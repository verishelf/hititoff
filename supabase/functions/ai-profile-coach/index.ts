import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI } from '../_shared/openai.ts';

interface ProfileCoachResult {
  score: number;
  summary: string;
  bio_suggestion: string;
  photo_tips: string[];
  prompt_tips: string[];
}

function fallbackCoach(profile: Record<string, unknown>): ProfileCoachResult {
  const bio = String(profile.bio ?? '');
  const photos = (profile.photos as string[] | undefined) ?? [];
  const prompts = (profile.profile_prompts as unknown[] | undefined) ?? [];
  let score = 50;
  if (bio.length > 40) score += 15;
  if (photos.length >= 3) score += 15;
  if (prompts.length >= 2) score += 10;

  return {
    score: Math.min(100, score),
    summary: 'Add more personality to your bio and fill out profile prompts so matches have easy conversation hooks.',
    bio_suggestion: bio.length < 40
      ? 'Try a 2-sentence bio: one line about who you are, one about what you are looking for.'
      : bio,
    photo_tips: [
      photos.length < 3 ? 'Add at least 3 photos — a clear face shot first, then a full-body and hobby photo.' : 'Lead with your clearest, most recent face photo.',
      'Avoid group shots as your first photo so matches know who you are.',
    ],
    prompt_tips: prompts.length === 0
      ? ['Add 2–3 profile prompts — they give AI and matches specific things to talk about.']
      : ['Answer prompts with specifics (places, stories) instead of one-word replies.'],
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, bio, interests, photos, profile_prompts, humor_type, flirting_style, is_premium, video_intro_url, voice_bio_url')
      .eq('id', user.id)
      .single();

    if (!profile) return errorResponse('Profile not found', 404);

    if (!profile.is_premium) {
      const { data: usageCount } = await supabase.rpc('increment_ai_usage', {
        p_feature: 'profile_coach',
      });
      if (usageCount && usageCount > 1) {
        return errorResponse('Daily profile review limit reached. Upgrade to HitItOff Pro.', 429);
      }
    }

    let result: ProfileCoachResult;

    if (hasOpenAI()) {
      try {
        const content = await chatCompletion(
          `You are a dating profile coach. Review the user's profile and return ONLY valid JSON:
{ "score": number (0-100 profile strength),
  "summary": string (2 sentences overall assessment),
  "bio_suggestion": string (rewritten bio, max 300 chars, in their voice),
  "photo_tips": string[] (2-3 actionable photo order/content tips),
  "prompt_tips": string[] (1-2 tips to improve profile prompts) }`,
          JSON.stringify({
            profile: {
              name: profile.name,
              bio: profile.bio,
              interests: profile.interests,
              photo_count: (profile.photos ?? []).length,
              profile_prompts: profile.profile_prompts,
              humor_type: profile.humor_type,
              flirting_style: profile.flirting_style,
              has_video: Boolean(profile.video_intro_url),
              has_voice: Boolean(profile.voice_bio_url),
            },
          }),
          { temperature: 0.65 },
        );
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        result = {
          score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
          summary: String(parsed.summary ?? ''),
          bio_suggestion: String(parsed.bio_suggestion ?? profile.bio),
          photo_tips: (parsed.photo_tips ?? []).slice(0, 3).map(String),
          prompt_tips: (parsed.prompt_tips ?? []).slice(0, 2).map(String),
        };
      } catch {
        result = fallbackCoach(profile);
      }
    } else {
      result = fallbackCoach(profile);
    }

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

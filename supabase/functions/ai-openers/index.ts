import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI, parseJsonArray } from '../_shared/openai.ts';

type OpenerTone = 'funny' | 'flirty' | 'deep' | 'romantic';

const TONE_PROMPTS: Record<OpenerTone, string> = {
  funny: 'Generate witty, lighthearted openers with humor. Keep it playful, not cheesy.',
  flirty: 'Generate charming, subtly flirty openers that feel confident and warm.',
  deep: 'Generate thoughtful conversation starters that invite meaningful dialogue.',
  romantic: 'Generate sweet, romantic openers that feel genuine, not overly intense.',
};

function fallbackOpeners(name: string, interests: string[], tone: OpenerTone): string[] {
  const interest = interests[0] ?? 'life';
  const templates: Record<OpenerTone, string[]> = {
    funny: [
      `Hey ${name}! If we both like ${interest}, does that mean we're legally required to have strong opinions about it?`,
      `${name}, quick poll: what's your most controversial ${interest} take?`,
      `I noticed we both like ${interest}. I'm already preparing my TED talk on the subject.`,
    ],
    flirty: [
      `${name}, your profile has great energy — what's the vibe you're going for this week?`,
      `Hey ${name}! Something about your profile made me smile. What's been making you happy lately?`,
      `${name}, if we grabbed coffee, what's the first thing you'd want to talk about?`,
    ],
    deep: [
      `${name}, what's something you've been thinking about a lot lately?`,
      `Hey ${name}! What's a value that's really important to you in relationships?`,
      `${name}, what's a conversation topic you never get tired of?`,
    ],
    romantic: [
      `${name}, what's your idea of a perfect slow Sunday together?`,
      `Hey ${name}! What's a small gesture that always makes you feel appreciated?`,
      `${name}, what's something that would make a first date feel special to you?`,
    ],
  };
  return templates[tone];
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

    const { match_id, tone = 'funny' } = await req.json() as { match_id: string; tone?: OpenerTone };
    if (!match_id) return errorResponse('match_id required');

    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', match_id)
      .single();

    if (!match) return errorResponse('Match not found', 404);
    if (match.user_a !== user.id && match.user_b !== user.id) return errorResponse('Forbidden', 403);

    const otherId = match.user_a === user.id ? match.user_b : match.user_a;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, bio, interests, profile_prompts, current_mood, humor_type, flirting_style')
      .in('id', [user.id, otherId]);

    const myProfile = profiles?.find((p) => p.id === user.id);
    const otherProfile = profiles?.find((p) => p.id === otherId);
    if (!myProfile || !otherProfile) return errorResponse('Profiles not found', 404);

    const sharedInterests = (myProfile.interests ?? []).filter((i: string) =>
      (otherProfile.interests ?? []).includes(i)
    );

    // Check usage limit for free users
    const { data: myFullProfile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (!myFullProfile?.is_premium) {
      const { data: usageCount } = await supabase.rpc('increment_ai_usage', { p_feature: 'openers' });
      if (usageCount && usageCount > 3) {
        return errorResponse('Daily AI opener limit reached. Upgrade to HitItOff Pro.', 429);
      }
    }

    let openers: string[];

    if (hasOpenAI()) {
      try {
        const content = await chatCompletion(
          `${TONE_PROMPTS[tone as OpenerTone] ?? TONE_PROMPTS.funny} Generate exactly 3 short dating app openers. Return ONLY a JSON array of strings, no markdown.`,
          JSON.stringify({
            my_profile: myProfile,
            their_profile: otherProfile,
            shared_interests: sharedInterests,
            tone,
          }),
          { temperature: 0.85 },
        );
        openers = await parseJsonArray<string>(content);
        if (openers.length === 0) throw new Error('Empty response');
        openers = openers.slice(0, 3).map(String);
      } catch {
        openers = fallbackOpeners(otherProfile.name, sharedInterests, tone as OpenerTone);
      }
    } else {
      openers = fallbackOpeners(otherProfile.name, sharedInterests, tone as OpenerTone);
    }

    return jsonResponse({ openers, tone });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

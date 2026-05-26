import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI } from '../_shared/openai.ts';

interface CoachSuggestion {
  text: string;
  reasoning: string;
}

interface CoachResult {
  temperature: number;
  diagnosis: string;
  suggestions: CoachSuggestion[];
}

function fallbackCoach(
  messages: { sender_id: string; text: string }[],
  userId: string,
  otherName: string,
): CoachResult {
  const count = messages.length;
  const lastMsg = messages[messages.length - 1];
  const theySentLast = lastMsg && lastMsg.sender_id !== userId;
  const temperature = Math.min(85, Math.max(25, 30 + count * 8 + (theySentLast ? 15 : 0)));

  let diagnosis = 'The conversation is still early — keep asking open questions about shared interests.';
  if (count >= 6 && theySentLast) {
    diagnosis = 'Good momentum. They replied recently — deepen the thread or suggest a low-key meetup.';
  } else if (count >= 4 && !theySentLast) {
    diagnosis = 'You sent the last message. Give them space, or send something light that is easy to reply to.';
  }

  return {
    temperature,
    diagnosis,
    suggestions: [
      {
        text: `That's a great point, ${otherName}. What got you into that?`,
        reasoning: 'Open-ended questions invite longer replies and show genuine curiosity.',
      },
      {
        text: 'Ha, fair enough. So what does your ideal weekend look like?',
        reasoning: 'Light pivot to lifestyle topics keeps things fun while learning compatibility.',
      },
    ],
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

    const { match_id } = await req.json() as { match_id: string };
    if (!match_id) return errorResponse('match_id required');

    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', match_id)
      .single();

    if (!match) return errorResponse('Match not found', 404);
    if (match.user_a !== user.id && match.user_b !== user.id) return errorResponse('Forbidden', 403);

    const otherId = match.user_a === user.id ? match.user_b : match.user_a;

    const { data: myFullProfile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (!myFullProfile?.is_premium) {
      const { data: usageCount } = await supabase.rpc('increment_ai_usage', {
        p_feature: 'conversation_coach',
      });
      if (usageCount && usageCount > 5) {
        return errorResponse('Daily conversation coach limit reached. Upgrade to HitItOff Pro.', 429);
      }
    }

    const [{ data: profiles }, { data: messages }, { data: chemistry }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, bio, interests, profile_prompts, current_mood, humor_type, flirting_style')
        .in('id', [user.id, otherId]),
      supabase
        .from('messages')
        .select('sender_id, text, created_at')
        .eq('match_id', match_id)
        .order('created_at', { ascending: true })
        .limit(40),
      supabase
        .from('match_chemistry')
        .select('spark_meter')
        .eq('match_id', match_id)
        .maybeSingle(),
    ]);

    const myProfile = profiles?.find((p) => p.id === user.id);
    const otherProfile = profiles?.find((p) => p.id === otherId);
    if (!myProfile || !otherProfile) return errorResponse('Profiles not found', 404);

    const thread = (messages ?? []).map((m) => ({
      from: m.sender_id === user.id ? 'me' : otherProfile.name,
      text: m.text,
    }));

    let result: CoachResult;

    if (hasOpenAI()) {
      try {
        const content = await chatCompletion(
          `You are a dating conversation coach inside a compatibility dating app. Analyze the chat thread and return ONLY valid JSON:
{ "temperature": number (0-100, how warm/engaged the conversation feels),
  "diagnosis": string (2-3 sentences on what's working and what's stalling),
  "suggestions": [{ "text": string (reply to send), "reasoning": string (why it works) }] }
Provide exactly 2 suggestions. Be specific to this match — reference their interests or prior messages when possible.`,
          JSON.stringify({
            my_profile: myProfile,
            their_profile: otherProfile,
            spark_meter: chemistry?.spark_meter ?? null,
            conversation: thread,
          }),
          { temperature: 0.7 },
        );
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        result = {
          temperature: Math.max(0, Math.min(100, Number(parsed.temperature) || 50)),
          diagnosis: String(parsed.diagnosis ?? ''),
          suggestions: (parsed.suggestions ?? []).slice(0, 2).map((s: CoachSuggestion) => ({
            text: String(s.text ?? ''),
            reasoning: String(s.reasoning ?? ''),
          })),
        };
        if (result.suggestions.length === 0) throw new Error('Empty suggestions');
      } catch {
        result = fallbackCoach(messages ?? [], user.id, otherProfile.name);
      }
    } else {
      result = fallbackCoach(messages ?? [], user.id, otherProfile.name);
    }

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

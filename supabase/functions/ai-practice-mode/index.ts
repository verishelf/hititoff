import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI } from '../_shared/openai.ts';

type PracticeAction = 'start' | 'chat' | 'evaluate';

interface PracticeMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PERSONAS = [
  { name: 'Sam', vibe: 'warm and curious, asks follow-up questions' },
  { name: 'Jordan', vibe: 'playful and witty, keeps things light' },
  { name: 'Alex', vibe: 'thoughtful and direct, prefers deeper topics' },
];

function pickPersona(userId: string) {
  const idx = userId.charCodeAt(0) % PERSONAS.length;
  return PERSONAS[idx];
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
      .select('is_premium, name, interests, humor_type')
      .eq('id', user.id)
      .single();

    if (!profile?.is_premium) {
      return errorResponse('Practice mode is a HitItOff Pro feature.', 403);
    }

    const body = await req.json() as {
      action: PracticeAction;
      messages?: PracticeMessage[];
    };

    const persona = pickPersona(user.id);

    if (body.action === 'start') {
      const opener = hasOpenAI()
        ? await chatCompletion(
          `You are ${persona.name}, a simulated dating match (${persona.vibe}). Send ONE friendly opening message (max 2 sentences) to someone who likes ${(profile.interests ?? []).slice(0, 2).join(' and ') || 'good conversation'}. Return plain text only.`,
          `User name: ${profile.name}`,
          { temperature: 0.85 },
        ).catch(() => `Hey! I saw you're into ${profile.interests?.[0] ?? 'meeting new people'} — what's your favorite thing about it?`)
        : `Hey ${profile.name}! I saw you're into ${profile.interests?.[0] ?? 'meeting new people'} — tell me more!`;

      return jsonResponse({
        persona_name: persona.name,
        message: opener.trim(),
      });
    }

    const messages = body.messages ?? [];
    if (body.action === 'chat') {
      if (messages.length === 0) return errorResponse('messages required');

      let reply: string;
      if (hasOpenAI()) {
        reply = await chatCompletion(
          `You are ${persona.name}, a simulated dating match (${persona.vibe}). Reply naturally in 1-3 sentences. Stay in character. Plain text only.`,
          JSON.stringify({ conversation: messages }),
          { temperature: 0.8 },
        );
      } else {
        reply = "That's interesting! What made you get into that?";
      }

      return jsonResponse({ message: reply.trim() });
    }

    if (body.action === 'evaluate') {
      let evaluation: Record<string, unknown>;
      if (hasOpenAI() && messages.length > 0) {
        const content = await chatCompletion(
          `You are a dating coach evaluating a practice conversation. Return ONLY valid JSON:
{ "overall_score": number (0-100),
  "confidence_score": number (0-100),
  "question_quality": number (0-100),
  "summary": string (2-3 sentences of constructive feedback),
  "tips": string[] (2-3 specific improvements) }`,
          JSON.stringify({ conversation: messages, persona: persona.name }),
          { temperature: 0.5 },
        );
        evaluation = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
      } else {
        evaluation = {
          overall_score: 70,
          confidence_score: 65,
          question_quality: 68,
          summary: 'Good start! Try asking more open-ended questions and sharing a brief story about yourself.',
          tips: [
            'Balance questions with personal details so it feels like a two-way conversation.',
            'When the moment feels right, suggest a specific low-pressure date idea.',
          ],
        };
      }

      return jsonResponse(evaluation);
    }

    return errorResponse('Invalid action');
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

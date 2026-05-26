import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI, parseJsonArray } from '../_shared/openai.ts';

interface CompatibilityResult {
  overall_score: number;
  chemistry_score: number;
  emotional_resonance: number;
  communication_compat: number;
  humor_alignment: number;
  factors: Record<string, unknown>;
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function heuristicScores(
  quizSim: number,
  sharedInterests: string[],
  locScore: number,
): CompatibilityResult {
  const interestBoost = Math.min(20, sharedInterests.length * 5);
  return {
    overall_score: Math.min(100, Math.round(0.6 * quizSim + 0.4 * locScore + interestBoost * 0.3)),
    chemistry_score: Math.min(100, Math.round(quizSim * 0.7 + interestBoost)),
    emotional_resonance: Math.min(100, Math.round(quizSim * 0.8 + 10)),
    communication_compat: Math.min(100, Math.round(quizSim * 0.65 + locScore * 0.2)),
    humor_alignment: Math.min(100, Math.round(quizSim * 0.55 + interestBoost * 0.5)),
    factors: { method: 'heuristic', shared_interests: sharedInterests, quiz_similarity: quizSim },
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

    const { user_id_a, user_id_b } = await req.json();
    if (!user_id_a || !user_id_b) return errorResponse('user_id_a and user_id_b required');
    if (user.id !== user_id_a && user.id !== user_id_b) return errorResponse('Forbidden', 403);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [user_id_a, user_id_b]);

    if (!profiles || profiles.length < 2) return errorResponse('Profiles not found', 404);

    const profileA = profiles.find((p) => p.id === user_id_a)!;
    const profileB = profiles.find((p) => p.id === user_id_b)!;

    const vecA: number[] = profileA.quiz_vector ?? [];
    const vecB: number[] = profileB.quiz_vector ?? [];
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] ** 2;
      magB += vecB[i] ** 2;
    }
    const quizSim = magA && magB ? Math.round((dot / (Math.sqrt(magA) * Math.sqrt(magB))) * 100) : 50;

    const sharedInterests = (profileA.interests ?? []).filter((i: string) =>
      (profileB.interests ?? []).includes(i)
    );

    let result: CompatibilityResult;

    if (hasOpenAI()) {
      try {
        const content = await chatCompletion(
          `You are a dating compatibility analyst. Return ONLY valid JSON with keys: overall_score, chemistry_score, emotional_resonance, communication_compat, humor_alignment, factors (object). All scores 0-100 integers.`,
          JSON.stringify({
            user_a: { name: profileA.name, bio: profileA.bio, interests: profileA.interests, prompts: profileA.profile_prompts, humor_type: profileA.humor_type, flirting_style: profileA.flirting_style },
            user_b: { name: profileB.name, bio: profileB.bio, interests: profileB.interests, prompts: profileB.profile_prompts, humor_type: profileB.humor_type, flirting_style: profileB.flirting_style },
            quiz_similarity: quizSim,
            shared_interests: sharedInterests,
          }),
          { temperature: 0.5 },
        );
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        result = {
          overall_score: Math.min(100, Math.max(0, parsed.overall_score ?? quizSim)),
          chemistry_score: Math.min(100, Math.max(0, parsed.chemistry_score ?? quizSim)),
          emotional_resonance: Math.min(100, Math.max(0, parsed.emotional_resonance ?? quizSim)),
          communication_compat: Math.min(100, Math.max(0, parsed.communication_compat ?? quizSim)),
          humor_alignment: Math.min(100, Math.max(0, parsed.humor_alignment ?? quizSim)),
          factors: parsed.factors ?? { method: 'ai' },
        };
      } catch {
        result = heuristicScores(quizSim, sharedInterests, 70);
      }
    } else {
      result = heuristicScores(quizSim, sharedInterests, 70);
    }

    const [user_a, user_b] = sortPair(user_id_a, user_id_b);
    await supabase.from('compatibility_analytics').upsert({
      user_a,
      user_b,
      ...result,
      computed_at: new Date().toISOString(),
    });

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

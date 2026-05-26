import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI, transcribeAudio } from '../_shared/openai.ts';

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

    const { audio_base64, mime_type = 'audio/m4a', clip_type = 'vibe' } = await req.json();
    if (!audio_base64) return errorResponse('audio_base64 required');

    let transcript = '';
    if (hasOpenAI()) {
      try {
        transcript = await transcribeAudio(audio_base64, mime_type);
      } catch {
        transcript = '';
      }
    }

    let vibeSummary = 'Warm and authentic';
    if (hasOpenAI() && transcript) {
      try {
        vibeSummary = await chatCompletion(
          'Summarize someone\'s voice vibe in 2-4 words like "Confident and playful" or "Calm and emotionally grounded". Return ONLY the summary phrase, no quotes.',
          `Transcript: "${transcript}"`,
          { temperature: 0.6 },
        );
        vibeSummary = vibeSummary.replace(/["']/g, '').trim().slice(0, 60);
      } catch {
        vibeSummary = 'Warm and authentic';
      }
    }

    const updateField = clip_type === 'bio' ? 'voice_vibe_summary' : 'voice_vibe_summary';
    await supabase
      .from('profiles')
      .update({ [updateField]: vibeSummary })
      .eq('id', user.id);

    return jsonResponse({ vibe_summary: vibeSummary, transcript });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

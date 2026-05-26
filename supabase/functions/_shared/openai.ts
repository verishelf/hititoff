const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

export function hasOpenAI(): boolean {
  return OPENAI_API_KEY.length > 0;
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; model?: string },
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

export async function parseJsonArray<T>(content: string): Promise<T[]> {
  const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];
  return parsed as T[];
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

  const binary = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const formData = new FormData();
  formData.append('file', new Blob([binary], { type: mimeType }), 'audio.m4a');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper error: ${await response.text()}`);
  }

  const json = await response.json();
  return json.text ?? '';
}

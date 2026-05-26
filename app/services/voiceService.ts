import { supabase } from './supabase';

const VOICE_BUCKET = 'voice-clips';

async function uriToBytes(localUri: string): Promise<Uint8Array> {
  const response = await fetch(localUri);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function uriToBase64(localUri: string): Promise<string> {
  const bytes = await uriToBytes(localUri);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadVoiceClip(
  userId: string,
  localUri: string,
  filename: string,
): Promise<string> {
  const binary = await uriToBytes(localUri);
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage.from(VOICE_BUCKET).upload(path, binary, {
    contentType: 'audio/m4a',
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(VOICE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAndSummarizeVoice(
  userId: string,
  localUri: string,
  clipType: 'bio' | 'vibe',
): Promise<{ url: string; vibeSummary: string }> {
  const filename = clipType === 'bio' ? 'voice-bio.m4a' : 'vibe-clip.m4a';
  const base64 = await uriToBase64(localUri);
  const url = await uploadVoiceClip(userId, localUri, filename);

  const field = clipType === 'bio' ? 'voice_bio_url' : 'vibe_clip_url';
  if (clipType === 'bio') {
    await supabase.from('profiles').update({ voice_bio_url: url }).eq('id', userId);
  } else {
    await supabase.from('profiles').update({ vibe_clip_url: url }).eq('id', userId);
  }

  let vibeSummary = '';
  try {
    const { generateVibeSummary } = await import('./aiService');
    const result = await generateVibeSummary(base64, 'audio/m4a', clipType);
    vibeSummary = result.vibe_summary;
  } catch {
    vibeSummary = 'Warm and authentic';
  }

  return { url, vibeSummary };
}

export async function updateVoiceFields(
  userId: string,
  fields: {
    voice_bio_url?: string | null;
    vibe_clip_url?: string | null;
    voice_vibe_summary?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) throw new Error(error.message);
}

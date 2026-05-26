import { supabase } from './supabase';
import type { MoodId } from '../utils/moodData';

export async function setMood(userId: string, mood: MoodId | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      current_mood: mood,
      mood_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function updateMoodPreferences(
  userId: string,
  prefs: { pref_match_mood?: boolean; pref_mood_filters?: string[] },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(prefs).eq('id', userId);
  if (error) throw new Error(error.message);
}

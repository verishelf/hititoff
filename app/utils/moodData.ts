export type MoodId =
  | 'deep_talks'
  | 'flirty'
  | 'adventurous'
  | 'serious'
  | 'chill'
  | 'spontaneous';

export interface MoodOption {
  id: MoodId;
  label: string;
  emoji: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'deep_talks', label: 'Deep talks', emoji: '💭' },
  { id: 'flirty', label: 'Flirty', emoji: '😏' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🌍' },
  { id: 'serious', label: 'Serious relationship', emoji: '💍' },
  { id: 'chill', label: 'Chill', emoji: '😌' },
  { id: 'spontaneous', label: 'Spontaneous', emoji: '⚡' },
];

export const MOOD_COMPATIBILITY: Record<MoodId, MoodId[]> = {
  deep_talks: ['deep_talks', 'serious', 'chill'],
  flirty: ['flirty', 'spontaneous', 'chill'],
  adventurous: ['adventurous', 'spontaneous', 'flirty'],
  serious: ['serious', 'deep_talks', 'chill'],
  chill: ['chill', 'deep_talks', 'flirty', 'spontaneous', 'adventurous', 'serious'],
  spontaneous: ['spontaneous', 'flirty', 'adventurous', 'chill'],
};

export function getMoodLabel(moodId: MoodId | string | null | undefined): string {
  if (!moodId) return '';
  return MOOD_OPTIONS.find((m) => m.id === moodId)?.label ?? moodId;
}

export function getMoodEmoji(moodId: MoodId | string | null | undefined): string {
  if (!moodId) return '';
  return MOOD_OPTIONS.find((m) => m.id === moodId)?.emoji ?? '';
}

import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { getMoodEmoji, getMoodLabel } from '../utils/moodData';
import type { MoodId } from '../utils/moodData';

interface MoodBadgeProps {
  mood: MoodId | string | null | undefined;
  size?: 'small' | 'medium';
}

export function MoodBadge({ mood, size = 'small' }: MoodBadgeProps) {
  if (!mood) return null;

  return (
    <View style={[styles.badge, size === 'medium' && styles.badgeMedium]}>
      <Text style={styles.emoji}>{getMoodEmoji(mood)}</Text>
      {size === 'medium' && (
        <Text style={styles.label}>{getMoodLabel(mood)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emoji: { fontSize: 14 },
  label: { color: COLORS.text, fontSize: 11, fontWeight: '600' },
});

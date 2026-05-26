import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScrollView } from './AppScrollView';
import { COLORS } from '../utils/constants';
import { MOOD_OPTIONS, type MoodId } from '../utils/moodData';

interface MoodSelectorProps {
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId | null) => void;
  compact?: boolean;
}

export function MoodSelector({ selectedMood, onSelect, compact = false }: MoodSelectorProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      {!compact && <Text style={styles.label}>What's your vibe today?</Text>}
      <AppScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {MOOD_OPTIONS.map((mood) => {
          const active = selectedMood === mood.id;
          return (
            <TouchableOpacity
              key={mood.id}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onSelect(active ? null : mood.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              {!compact && (
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {mood.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  label: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emoji: { fontSize: 16 },
  pillText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.text,
  },
});

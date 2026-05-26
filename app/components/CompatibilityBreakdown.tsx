import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../utils/constants';
import type { CompatibilityBreakdown } from '../types';

interface ScoreBarProps {
  label: string;
  score: number;
  delay?: number;
}

function ScoreBar({ label, score, delay = 0 }: ScoreBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      width.value = withTiming(score, { duration: 600 });
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
      <Text style={styles.barScore}>{score}%</Text>
    </View>
  );
}

interface CompatibilityBreakdownProps {
  breakdown: CompatibilityBreakdown;
  compact?: boolean;
  blurred?: boolean;
}

export function CompatibilityBreakdown({
  breakdown,
  compact = false,
  blurred = false,
}: CompatibilityBreakdownProps) {
  if (blurred) {
    return (
      <View style={[styles.container, compact && styles.compact]}>
        <Text style={styles.blurredText}>Upgrade to Pro for AI compatibility insights</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {!compact && (
        <Text style={styles.title}>Compatibility Breakdown</Text>
      )}
      <ScoreBar label="Chemistry" score={breakdown.chemistry_score} delay={0} />
      <ScoreBar label="Emotional" score={breakdown.emotional_resonance} delay={100} />
      <ScoreBar label="Communication" score={breakdown.communication_compat} delay={200} />
      <ScoreBar label="Humor" score={breakdown.humor_alignment} delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compact: {
    padding: 12,
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    width: 90,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  barScore: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  blurredText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { COLORS } from '../utils/constants';
import { AnimatedStatValue } from './AnimatedStatValue';

interface AnimatedStatCardProps {
  value: number;
  label: string;
  infinity?: boolean;
  animationTrigger: number;
  resetTrigger: number;
  delayMs?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AnimatedStatCard({
  value,
  label,
  infinity = false,
  animationTrigger,
  resetTrigger,
  delayMs = 0,
  onPress,
  style,
}: AnimatedStatCardProps) {
  const content = (
    <>
      <AnimatedStatValue
        value={value}
        infinity={infinity}
        style={styles.statValue}
        animationTrigger={animationTrigger}
        resetTrigger={resetTrigger}
        delayMs={delayMs}
      />
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.statCard, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.statCard, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});

import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

interface WaveformPlayerProps {
  isPlaying?: boolean;
  barCount?: number;
  onPress?: () => void;
  color?: string;
}

export function WaveformPlayer({
  isPlaying = false,
  barCount = 12,
  onPress,
  color = COLORS.accent,
}: WaveformPlayerProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={color} />
      <View style={styles.bars}>
        {bars.map((i) => (
          <WaveBar key={i} index={i} isPlaying={isPlaying} color={color} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

function WaveBar({
  index,
  isPlaying,
  color,
}: {
  index: number;
  isPlaying: boolean;
  color: string;
}) {
  const height = useSharedValue(4 + (index % 3) * 4);

  useEffect(() => {
    if (isPlaying) {
      height.value = withRepeat(
        withSequence(
          withTiming(4 + Math.random() * 16, { duration: 200 + index * 30 }),
          withTiming(4, { duration: 200 + index * 30 }),
        ),
        -1,
        true,
      );
    } else {
      height.value = withTiming(4 + (index % 3) * 4);
    }
  }, [isPlaying, index, height]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

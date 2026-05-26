import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

const COUNT_DURATION_MS = 650;

interface AnimatedStatValueProps {
  value: number;
  infinity?: boolean;
  style?: TextStyle;
  /** Increment to snap back to 0 immediately */
  resetTrigger: number;
  /** Increment to run the count-up animation */
  animationTrigger: number;
  delayMs?: number;
}

export function AnimatedStatValue({
  value,
  infinity = false,
  style,
  resetTrigger,
  animationTrigger,
  delayMs = 0,
}: AnimatedStatValueProps) {
  const [display, setDisplay] = useState('0');
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAnimation = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  useEffect(() => {
    cancelAnimation();
    setDisplay('0');
  }, [resetTrigger]);

  useEffect(() => {
    if (animationTrigger === 0) return;

    cancelAnimation();
    setDisplay('0');

    timeoutRef.current = setTimeout(() => {
      if (infinity) {
        setDisplay('∞');
        return;
      }

      const target = Math.max(0, Math.round(value));
      if (target === 0) {
        setDisplay('0');
        return;
      }

      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / COUNT_DURATION_MS);
        const eased = 1 - (1 - progress) ** 3;
        setDisplay(String(Math.round(target * eased)));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(String(target));
          frameRef.current = null;
        }
      };

      setDisplay('0');
      frameRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return cancelAnimation;
  }, [animationTrigger, value, infinity, delayMs]);

  return <Text style={[styles.value, style]}>{display}</Text>;
}

const styles = StyleSheet.create({
  value: {
    fontVariant: ['tabular-nums'],
  },
});

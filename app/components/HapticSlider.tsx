import { useEffect, useRef } from 'react';
import Slider, { type SliderProps } from '@react-native-community/slider';
import { hapticSelection } from '../utils/haptics';

function snapValue(value: number, step?: number): number {
  if (step == null || step <= 0) return value;
  if (step >= 1) return Math.round(value);
  return Math.round(value / step) * step;
}

export function HapticSlider({ onValueChange, onSlidingComplete, value, step, ...rest }: SliderProps) {
  const lastStep = useRef<number | null>(null);

  useEffect(() => {
    if (value != null) {
      lastStep.current = snapValue(value, step);
    }
  }, [value, step]);

  return (
    <Slider
      {...rest}
      step={step}
      value={value}
      onValueChange={(next) => {
        const snapped = snapValue(next, step);
        if (lastStep.current !== snapped) {
          lastStep.current = snapped;
          hapticSelection();
        }
        onValueChange?.(next);
      }}
      onSlidingComplete={(next) => {
        lastStep.current = snapValue(next, step);
        onSlidingComplete?.(next);
      }}
    />
  );
}

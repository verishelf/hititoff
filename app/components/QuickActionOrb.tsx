import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type QuickActionVariant = 'discover' | 'messages' | 'boost' | 'profile';

const VARIANTS: Record<
  QuickActionVariant,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string, string, string];
    rim: string;
    iconColor: string;
    shadow: string;
  }
> = {
  discover: {
    icon: 'heart',
    colors: ['#ff7eb3', '#ff4d8d', '#c9185a', '#8b1048'],
    rim: '#5a1538',
    iconColor: '#ffffff',
    shadow: '#ff4d8d',
  },
  messages: {
    icon: 'chatbubbles',
    colors: ['#ffc4d6', '#ff8fab', '#e85a8a', '#9e3d5c'],
    rim: '#4a2230',
    iconColor: '#ffffff',
    shadow: '#ff8fab',
  },
  boost: {
    icon: 'flash',
    colors: ['#fde68a', '#facc15', '#ca8a04', '#713f12'],
    rim: '#3d2e0a',
    iconColor: '#fffbeb',
    shadow: '#facc15',
  },
  profile: {
    icon: 'person',
    colors: ['#86efac', '#4ade80', '#16a34a', '#14532d'],
    rim: '#0f2918',
    iconColor: '#ffffff',
    shadow: '#4ade80',
  },
};

interface QuickActionOrbProps {
  variant: QuickActionVariant;
  size?: number;
  /** Subtle rear glow + throb (boost) */
  pulse?: boolean;
  /** Slightly stronger glow when boost is live */
  boostActive?: boolean;
  /** Drop bottom margin (e.g. header toolbar) */
  compact?: boolean;
  /** 3D red dot for unread / new activity */
  showBadge?: boolean;
}

function OrbBadgeDot({ size = 14 }: { size?: number }) {
  const innerSize = size - 3;

  return (
    <View
      style={[
        styles.badgeOuter,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          ...Platform.select({
            ios: {
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.55,
              shadowRadius: 3,
            },
            android: { elevation: 4 },
          }),
        },
      ]}
    >
      <View
        style={[
          styles.badgeRim,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <LinearGradient
          colors={['#ff8a8a', '#ef4444', '#b91c1c', '#7f1d1d']}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[
            styles.badgeSphere,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.08)', 'transparent']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.25, y: 0.05 }}
            end={{ x: 0.75, y: 0.85 }}
            style={[
              styles.badgeGloss,
              {
                width: innerSize * 0.72,
                height: innerSize * 0.42,
                borderRadius: innerSize * 0.36,
                top: innerSize * 0.06,
                left: innerSize * 0.14,
              },
            ]}
          />
          <View style={styles.badgeShade} />
        </LinearGradient>
      </View>
    </View>
  );
}

export function QuickActionOrb({
  variant,
  size = 52,
  pulse = false,
  boostActive = false,
  compact = false,
  showBadge = false,
}: QuickActionOrbProps) {
  const theme = VARIANTS[variant];
  const innerSize = size - 8;
  const pulseVal = useSharedValue(0);

  useEffect(() => {
    if (!pulse) return;

    const duration = boostActive ? 1800 : 2400;

    pulseVal.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse, boostActive, pulseVal]);

  const rearGlowStyle = useAnimatedStyle(() => {
    const base = boostActive ? 0.12 : 0.08;
    const peak = boostActive ? 0.22 : 0.14;
    return {
      opacity: base + pulseVal.value * (peak - base),
      transform: [{ scale: 1.04 + pulseVal.value * (boostActive ? 0.08 : 0.05) }],
    };
  });

  return (
    <View style={[styles.wrap, { width: size, height: size, marginBottom: compact ? 0 : 6 }]}>
      {pulse ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rearGlow,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              backgroundColor: theme.shadow,
            },
            rearGlowStyle,
          ]}
        />
      ) : null}

      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.rim,
            ...Platform.select({
              ios: {
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: Math.max(3, size * 0.06) },
                shadowOpacity: 0.35,
                shadowRadius: Math.max(5, size * 0.1),
              },
              android: { elevation: 6 },
            }),
          },
        ]}
      >
        <LinearGradient
          colors={theme.colors}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[
            styles.sphere,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.06)', 'transparent']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.25, y: 0.05 }}
            end={{ x: 0.75, y: 0.85 }}
            style={[
              styles.gloss,
              {
                width: innerSize * 0.72,
                height: innerSize * 0.42,
                borderRadius: innerSize * 0.36,
                top: innerSize * 0.06,
                left: innerSize * 0.14,
              },
            ]}
          />

          <View style={styles.rimBottom} />

          <Ionicons
            name={theme.icon}
            size={Math.round(size * 0.4)}
            color={theme.iconColor}
            style={styles.icon}
          />
        </LinearGradient>
      </View>

      {showBadge ? (
        <View
          pointerEvents="none"
          style={[
            styles.badgeWrap,
            {
              top: Math.max(0, size * 0.02),
              right: Math.max(0, size * 0.02),
            },
          ]}
        >
          <OrbBadgeDot size={Math.max(12, Math.round(size * 0.28))} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    zIndex: 3,
  },
  badgeOuter: {
    borderWidth: 2,
    borderColor: '#120810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRim: {
    backgroundColor: '#5a1010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSphere: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeGloss: {
    position: 'absolute',
    transform: [{ rotate: '-18deg' }],
  },
  badgeShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  rearGlow: {
    position: 'absolute',
    zIndex: 0,
  },
  outerRing: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphere: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gloss: {
    position: 'absolute',
    transform: [{ rotate: '-18deg' }],
  },
  rimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  icon: {
    zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

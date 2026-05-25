import { useCallback } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { Candidate, SwipeDirection } from '../types';
import { UserCard } from './UserCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface SwipeDeckProps {
  candidates: Candidate[];
  showCompatibility: boolean;
  photosUnlocked: boolean;
  superLikeEnabled: boolean;
  maxPhotoHeight?: number;
  deckKey?: number;
  onSwipe: (candidate: Candidate, direction: SwipeDirection) => void;
  onViewProfile: (candidate: Candidate) => void;
  onSuperLikeBlocked?: () => void;
  onResetDiscover?: () => void;
}

function SwipeCard({
  candidate,
  showCompatibility,
  photosUnlocked,
  superLikeEnabled,
  maxPhotoHeight,
  onSwipe,
  onViewProfile,
  onSuperLikeBlocked,
  isTop,
}: {
  candidate: Candidate;
  showCompatibility: boolean;
  photosUnlocked: boolean;
  superLikeEnabled: boolean;
  maxPhotoHeight?: number;
  onSwipe: (direction: SwipeDirection) => void;
  onViewProfile: () => void;
  onSuperLikeBlocked?: () => void;
  isTop: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection) => {
      onSwipe(direction);
    },
    [onSwipe],
  );

  const handleSuperLikeBlocked = useCallback(() => {
    onSuperLikeBlocked?.();
  }, [onSuperLikeBlocked]);

  const handleTap = useCallback(() => {
    onViewProfile();
  }, [onViewProfile]);

  const tap = Gesture.Tap()
    .enabled(isTop)
    .maxDistance(12)
    .onEnd(() => {
      runOnJS(handleTap)();
    });

  const pan = Gesture.Pan()
    .enabled(isTop)
    .activeOffsetX([-20, 20])
    .activeOffsetY([-20, 20])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY < -SWIPE_THRESHOLD && Math.abs(e.translationX) < SWIPE_THRESHOLD) {
        if (!superLikeEnabled) {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          runOnJS(handleSuperLikeBlocked)();
          return;
        }

        translateY.value = withTiming(-SCREEN_WIDTH, { duration: 250 }, () => {
          runOnJS(handleSwipeComplete)('super_like');
        });
        return;
      }

      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
          runOnJS(handleSwipeComplete)('like');
        });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
          runOnJS(handleSwipeComplete)('pass');
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-15, 15])}deg` },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }));

  const superOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <UserCard
          user={candidate}
          showCompatibility={showCompatibility}
          photosUnlocked={photosUnlocked}
          mediaActive={isTop}
          photoHeight={maxPhotoHeight}
        />
        <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.passOverlay, passOpacity]}>
          <Text style={styles.overlayText}>PASS</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.superOverlay, superOpacity]}>
          <Text style={styles.overlayText}>SUPER</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export function SwipeDeck({
  candidates,
  showCompatibility,
  photosUnlocked,
  superLikeEnabled,
  maxPhotoHeight,
  deckKey = 0,
  onSwipe,
  onViewProfile,
  onSuperLikeBlocked,
  onResetDiscover,
}: SwipeDeckProps) {
  if (candidates.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No more matches nearby</Text>
        <Text style={styles.emptySubtitle}>
          Try expanding your radius or check back later
        </Text>
        {__DEV__ && onResetDiscover ? (
          <TouchableOpacity style={styles.resetBtn} onPress={onResetDiscover}>
            <Text style={styles.resetBtnText}>Reset Discover (dev)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const visible = candidates.slice(0, 3);

  return (
    <View style={styles.deck}>
      {visible
        .map((candidate, index) => (
          <View
            key={`${deckKey}-${candidate.id}`}
            style={[styles.cardLayer, { zIndex: visible.length - index }]}
          >
            <SwipeCard
              candidate={candidate}
              showCompatibility={showCompatibility}
              photosUnlocked={photosUnlocked}
              superLikeEnabled={superLikeEnabled}
              maxPhotoHeight={maxPhotoHeight}
              isTop={index === 0}
              onSwipe={(direction) => onSwipe(candidate, direction)}
              onViewProfile={() => onViewProfile(candidate)}
              onSuperLikeBlocked={onSuperLikeBlocked}
            />
          </View>
        ))
        .reverse()}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    overflow: 'hidden',
  },
  cardLayer: {
    position: 'absolute',
  },
  cardWrapper: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 8,
  },
  likeOverlay: {
    left: 24,
    borderColor: COLORS.success,
  },
  passOverlay: {
    right: 24,
    borderColor: COLORS.danger,
  },
  superOverlay: {
    alignSelf: 'center',
    left: '35%',
    borderColor: '#60a5fa',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...headerText,
    color: COLORS.text,
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});

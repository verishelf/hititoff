import { useEvent } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface VideoIntroPlayerProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  loop?: boolean;
  isActive?: boolean;
}

function safePlay(player: VideoPlayer) {
  try {
    player.play();
  } catch {
    // Native player was already released (e.g. on unmount).
  }
}

function safePause(player: VideoPlayer) {
  try {
    player.pause();
  } catch {
    // Native player was already released (e.g. on unmount).
  }
}

export function VideoIntroPlayer({
  uri,
  style,
  autoPlay = false,
  loop = true,
  isActive = true,
}: VideoIntroPlayerProps) {
  const mountedRef = useRef(true);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = loop;
    if (autoPlay && isActive) {
      safePlay(instance);
    }
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    if (isActive && autoPlay) {
      safePlay(player);
    } else if (!isActive) {
      safePause(player);
    }
  }, [autoPlay, isActive, player]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (!mountedRef.current || nextState === 'active') return;
      safePause(player);
    });

    return () => subscription.remove();
  }, [player]);

  const handlePress = () => {
    if (!isActive) return;

    if (isPlaying) {
      safePause(player);
    } else {
      safePlay(player);
    }
  };

  const showPausedOverlay = isActive && !isPlaying;

  return (
    <Pressable style={[styles.container, style]} onPress={handlePress}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {showPausedOverlay && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.playButton}>
            <Ionicons name="play" size={36} color="#fff" />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
});

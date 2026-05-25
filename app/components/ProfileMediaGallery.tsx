import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { AppFlatList } from './AppFlatList';
import { AppScrollView } from './AppScrollView';
import { ProfilePhoto } from './ProfilePhoto';
import { VideoIntroPlayer } from './VideoIntroPlayer';

type GalleryItem =
  | { type: 'video'; uri: string; key: string }
  | { type: 'photo'; uri: string | null; photoIndex: number; key: string };

interface ProfileMediaGalleryProps {
  name: string;
  photos: string[];
  videoIntroUrl?: string | null;
  photosUnlocked: boolean;
  photoHeight: number;
  style?: StyleProp<ViewStyle>;
  showPhotoNav?: boolean;
  showThumbnails?: boolean;
  mediaActive?: boolean;
}

export function ProfileMediaGallery({
  name,
  photos,
  videoIntroUrl,
  photosUnlocked,
  photoHeight,
  style,
  showPhotoNav = true,
  showThumbnails = false,
  mediaActive = true,
}: ProfileMediaGalleryProps) {
  const isFocused = useIsFocused();
  const playbackEnabled = isFocused && mediaActive;
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [videoThumbUri, setVideoThumbUri] = useState<string | null>(null);
  const listRef = useRef<React.ElementRef<typeof AppFlatList<GalleryItem>>>(null);

  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [];

    if (videoIntroUrl) {
      items.push({ type: 'video', uri: videoIntroUrl, key: 'video-intro' });
    }

    const photoItems = photos.length > 0 ? photos : [null];
    photoItems.forEach((uri, photoIndex) => {
      items.push({
        type: 'photo',
        uri,
        photoIndex,
        key: uri ? `photo-${uri}-${photoIndex}` : `photo-empty-${photoIndex}`,
      });
    });

    return items;
  }, [photos, videoIntroUrl]);

  useEffect(() => {
    if (!videoIntroUrl) {
      setVideoThumbUri(null);
      return;
    }

    let cancelled = false;

    const loadVideoThumb = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoIntroUrl, {
          time: 0,
          quality: 0.7,
        });
        if (!cancelled) setVideoThumbUri(uri);
      } catch {
        if (!cancelled) setVideoThumbUri(photos[0] ?? null);
      }
    };

    loadVideoThumb();

    return () => {
      cancelled = true;
    };
  }, [videoIntroUrl, photos]);

  const photoSize = containerWidth > 0 ? containerWidth : photoHeight;

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const goToIndex = (index: number) => {
    setActiveIndex(index);
    if (containerWidth > 0) {
      listRef.current?.scrollToOffset({ offset: containerWidth * index, animated: true });
    }
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / containerWidth);
    setActiveIndex(Math.max(0, Math.min(index, galleryItems.length - 1)));
  };

  return (
    <View style={style} onLayout={onLayout}>
      <View style={[styles.photoContainer, { height: photoSize }]}>
        {containerWidth > 0 && (
          <AppFlatList
            ref={listRef}
            data={galleryItems}
            horizontal
            pagingEnabled
            bounces={galleryItems.length > 1}
            keyExtractor={(item) => item.key}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, index) => ({
              length: containerWidth,
              offset: containerWidth * index,
              index,
            })}
            renderItem={({ item, index }) => {
              if (item.type === 'video') {
                return (
                  <View style={{ width: containerWidth, height: photoSize }}>
                    <VideoIntroPlayer
                      uri={item.uri}
                      style={styles.media}
                      isActive={playbackEnabled && activeIndex === index}
                      autoPlay={playbackEnabled && activeIndex === index}
                    />
                  </View>
                );
              }

              const shouldBlurPhoto = !photosUnlocked && item.photoIndex > 0;

              return (
                <View style={{ width: containerWidth, height: photoSize }}>
                  {item.uri ? (
                    <ProfilePhoto uri={item.uri} style={styles.media} label={name} />
                  ) : (
                    <View style={[styles.media, styles.photoPlaceholder]}>
                      <Text style={styles.placeholderText}>{name[0]?.toUpperCase()}</Text>
                    </View>
                  )}

                  {shouldBlurPhoto && (
                    <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill}>
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={28} color={COLORS.text} />
                        <Text style={styles.lockText}>Upgrade to HitItOff Pro to see all photos</Text>
                      </View>
                    </BlurView>
                  )}
                </View>
              );
            }}
          />
        )}

        {showPhotoNav && galleryItems.length > 1 && (
          <View style={styles.dots} pointerEvents="none">
            {galleryItems.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.dot,
                  item.type === 'video' && styles.dotVideo,
                  i === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {showThumbnails && galleryItems.length > 1 && (
        <AppScrollView horizontal style={styles.thumbRow}>
          {galleryItems.map((item, i) => {
            if (item.type === 'video') {
              const posterUri = videoThumbUri ?? photos[0] ?? null;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => goToIndex(i)}
                  style={[styles.thumbWrap, i === activeIndex && styles.thumbActive]}
                >
                  {posterUri ? (
                    <ProfilePhoto uri={posterUri} style={styles.thumb} label={name} />
                  ) : (
                    <View style={[styles.thumb, styles.videoThumb]}>
                      <Ionicons name="videocam" size={20} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.playOverlay}>
                    <Ionicons name="play-circle" size={28} color={COLORS.text} />
                  </View>
                </Pressable>
              );
            }

            const locked = !photosUnlocked && item.photoIndex > 0;

            return (
              <Pressable
                key={item.key}
                onPress={() => goToIndex(i)}
                style={[styles.thumbWrap, i === activeIndex && styles.thumbActive]}
              >
                {item.uri ? (
                  <ProfilePhoto uri={item.uri} style={styles.thumb} label={name} />
                ) : (
                  <View style={[styles.thumb, styles.photoPlaceholder]}>
                    <Text style={styles.thumbPlaceholderText}>{name[0]?.toUpperCase()}</Text>
                  </View>
                )}
                {locked && <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />}
              </Pressable>
            );
          })}
        </AppScrollView>
      )}
    </View>
  );
}

const THUMB_SIZE = 64;

const styles = StyleSheet.create({
  photoContainer: {
    width: '100%',
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 64,
    color: COLORS.primary,
    fontWeight: '700',
  },
  thumbPlaceholderText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
  },
  lockOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotVideo: {
    backgroundColor: 'rgba(255, 77, 141, 0.7)',
  },
  dotActive: {
    backgroundColor: COLORS.text,
    width: 20,
  },
  thumbRow: {
    marginTop: 12,
    flexGrow: 0,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: COLORS.primary,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  videoThumb: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

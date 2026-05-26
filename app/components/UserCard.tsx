import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScrollView } from './AppScrollView';
import { formatDistanceMi } from '../utils/distance';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { Candidate } from '../types';
import { ProfileMediaGallery } from './ProfileMediaGallery';
import { MoodBadge } from './MoodBadge';
import { RespectfulDaterBadge } from './RespectfulDaterBadge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface UserCardProps {
  user: Candidate;
  showCompatibility?: boolean;
  photosUnlocked?: boolean;
  mediaActive?: boolean;
  photoHeight?: number;
}

export function UserCard({
  user,
  showCompatibility = true,
  photosUnlocked = false,
  mediaActive = true,
  photoHeight = CARD_WIDTH * 1.1,
}: UserCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.mediaWrap}>
        <ProfileMediaGallery
          name={user.name}
          photos={user.photos}
          videoIntroUrl={user.video_intro_url}
          photosUnlocked={photosUnlocked}
          photoHeight={photoHeight}
          showPhotoNav
          showThumbnails
          mediaActive={mediaActive}
        />

      {showCompatibility && (
        <View style={styles.compatibilityBadge}>
          <Text style={styles.compatibilityText}>{user.compatibilityScore}%</Text>
          <Text style={styles.compatibilityLabel}>match</Text>
        </View>
      )}
      <View style={styles.topLeftBadges}>
        <MoodBadge mood={user.current_mood} size="medium" />
        {user.respectful_dater_badge && <RespectfulDaterBadge size="small" />}
      </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>
          {user.name}, {user.age}
        </Text>
        <Text style={styles.distance}>{formatDistanceMi(user.distanceMi)}</Text>
        {user.bio ? <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text> : null}

        {user.interests.length > 0 && (
          <AppScrollView horizontal>
            <View style={styles.tags}>
              {user.interests.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </AppScrollView>
        )}

        {!photosUnlocked && user.photos.length > 1 && (
          <Text style={styles.photoHint}>First photo free · upgrade for the full gallery</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaWrap: {
    position: 'relative',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  compatibilityText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  compatibilityLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  topLeftBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 6,
    zIndex: 2,
  },
  info: {
    padding: 16,
  },
  name: {
    ...headerText,
    color: COLORS.text,
    fontSize: 24,
  },
  distance: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 8,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  photoHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});

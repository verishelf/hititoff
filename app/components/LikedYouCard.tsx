import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProfilePhoto } from './ProfilePhoto';
import { COLORS } from '../utils/constants';
import type { UserProfile } from '../types';

interface LikedYouCardProps {
  liker: UserProfile;
  locked?: boolean;
  isSuperLike?: boolean;
  onPress: () => void;
  avatarSize?: number;
}

export function LikedYouCard({
  liker,
  locked = false,
  isSuperLike = false,
  onPress,
  avatarSize = 64,
}: LikedYouCardProps) {
  const avatarStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.avatarWrap, avatarStyle]}>
        {liker.photos[0] ? (
          <ProfilePhoto uri={liker.photos[0]} style={avatarStyle} label={liker.name} />
        ) : (
          <View style={[avatarStyle, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{liker.name[0] ?? '?'}</Text>
          </View>
        )}

        {locked && <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />}

        {isSuperLike && (
          <View style={styles.superBadge}>
            <Ionicons name="star" size={10} color={COLORS.text} />
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {liker.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  avatarWrap: {
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  superBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#60a5fa',
    borderRadius: 10,
    padding: 3,
    zIndex: 2,
  },
  name: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

interface LikedYouPlaceholderProps {
  onPress: () => void;
  avatarSize?: number;
}

export function LikedYouPlaceholder({ onPress, avatarSize = 64 }: LikedYouPlaceholderProps) {
  const avatarStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.avatarWrap, avatarStyle, styles.avatarPlaceholder]}>
        <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
      </View>
    </TouchableOpacity>
  );
}

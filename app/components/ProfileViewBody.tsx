import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import { AppScrollView } from './AppScrollView';
import { InstagramSection } from './InstagramSection';
import { ProfileMediaGallery } from './ProfileMediaGallery';

const { width } = Dimensions.get('window');

interface ProfileViewBodyProps {
  name: string;
  age: number;
  bio: string;
  interests: string[];
  photos: string[];
  videoIntroUrl?: string | null;
  instagramUsername?: string | null;
  instagramPhotos?: string[];
  photosUnlocked?: boolean;
}

export function ProfileViewBody({
  name,
  age,
  bio,
  interests,
  photos,
  videoIntroUrl,
  instagramUsername = null,
  instagramPhotos = [],
  photosUnlocked = true,
}: ProfileViewBodyProps) {
  const photoHeight = width - 48;

  return (
    <View style={styles.card}>
      <ProfileMediaGallery
        name={name}
        photos={photos}
        videoIntroUrl={videoIntroUrl}
        photosUnlocked={photosUnlocked}
        photoHeight={photoHeight}
        showPhotoNav
        showThumbnails
      />

      <View style={styles.info}>
        <Text style={styles.name}>
          {name}, {age}
        </Text>
        {bio ? <Text style={styles.bio}>{bio}</Text> : null}

        {interests.length > 0 && (
          <AppScrollView horizontal>
            <View style={styles.tags}>
              {interests.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </AppScrollView>
        )}

        <InstagramSection
          mode="view"
          username={instagramUsername}
          photos={instagramPhotos}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  info: {
    padding: 16,
  },
  name: {
    ...headerText,
    color: COLORS.text,
    fontSize: 24,
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
});

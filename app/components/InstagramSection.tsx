import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from './AppScrollView';
import { ProfilePhoto } from './ProfilePhoto';
import { deleteProfilePhoto } from '../services/matchService';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import {
  formatInstagramHandle,
  instagramProfileUrl,
  parseInstagramUsername,
} from '../utils/instagram';

interface InstagramSectionProps {
  mode: 'view' | 'edit';
  username: string | null;
  photos: string[];
  onUpdate?: (updates: {
    instagram_username?: string | null;
    instagram_photos?: string[];
  }) => Promise<void>;
}

export function InstagramSection({
  mode,
  username,
  photos,
  onUpdate,
}: InstagramSectionProps) {
  const [usernameInput, setUsernameInput] = useState(username ? `@${username}` : '');
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    setUsernameInput(username ? `@${username}` : '');
  }, [username]);

  const hasContent = Boolean(username) || photos.length > 0;
  if (mode === 'view' && !hasContent) return null;

  const openInstagram = async () => {
    if (!username) return;
    const url = instagramProfileUrl(username);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Could not open Instagram');
    }
  };

  const saveUsername = async () => {
    if (!onUpdate) return;

    const parsed = parseInstagramUsername(usernameInput);
    if (usernameInput.trim() && !parsed) {
      Alert.alert('Invalid username', 'Enter a valid Instagram username or profile link.');
      return;
    }

    setSavingUsername(true);
    try {
      await onUpdate({ instagram_username: parsed });
      setUsernameInput(parsed ? `@${parsed}` : '');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save Instagram');
    } finally {
      setSavingUsername(false);
    }
  };

  const removePhoto = (index: number) => {
    const url = photos[index];
    if (!url || !onUpdate) return;

    Alert.alert('Remove photo?', 'This will delete the photo from your Instagram section.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingIndex(index);
            await deleteProfilePhoto(url);
            await onUpdate({ instagram_photos: photos.filter((_, i) => i !== index) });
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove photo');
          } finally {
            setDeletingIndex(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#f58529', '#dd2a7b', '#8134af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBadge}
        >
          <Ionicons name="logo-instagram" size={18} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Instagram</Text>
      </View>

      {mode === 'edit' ? (
        <>
          <Text style={styles.hint}>
            Add your @username or paste your profile link.
          </Text>
          <View style={styles.usernameRow}>
            <TextInput
              style={styles.usernameInput}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="@username or instagram.com/..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={saveUsername}
              disabled={savingUsername}
            >
              {savingUsername ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Text style={styles.connectBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {username ? (
            <TouchableOpacity style={styles.profileLink} onPress={openInstagram}>
              <Text style={styles.profileLinkText}>{formatInstagramHandle(username)}</Text>
              <Ionicons name="open-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null}

          {photos.length > 0 && (
            <AppScrollView horizontal contentContainerStyle={styles.photosContent}>
              {photos.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoWrap}>
                  <ProfilePhoto uri={uri} style={styles.photo} label="Instagram" />
                  <TouchableOpacity
                    style={styles.deletePhotoBtn}
                    onPress={() => removePhoto(index)}
                    disabled={deletingIndex === index}
                  >
                    {deletingIndex === index ? (
                      <ActivityIndicator size="small" color={COLORS.text} />
                    ) : (
                      <Ionicons name="close" size={14} color={COLORS.text} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </AppScrollView>
          )}
        </>
      ) : (
        <>
          {username ? (
            <TouchableOpacity style={styles.profileLink} onPress={openInstagram}>
              <Text style={styles.profileLinkText}>{formatInstagramHandle(username)}</Text>
              <Ionicons name="open-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null}

          {photos.length > 0 && (
            <AppScrollView horizontal contentContainerStyle={styles.photosContent}>
              {photos.map((uri, index) => (
                <ProfilePhoto key={`${uri}-${index}`} uri={uri} style={styles.photo} label="Instagram" />
              ))}
            </AppScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...headerText,
    color: COLORS.text,
    fontSize: 16,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  usernameRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  usernameInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  connectBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  profileLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  photosContent: {
    alignItems: 'center',
    paddingRight: 8,
  },
  photoWrap: {
    position: 'relative',
    marginRight: 10,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.text,
  },
});

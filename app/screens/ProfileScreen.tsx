import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { AppScrollView } from '../components/AppScrollView';
import { LegalLinksRow } from '../components/LegalLinksRow';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount, signOut } from '../services/authService';
import {
  deleteProfilePhoto,
  deleteProfileVideo,
  uploadProfilePhoto,
  uploadProfileVideo,
} from '../services/matchService';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '../store/userStore';
import { COLORS, INTEREST_OPTIONS, MAX_VIDEO_INTRO_SECONDS } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { MainTabParamList, RootStackParamList } from '../types';
import { VideoIntroPlayer } from '../components/VideoIntroPlayer';
import { ProfileViewBody } from '../components/ProfileViewBody';
import { InstagramSection } from '../components/InstagramSection';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { uploadAndSummarizeVoice } from '../services/voiceService';
import { submitVerificationRequest } from '../services/safetyService';
import { ProfileCoachPanel } from '../components/ProfileCoachPanel';
import { upsertOwnPhone } from '../services/phoneService';
import { isValidPhoneNumber, normalizePhoneInput } from '../utils/phone';

interface ProfileScreenProps {
  userId: string;
  onSignOut: () => void;
}

type ProfileTabRoute = RouteProp<MainTabParamList, 'Profile'>;

export function ProfileScreen({ userId, onSignOut }: ProfileScreenProps) {
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const route = useRoute<ProfileTabRoute>();
  const { profile, updateUserProfile, loadProfile } = useUserStore();
  const { hasPro, expirationDate } = useHitItOffPro();
  const { checkPro } = useSubscriptionStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? '');
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void checkPro(userId);
      loadProfile(userId);
    }, [checkPro, loadProfile, userId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!route.params?.edit || !profile) return;

      setName(profile.name ?? '');
      setBio(profile.bio ?? '');
      setInterests(profile.interests ?? []);
      setPhoneNumber(profile.phone_number ?? '');
      setEditing(true);
      tabNav.setParams({ edit: undefined });
    }, [route.params?.edit, profile, tabNav]),
  );

  const premium = hasPro;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setUploadingPhoto(true);
        const asset = result.assets[0];
        const url = await uploadProfilePhoto(
          userId,
          asset.uri,
          profile?.photos.length ?? 0,
          asset.mimeType ?? undefined,
        );
        await updateUserProfile(userId, {
          photos: [...(profile?.photos ?? []), url],
        });
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const pickVideoIntro = async () => {
    if (!premium) {
      stackNav.navigate('Paywall');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to upload a video intro.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_VIDEO_INTRO_SECONDS,
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const durationMs = asset.duration ?? 0;
      if (durationMs > MAX_VIDEO_INTRO_SECONDS * 1000) {
        Alert.alert('Too long', `Video intro must be ${MAX_VIDEO_INTRO_SECONDS} seconds or less`);
        return;
      }

      try {
        setUploadingVideo(true);
        if (profile?.video_intro_url) {
          await deleteProfileVideo(profile.video_intro_url);
        }
        const url = await uploadProfileVideo(userId, asset.uri, asset.mimeType ?? undefined);
        await updateUserProfile(userId, { video_intro_url: url });
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Video upload failed');
      } finally {
        setUploadingVideo(false);
      }
    }
  };

  const removeVideoIntro = () => {
    if (!profile?.video_intro_url) return;

    Alert.alert('Remove video intro?', 'This will delete your video from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploadingVideo(true);
            await deleteProfileVideo(profile.video_intro_url!);
            await updateUserProfile(userId, { video_intro_url: null });
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove video');
          } finally {
            setUploadingVideo(false);
          }
        },
      },
    ]);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 8
          ? [...prev, interest]
          : prev,
    );
  };

  const removePhoto = (index: number) => {
    const url = profile?.photos[index];
    if (!url) return;

    Alert.alert('Remove photo?', 'This will delete the photo from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingPhotoIndex(index);
            await deleteProfilePhoto(url);
            await updateUserProfile(userId, {
              photos: profile.photos.filter((_, i) => i !== index),
            });
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove photo');
          } finally {
            setDeletingPhotoIndex(null);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone && !isValidPhoneNumber(trimmedPhone)) {
      Alert.alert('Invalid number', 'Please enter a valid phone number or clear the field');
      return;
    }

    try {
      await updateUserProfile(userId, { name, bio, interests });
      await upsertOwnPhone(userId, trimmedPhone);
      await loadProfile(userId);
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    }
  };

  const startEditing = () => {
    setName(profile?.name ?? '');
    setBio(profile?.bio ?? '');
    setInterests(profile?.interests ?? []);
    setPhoneNumber(profile?.phone_number ?? '');
    setEditing(true);
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your profile, matches, and messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              onSignOut();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  if (!profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity onPress={() => (editing ? handleSave() : startEditing())}>
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <>
              <View style={styles.photosRow}>
                <AppScrollView
                  horizontal
                  contentContainerStyle={styles.photosContent}
                >
                  {profile.photos.map((uri, i) => (
                    <View key={`${uri}-${i}`} style={styles.photoWrap}>
                      <ProfilePhoto uri={uri} style={styles.photo} label={profile.name} />
                      <TouchableOpacity
                        style={styles.deletePhotoBtn}
                        onPress={() => removePhoto(i)}
                        disabled={deletingPhotoIndex === i}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        {deletingPhotoIndex === i ? (
                          <ActivityIndicator size="small" color={COLORS.text} />
                        ) : (
                          <Ionicons name="close" size={14} color={COLORS.text} />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addPhoto}
                    onPress={pickPhoto}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <ActivityIndicator color={COLORS.primary} />
                    ) : (
                      <Ionicons name="add" size={32} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </AppScrollView>
              </View>

              {profile.photos.length === 0 && (
                <Text style={styles.photoHint}>Add at least one photo so matches can see you.</Text>
              )}

              <View style={styles.videoSection}>
                <Text style={styles.sectionLabel}>Video intro</Text>
                {premium ? (
                  <>
                    {profile.video_intro_url ? (
                      <View style={styles.videoWrap}>
                        <VideoIntroPlayer uri={profile.video_intro_url} style={styles.videoPlayer} />
                        <TouchableOpacity style={styles.removeVideoBtn} onPress={removeVideoIntro}>
                          <Ionicons name="trash-outline" size={16} color={COLORS.text} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={styles.videoBtn}
                      onPress={pickVideoIntro}
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <ActivityIndicator color={COLORS.primary} />
                      ) : (
                        <>
                          <Ionicons name="videocam" size={20} color={COLORS.primary} />
                          <Text style={styles.videoBtnText}>
                            {profile.video_intro_url ? 'Replace video intro' : 'Add video intro'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.videoHint}>
                      HitItOff Pro · up to {MAX_VIDEO_INTRO_SECONDS} seconds
                    </Text>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.videoLocked}
                    onPress={() => stackNav.navigate('Paywall')}
                  >
                    <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
                    <Text style={styles.videoLockedText}>
                      Upgrade to add a {MAX_VIDEO_INTRO_SECONDS}s video intro
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor={COLORS.textMuted}
                multiline
              />

              <Text style={styles.sectionLabel}>Phone number</Text>
              <Text style={styles.phoneHint}>
                Private — only shared when you and a match both tap Exchange numbers.
              </Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(normalizePhoneInput(text))}
                placeholder="(555) 123-4567"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={20}
              />

              <View style={styles.interests}>
                {INTEREST_OPTIONS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.chip,
                      interests.includes(interest) && styles.chipActive,
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        interests.includes(interest) && styles.chipTextActive,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <InstagramSection
                mode="edit"
                username={profile.instagram_username}
                photos={profile.instagram_photos}
                onUpdate={async (updates) => {
                  await updateUserProfile(userId, updates);
                }}
              />

              <View style={styles.voiceSection}>
                <Text style={styles.sectionLabel}>Voice bio</Text>
                <VoiceRecorder
                  maxDurationSec={60}
                  label="Record a short voice intro"
                  onRecorded={async (uri) => {
                    try {
                      const { vibeSummary } = await uploadAndSummarizeVoice(userId, uri, 'bio');
                      await loadProfile(userId);
                      if (vibeSummary) {
                        Alert.alert('Voice saved', `Vibe: ${vibeSummary}`);
                      }
                    } catch (e) {
                      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
                    }
                  }}
                />
                {profile.voice_vibe_summary && (
                  <Text style={styles.vibeSummary}>"{profile.voice_vibe_summary}"</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={async () => {
                  const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                  });
                  if (result.canceled || !result.assets[0]) return;
                  try {
                    const url = await uploadProfilePhoto(userId, result.assets[0].uri, 99, 'image/jpeg');
                    await submitVerificationRequest(userId, url);
                    await loadProfile(userId);
                    Alert.alert('Submitted', 'Your verification request is pending review.');
                  } catch (e) {
                    Alert.alert('Error', e instanceof Error ? e.message : 'Verification failed');
                  }
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
                <Text style={styles.verifyBtnText}>
                  {profile.verification_status === 'verified'
                    ? 'Profile verified'
                    : profile.verification_status === 'pending'
                      ? 'Verification pending'
                      : 'Verify profile'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <ProfileViewBody
              name={profile.name}
              age={profile.age}
              bio={profile.bio}
              interests={profile.interests}
              photos={profile.photos}
              videoIntroUrl={profile.video_intro_url}
              instagramUsername={profile.instagram_username}
              instagramPhotos={profile.instagram_photos}
              photosUnlocked
              voiceBioUrl={profile.voice_bio_url}
              voiceVibeSummary={profile.voice_vibe_summary}
            />
          )}

          <View style={styles.coachSection}>
            <ProfileCoachPanel
              isPremium={premium}
              onApplyBio={(appliedBio) => {
                setBio(appliedBio);
                setEditing(true);
              }}
            />

            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => {
                if (!premium) {
                  stackNav.navigate('Paywall');
                  return;
                }
                stackNav.navigate('PracticeMode');
              }}
            >
              <Ionicons name="school-outline" size={20} color={COLORS.primary} />
              <View style={styles.practiceBtnTextWrap}>
                <Text style={styles.practiceBtnTitle}>Practice mode</Text>
                <Text style={styles.practiceBtnSub}>
                  {premium
                    ? 'Rehearse conversations with AI feedback'
                    : 'Pro — build confidence before real matches'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {!premium && (
            <View style={styles.quizHidden}>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
              <Text style={styles.quizHiddenText}>
                Quiz compatibility scores unlock after match or with HitItOff Pro
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.premiumBtn}
            onPress={() => stackNav.navigate('Paywall')}
          >
            <Ionicons name="star" size={20} color={COLORS.text} />
            <Text style={styles.premiumBtnText}>
              {premium ? 'HitItOff Pro Active' : 'Upgrade to HitItOff Pro'}
            </Text>
          </TouchableOpacity>

          {premium && (
            <TouchableOpacity
              style={styles.customerCenterBtn}
              onPress={() => stackNav.navigate('CustomerCenter')}
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.accent} />
              <Text style={styles.customerCenterText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}

          {premium && expirationDate ? (
            <Text style={styles.expirationText}>
              Renews {new Date(expirationDate).toLocaleDateString()}
            </Text>
          ) : null}

          <Text style={styles.settingsTitle}>Settings</Text>

          <LegalLinksRow style={styles.legalLinksRow} />

          <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteAccountText}>Delete My Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </AppScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { ...headerText, color: COLORS.text, fontSize: 28 },
  editBtn: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  photosRow: { height: 130, marginBottom: 12 },
  photosContent: { alignItems: 'center', paddingRight: 8 },
  photoWrap: {
    position: 'relative',
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 130,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  photoHint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  videoSection: { marginBottom: 20 },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  phoneHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
    marginBottom: 10,
  },
  videoWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.card,
  },
  videoBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  videoHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  videoLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoLockedText: {
    color: COLORS.textMuted,
    fontSize: 14,
    flex: 1,
  },
  addPhoto: {
    width: 100,
    height: 130,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...headerText, color: COLORS.text, fontSize: 24 },
  bio: { color: COLORS.textMuted, fontSize: 15, marginTop: 8, lineHeight: 22 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 14 },
  chipTextActive: { color: COLORS.text, fontWeight: '600' },
  quizHidden: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  quizHiddenText: { color: COLORS.textMuted, fontSize: 13, flex: 1 },
  coachSection: {
    marginTop: 20,
    gap: 12,
  },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  practiceBtnTextWrap: { flex: 1 },
  practiceBtnTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  practiceBtnSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  premiumBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  customerCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customerCenterText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  expirationText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
  },
  settingsTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 12,
  },
  legalLinksRow: {
    marginBottom: 24,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  deleteAccountText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  signOutBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  voiceSection: {
    marginTop: 20,
    gap: 8,
  },
  vibeSummary: {
    color: COLORS.accent,
    fontSize: 14,
    fontStyle: 'italic',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  verifyBtnText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  signOutText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },
});

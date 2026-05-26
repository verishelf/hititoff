import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from '../components/AppScrollView';
import { ProfileMediaGallery } from '../components/ProfileMediaGallery';
import { ProfileMessageSection } from '../components/ProfileMessageSection';
import { InstagramSection } from '../components/InstagramSection';
import { getMatchIdForUsers, createMatchFromLikedYou } from '../services/matchService';
import { useMatchStore } from '../store/matchStore';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useUserStore } from '../store/userStore';
import { COLORS } from '../utils/constants';
import { headerText, navHeaderText } from '../utils/typography';
import { formatDistanceMi } from '../utils/distance';
import { getCompatibilityBreakdown } from '../utils/compatibility';
import type { RootStackParamList, CompatibilityBreakdown } from '../types';
import { CompatibilityBreakdown as CompatibilityBreakdownView } from '../components/CompatibilityBreakdown';
import { RespectfulDaterBadge } from '../components/RespectfulDaterBadge';
import { MoodBadge } from '../components/MoodBadge';
import { VoiceBioSection } from '../components/VoiceBioSection';
import { ReportBlockSheet } from '../components/ReportBlockSheet';
import { SparkMeter, INITIAL_SPARK_TEMPERATURE } from '../components/SparkMeter';
import { DateInviteSection } from '../components/DateInviteSection';
import { useMatchChemistry } from '../hooks/useMatchChemistry';

type UserProfileRoute = RouteProp<RootStackParamList, 'UserProfile'>;

interface UserProfileScreenProps {
  userId: string;
}

export function UserProfileScreen({ userId }: UserProfileScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<UserProfileRoute>();
  const { profile } = useUserStore();
  const { hasPro: premium } = useHitItOffPro();
  const dismissedMessageMatchIds = useMatchStore((s) => s.dismissedMessageMatchIds);
  const restoreToMessagesInbox = useMatchStore((s) => s.restoreToMessagesInbox);

  const {
    userId: otherUserId,
    name,
    age,
    bio,
    interests,
    photos,
    videoIntroUrl,
    instagramUsername,
    instagramPhotos,
    distanceMi,
    compatibilityScore,
    fromLikedYou,
    currentMood,
    voiceBioUrl,
    voiceVibeSummary,
    respectfulDaterBadge,
  } = route.params;

  const [matchId, setMatchId] = useState<string | null>(route.params.matchId ?? null);
  const [startingMessage, setStartingMessage] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(true);
  const [breakdown, setBreakdown] = useState<CompatibilityBreakdown | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const { sparkMeter } = useMatchChemistry(matchId);

  const photosUnlocked = premium;
  const photoHeight = Dimensions.get('window').width - 48;

  const refreshMatchId = useCallback(async () => {
    const id = await getMatchIdForUsers(userId, otherUserId);
    setMatchId(id);
  }, [userId, otherUserId]);

  useFocusEffect(
    useCallback(() => {
      refreshMatchId();
    }, [refreshMatchId]),
  );

  useEffect(() => {
    if (premium && compatibilityScore != null) {
      getCompatibilityBreakdown(userId, otherUserId, compatibilityScore, compatibilityScore)
        .then(setBreakdown)
        .catch(() => {});
    }
  }, [userId, otherUserId, premium, compatibilityScore]);

  const isConversationRemoved = Boolean(matchId && dismissedMessageMatchIds.includes(matchId));

  useEffect(() => {
    if (!matchId) {
      setShowMessageComposer(false);
      return;
    }

    setShowMessageComposer(!dismissedMessageMatchIds.includes(matchId));
  }, [matchId, dismissedMessageMatchIds]);

  const handleRestoreConversation = () => {
    if (!matchId) return;
    restoreToMessagesInbox(matchId);
    setShowMessageComposer(true);
  };

  const handleStartMessage = async () => {
    setStartingMessage(true);
    try {
      let id = matchId ?? (await getMatchIdForUsers(userId, otherUserId));
      if (!id) {
        id = await createMatchFromLikedYou(userId, otherUserId);
      }
      setMatchId(id);
      await refreshMatchId();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not start messaging';
      if (message.includes('limit')) {
        Alert.alert('Daily Limit', 'Upgrade to HitItOff Pro for unlimited likes', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
        ]);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setStartingMessage(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setReportVisible(true)} style={styles.backBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <AppScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <ProfileMediaGallery
              name={name}
              photos={photos}
              videoIntroUrl={videoIntroUrl}
              photosUnlocked={photosUnlocked}
              photoHeight={photoHeight}
              showPhotoNav
              showThumbnails
            />

            <Text style={styles.name}>
              {name}, {age}
            </Text>
            {distanceMi != null && (
              <Text style={styles.distance}>{formatDistanceMi(distanceMi)}</Text>
            )}
            {photosUnlocked && compatibilityScore != null && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{compatibilityScore}% compatible</Text>
              </View>
            )}
            <View style={styles.badgeRow}>
              <MoodBadge mood={currentMood} size="medium" />
              {respectfulDaterBadge && <RespectfulDaterBadge size="medium" />}
            </View>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}

            <VoiceBioSection
              voiceBioUrl={voiceBioUrl}
              vibeSummary={voiceVibeSummary}
            />

            {breakdown && (
              <CompatibilityBreakdownView
                breakdown={breakdown}
                blurred={!premium}
              />
            )}

            {interests.length > 0 && (
              <View style={styles.interests}>
                {interests.map((tag) => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <InstagramSection
              mode="view"
              username={instagramUsername ?? null}
              photos={instagramPhotos ?? []}
            />

            {!photosUnlocked && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => navigation.navigate('Paywall')}
              >
                <Ionicons name="star" size={18} color={COLORS.text} />
                <Text style={styles.upgradeBtnText}>Unlock all photos with HitItOff Pro</Text>
              </TouchableOpacity>
            )}

            {fromLikedYou && !matchId && (
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleStartMessage}
                disabled={startingMessage}
              >
                {startingMessage ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <>
                    <Ionicons name="chatbubble" size={18} color={COLORS.text} />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {matchId ? (
              <View style={styles.sparkRow}>
                <SparkMeter
                  value={sparkMeter > 0 ? sparkMeter : INITIAL_SPARK_TEMPERATURE}
                  size={64}
                  label="Conversation temperature"
                  isInitialBaseline={sparkMeter <= 0}
                />
              </View>
            ) : null}

            {matchId ? (
              <DateInviteSection
                matchId={matchId}
                userId={userId}
                otherUserName={name}
                isPremium={premium}
              />
            ) : null}
          </AppScrollView>

          {matchId && isConversationRemoved && !showMessageComposer && (
            <TouchableOpacity style={styles.restoreMessageBtn} onPress={handleRestoreConversation}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.text} />
              <Text style={styles.restoreMessageText}>Message {name}</Text>
            </TouchableOpacity>
          )}

          {matchId && showMessageComposer ? (
            <ProfileMessageSection
              matchId={matchId}
              userId={userId}
              otherUserName={name}
              isPremium={premium}
            />
          ) : null}
        </KeyboardAvoidingView>

        <ReportBlockSheet
          visible={reportVisible}
          reporterId={userId}
          reportedId={otherUserId}
          reportedName={name}
          onClose={() => setReportVisible(false)}
          onBlocked={() => navigation.goBack()}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...navHeaderText,
    color: COLORS.text,
    fontSize: 17,
  },
  scroll: {
    padding: 24,
    paddingBottom: 16,
  },
  name: {
    ...headerText,
    color: COLORS.text,
    fontSize: 28,
    marginTop: 20,
  },
  distance: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 6,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  matchBadgeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  sparkRow: {
    marginTop: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  bio: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
  },
  upgradeBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
  },
  messageBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  restoreMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
  },
  restoreMessageText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

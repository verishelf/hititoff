import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScrollView } from '../components/AppScrollView';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LikedYouCard, LikedYouPlaceholder } from '../components/LikedYouCard';
import { ProfilePhoto } from '../components/ProfilePhoto';
import {
  DiscoveryPreferences,
  profileToDiscoveryPreferences,
} from '../components/DiscoveryPreferences';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useMatchStore } from '../store/matchStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '../store/userStore';
import { APP_SLOGAN, COLORS, FREE_LIKED_YOU_PREVIEW, HITITOFF_PRO_UPGRADE_BLURB } from '../utils/constants';
import { headerText, navHeaderText } from '../utils/typography';
import { getDevMockLikesReceived } from '../utils/mockLikedYou';
import type { MainTabParamList, MatchRecord, RootStackParamList, UserProfile } from '../types';
import { MoodSelector } from '../components/MoodSelector';
import { AnimatedStatCard } from '../components/AnimatedStatCard';
import { QuickActionOrb } from '../components/QuickActionOrb';
import { setMood } from '../services/moodService';
import { hapticLight } from '../utils/haptics';
import type { MoodId } from '../utils/moodData';

interface HomeScreenProps {
  userId: string;
}

function isBoostActive(boostedUntil: string | null | undefined): boolean {
  return Boolean(boostedUntil && new Date(boostedUntil).getTime() > Date.now());
}

function formatBoostRemaining(boostedUntil: string): string {
  const ms = new Date(boostedUntil).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins} min left`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder > 0 ? `${hours}h ${remainder}m left` : `${hours}h left`;
}

type ProfileTip = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
};

export function HomeScreen({ userId }: HomeScreenProps) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, radiusMi, setRadius, refreshLocation, loadProfile, updateDiscoveryPreferences } =
    useUserStore();
  const {
    candidates,
    matches,
    likesReceived,
    likesRemaining,
    loadCandidates,
    loadMatches,
    loadLikesReceived,
    checkSwipeLimit,
    triggerBoost,
  } = useMatchStore();
  const unreadMessageCount = useMatchStore((s) => s.unreadMessageCount);
  const { hasPro: premium } = useHitItOffPro();
  const { checkPro } = useSubscriptionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [statsResetKey, setStatsResetKey] = useState(0);
  const [statsAnimKey, setStatsAnimKey] = useState(0);
  const boostActive = isBoostActive(profile?.boosted_until);
  const recentMatches = useMemo(() => matches.slice(0, 8), [matches]);

  const displayLikesReceived = useMemo(
    () => getDevMockLikesReceived(likesReceived),
    [likesReceived],
  );

  const regularLikesReceived = useMemo(
    () => displayLikesReceived.filter((like) => !like.is_super_like),
    [displayLikesReceived],
  );

  const superLikesReceived = useMemo(
    () => displayLikesReceived.filter((like) => like.is_super_like),
    [displayLikesReceived],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkPro(userId),
        refreshLocation(userId),
        checkSwipeLimit(userId),
        loadCandidates(userId, radiusMi),
        loadMatches(userId),
        loadLikesReceived(userId),
        loadProfile(userId),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    userId,
    radiusMi,
    checkPro,
    refreshLocation,
    checkSwipeLimit,
    loadCandidates,
    loadMatches,
    loadLikesReceived,
    loadProfile,
  ]);

  useFocusEffect(
    useCallback(() => {
      setStatsResetKey((key) => key + 1);

      let active = true;
      void (async () => {
        await refresh();
        if (!active) return;
        setStatsAnimKey((key) => key + 1);
        hapticLight();
      })();
      return () => {
        active = false;
      };
    }, [refresh]),
  );

  const openUserProfile = (user: UserProfile, options?: { matchId?: string; fromLikedYou?: boolean }) => {
    stackNav.navigate('UserProfile', {
      userId: user.id,
      name: user.name,
      age: user.age,
      bio: user.bio,
      interests: user.interests,
      photos: user.photos,
      videoIntroUrl: user.video_intro_url,
      instagramUsername: user.instagram_username,
      instagramPhotos: user.instagram_photos,
      matchId: options?.matchId,
      fromLikedYou: options?.fromLikedYou,
    });
  };

  const handleBoost = async () => {
    if (!premium) {
      stackNav.navigate('Paywall');
      return;
    }
    try {
      await triggerBoost(userId);
      await loadProfile(userId);
      Alert.alert('Boost Active', 'Your profile is boosted for 30 minutes!');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Boost failed');
    }
  };

  const profileTips = useMemo((): ProfileTip[] => {
    if (!profile) return [];

    const tips: ProfileTip[] = [];

    if (profile.photos.length < 3) {
      tips.push({
        icon: 'images-outline',
        text: 'Add more photos to get more matches',
        onPress: () => tabNav.navigate('Profile'),
      });
    }

    if (!profile.quiz_completed) {
      tips.push({
        icon: 'help-circle-outline',
        text: 'Complete the compatibility quiz',
        onPress: () => stackNav.navigate('Quiz'),
      });
    }

    if (premium && !profile.video_intro_url) {
      tips.push({
        icon: 'videocam-outline',
        text: 'Add a video intro to stand out',
        onPress: () => tabNav.navigate('Profile'),
      });
    }

    if (!profile.bio || profile.bio.trim().length < 20) {
      tips.push({
        icon: 'create-outline',
        text: 'Write a bio so people know you better',
        onPress: () => tabNav.navigate('Profile', { edit: true }),
      });
    }

    return tips.slice(0, 2);
  }, [profile, premium, tabNav, stackNav]);

  const renderMatchCard = (item: MatchRecord) => {
    const other = item.otherUser;
    if (!other) return null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.recentCard}
        onPress={() => openUserProfile(other, { matchId: item.id })}
        activeOpacity={0.85}
      >
        {other.photos[0] ? (
          <ProfilePhoto uri={other.photos[0]} style={styles.recentAvatar} label={other.name} />
        ) : (
          <View style={[styles.recentAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{other.name[0] ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.recentName} numberOfLines={1}>
          {other.name}
        </Text>
        {!item.last_message_at && <View style={styles.newDot} />}
      </TouchableOpacity>
    );
  };

  const renderLikedYouCard = (
    item: (typeof displayLikesReceived)[number],
    index: number,
    options?: { showSuperBadge?: boolean; proOnly?: boolean },
  ) => {
    const liker = item.liker;
    if (!liker) return null;

    const proOnly = options?.proOnly ?? false;
    const locked = proOnly ? !premium : !premium && index >= FREE_LIKED_YOU_PREVIEW;

    return (
      <LikedYouCard
        key={item.liker_id}
        liker={liker}
        locked={locked}
        isSuperLike={options?.showSuperBadge ?? false}
        onPress={() => {
          if (locked) {
            stackNav.navigate('Paywall');
            return;
          }
          openUserProfile(liker, { fromLikedYou: true });
        }}
      />
    );
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />
          }
        >
          <Text style={styles.greeting}>Hey, {profile?.name ?? 'there'} 👋</Text>
          <Text style={styles.subtitle}>{APP_SLOGAN}</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => tabNav.navigate('Swipe')}>
              <QuickActionOrb variant="discover" />
              <Text style={styles.quickLabel}>Discover</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={() => tabNav.navigate('Matches')}>
              <QuickActionOrb variant="messages" showBadge={unreadMessageCount > 0} />
              <Text style={styles.quickLabel}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handleBoost}>
              <QuickActionOrb variant="boost" pulse boostActive={boostActive} />
              <Text style={styles.quickLabel}>Boost</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={() => tabNav.navigate('Profile')}>
              <QuickActionOrb variant="profile" />
              <Text style={styles.quickLabel}>Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <AnimatedStatCard
              value={candidates.length}
              label="Nearby"
              resetTrigger={statsResetKey}
              animationTrigger={statsAnimKey}
              delayMs={0}
              onPress={() => tabNav.navigate('Swipe')}
            />
            <AnimatedStatCard
              value={matches.length}
              label="Matches"
              resetTrigger={statsResetKey}
              animationTrigger={statsAnimKey}
              delayMs={60}
              onPress={() => tabNav.navigate('Matches')}
            />
            <AnimatedStatCard
              value={likesRemaining}
              label="Likes left"
              infinity={premium}
              resetTrigger={statsResetKey}
              animationTrigger={statsAnimKey}
              delayMs={120}
              onPress={() => tabNav.navigate('Swipe')}
            />
            <AnimatedStatCard
              value={likesReceived.length}
              label="Liked you"
              resetTrigger={statsResetKey}
              animationTrigger={statsAnimKey}
              delayMs={180}
              onPress={() => tabNav.navigate('Matches')}
            />
          </View>

          {profile && (
            <View style={styles.section}>
              <MoodSelector
                selectedMood={(profile.current_mood as MoodId) ?? null}
                onSelect={async (mood) => {
                  await setMood(userId, mood);
                  await loadProfile(userId);
                  await loadCandidates(userId, radiusMi);
                }}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dating Preferences</Text>
            {profile ? (
              <DiscoveryPreferences
                value={profileToDiscoveryPreferences(profile)}
                radiusMi={radiusMi}
                isPremium={Boolean(premium)}
                onSave={async (preferences, radius) => {
                  await updateDiscoveryPreferences(userId, preferences);
                  setRadius(radius);
                  await loadCandidates(userId, radius);
                }}
                onPremiumRequired={() => stackNav.navigate('Paywall')}
              />
            ) : null}
          </View>

          {boostActive && profile?.boosted_until ? (
            <View style={styles.boostActiveCard}>
              <Ionicons name="flash" size={22} color="#facc15" />
              <View style={styles.boostActiveText}>
                <Text style={styles.boostActiveTitle}>Boost is active</Text>
                <Text style={styles.boostActiveSub}>
                  {formatBoostRemaining(profile.boosted_until)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.boostCard} onPress={handleBoost} activeOpacity={0.85}>
              <View style={styles.boostCardLeft}>
                <Ionicons name="flash-outline" size={24} color="#facc15" />
                <View>
                  <Text style={styles.boostCardTitle}>Boost your profile</Text>
                  <Text style={styles.boostCardSub}>Be seen by more people for 30 minutes</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          {recentMatches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Matches</Text>
                <TouchableOpacity onPress={() => tabNav.navigate('Matches')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <AppScrollView horizontal>
                {recentMatches.map(renderMatchCard)}
              </AppScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liked You</Text>
            {regularLikesReceived.length > 0 ? (
              <>
                {!premium && regularLikesReceived.length > FREE_LIKED_YOU_PREVIEW && (
                  <Text style={styles.likedYouHint}>
                    {regularLikesReceived.length - FREE_LIKED_YOU_PREVIEW} more hidden — upgrade to see all
                  </Text>
                )}
                <AppScrollView horizontal>
                  {regularLikesReceived
                    .slice(0, 8)
                    .map((item, index) => renderLikedYouCard(item, index))}
                </AppScrollView>
              </>
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="heart-outline" size={28} color={COLORS.textMuted} />
                <Text style={styles.emptySectionText}>No likes yet — keep swiping!</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Super Likes</Text>
            {!premium ? (
              <View style={styles.superLikesBox}>
                {superLikesReceived.length > 0 && (
                  <Text style={styles.superLikesHint}>
                    {superLikesReceived.length} super{' '}
                    {superLikesReceived.length === 1 ? 'like' : 'likes'} waiting — upgrade to see who
                  </Text>
                )}
                <AppScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.superLikesScroll}
                >
                  {[0, 1, 2].map((index) => (
                    <LikedYouPlaceholder
                      key={index}
                      onPress={() => stackNav.navigate('Paywall')}
                    />
                  ))}
                </AppScrollView>
                <Text style={styles.proFeatureHint}>Super Likes are included with HitItOff Pro</Text>
              </View>
            ) : superLikesReceived.length > 0 ? (
              <AppScrollView horizontal showsHorizontalScrollIndicator={false}>
                {superLikesReceived
                  .slice(0, 8)
                  .map((item, index) =>
                    renderLikedYouCard(item, index, { showSuperBadge: true, proOnly: true }),
                  )}
              </AppScrollView>
            ) : (
              <View style={styles.superLikesBox}>
                <View style={styles.superLikesEmpty}>
                  <Ionicons name="star-outline" size={28} color={COLORS.textMuted} />
                  <Text style={styles.superLikesEmptyText}>
                    No super likes yet — swipe up on profiles you really like!
                  </Text>
                </View>
              </View>
            )}
          </View>

          {profileTips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Improve Your Profile</Text>
              {profileTips.map((tip) => (
                <TouchableOpacity
                  key={tip.text}
                  style={styles.tipRow}
                  onPress={tip.onPress}
                  activeOpacity={0.85}
                >
                  <View style={styles.tipIcon}>
                    <Ionicons name={tip.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.swipeBtn}
            onPress={() => tabNav.navigate('Swipe')}
          >
            <Ionicons name="heart" size={22} color={COLORS.text} />
            <Text style={styles.swipeBtnText}>Start Swiping</Text>
          </TouchableOpacity>

          {!premium && (
            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={() => stackNav.navigate('Paywall')}
            >
              <Ionicons name="star" size={20} color={COLORS.primary} />
              <Text style={styles.premiumText}>
                Upgrade to HitItOff Pro — {HITITOFF_PRO_UPGRADE_BLURB}
              </Text>
            </TouchableOpacity>
          )}
        </AppScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 100 },
  greeting: { ...headerText, color: COLORS.text, fontSize: 28 },
  subtitle: { color: COLORS.textMuted, fontSize: 15, marginBottom: 20 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAction: { alignItems: 'center', flex: 1 },
  quickLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  boostCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  boostCardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  boostCardSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  boostActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(250,204,21,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
  },
  boostActiveText: { flex: 1 },
  boostActiveTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  boostActiveSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    ...navHeaderText,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 12,
  },
  likedYouHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: -4,
    marginBottom: 12,
  },
  proFeatureHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 12,
  },
  superLikesBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  superLikesHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  superLikesScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  superLikesEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  superLikesEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  seeAll: { color: COLORS.primary, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  recentCard: { alignItems: 'center', marginRight: 14, width: 72 },
  recentAvatar: { width: 64, height: 64, borderRadius: 32 },
  recentName: { color: COLORS.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center' },
  newDot: {
    position: 'absolute',
    top: 2,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  superBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    backgroundColor: '#60a5fa',
    borderRadius: 10,
    padding: 3,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  emptySectionText: { color: COLORS.textMuted, fontSize: 14 },
  likedYouLocked: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 100,
    justifyContent: 'center',
  },
  likedYouBlurred: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
    opacity: 0.35,
  },
  blurredAvatar: { width: 56, height: 56, borderRadius: 28 },
  likedYouLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(18,8,16,0.55)',
  },
  likedYouLockText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,77,141,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: { color: COLORS.text, fontSize: 14, flex: 1 },
  swipeBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  swipeBtnText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  premiumText: { color: COLORS.text, fontSize: 14, flex: 1 },
});

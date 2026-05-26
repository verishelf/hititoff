import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { AppFlatList } from '../components/AppFlatList';
import { AppScrollView } from '../components/AppScrollView';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LikedYouCard, LikedYouPlaceholder } from '../components/LikedYouCard';
import { MatchSwipeRow } from '../components/MatchSwipeRow';
import { DateInviteInboxRow } from '../components/DateInviteInboxRow';
import { deleteAllOwnMessagesInMatch, getInboxDateInvites, markAsRead } from '../services/chatService';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useMatchStore } from '../store/matchStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { COLORS, FREE_LIKED_YOU_PREVIEW } from '../utils/constants';
import { headerText } from '../utils/typography';
import { getDevMockLikesReceived } from '../utils/mockLikedYou';
import type { InboxDateInvite, MatchRecord, RootStackParamList, UserProfile } from '../types';

interface MatchesScreenProps {
  userId: string;
}

export function MatchesScreen({ userId }: MatchesScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    matches,
    likesReceived,
    dismissedMessageMatchIds,
    loadMatches,
    loadLikesReceived,
    dismissFromMessagesInbox,
  } = useMatchStore();
  const { hasPro: premium } = useHitItOffPro();
  const { checkPro } = useSubscriptionStore();
  const [dateInvites, setDateInvites] = useState<InboxDateInvite[]>([]);

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

  const inviteMatchIds = useMemo(
    () => new Set(dateInvites.map((invite) => invite.matchId)),
    [dateInvites],
  );

  const conversationMatches = useMemo(
    () =>
      matches.filter(
        (match) =>
          !dismissedMessageMatchIds.includes(match.id) &&
          Boolean(match.last_message_at) &&
          !inviteMatchIds.has(match.id),
      ),
    [matches, dismissedMessageMatchIds, inviteMatchIds],
  );

  const refresh = useCallback(async () => {
    await checkPro(userId);
    await loadMatches(userId);
    await loadLikesReceived(userId);

    const activeMatches = useMatchStore
      .getState()
      .matches.filter(
        (match) =>
          !useMatchStore.getState().dismissedMessageMatchIds.includes(match.id) &&
          Boolean(match.last_message_at),
      );

    try {
      const invites = await getInboxDateInvites(userId, activeMatches);
      setDateInvites(invites);
    } catch {
      setDateInvites([]);
    }
  }, [userId, checkPro, loadMatches, loadLikesReceived]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openUserProfile = (user: UserProfile, options?: { matchId?: string; fromLikedYou?: boolean }) => {
    navigation.navigate('UserProfile', {
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

  const handleLikedYouPress = (liker: UserProfile, locked: boolean) => {
    if (locked) {
      navigation.navigate('Paywall');
      return;
    }

    openUserProfile(liker, { fromLikedYou: true });
  };

  const renderLikedYouItem = ({
    item,
    index,
    showSuperBadge = false,
    proOnly = false,
  }: {
    item: (typeof displayLikesReceived)[number];
    index: number;
    showSuperBadge?: boolean;
    proOnly?: boolean;
  }) => {
    const liker = item.liker;
    if (!liker) return null;

    const locked = proOnly ? !premium : !premium && index >= FREE_LIKED_YOU_PREVIEW;

    return (
      <LikedYouCard
        liker={liker}
        locked={locked}
        isSuperLike={showSuperBadge}
        onPress={() => handleLikedYouPress(liker, locked)}
      />
    );
  };

  const handleRemoveConversation = async (matchId: string) => {
    dismissFromMessagesInbox(matchId);

    try {
      await deleteAllOwnMessagesInMatch(matchId, userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (!message.includes('No messages from you to delete')) {
        Alert.alert('Error', message || 'Failed to remove conversation');
      }
    }

    await loadMatches(userId);
  };

  const renderMatchAvatar = (item: MatchRecord) => {
    const other = item.otherUser;
    if (!other) return null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.matchCard}
        onPress={() => openUserProfile(other, { matchId: item.id })}
        activeOpacity={0.85}
      >
        {other.photos[0] ? (
          <ProfilePhoto uri={other.photos[0]} style={styles.matchAvatar} label={other.name} />
        ) : (
          <View style={[styles.matchAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{other.name[0] ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.matchName} numberOfLines={1}>
          {other.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleInvitePress = (invite: InboxDateInvite) => {
    const other = invite.otherUser;
    if (!other) return;

    void markAsRead(invite.matchId, userId).then(() => {
      setDateInvites((current) =>
        current.map((item) =>
          item.messageId === invite.messageId ? { ...item, isUnread: false } : item,
        ),
      );
    });

    openUserProfile(other, { matchId: invite.matchId });
  };

  const renderInviteHeader = () => {
    if (dateInvites.length === 0) return null;

    return (
      <View style={styles.invitesBlock}>
        <Text style={styles.invitesSubtitle}>Date invites</Text>
        {dateInvites.map((invite) => (
          <DateInviteInboxRow
            key={invite.messageId}
            invite={invite}
            onPress={() => handleInvitePress(invite)}
          />
        ))}
        {conversationMatches.length > 0 ? (
          <Text style={styles.chatsSubtitle}>Chats</Text>
        ) : null}
      </View>
    );
  };

  const renderConversation = ({ item }: { item: MatchRecord }) => {
    const other = item.otherUser;
    if (!other) return null;

    return (
      <MatchSwipeRow
        item={item}
        onPress={() => openUserProfile(other, { matchId: item.id })}
        onDeleteMessage={() => handleRemoveConversation(item.id)}
      />
    );
  };

  const emptyMessagesCopy =
    matches.length > 0
      ? 'No active chats. Tap a match above to start messaging.'
      : 'No matches yet. Keep swiping!';

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Matches</Text>

        {(regularLikesReceived.length > 0 || superLikesReceived.length === 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liked You</Text>
            {regularLikesReceived.length > 0 ? (
              <>
                {!premium && regularLikesReceived.length > FREE_LIKED_YOU_PREVIEW && (
                  <Text style={styles.likedYouHint}>
                    {regularLikesReceived.length - FREE_LIKED_YOU_PREVIEW} more hidden — upgrade to see all
                  </Text>
                )}
                <AppFlatList
                  horizontal
                  data={regularLikesReceived}
                  keyExtractor={(item) => item.liker_id}
                  renderItem={({ item, index }) => renderLikedYouItem({ item, index })}
                />
              </>
            ) : premium ? (
              <Text style={styles.noLikesText}>No likes yet — keep swiping!</Text>
            ) : (
              <AppScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[0, 1, 2].map((index) => (
                  <LikedYouPlaceholder
                    key={index}
                    onPress={() => navigation.navigate('Paywall')}
                  />
                ))}
              </AppScrollView>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Super Likes</Text>
          {!premium ? (
            <>
              {superLikesReceived.length > 0 && (
                <Text style={styles.likedYouHint}>
                  {superLikesReceived.length} super{' '}
                  {superLikesReceived.length === 1 ? 'like' : 'likes'} waiting — upgrade to see who
                </Text>
              )}
              <AppScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[0, 1, 2].map((index) => (
                  <LikedYouPlaceholder
                    key={index}
                    onPress={() => navigation.navigate('Paywall')}
                  />
                ))}
              </AppScrollView>
              <Text style={styles.proFeatureHint}>Super Likes are included with HitItOff Pro</Text>
            </>
          ) : superLikesReceived.length > 0 ? (
            <AppFlatList
              horizontal
              data={superLikesReceived}
              keyExtractor={(item) => item.liker_id}
              renderItem={({ item, index }) =>
                renderLikedYouItem({ item, index, showSuperBadge: true, proOnly: true })
              }
            />
          ) : (
            <Text style={styles.noLikesText}>
              No super likes yet — swipe up on profiles you really like!
            </Text>
          )}
        </View>

        {matches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Matches</Text>
            <AppFlatList
              horizontal
              data={matches}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderMatchAvatar(item)}
            />
          </View>
        )}

        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {dateInvites.length === 0 && conversationMatches.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{emptyMessagesCopy}</Text>
            </View>
          ) : (
            <AppFlatList
              style={styles.conversationList}
              data={conversationMatches}
              keyExtractor={(item) => item.id}
              renderItem={renderConversation}
              ListHeaderComponent={renderInviteHeader}
              contentContainerStyle={styles.list}
              extraData={[dismissedMessageMatchIds, dateInvites]}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  title: { ...headerText, color: COLORS.text, fontSize: 28, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    ...headerText,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 12,
  },
  invitesBlock: {
    marginBottom: 4,
  },
  invitesSubtitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chatsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  likedYouHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: -4,
    marginBottom: 12,
  },
  noLikesText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  proFeatureHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  matchCard: { alignItems: 'center', marginRight: 16, width: 72 },
  matchAvatar: { width: 64, height: 64, borderRadius: 32 },
  matchName: { color: COLORS.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  messagesSection: {
    flex: 1,
  },
  conversationList: {
    flex: 1,
  },
  list: { paddingBottom: 24 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 72,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
});

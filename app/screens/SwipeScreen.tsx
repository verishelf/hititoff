import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AdBanner } from '../components/AdBanner';
import { MatchModal } from '../components/MatchModal';
import { RadiusSelector } from '../components/RadiusSelector';
import { SwipeDeck } from '../components/SwipeDeck';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useMatchStore } from '../store/matchStore';
import { useUserStore } from '../store/userStore';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { Candidate, RootStackParamList, SwipeDirection } from '../types';

const HEADER_HEIGHT = 56;
const INFO_SECTION_HEIGHT = 148;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 60;
const AD_BANNER_HEIGHT = 56;

interface SwipeScreenProps {
  userId: string;
}

export function SwipeScreen({ userId }: SwipeScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { profile, radiusMi, setRadius, refreshLocation } = useUserStore();
  const [deckKey, setDeckKey] = useState(0);
  const {
    candidates,
    isLoading,
    showMatchModal,
    matchedUser,
    lastMatchId,
    loadCandidates,
    swipe,
    dismissMatchModal,
    checkSwipeLimit,
    triggerBoost,
    resetDiscover,
  } = useMatchStore();
  const { hasPro: premium } = useHitItOffPro();
  const showCompatibility = Boolean(premium);
  const photosUnlocked = Boolean(premium);

  const maxPhotoHeight = useMemo(() => {
    const cardWidth = windowWidth - 32;
    const adHeight = premium ? 0 : AD_BANNER_HEIGHT;
    const deckHeight =
      windowHeight -
      insets.top -
      HEADER_HEIGHT -
      adHeight -
      TAB_BAR_HEIGHT -
      24;
    return Math.max(260, Math.min(cardWidth * 1.1, deckHeight - INFO_SECTION_HEIGHT));
  }, [windowWidth, windowHeight, insets.top, premium]);

  const handleViewProfile = (candidate: Candidate) => {
    navigation.navigate('UserProfile', {
      userId: candidate.id,
      name: candidate.name,
      age: candidate.age,
      bio: candidate.bio,
      interests: candidate.interests,
      photos: candidate.photos,
      videoIntroUrl: candidate.video_intro_url,
      instagramUsername: candidate.instagram_username,
      instagramPhotos: candidate.instagram_photos,
      distanceMi: candidate.distanceMi,
      compatibilityScore: candidate.compatibilityScore,
    });
  };

  const refresh = useCallback(async () => {
    await refreshLocation(userId);
    await checkSwipeLimit(userId);
    await loadCandidates(userId, radiusMi);
  }, [userId, radiusMi, refreshLocation, checkSwipeLimit, loadCandidates]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSwipe = async (candidate: Candidate, direction: SwipeDirection) => {
    if (direction === 'super_like' && !premium) {
      navigation.navigate('Paywall');
      return;
    }

    try {
      await swipe(userId, candidate, direction);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Swipe failed';
      if (message.includes('limit')) {
        Alert.alert('Daily Limit', 'Upgrade to Premium for unlimited likes', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
        ]);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleBoost = async () => {
    if (!premium) {
      navigation.navigate('Paywall');
      return;
    }
    try {
      await triggerBoost(userId);
      Alert.alert('Boost Active', 'Your profile is boosted for 30 minutes!');
      await refresh();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Boost failed');
    }
  };

  const performResetDiscover = async () => {
    await resetDiscover(userId);
    setDeckKey((current) => current + 1);
    await refresh();
  };

  const handleResetDiscover = () => {
    Alert.alert(
      'Reset Discover',
      'Clear your swipe history and matches so profiles show up again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await performResetDiscover();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Reset failed');
            }
          },
        },
      ],
    );
  };

  const handleMatchChat = () => {
    dismissMatchModal();
    if (lastMatchId && matchedUser) {
      navigation.navigate('Chat', {
        matchId: lastMatchId,
        otherUserName: matchedUser.name,
        otherUserId: matchedUser.id,
        otherUserInterests: matchedUser.interests,
      });
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <RadiusSelector
            mini
            selected={radiusMi}
            isPremium={Boolean(premium)}
            onSelect={(r) => {
              setRadius(r);
              loadCandidates(userId, r);
            }}
            onPremiumRequired={() => navigation.navigate('Paywall')}
          />
          <TouchableOpacity onPress={handleBoost} style={styles.boostBtn}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          {__DEV__ ? (
            <TouchableOpacity onPress={handleResetDiscover} style={styles.boostBtn}>
              <Ionicons name="refresh" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <View style={styles.deckArea}>
            <SwipeDeck
              key={deckKey}
              deckKey={deckKey}
              candidates={candidates}
              showCompatibility={showCompatibility}
              photosUnlocked={photosUnlocked}
              superLikeEnabled={Boolean(premium)}
              maxPhotoHeight={maxPhotoHeight}
              onSwipe={handleSwipe}
              onViewProfile={handleViewProfile}
              onSuperLikeBlocked={() => navigation.navigate('Paywall')}
              onResetDiscover={handleResetDiscover}
            />
          </View>
        )}

        <AdBanner visible={!premium} />

        <MatchModal
          visible={showMatchModal}
          matchedUser={matchedUser}
          onChat={handleMatchChat}
          onDismiss={dismissMatchModal}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
    zIndex: 2,
  },
  deckArea: {
    flex: 1,
    overflow: 'hidden',
  },
  title: { ...headerText, color: COLORS.text, fontSize: 24, flex: 1 },
  boostBtn: {
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loader: { flex: 1 },
});

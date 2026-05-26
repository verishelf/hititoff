import 'react-native-gesture-handler';
import { Outfit_700Bold, Outfit_800ExtraBold, useFonts } from '@expo-google-fonts/outfit';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import type { Session } from '@supabase/supabase-js';
import { RootNavigator } from './app/navigation/RootNavigator';
import { AuthScreen } from './app/screens/AuthScreen';
import { OnboardingScreen } from './app/screens/OnboardingScreen';
import { QuizScreen } from './app/screens/QuizScreen';
import {
  clearStaleSession,
  createSessionFromAuthUrl,
  getValidSession,
  isInvalidRefreshTokenError,
  onAuthStateChange,
} from './app/services/authService';
import { initializeRevenueCat, isRevenueCatConfigured, teardownRevenueCatListeners } from './app/services/revenuecat';
import type { CustomerInfo } from 'react-native-purchases';
import { getProfile } from './app/services/matchService';
import { useMatchStore } from './app/store/matchStore';
import { useSubscriptionStore } from './app/store/subscriptionStore';
import { useUserStore } from './app/store/userStore';
import { COLORS } from './app/utils/constants';
import { initializeAds } from './app/services/adsService';
import { heartbeat } from './app/services/activityService';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    border: 'transparent',
  },
};

type AppPhase = 'loading' | 'auth' | 'onboarding' | 'quiz' | 'main';

const SPLASH_TIMEOUT_MS = 5000;

SplashScreen.preventAutoHideAsync().catch(() => {});

async function runDeferredMainInit(
  userId: string,
  loadProfile: (userId: string) => Promise<void>,
  setCustomerInfo: (info: CustomerInfo) => void,
  checkPro: (userId: string) => Promise<boolean>,
) {
  try {
    if (isRevenueCatConfigured()) {
      await initializeRevenueCat(userId, setCustomerInfo);
      await checkPro(userId);
    }
    await loadProfile(userId);
  } catch (error) {
    console.warn('[App] Deferred main init failed', error);
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<AppPhase>('loading');

  const { loadProfile, clear: clearUser } = useUserStore();
  const { clear: clearMatch } = useMatchStore();
  const { checkPro, setCustomerInfo, clear: clearSub, showPaywall } = useSubscriptionStore();

  const resolvePhase = async (currentSession: Session | null) => {
    try {
      if (!currentSession) {
        setPhase('auth');
        return;
      }

      const userProfile = await getProfile(currentSession.user.id);
      if (userProfile) {
        useUserStore.setState({ profile: userProfile, isLoading: false, error: null });
      }

      if (!userProfile?.photos?.length) {
        setPhase('onboarding');
        return;
      }

      if (!userProfile.quiz_completed) {
        setPhase('quiz');
        return;
      }

      setPhase('main');
      void runDeferredMainInit(
        currentSession.user.id,
        loadProfile,
        setCustomerInfo,
        checkPro,
      );
      heartbeat(currentSession.user.id).catch(() => {});
    } catch (error) {
      console.warn('[App] Failed to resolve app phase', error);
      setPhase('auth');
    }
  };

  useEffect(() => {
    initializeAds();
  }, []);

  useEffect(() => {
    async function handleAuthCallback(url: string | null) {
      if (!url || !url.includes('auth/callback')) return;

      try {
        await createSessionFromAuthUrl(url);
      } catch (error) {
        console.warn('[App] Magic link callback failed', error);
      }
    }

    Linking.getInitialURL()
      .then(handleAuthCallback)
      .catch(() => {});

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthCallback(url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const currentSession = await getValidSession();
        if (cancelled) return;
        setSession(currentSession);
        await resolvePhase(currentSession);
      } catch (error) {
        console.warn('[App] Bootstrap failed', error);
        if (isInvalidRefreshTokenError(error)) {
          await clearStaleSession();
          if (!cancelled) setSession(null);
        }
        if (!cancelled) setPhase('auth');
      }
    }

    bootstrap();

    const { data: subscription } = onAuthStateChange(async (currentSession) => {
      if (cancelled) return;
      setSession(currentSession);
      try {
        if (currentSession) {
          await resolvePhase(currentSession);
        } else {
          clearUser();
          clearMatch();
          clearSub();
          teardownRevenueCatListeners();
          setPhase('auth');
        }
      } catch (error) {
        console.warn('[App] Auth state change failed', error);
        if (isInvalidRefreshTokenError(error)) {
          await clearStaleSession();
          setSession(null);
        }
        setPhase('auth');
      }
    });

    const splashTimeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setPhase((current) => (current === 'loading' ? 'auth' : current));
    }, SPLASH_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(splashTimeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'loading' && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [phase, fontsLoaded]);

  const handleSignOut = () => {
    clearUser();
    clearMatch();
    clearSub();
    teardownRevenueCatListeners();
    setSession(null);
    setPhase('auth');
  };

  const handleQuizComplete = async () => {
    if (!session) return;

    if (isRevenueCatConfigured()) {
      await initializeRevenueCat(session.user.id, setCustomerInfo);
      try {
        await showPaywall();
      } catch (error) {
        console.warn('[RevenueCat] Post-quiz paywall failed', error);
      }
      await checkPro(session.user.id);
    }

    await loadProfile(session.user.id);
    setPhase('main');
  };

  const renderContent = () => {
    if (phase === 'loading' || !fontsLoaded) {
      return null;
    }

    if (!session || phase === 'auth') {
      return (
        <AuthScreen
          onAuthenticated={async () => {
            const current = await getValidSession();
            setSession(current);
            await resolvePhase(current);
          }}
        />
      );
    }

    if (phase === 'onboarding') {
      return (
        <OnboardingScreen
          userId={session.user.id}
          onComplete={() => setPhase('quiz')}
        />
      );
    }

    if (phase === 'quiz') {
      return (
        <QuizScreen
          userId={session.user.id}
          onComplete={handleQuizComplete}
        />
      );
    }

    return <RootNavigator userId={session.user.id} onSignOut={handleSignOut} />;
  };

  return (
    <GestureHandlerRootView style={[styles.flex, styles.root]}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          {renderContent()}
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { backgroundColor: COLORS.background },
});

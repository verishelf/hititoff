import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getSession,
  sendMagicLink,
  signInWithEmail,
  signUpWithEmail,
} from '../services/authService';
import { LegalLinksRow } from '../components/LegalLinksRow';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';

const splashVideoSource = require('../../assets/splash.mp4');

function SplashVideoBackground({ children }: { children: React.ReactNode }) {
  const player = useVideoPlayer(splashVideoSource, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        player.play();
      } else {
        player.pause();
      }
    });

    return () => subscription.remove();
  }, [player]);

  return (
    <View style={styles.backgroundRoot}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.videoOverlay} pointerEvents="none" />
      {children}
    </View>
  );
}

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password, name);
        if (error) throw new Error(error);
        const current = await getSession();
        if (current) onAuthenticated();
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw new Error(error);
        onAuthenticated();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendMagicLink(email);
      if (error) throw new Error(error);
      setMagicLinkSent(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const resetToSignIn = () => {
    setIsSignUp(false);
    setIsMagicLink(false);
    setMagicLinkSent(false);
  };

  return (
    <SplashVideoBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <View style={styles.titleWrap}>
            <Text style={styles.title}>HitItOff</Text>
          </View>

          <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {!isMagicLink && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'password'}
            />
          )}

          {isMagicLink && (
            <Text style={styles.magicHint}>
              {magicLinkSent
                ? `We sent a sign-in link to ${email}. Open it on this device to continue.`
                : "Enter your email and we'll send you a one-time sign-in link."}
            </Text>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={isMagicLink ? handleMagicLink : handleEmailAuth}
            disabled={loading || (isMagicLink && magicLinkSent)}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isMagicLink
                  ? magicLinkSent
                    ? 'Link Sent'
                    : 'Send Magic Link'
                  : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {isMagicLink ? (
            <>
              {magicLinkSent && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setMagicLinkSent(false);
                    void handleMagicLink();
                  }}
                  disabled={loading}
                >
                  <Text style={styles.switchText}>Resend link</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={resetToSignIn}>
                <Text style={styles.switchText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setMagicLinkSent(false);
                }}
              >
                <Text style={styles.switchText}>
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </Text>
              </TouchableOpacity>
              {!isSignUp && (
                <TouchableOpacity
                  onPress={() => {
                    setIsMagicLink(true);
                    setMagicLinkSent(false);
                  }}
                >
                  <Text style={styles.forgotText}>Forgot your password?</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          <LegalLinksRow />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SplashVideoBackground>
  );
}

const styles = StyleSheet.create({
  backgroundRoot: { flex: 1, backgroundColor: COLORS.background },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 8, 16, 0.5)',
  },
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, paddingVertical: 24, justifyContent: 'center' },
  titleWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  title: {
    ...headerText,
    color: COLORS.primary,
    fontSize: 40,
    textAlign: 'center',
    width: '100%',
  },
  form: {
    width: '100%',
  },
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
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  forgotText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  magicHint: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  secondaryBtn: {
    marginTop: 4,
  },
});

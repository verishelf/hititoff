import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectUrl = Linking.createURL('auth/callback');

export async function createSessionFromAuthUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace('#', '?'));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const code = parsed.searchParams.get('code') ?? hashParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(error.message);
    return;
  }

  const tokenHash = parsed.searchParams.get('token_hash') ?? hashParams.get('token_hash');
  const type = parsed.searchParams.get('type') ?? hashParams.get('type');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'magiclink' | 'recovery',
    });
    if (error) throw new Error(error.message);
    return;
  }

  throw new Error('Sign-in link is invalid or expired');
}

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ session: Session | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { session: null, error: error.message };
  return { session: data.session, error: null };
}

async function signInWithOAuth(provider: 'google' | 'apple') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(error.message);
  if (!data.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type !== 'success' || !result.url) {
    throw new Error('OAuth cancelled');
  }

  await createSessionFromAuthUrl(result.url);
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithOAuth('google');
}

export async function signInWithApple(): Promise<void> {
  if (Platform.OS === 'ios') {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign-In failed: no identity token');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw new Error(error.message);
    return;
  }

  await signInWithOAuth('apple');
}

export function isInvalidRefreshTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /refresh token/i.test(message) || /invalid refresh/i.test(message);
}

/** Clear cached auth without requiring a valid refresh token on the server. */
export async function clearStaleSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

/**
 * Returns a session only if it is still valid on the Supabase Auth server.
 * Clears stale local tokens when refresh fails (common after DB resets or key changes).
 */
export async function getValidSession(): Promise<Session | null> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError && isInvalidRefreshTokenError(sessionError)) {
    await clearStaleSession();
    return null;
  }

  if (!session) return null;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    if (isInvalidRefreshTokenError(userError)) {
      await clearStaleSession();
    }
    return null;
  }

  return session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error && !isInvalidRefreshTokenError(error)) {
    throw new Error(error.message);
  }
  await clearStaleSession();
}

export async function deleteAccount(): Promise<void> {
  const { error: rpcError } = await supabase.rpc('delete_own_account');
  if (rpcError) throw new Error(rpcError.message);

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) throw new Error(signOutError.message);
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

export async function getSession(): Promise<Session | null> {
  return getValidSession();
}

export { redirectUrl };

import { supabase } from '../services/supabase';

/** Emails granted Pro without a RevenueCat subscription (testing / internal accounts). */
const GRANTED_PREMIUM_EMAILS = new Set(['frankposada4@icloud.com']);

export async function isDevPremiumUser(userId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId || !user.email) return false;
  return GRANTED_PREMIUM_EMAILS.has(user.email.toLowerCase());
}

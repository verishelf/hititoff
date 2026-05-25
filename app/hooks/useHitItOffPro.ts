import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '../store/userStore';

/**
 * Unified hook for HitItOff Pro entitlement across RevenueCat + Supabase profile.
 */
export function useHitItOffPro() {
  const { isPro, customerInfo, activeProductId, expirationDate } =
    useSubscriptionStore();
  const profile = useUserStore((s) => s.profile);

  const hasPro = isPro || Boolean(profile?.is_premium);

  return {
    hasPro,
    isPro,
    isPremium: hasPro,
    customerInfo,
    activeProductId,
    expirationDate,
  };
}

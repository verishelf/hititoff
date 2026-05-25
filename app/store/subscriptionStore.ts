import { create } from 'zustand';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import {
  checkHitItOffProEntitlement,
  getCustomerInfo,
  getOfferings,
  getSubscriptionPackages,
  parsePurchaseError,
  presentCustomerCenter,
  presentHitItOffProPaywall,
  presentHitItOffProPaywallIfNeeded,
  purchasePackage,
  restorePurchases,
  syncEntitlementToProfile,
  getActiveSubscriptionProductId,
  getExpirationDate,
  hasHitItOffProEntitlement,
} from '../services/revenuecat';
import { isDevPremiumUser } from '../utils/devPremium';
import { useUserStore } from '../store/userStore';

interface SubscriptionState {
  isPro: boolean;
  /** @deprecated alias for isPro */
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  packages: PurchasesPackage[];
  activeProductId: string | null;
  expirationDate: string | null;
  isLoading: boolean;
  error: string | null;

  setCustomerInfo: (info: CustomerInfo) => void;
  loadOfferings: () => Promise<void>;
  refreshCustomerInfo: (userId: string) => Promise<boolean>;
  checkPro: (userId: string) => Promise<boolean>;
  purchase: (userId: string, pkg: PurchasesPackage) => Promise<boolean>;
  restore: (userId: string) => Promise<boolean>;
  showPaywall: () => Promise<void>;
  showPaywallIfNeeded: () => Promise<void>;
  showCustomerCenter: () => Promise<void>;
  clear: () => void;
}

function applyCustomerInfo(info: CustomerInfo) {
  const isPro = hasHitItOffProEntitlement(info);
  return {
    isPro,
    isPremium: isPro,
    customerInfo: info,
    activeProductId: getActiveSubscriptionProductId(info),
    expirationDate: getExpirationDate(info),
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  isPremium: false,
  customerInfo: null,
  offerings: null,
  packages: [],
  activeProductId: null,
  expirationDate: null,
  isLoading: false,
  error: null,

  setCustomerInfo: (info) => {
    set(applyCustomerInfo(info));
  },

  loadOfferings: async () => {
    set({ isLoading: true, error: null });
    try {
      const offerings = await getOfferings();
      set({
        offerings,
        packages: getSubscriptionPackages(offerings),
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load offerings',
        isLoading: false,
      });
    }
  },

  refreshCustomerInfo: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const info = await getCustomerInfo();
      if (info) {
        set(applyCustomerInfo(info));
        await syncEntitlementToProfile(userId);
      }
      set({ isLoading: false });
      return get().isPro;
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to refresh subscription',
        isLoading: false,
      });
      return false;
    }
  },

  checkPro: async (userId) => {
    if (await isDevPremiumUser(userId)) {
      set({ isPro: true, isPremium: true });
      await syncEntitlementToProfile(userId);
      const profile = useUserStore.getState().profile;
      if (profile?.id === userId) {
        useUserStore.setState({ profile: { ...profile, is_premium: true } });
      }
      return true;
    }

    const isPro = await syncEntitlementToProfile(userId);
    const info = await getCustomerInfo();
    if (info) set(applyCustomerInfo(info));
    else set({ isPro, isPremium: isPro });

    const profile = useUserStore.getState().profile;
    if (profile?.id === userId && profile.is_premium !== isPro) {
      useUserStore.setState({ profile: { ...profile, is_premium: isPro } });
    }
    return isPro;
  },

  purchase: async (userId, pkg) => {
    set({ isLoading: true, error: null });
    try {
      const { isPro, customerInfo } = await purchasePackage(pkg, userId);
      set({ ...applyCustomerInfo(customerInfo), isLoading: false });
      return isPro;
    } catch (e) {
      const message = parsePurchaseError(e);
      if (message !== 'Purchase cancelled') {
        set({ error: message, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return false;
    }
  },

  restore: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { isPro, customerInfo } = await restorePurchases(userId);
      set({ ...applyCustomerInfo(customerInfo), isLoading: false });
      return isPro;
    } catch (e) {
      set({
        error: parsePurchaseError(e),
        isLoading: false,
      });
      return false;
    }
  },

  showPaywall: async () => {
    await presentHitItOffProPaywall();
    const info = await getCustomerInfo();
    if (info) set(applyCustomerInfo(info));
  },

  showPaywallIfNeeded: async () => {
    await presentHitItOffProPaywallIfNeeded();
    const info = await getCustomerInfo();
    if (info) set(applyCustomerInfo(info));
  },

  showCustomerCenter: async () => {
    await presentCustomerCenter();
    const info = await getCustomerInfo();
    if (info) set(applyCustomerInfo(info));
  },

  clear: () =>
    set({
      isPro: false,
      isPremium: false,
      customerInfo: null,
      offerings: null,
      packages: [],
      activeProductId: null,
      expirationDate: null,
      error: null,
    }),
}));

/** Convenience helper for non-component code */
export async function refreshProStatus(userId: string): Promise<boolean> {
  const isPro = await checkHitItOffProEntitlement();
  await syncEntitlementToProfile(userId);
  const info = await getCustomerInfo();
  if (info) useSubscriptionStore.setState(applyCustomerInfo(info));
  else useSubscriptionStore.setState({ isPro, isPremium: isPro });
  return isPro;
}

/** @deprecated Use isPro from useSubscriptionStore */
export const useSubscriptionStore_legacy = useSubscriptionStore;

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { HITITOFF_PRO_ENTITLEMENT, PACKAGE_IDS } from '../utils/constants';
import { isDevPremiumUser } from '../utils/devPremium';
import { useUserStore } from '../store/userStore';
import { syncPremiumStatus } from './matchService';

let initialized = false;
let listenerUserId: string | null = null;
let removeCustomerInfoListener: (() => void) | null = null;

export type { CustomerInfo, PurchasesError, PurchasesOfferings, PurchasesPackage };
export { PAYWALL_RESULT, PURCHASES_ERROR_CODE };

function getApiKey(): string {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (testKey) return testKey;

  return Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '')
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '');
}

export function isRevenueCatConfigured(): boolean {
  return Boolean(getApiKey());
}

export function hasHitItOffProEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[HITITOFF_PRO_ENTITLEMENT]);
}

export function getActiveSubscriptionProductId(
  customerInfo: CustomerInfo,
): string | null {
  const entitlement = customerInfo.entitlements.active[HITITOFF_PRO_ENTITLEMENT];
  return entitlement?.productIdentifier ?? null;
}

export function getExpirationDate(customerInfo: CustomerInfo): string | null {
  const entitlement = customerInfo.entitlements.active[HITITOFF_PRO_ENTITLEMENT];
  return entitlement?.expirationDate ?? null;
}

export function parsePurchaseError(error: unknown): string {
  const purchaseError = error as PurchasesError;
  if (purchaseError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return 'Purchase cancelled';
  }
  if (purchaseError?.code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
    return 'Network error. Check your connection and try again.';
  }
  if (purchaseError?.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
    return 'App Store error. Please try again later.';
  }
  if (purchaseError?.message) return purchaseError.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function applyPremiumToUserStore(userId: string, isPremium: boolean) {
  const profile = useUserStore.getState().profile;
  if (profile?.id === userId && profile.is_premium !== isPremium) {
    useUserStore.setState({ profile: { ...profile, is_premium: isPremium } });
  }
}

async function syncProfileFromCustomerInfo(
  userId: string,
  customerInfo: CustomerInfo,
): Promise<boolean> {
  if (await isDevPremiumUser(userId)) {
    await syncPremiumStatus(userId, true);
    applyPremiumToUserStore(userId, true);
    return true;
  }

  const isPro = hasHitItOffProEntitlement(customerInfo);
  await syncPremiumStatus(userId, isPro);
  applyPremiumToUserStore(userId, isPro);
  return isPro;
}

export async function initializeRevenueCat(
  userId: string,
  onCustomerInfoUpdated?: (info: CustomerInfo) => void,
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[RevenueCat] API key missing — subscriptions disabled');
    return;
  }

  if (__DEV__) {
    await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  if (!initialized) {
    Purchases.configure({ apiKey, appUserID: userId });
    initialized = true;
    listenerUserId = userId;
  } else if (listenerUserId !== userId) {
    await Purchases.logIn(userId);
    listenerUserId = userId;
  }

  if (removeCustomerInfoListener) {
    removeCustomerInfoListener();
    removeCustomerInfoListener = null;
  }

  const listener = (customerInfo: CustomerInfo) => {
    syncProfileFromCustomerInfo(userId, customerInfo).catch(console.warn);
    onCustomerInfoUpdated?.(customerInfo);
  };

  Purchases.addCustomerInfoUpdateListener(listener);
  removeCustomerInfoListener = () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };

  const customerInfo = await Purchases.getCustomerInfo();
  await syncProfileFromCustomerInfo(userId, customerInfo);
  onCustomerInfoUpdated?.(customerInfo);
}

export function teardownRevenueCatListeners(): void {
  removeCustomerInfoListener?.();
  removeCustomerInfoListener = null;
  listenerUserId = null;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn('[RevenueCat] getCustomerInfo failed', error);
    return null;
  }
}

export async function checkHitItOffProEntitlement(): Promise<boolean> {
  const info = await getCustomerInfo();
  return info ? hasHitItOffProEntitlement(info) : false;
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!initialized) return null;
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.warn('[RevenueCat] getOfferings failed', error);
    return null;
  }
}

export function getSubscriptionPackages(
  offerings: PurchasesOfferings | null,
): PurchasesPackage[] {
  const current = offerings?.current;
  if (!current) return [];

  const byId = new Map(
    current.availablePackages.map((pkg) => [pkg.identifier, pkg]),
  );

  return [
    byId.get(PACKAGE_IDS.weekly) ?? current.weekly,
    byId.get(PACKAGE_IDS.monthly) ?? current.monthly,
    byId.get(PACKAGE_IDS.yearly) ?? current.annual ?? byId.get(PACKAGE_IDS.yearly),
  ].filter(Boolean) as PurchasesPackage[];
}

export async function purchasePackage(
  pkg: PurchasesPackage,
  userId: string,
): Promise<{ isPro: boolean; customerInfo: CustomerInfo }> {
  if (!initialized) throw new Error('RevenueCat not initialized');

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = await syncProfileFromCustomerInfo(userId, customerInfo);
    return { isPro, customerInfo };
  } catch (error) {
    throw new Error(parsePurchaseError(error));
  }
}

export async function restorePurchases(
  userId: string,
): Promise<{ isPro: boolean; customerInfo: CustomerInfo }> {
  if (!initialized) throw new Error('RevenueCat not initialized');

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = await syncProfileFromCustomerInfo(userId, customerInfo);
    return { isPro, customerInfo };
  } catch (error) {
    throw new Error(parsePurchaseError(error));
  }
}

export async function syncEntitlementToProfile(userId: string): Promise<boolean> {
  if (await isDevPremiumUser(userId)) {
    await syncPremiumStatus(userId, true);
    applyPremiumToUserStore(userId, true);
    return true;
  }

  const info = await getCustomerInfo();
  if (!info) return false;
  return syncProfileFromCustomerInfo(userId, info);
}

export async function presentHitItOffProPaywall(): Promise<PAYWALL_RESULT> {
  return RevenueCatUI.presentPaywall();
}

export async function presentHitItOffProPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  return RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: HITITOFF_PRO_ENTITLEMENT,
  });
}

export async function presentCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter({
    callbacks: {
      onRestoreCompleted: ({ customerInfo }) => {
        if (listenerUserId) {
          syncProfileFromCustomerInfo(listenerUserId, customerInfo).catch(
            console.warn,
          );
        }
      },
      onRestoreFailed: ({ error }) => {
        console.warn('[RevenueCat] Customer Center restore failed', error);
      },
    },
  });
}

/** @deprecated Use checkHitItOffProEntitlement */
export const checkPremiumEntitlement = checkHitItOffProEntitlement;
/** @deprecated Use hasHitItOffProEntitlement */
export const hasFlikrProEntitlement = hasHitItOffProEntitlement;
/** @deprecated Use checkHitItOffProEntitlement */
export const checkFlikrProEntitlement = checkHitItOffProEntitlement;
/** @deprecated Use presentHitItOffProPaywall */
export const presentFlikrProPaywall = presentHitItOffProPaywall;
/** @deprecated Use presentHitItOffProPaywallIfNeeded */
export const presentFlikrProPaywallIfNeeded = presentHitItOffProPaywallIfNeeded;

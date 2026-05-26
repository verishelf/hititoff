import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  HITITOFF_PRO_ENTITLEMENT,
  IOS_BUNDLE_ID,
  PACKAGE_IDS,
  REVENUECAT_OFFERING_ID,
  STORE_PRODUCT_IDS,
} from '../utils/constants';
import { isDevPremiumUser } from '../utils/devPremium';
import { useUserStore } from '../store/userStore';
import { syncPremiumStatus } from './matchService';

let initialized = false;
let listenerUserId: string | null = null;
let removeCustomerInfoListener: (() => void) | null = null;

export type { CustomerInfo, PurchasesError, PurchasesOffering, PurchasesOfferings, PurchasesPackage };
export { PAYWALL_RESULT, PURCHASES_ERROR_CODE };

function normalizeEnv(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, '') ?? '';
}

function getApiKey(): string {
  const iosKey = normalizeEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
  const androidKey = normalizeEnv(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
  const testKey = normalizeEnv(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY);

  // Platform keys always win — using test_/goog_ on iOS (or appl_ on Android) causes Error 23.
  if (Platform.OS === 'ios') {
    if (iosKey) return iosKey;
    if (__DEV__ && testKey) return testKey;
    return '';
  }

  if (Platform.OS === 'android') {
    if (androidKey) return androidKey;
    if (__DEV__ && testKey) return testKey;
    return '';
  }

  return __DEV__ ? testKey : '';
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return 'MISSING';
  if (apiKey.length <= 12) return `${apiKey.slice(0, 5)}…`;
  return `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`;
}

function validateApiKeyForPlatform(apiKey: string): void {
  if (!apiKey) return;

  const masked = maskApiKey(apiKey);
  if (Platform.OS === 'ios' && !apiKey.startsWith('appl_') && !apiKey.startsWith('test_')) {
    console.warn(
      `[RevenueCat] iOS expects an appl_… API key; got "${masked}". This often causes Error 23.`,
    );
  }
  if (Platform.OS === 'android' && !apiKey.startsWith('goog_') && !apiKey.startsWith('test_')) {
    console.warn(
      `[RevenueCat] Android expects a goog_… API key; got "${masked}". This often causes Error 23.`,
    );
  }
}

export type RevenueCatDiagnostics = {
  platform: string;
  bundleId: string;
  apiKeyConfigured: boolean;
  apiKeyMasked: string;
  iosKeyConfigured: boolean;
  androidKeyConfigured: boolean;
  initialized: boolean;
  offeringId: string;
  entitlementId: string;
  expectedProductIds: string[];
  availableOfferingIds: string[];
  activeOfferingId: string | null;
  packageCount: number;
  storeProductIds: string[];
  packagesWithPrices: number;
  lastError: string | null;
};

let lastRevenueCatError: string | null = null;

export function getRevenueCatDiagnostics(
  offerings: PurchasesOfferings | null = null,
): RevenueCatDiagnostics {
  const apiKey = getApiKey();
  const active = getActiveOffering(offerings);
  const packages = active?.availablePackages ?? [];
  const storeProductIds = packages.map((pkg) => pkg.product.identifier);
  const packagesWithPrices = packages.filter((pkg) => Boolean(pkg.product.priceString)).length;

  return {
    platform: Platform.OS,
    bundleId: IOS_BUNDLE_ID,
    apiKeyConfigured: Boolean(apiKey),
    apiKeyMasked: maskApiKey(apiKey),
    iosKeyConfigured: Boolean(normalizeEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY)),
    androidKeyConfigured: Boolean(normalizeEnv(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY)),
    initialized,
    offeringId: REVENUECAT_OFFERING_ID,
    entitlementId: HITITOFF_PRO_ENTITLEMENT,
    expectedProductIds: Object.values(STORE_PRODUCT_IDS),
    availableOfferingIds: offerings ? Object.keys(offerings.all) : [],
    activeOfferingId: active?.identifier ?? null,
    packageCount: packages.length,
    storeProductIds,
    packagesWithPrices,
    lastError: lastRevenueCatError,
  };
}

function logRevenueCatDiagnostics(offerings: PurchasesOfferings | null = null): void {
  const diagnostics = getRevenueCatDiagnostics(offerings);
  console.warn('[RevenueCat] diagnostics', JSON.stringify(diagnostics, null, 2));
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
  if (purchaseError?.code === PURCHASES_ERROR_CODE.CONFIGURATION_ERROR) {
    return (
      'Subscription configuration error. Verify your RevenueCat API key, product IDs, ' +
      'and that subscriptions are set up in App Store Connect.'
    );
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
    lastRevenueCatError =
      'RevenueCat API key missing in this build. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY in EAS (production) and rebuild.';
    console.warn('[RevenueCat] API key missing — subscriptions disabled');
    logRevenueCatDiagnostics();
    return;
  }

  validateApiKeyForPlatform(apiKey);
  lastRevenueCatError = null;

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

export function getActiveOffering(
  offerings: PurchasesOfferings | null,
): PurchasesOffering | null {
  if (!offerings) return null;

  const configured = offerings.all[REVENUECAT_OFFERING_ID];
  if (configured) return configured;

  if (__DEV__) {
    console.warn(
      `[RevenueCat] Offering "${REVENUECAT_OFFERING_ID}" not found. Available:`,
      Object.keys(offerings.all).join(', ') || '(none)',
    );
  }

  return offerings.current ?? null;
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const active = getActiveOffering(offerings);

    if (!active) {
      lastRevenueCatError =
        `Offering "${REVENUECAT_OFFERING_ID}" not found. Available: ${
          Object.keys(offerings.all).join(', ') || '(none)'
        }`;
      console.warn(`[RevenueCat] ${lastRevenueCatError}`);
    } else if (active.availablePackages.length === 0) {
      lastRevenueCatError =
        `Offering "${REVENUECAT_OFFERING_ID}" has no packages — map weekly/monthly/yearly in RevenueCat.`;
      console.warn(`[RevenueCat] ${lastRevenueCatError}`);
    } else {
      const missingPrices = active.availablePackages.filter(
        (pkg) => !pkg.product.priceString,
      ).length;
      if (missingPrices > 0) {
        lastRevenueCatError =
          `${missingPrices} package(s) missing App Store prices — StoreKit could not fetch products (Error 23). ` +
          'Verify bundle ID, product IDs in App Store Connect, and Paid Apps agreement.';
      } else {
        lastRevenueCatError = null;
      }
    }

    logRevenueCatDiagnostics(offerings);
    return offerings;
  } catch (error) {
    const message = parsePurchaseError(error);
    lastRevenueCatError = message;
    console.warn('[RevenueCat] getOfferings failed:', message, error);
    logRevenueCatDiagnostics();
    return null;
  }
}

export function getSubscriptionPackages(
  offerings: PurchasesOfferings | null,
): PurchasesPackage[] {
  const active = getActiveOffering(offerings);
  if (!active) return [];

  const byId = new Map(
    active.availablePackages.map((pkg) => [pkg.identifier, pkg]),
  );

  return [
    byId.get(PACKAGE_IDS.weekly) ?? active.weekly,
    byId.get(PACKAGE_IDS.monthly) ?? active.monthly,
    byId.get(PACKAGE_IDS.yearly) ?? active.annual ?? byId.get(PACKAGE_IDS.yearly),
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
  const offerings = await getOfferings();
  const offering = getActiveOffering(offerings);
  return RevenueCatUI.presentPaywall({ offering: offering ?? undefined });
}

export async function presentHitItOffProPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  const offerings = await getOfferings();
  const offering = getActiveOffering(offerings);
  return RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: HITITOFF_PRO_ENTITLEMENT,
    offering: offering ?? undefined,
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

import Constants from 'expo-constants';

/** AdMob requires a dev/production build — not available in Expo Go */
export function isAdsNativeModuleAvailable(): boolean {
  return Constants.appOwnership !== 'expo';
}

export async function initializeAds(): Promise<void> {
  if (!isAdsNativeModuleAvailable()) {
    if (__DEV__) {
      console.log('[AdMob] Skipped — native module unavailable in Expo Go');
    }
    return;
  }

  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    await mobileAds().initialize();
  } catch (error) {
    console.warn('[AdMob] Initialization failed', error);
  }
}

export function getBannerAdModule(): typeof import('react-native-google-mobile-ads') | null {
  if (!isAdsNativeModuleAvailable()) return null;

  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

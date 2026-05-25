import { Platform, StyleSheet, View } from 'react-native';
import { getBannerAdModule } from '../services/adsService';

const bannerUnitId =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS
    : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID;

interface AdBannerProps {
  visible: boolean;
}

export function AdBanner({ visible }: AdBannerProps) {
  if (!visible) return null;

  const ads = getBannerAdModule();
  if (!ads) return null;

  const { BannerAd, BannerAdSize, TestIds } = ads;
  const unitId =
    bannerUnitId && !bannerUnitId.includes('xxx') ? bannerUnitId : TestIds.BANNER;

  return (
    <View style={styles.container}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});

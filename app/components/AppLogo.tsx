import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { APP_SLOGAN } from '../utils/constants';

const logoSource = require('../../assets/logo.png');

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showSlogan?: boolean;
}

export function AppLogo({ size = 220, style, imageStyle, showSlogan = false }: AppLogoProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={logoSource}
        style={[styles.image, { width: size, height: size }, imageStyle]}
        resizeMode="contain"
        accessibilityLabel="HitItOff logo"
      />
      {showSlogan && <Text style={styles.slogan}>{APP_SLOGAN}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 24,
  },
  slogan: {
    color: '#b8a0ad',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

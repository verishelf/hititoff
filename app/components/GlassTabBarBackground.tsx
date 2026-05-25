import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS } from '../utils/constants';

/** Semi-transparent lift over blur — matches card/glass surfaces in the app */
const TAB_BAR_GLASS = 'rgba(42, 24, 48, 0.72)';

export function GlassTabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
      </View>
    );
  }

  return <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />;
}

/** Extra bottom inset when using floating glass tab bar on iOS */
export const IOS_TAB_BAR_INSET = Platform.OS === 'ios' ? 88 : 0;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    top: -1,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  glassOverlay: {
    backgroundColor: TAB_BAR_GLASS,
  },
  androidBackground: {
    backgroundColor: COLORS.surface,
  },
});

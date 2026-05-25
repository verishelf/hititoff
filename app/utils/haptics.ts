import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export function hapticSelection() {
  if (!isSupported) return;
  void Haptics.selectionAsync();
}

export function hapticLight() {
  if (!isSupported) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticSuccess() {
  if (!isSupported) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

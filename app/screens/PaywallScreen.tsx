import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppScrollView } from '../components/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RevenueCatUI from 'react-native-purchases-ui';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '../store/userStore';
import { COLORS, HITITOFF_PRO_FEATURES } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { RootStackParamList } from '../types';

interface PaywallScreenProps {
  userId: string;
}

export function PaywallScreen({ userId }: PaywallScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hasPro, expirationDate } = useHitItOffPro();
  const { loadOfferings, refreshCustomerInfo } = useSubscriptionStore();
  const { loadProfile } = useUserStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadOfferings().finally(() => setReady(true));
  }, [loadOfferings]);

  const handlePurchaseCompleted = useCallback(async () => {
    await refreshCustomerInfo(userId);
    await loadProfile(userId);
    Alert.alert('Welcome to HitItOff Pro!', 'All premium features are now unlocked.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }, [userId, refreshCustomerInfo, loadProfile, navigation]);

  const handleRestoreCompleted = useCallback(async () => {
    const isPro = await refreshCustomerInfo(userId);
    await loadProfile(userId);
    if (isPro) {
      Alert.alert('Restored', 'Your HitItOff Pro subscription has been restored.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert(
        'No subscription found',
        'We could not find an active HitItOff Pro subscription.',
      );
    }
  }, [userId, refreshCustomerInfo, loadProfile, navigation]);

  if (hasPro) {
    return (
      <SafeAreaView style={styles.container}>
        <AppScrollView contentContainerStyle={styles.proActive}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
          <Text style={styles.proTitle}>HitItOff Pro Active</Text>
          {expirationDate ? (
            <Text style={styles.proSub}>
              Renews {new Date(expirationDate).toLocaleDateString()}
            </Text>
          ) : null}

          <Text style={styles.proFeaturesTitle}>Your Pro benefits</Text>
          <View style={styles.proFeaturesList}>
            {HITITOFF_PRO_FEATURES.map((feature) => (
              <View key={feature} style={styles.proFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.proFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('CustomerCenter')}
          >
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </AppScrollView>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeIcon} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={COLORS.text} />
      </TouchableOpacity>

      <RevenueCatUI.Paywall
        options={{ displayCloseButton: false }}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handleRestoreCompleted}
        onPurchaseError={({ error: purchaseError }) => {
          Alert.alert('Purchase failed', purchaseError.message);
        }}
        onRestoreError={({ error: restoreError }) => {
          Alert.alert('Restore failed', restoreError.message);
        }}
        onDismiss={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  proActive: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
  },
  proFeaturesTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  proFeaturesList: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 8,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proFeatureText: {
    color: COLORS.textMuted,
    fontSize: 14,
    flex: 1,
  },
  proTitle: {
    ...headerText,
    color: COLORS.text,
    fontSize: 26,
    marginTop: 16,
  },
  proSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  manageBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  manageBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  closeBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  closeBtnText: { color: COLORS.text, fontWeight: '700' },
});

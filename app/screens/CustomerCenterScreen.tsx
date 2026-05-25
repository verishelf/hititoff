import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '../store/userStore';
import { COLORS } from '../utils/constants';

interface CustomerCenterScreenProps {
  userId: string;
}

export function CustomerCenterScreen({ userId }: CustomerCenterScreenProps) {
  const navigation = useNavigation();
  const { refreshCustomerInfo } = useSubscriptionStore();
  const { loadProfile } = useUserStore();

  const syncAfterChange = async () => {
    await refreshCustomerInfo(userId);
    await loadProfile(userId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.flex}>
        <RevenueCatUI.CustomerCenterView
          style={styles.flex}
          shouldShowCloseButton
          onDismiss={() => navigation.goBack()}
          onRestoreCompleted={async () => {
            await syncAfterChange();
          }}
          onPromotionalOfferSucceeded={async () => {
            await syncAfterChange();
          }}
          onRestoreFailed={({ error }) => {
            console.warn('[CustomerCenter] restore failed', error);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
});

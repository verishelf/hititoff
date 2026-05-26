import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

interface RespectfulDaterBadgeProps {
  size?: 'small' | 'medium';
}

export function RespectfulDaterBadge({ size = 'small' }: RespectfulDaterBadgeProps) {
  return (
    <View style={[styles.badge, size === 'medium' && styles.badgeMedium]}>
      <Ionicons name="shield-checkmark" size={size === 'medium' ? 14 : 12} color={COLORS.success} />
      <Text style={[styles.text, size === 'medium' && styles.textMedium]}>
        Respectful dater
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '600',
  },
  textMedium: { fontSize: 12 },
});

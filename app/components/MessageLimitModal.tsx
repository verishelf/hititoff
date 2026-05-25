import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FREE_MESSAGES_PER_MATCH } from '../utils/constants';
import { headerText } from '../utils/typography';

interface MessageLimitModalProps {
  visible: boolean;
  otherUserName: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function MessageLimitModal({
  visible,
  otherUserName,
  onUpgrade,
  onDismiss,
}: MessageLimitModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.background]}
          style={styles.content}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="chatbubbles" size={32} color={COLORS.text} />
          </View>

          <Text style={styles.title}>Message limit reached</Text>
          <Text style={styles.subtitle}>
            Free accounts can send and receive {FREE_MESSAGES_PER_MATCH} messages with{' '}
            {otherUserName}. Upgrade to HitItOff Pro for unlimited messaging.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={onUpgrade}>
            <Ionicons name="star" size={18} color={COLORS.primaryDark} />
            <Text style={styles.primaryBtnText}>Upgrade to HitItOff Pro</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
            <Text style={styles.secondaryBtnText}>Not now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...headerText,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.text,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});

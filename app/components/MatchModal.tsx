import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { Candidate } from '../types';

interface MatchModalProps {
  visible: boolean;
  matchedUser: Candidate | null;
  onChat: () => void;
  onDismiss: () => void;
}

export function MatchModal({
  visible,
  matchedUser,
  onChat,
  onDismiss,
}: MatchModalProps) {
  if (!matchedUser) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.background]}
          style={styles.content}
        >
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and {matchedUser.name} liked each other
          </Text>

          <View style={styles.scoreCircle}>
            <Text style={styles.score}>{matchedUser.compatibilityScore}%</Text>
            <Text style={styles.scoreLabel}>compatible</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onChat}>
            <Text style={styles.primaryBtnText}>Send a Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
            <Text style={styles.secondaryBtnText}>Keep Swiping</Text>
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
    padding: 32,
    alignItems: 'center',
  },
  title: {
    ...headerText,
    color: COLORS.text,
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  score: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '800',
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
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

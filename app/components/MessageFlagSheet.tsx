import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { checkMessageFlag, type MessageFlagResult } from '../services/aiService';

interface MessageFlagSheetProps {
  visible: boolean;
  messageText: string;
  onClose: () => void;
}

const SIGNAL_CONFIG = {
  green: { icon: 'checkmark-circle' as const, color: COLORS.success, label: 'Green flag' },
  yellow: { icon: 'alert-circle' as const, color: '#fbbf24', label: 'Yellow flag' },
  red: { icon: 'close-circle' as const, color: COLORS.danger, label: 'Red flag' },
};

export function MessageFlagSheet({ visible, messageText, onClose }: MessageFlagSheetProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MessageFlagResult | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const flag = await checkMessageFlag(messageText);
      setResult(flag);
    } catch {
      setResult({
        signal: 'yellow',
        headline: 'Could not analyze',
        explanation: 'Try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  }, [messageText]);

  useEffect(() => {
    if (visible && messageText) {
      setResult(null);
      analyze();
    }
  }, [visible, messageText, analyze]);

  const config = result ? SIGNAL_CONFIG[result.signal] : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Message check</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.quote} numberOfLines={4}>"{messageText}"</Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : result && config ? (
            <View style={styles.result}>
              <View style={styles.signalRow}>
                <Ionicons name={config.icon} size={28} color={config.color} />
                <Text style={[styles.signalLabel, { color: config.color }]}>{config.label}</Text>
              </View>
              <Text style={styles.headline}>{result.headline}</Text>
              <Text style={styles.explanation}>{result.explanation}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  quote: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  loader: { paddingVertical: 24 },
  result: { marginBottom: 16 },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  signalLabel: { fontSize: 16, fontWeight: '700' },
  headline: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  explanation: { color: COLORS.textMuted, fontSize: 14, lineHeight: 21 },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
});

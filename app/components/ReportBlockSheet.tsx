import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { blockUser, reportUser, REPORT_REASONS } from '../services/safetyService';

interface ReportBlockSheetProps {
  visible: boolean;
  reporterId: string;
  reportedId: string;
  reportedName: string;
  onClose: () => void;
  onBlocked?: () => void;
}

export function ReportBlockSheet({
  visible,
  reporterId,
  reportedId,
  reportedName,
  onClose,
  onBlocked,
}: ReportBlockSheetProps) {
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleBlock = () => {
    Alert.alert(
      `Block ${reportedName}?`,
      'They won\'t appear in your discovery feed and you won\'t receive messages from them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(reporterId, reportedId);
              onBlocked?.();
              onClose();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not block user');
            }
          },
        },
      ],
    );
  };

  const handleReport = async () => {
    if (!reason) {
      Alert.alert('Select a reason', 'Please choose a reason for your report.');
      return;
    }
    try {
      await reportUser(reporterId, reportedId, reason, details);
      Alert.alert('Report submitted', 'Thank you for helping keep HitItOff safe.');
      setMode('menu');
      setReason('');
      setDetails('');
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit report');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {mode === 'menu' ? (
            <>
              <Text style={styles.title}>Safety options</Text>
              <TouchableOpacity style={styles.option} onPress={() => setMode('report')}>
                <Text style={styles.optionText}>Report {reportedName}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.option, styles.dangerOption]} onPress={handleBlock}>
                <Text style={styles.dangerText}>Block {reportedName}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Report {reportedName}</Text>
              <ScrollView style={styles.reasons}>
                {REPORT_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                    onPress={() => setReason(r)}
                  >
                    <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={styles.detailsInput}
                placeholder="Additional details (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={details}
                onChangeText={setDetails}
                multiline
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleReport}>
                <Text style={styles.submitText}>Submit report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('menu')}>
                <Text style={styles.cancelText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
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
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    marginBottom: 8,
  },
  optionText: { color: COLORS.text, fontSize: 15 },
  dangerOption: { backgroundColor: 'rgba(248,113,113,0.1)' },
  dangerText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },
  cancelBtn: { padding: 16, alignItems: 'center' },
  cancelText: { color: COLORS.textMuted, fontSize: 15 },
  reasons: { maxHeight: 200, marginBottom: 12 },
  reasonChip: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reasonText: { color: COLORS.textMuted, fontSize: 14 },
  reasonTextActive: { color: COLORS.text },
  detailsInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 60,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
});

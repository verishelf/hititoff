import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { canSendMessage, sendDateInvite, sendMessage } from '../services/chatService';
import {
  getPhoneExchangeStatus,
  sharePhoneWithMatch,
  type PhoneExchangeStatus,
} from '../services/phoneService';
import { useMatchStore } from '../store/matchStore';
import { COLORS } from '../utils/constants';
import {
  DATE_REASON_OPTIONS,
  formatInviteDateTime,
  getDefaultDateTime,
  resolveDateReason,
  type DateReasonId,
} from '../utils/dateInviteOptions';
import { hapticSelection } from '../utils/haptics';
import type { RootStackParamList } from '../types';
import { MessageLimitModal } from './MessageLimitModal';

interface DateInviteSectionProps {
  matchId: string;
  userId: string;
  otherUserName: string;
  isPremium: boolean;
}

function reasonFieldLabel(reasonId: DateReasonId | null, otherReason: string): string {
  if (!reasonId) return 'Choose a plan';
  if (reasonId === 'other') {
    return otherReason.trim() || 'Other — add details below';
  }
  return DATE_REASON_OPTIONS.find((option) => option.id === reasonId)?.label ?? 'Choose a plan';
}

export function DateInviteSection({
  matchId,
  userId,
  otherUserName,
  isPremium,
}: DateInviteSectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const restoreToMessagesInbox = useMatchStore((s) => s.restoreToMessagesInbox);

  const [selectedDate, setSelectedDate] = useState(getDefaultDateTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [iosDateDraft, setIosDateDraft] = useState(getDefaultDateTime);
  const [reasonId, setReasonId] = useState<DateReasonId | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [reasonSheetVisible, setReasonSheetVisible] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sharingPhone, setSharingPhone] = useState(false);
  const [exchange, setExchange] = useState<PhoneExchangeStatus | null>(null);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const refreshExchange = useCallback(async () => {
    try {
      const status = await getPhoneExchangeStatus(matchId);
      setExchange(status);
    } catch {
      setExchange(null);
    }
  }, [matchId]);

  useEffect(() => {
    refreshExchange();
  }, [refreshExchange]);

  const openDatePicker = () => {
    hapticSelection();
    setIosDateDraft(selectedDate);
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (_event.type === 'dismissed' || !date) return;
      setSelectedDate(date);
      return;
    }

    if (date) setIosDateDraft(date);
  };

  const confirmIosDate = () => {
    hapticSelection();
    setSelectedDate(iosDateDraft);
    setShowDatePicker(false);
  };

  const selectReason = (id: DateReasonId) => {
    hapticSelection();
    setReasonId(id);
    setReasonSheetVisible(false);
  };

  const handleSendInvite = async () => {
    const whenLabel = formatInviteDateTime(selectedDate);
    const reasonLabel = resolveDateReason(reasonId, otherReason);

    if (!reasonId) {
      Alert.alert('Choose a plan', 'Pick what kind of date you have in mind.');
      return;
    }

    if (reasonId === 'other' && !otherReason.trim()) {
      Alert.alert('Add details', 'Tell them what you have in mind under Other.');
      return;
    }

    const { allowed } = await canSendMessage(matchId, userId, isPremium);
    if (!allowed) {
      setLimitModalVisible(true);
      return;
    }

    setSendingInvite(true);
    try {
      await sendDateInvite(matchId, userId, whenLabel, reasonLabel, otherUserName);
      restoreToMessagesInbox(matchId);
      Alert.alert('Sent!', `Your date invite is on its way to ${otherUserName}.`);
      setSelectedDate(getDefaultDateTime());
      setReasonId(null);
      setOtherReason('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not send invite';
      if (message.includes('limit')) {
        setLimitModalVisible(true);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setSendingInvite(false);
    }
  };

  const handleExchangeNumbers = async () => {
    if (exchange?.iShared && exchange.theyShared && exchange.theirPhone) {
      return;
    }

    if (!exchange?.myPhone) {
      Alert.alert(
        'Add your number first',
        'Open Profile → Edit and save your phone number so you can exchange with matches.',
      );
      return;
    }

    setSharingPhone(true);
    try {
      const status = await sharePhoneWithMatch(matchId);
      setExchange(status);

      const inviteText = `${otherUserName}, I'd love to exchange numbers! Here is mine: ${status.myPhone}`;
      const { allowed } = await canSendMessage(matchId, userId, isPremium);
      if (allowed) {
        await sendMessage(matchId, userId, inviteText);
        restoreToMessagesInbox(matchId);
      }

      if (status.theyShared && status.theirPhone) {
        Alert.alert('Numbers exchanged', `${otherUserName}'s number: ${status.theirPhone}`);
      } else {
        Alert.alert(
          'Request sent',
          `${otherUserName} will see your number once they tap Exchange numbers too.`,
        );
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not exchange numbers');
    } finally {
      setSharingPhone(false);
    }
  };

  const bothShared = Boolean(exchange?.iShared && exchange?.theyShared && exchange?.theirPhone);
  const minimumDate = new Date();

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={18} color={COLORS.text} />
          </View>
          <Text style={styles.title}>Let's go on a date</Text>
        </View>

        <Text style={styles.label}>When</Text>
        <TouchableOpacity style={styles.pickerField} onPress={openDatePicker} activeOpacity={0.85}>
          <View style={styles.pickerLeft}>
            <Ionicons name="time-outline" size={18} color={COLORS.accent} />
            <Text style={styles.pickerValue}>{formatInviteDateTime(selectedDate)}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Text style={styles.label}>For</Text>
        <TouchableOpacity
          style={styles.pickerField}
          onPress={() => {
            hapticSelection();
            setReasonSheetVisible(true);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.pickerLeft}>
            <Ionicons name="sparkles-outline" size={18} color={COLORS.accent} />
            <Text
              style={[
                styles.pickerValue,
                !reasonId && styles.pickerPlaceholder,
              ]}
            >
              {reasonFieldLabel(reasonId, otherReason)}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {reasonId === 'other' ? (
          <TextInput
            style={styles.otherInput}
            placeholder="Describe your date idea..."
            placeholderTextColor={COLORS.textMuted}
            value={otherReason}
            onChangeText={setOtherReason}
            multiline
            maxLength={120}
          />
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, sendingInvite && styles.btnDisabled]}
          onPress={handleSendInvite}
          disabled={sendingInvite}
        >
          {sendingInvite ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color={COLORS.text} />
              <Text style={styles.primaryBtnText}>Send date invite</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {Platform.OS === 'android' && showDatePicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="datetime"
          minimumDate={minimumDate}
          onChange={handleDateChange}
        />
      ) : null}

      <Modal visible={showDatePicker && Platform.OS === 'ios'} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Pick date & time</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={iosDateDraft}
              mode="datetime"
              display="spinner"
              minimumDate={minimumDate}
              onChange={handleDateChange}
              themeVariant="dark"
              accentColor={COLORS.primary}
              style={styles.iosPicker}
            />
            <TouchableOpacity style={styles.sheetDoneBtn} onPress={confirmIosDate}>
              <Text style={styles.sheetDoneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={reasonSheetVisible} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setReasonSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>What kind of date?</Text>
            <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
              {DATE_REASON_OPTIONS.map((option) => {
                const active = reasonId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.reasonOption, active && styles.reasonOptionActive]}
                    onPress={() => selectReason(option.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.reasonOptionText, active && styles.reasonOptionTextActive]}>
                      {option.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.text} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.exchangeCard}>
        {bothShared ? (
          <>
            <Text style={styles.exchangeTitle}>{otherUserName}'s number</Text>
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => Linking.openURL(`tel:${exchange!.theirPhone}`)}
            >
              <Ionicons name="call" size={18} color={COLORS.primary} />
              <Text style={styles.phoneText}>{exchange!.theirPhone}</Text>
            </TouchableOpacity>
            <Text style={styles.exchangeHint}>You both shared numbers for this match.</Text>
          </>
        ) : (
          <>
            <Text style={styles.exchangeTitle}>Ready to take it offline?</Text>
            <Text style={styles.exchangeHint}>
              {exchange?.iShared && !exchange.theyShared
                ? `Waiting for ${otherUserName} to share their number.`
                : `Exchange numbers when you are both comfortable.`}
            </Text>
            <TouchableOpacity
              style={[styles.outlineBtn, sharingPhone && styles.btnDisabled]}
              onPress={handleExchangeNumbers}
              disabled={sharingPhone || Boolean(exchange?.iShared && !exchange?.theyShared)}
            >
              {sharingPhone ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
                  <Text style={styles.outlineBtnText}>
                    {exchange?.iShared ? 'Number shared — waiting' : 'Exchange numbers'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <MessageLimitModal
        visible={limitModalVisible}
        otherUserName={otherUserName}
        onUpgrade={() => {
          setLimitModalVisible(false);
          navigation.navigate('Paywall');
        }}
        onDismiss={() => setLimitModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  pickerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  otherInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  primaryBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  iosPicker: {
    height: 220,
  },
  sheetDoneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetDoneText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  reasonList: {
    maxHeight: 360,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  reasonOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reasonOptionText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  reasonOptionTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  exchangeCard: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  exchangeTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  exchangeHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,77,141,0.08)',
  },
  outlineBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  phoneText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

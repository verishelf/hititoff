import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppFlatList } from '../components/AppFlatList';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  canSendMessage,
  deleteMessage,
  getMessages,
  isConversationStale,
  markAsRead,
  sendMessage,
  sendQuickResponse,
  subscribeToMessages,
} from '../services/chatService';
import { useMatchStore } from '../store/matchStore';
import { useHitItOffPro } from '../hooks/useHitItOffPro';
import { useUserStore } from '../store/userStore';
import { COLORS, FREE_MESSAGES_PER_MATCH } from '../utils/constants';
import type { Message, RootStackParamList } from '../types';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { MessageLimitModal } from '../components/MessageLimitModal';
import { ConversationStarterPanel } from '../components/ConversationStarterPanel';
import { ConversationCoachPanel } from '../components/ConversationCoachPanel';
import { QuickResponseBar } from '../components/QuickResponseBar';
import { SparkMeter, INITIAL_SPARK_TEMPERATURE } from '../components/SparkMeter';
import { ChemistryTimeline } from '../components/ChemistryTimeline';
import { DateIdeasSheet } from '../components/DateIdeasSheet';
import { ReportBlockSheet } from '../components/ReportBlockSheet';
import { MessageFlagSheet } from '../components/MessageFlagSheet';
import { useMatchChemistry } from '../hooks/useMatchChemistry';
import type { QuickResponseKey } from '../utils/quickResponses';

interface ChatScreenProps {
  userId: string;
  route: RouteProp<RootStackParamList, 'Chat'>;
  otherUserInterests?: string[];
}

export function ChatScreen({
  userId,
  route,
}: ChatScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { matchId, otherUserName, otherUserId } = route.params;
  const { profile } = useUserStore();
  const { hasPro: premium } = useHitItOffPro();
  const restoreToMessagesInbox = useMatchStore((s) => s.restoreToMessagesInbox);
  const dismissFromMessagesInbox = useMatchStore((s) => s.dismissFromMessagesInbox);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(FREE_MESSAGES_PER_MATCH);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [showChemistry, setShowChemistry] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [flagSheetVisible, setFlagSheetVisible] = useState(false);
  const [flagMessageText, setFlagMessageText] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { chemistry, events, sparkMeter } = useMatchChemistry(matchId);

  useEffect(() => {
    channelRef.current = subscribeToMessages(matchId, setMessages);
    markAsRead(matchId, userId);

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [matchId, userId]);

  useEffect(() => {
    canSendMessage(matchId, userId, premium).then(({ remaining: left }) => {
      setRemaining(left);
    });
  }, [matchId, userId, premium, messages]);

  const showLimitModal = () => setLimitModalVisible(true);

  const handleSend = async (messageText?: string) => {
    const content = (messageText ?? text).trim();
    if (!content || sending) return;

    const { allowed } = await canSendMessage(matchId, userId, premium);
    if (!allowed) {
      showLimitModal();
      return;
    }

    setSending(true);
    try {
      await sendMessage(matchId, userId, content);
      restoreToMessagesInbox(matchId);
      setText('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Send failed';
      if (message.includes('limit')) {
        showLimitModal();
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleQuickResponse = async (key: QuickResponseKey, message: string) => {
    const { allowed } = await canSendMessage(matchId, userId, premium);
    if (!allowed) {
      showLimitModal();
      return;
    }
    setSending(true);
    try {
      await sendQuickResponse(matchId, userId, key, message);
      restoreToMessagesInbox(matchId);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceSend = async () => {
    Alert.alert('Voice messages', 'Record a voice bio from your profile, or use text messages here.');
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId, userId);
      const remainingMsgs = await getMessages(matchId);
      const ownRemaining = remainingMsgs.filter((message) => message.sender_id === userId);
      if (ownRemaining.length === 0) {
        dismissFromMessagesInbox(matchId);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessageBubble
      message={item}
      userId={userId}
      onDelete={handleDelete}
      onCheckMessage={(text) => {
        setFlagMessageText(text);
        setFlagSheetVisible(true);
      }}
    />
  );

  const canSend = premium || remaining > 0;
  const stale = isConversationStale(messages);

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.chatHeader}>
          <SparkMeter
            value={sparkMeter > 0 ? sparkMeter : INITIAL_SPARK_TEMPERATURE}
            size={48}
            messageCount={messages.length}
            isInitialBaseline={
              sparkMeter <= 0 ||
              (sparkMeter <= INITIAL_SPARK_TEMPERATURE && messages.length === 0)
            }
            onViewDetails={() => setShowChemistry(true)}
          />
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setDateSheetVisible(true)} style={styles.headerBtn}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReportVisible(true)} style={styles.headerBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {showChemistry && (
          <View style={styles.chemistryPanel}>
            <ChemistryTimeline
              events={events}
              sparkMeter={sparkMeter}
              detailed={premium}
            />
          </View>
        )}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {!premium && (
            <Text style={styles.limitHint}>
              {remaining > 0
                ? `${remaining} of ${FREE_MESSAGES_PER_MATCH} free messages left`
                : 'Free message limit reached'}
            </Text>
          )}

          <ConversationStarterPanel
            matchId={matchId}
            isPremium={premium}
            onSend={handleSend}
            visible={messages.length === 0 && canSend}
          />

          <ConversationCoachPanel
            matchId={matchId}
            isPremium={premium}
            onSend={handleSend}
            visible={messages.length > 0 && canSend}
          />

          <QuickResponseBar
            visible={stale && canSend}
            onSelect={handleQuickResponse}
          />

          <AppFlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => markAsRead(matchId, userId)}
          />

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.micBtn}
              onPress={handleVoiceSend}
            >
              <Ionicons name="mic-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, !canSend && styles.inputDisabled]}
              placeholder={
                canSend ? 'Type a message...' : 'Upgrade to send more messages'
              }
              placeholderTextColor={COLORS.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              editable={canSend}
              onFocus={() => {
                if (!canSend) showLimitModal();
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={() => {
                if (!canSend) {
                  showLimitModal();
                  return;
                }
                handleSend();
              }}
              disabled={!text.trim() || sending}
            >
              <Ionicons name="send" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <MessageLimitModal
          visible={limitModalVisible}
          otherUserName={otherUserName}
          onUpgrade={() => {
            setLimitModalVisible(false);
            navigation.navigate('Paywall');
          }}
          onDismiss={() => setLimitModalVisible(false)}
        />

        <DateIdeasSheet
          visible={dateSheetVisible}
          matchId={matchId}
          isPremium={premium}
          onClose={() => setDateSheetVisible(false)}
          onUpgrade={() => {
            setDateSheetVisible(false);
            navigation.navigate('Paywall');
          }}
        />

        <MessageFlagSheet
          visible={flagSheetVisible}
          messageText={flagMessageText}
          onClose={() => setFlagSheetVisible(false)}
        />

        <ReportBlockSheet
          visible={reportVisible}
          reporterId={userId}
          reportedId={otherUserId}
          reportedName={otherUserName}
          onClose={() => setReportVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  flex: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 8 },
  chemistryPanel: { paddingHorizontal: 16, paddingVertical: 8 },
  limitHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  messagesList: { padding: 16, flexGrow: 1 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: { opacity: 0.6 },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});

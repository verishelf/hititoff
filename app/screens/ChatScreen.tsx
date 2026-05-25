import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppFlatList } from '../components/AppFlatList';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  generateIcebreakers,
  getMessages,
  markAsRead,
  sendMessage,
  subscribeToMessages,
} from '../services/chatService';
import { useMatchStore } from '../store/matchStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '../store/userStore';
import { COLORS, FREE_MESSAGES_PER_MATCH } from '../utils/constants';
import type { Message, RootStackParamList } from '../types';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { MessageLimitModal } from '../components/MessageLimitModal';

interface ChatScreenProps {
  userId: string;
  route: RouteProp<RootStackParamList, 'Chat'>;
  otherUserInterests?: string[];
}

export function ChatScreen({
  userId,
  route,
  otherUserInterests = [],
}: ChatScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { matchId, otherUserName } = route.params;
  const { profile } = useUserStore();
  const { isPremium: subPremium } = useSubscriptionStore();
  const premium = Boolean(subPremium || profile?.is_premium);
  const restoreToMessagesInbox = useMatchStore((s) => s.restoreToMessagesInbox);
  const dismissFromMessagesInbox = useMatchStore((s) => s.dismissFromMessagesInbox);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(FREE_MESSAGES_PER_MATCH);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

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
      setIcebreakers([]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Send failed';
      if (message.includes('limit')) {
        showLimitModal();
      }
    } finally {
      setSending(false);
    }
  };

  const loadIcebreakers = useCallback(async () => {
    const myInterests = profile?.interests ?? [];
    const shared = myInterests.filter((i) => otherUserInterests.includes(i));
    const suggestions = await generateIcebreakers(shared, otherUserName);
    setIcebreakers(suggestions);
  }, [profile, otherUserName, otherUserInterests]);

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId, userId);
      const remaining = await getMessages(matchId);
      const ownRemaining = remaining.filter((message) => message.sender_id === userId);
      if (ownRemaining.length === 0) {
        dismissFromMessagesInbox(matchId);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessageBubble message={item} userId={userId} onDelete={handleDelete} />
  );

  const canSend = premium || remaining > 0;

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
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

          {messages.length === 0 && canSend && (
            <TouchableOpacity style={styles.icebreakerBtn} onPress={loadIcebreakers}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              <Text style={styles.icebreakerBtnText}>Get AI icebreakers</Text>
            </TouchableOpacity>
          )}

          {icebreakers.length > 0 && canSend && (
            <View style={styles.icebreakers}>
              {icebreakers.map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.icebreakerChip}
                  onPress={() => handleSend(suggestion)}
                >
                  <Text style={styles.icebreakerText} numberOfLines={2}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <AppFlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => markAsRead(matchId, userId)}
          />

          <View style={styles.inputRow}>
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
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  flex: { flex: 1 },
  limitHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  icebreakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    padding: 12,
    marginTop: 12,
  },
  icebreakerBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  icebreakers: { padding: 12, gap: 8 },
  icebreakerChip: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icebreakerText: { color: COLORS.text, fontSize: 14 },
  messagesList: { padding: 16, flexGrow: 1 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
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

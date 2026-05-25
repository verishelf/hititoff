import { AppScrollView } from './AppScrollView';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  canSendMessage,
  deleteMessage,
  getMessages,
  markAsRead,
  sendMessage,
  subscribeToMessages,
} from '../services/chatService';
import { useMatchStore } from '../store/matchStore';
import { COLORS, FREE_MESSAGES_PER_MATCH } from '../utils/constants';
import type { Message, RootStackParamList } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { MessageLimitModal } from './MessageLimitModal';

interface ProfileMessageSectionProps {
  matchId: string;
  userId: string;
  otherUserName: string;
  isPremium: boolean;
}

export function ProfileMessageSection({
  matchId,
  userId,
  otherUserName,
  isPremium,
}: ProfileMessageSectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const restoreToMessagesInbox = useMatchStore((s) => s.restoreToMessagesInbox);
  const dismissFromMessagesInbox = useMatchStore((s) => s.dismissFromMessagesInbox);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(FREE_MESSAGES_PER_MATCH);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  useEffect(() => {
    channelRef.current = subscribeToMessages(matchId, setMessages);
    markAsRead(matchId, userId);

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [matchId, userId]);

  useEffect(() => {
    canSendMessage(matchId, userId, isPremium).then(({ remaining: left }) => {
      setRemaining(left);
    });
  }, [matchId, userId, isPremium, messages]);

  const showLimitModal = () => setLimitModalVisible(true);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    const { allowed } = await canSendMessage(matchId, userId, isPremium);
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
      }
    } finally {
      setSending(false);
    }
  };

  const canSend = isPremium || remaining > 0;

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

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.sectionTitle}>Messages</Text>

        {!isPremium && (
          <Text style={styles.limitHint}>
            {remaining > 0
              ? `${remaining} of ${FREE_MESSAGES_PER_MATCH} free messages left`
              : 'Free message limit reached'}
          </Text>
        )}

        {messages.length > 0 && (
          <AppScrollView
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            nestedScrollEnabled
          >
            {messages.map((item) => (
              <ChatMessageBubble
                key={item.id}
                message={item}
                userId={userId}
                compact
                onDelete={handleDelete}
              />
            ))}
          </AppScrollView>
        )}

        {messages.length === 0 && (
          <Text style={styles.emptyHint}>Say hi to {otherUserName}</Text>
        )}

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
            style={[styles.sendBtn, (!text.trim() || sending || !canSend) && styles.sendBtnDisabled]}
            onPress={() => {
              if (!canSend) {
                showLimitModal();
                return;
              }
              handleSend();
            }}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Ionicons name="send" size={18} color={COLORS.text} />
            )}
          </TouchableOpacity>
        </View>
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
  container: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  limitHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  messagesScroll: {
    maxHeight: 160,
    marginBottom: 10,
  },
  messagesContent: {
    gap: 8,
    paddingVertical: 4,
  },
  emptyHint: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
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
    maxHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

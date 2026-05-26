import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import type { Message } from '../types';
import { WaveformPlayer } from './WaveformPlayer';

interface ChatMessageBubbleProps {
  message: Message;
  userId: string;
  compact?: boolean;
  onDelete: (messageId: string) => void;
  onCheckMessage?: (text: string) => void;
}

export function ChatMessageBubble({
  message,
  userId,
  compact = false,
  onDelete,
  onCheckMessage,
}: ChatMessageBubbleProps) {
  const isMine = message.sender_id === userId;
  const isRead = message.read_by.some((id) => id !== message.sender_id);

  const confirmDelete = () => {
    Alert.alert('Delete message?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(message.id),
      },
    ]);
  };

  const handleLongPress = () => {
    if (isMine) {
      confirmDelete();
      return;
    }
    if (onCheckMessage && message.text && message.message_type !== 'voice') {
      Alert.alert('Message options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check this message',
          onPress: () => onCheckMessage(message.text),
        },
      ]);
    }
  };

  return (
    <View style={[styles.bubbleRow, compact && styles.bubbleRowCompact, isMine && styles.bubbleRowMine]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={[
          styles.bubble,
          compact && styles.bubbleCompact,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text style={[styles.bubbleText, compact && styles.bubbleTextCompact]}>
          {message.message_type === 'voice' && message.audio_url ? (
            <WaveformPlayer />
          ) : (
            message.text
          )}
        </Text>
        {!compact && (
          <View style={styles.meta}>
            <Text style={styles.time}>
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isMine && (
              <Ionicons
                name={isRead ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={isRead ? COLORS.accent : COLORS.textMuted}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { marginBottom: 10, alignItems: 'flex-start' },
  bubbleRowCompact: { marginBottom: 0 },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 12,
  },
  bubbleCompact: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  bubbleTextCompact: { fontSize: 14, lineHeight: 20 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
});

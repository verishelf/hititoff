import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePhoto } from './ProfilePhoto';
import { COLORS } from '../utils/constants';
import type { MatchRecord } from '../types';

interface MatchSwipeRowProps {
  item: MatchRecord;
  onPress: () => void;
  onDeleteMessage: () => void;
}

export function MatchSwipeRow({ item, onPress, onDeleteMessage }: MatchSwipeRowProps) {
  const other = item.otherUser;
  if (!other) return null;

  const confirmDelete = () => {
    Alert.alert(
      'Remove conversation?',
      `Remove your chat with ${other.name} from Messages? You can still view their profile in Your Matches.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteMessage },
      ],
    );
  };

  const renderRightActions = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={confirmDelete} activeOpacity={0.85}>
      <Ionicons name="trash-outline" size={22} color={COLORS.text} />
      <Text style={styles.deleteText}>Remove</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      containerStyle={styles.swipeContainer}
    >
      <TouchableOpacity style={styles.matchRow} onPress={onPress} activeOpacity={0.85}>
        {other.photos[0] ? (
          <ProfilePhoto uri={other.photos[0]} style={styles.avatar} label={other.name} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{other.name[0]}</Text>
          </View>
        )}
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{other.name}</Text>
          <Text style={styles.matchSub}>
            {item.last_message_at ? 'Recent message' : 'Say hello!'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    marginBottom: 10,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteAction: {
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    borderRadius: 14,
    marginLeft: 8,
    gap: 4,
  },
  deleteText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
  matchInfo: { flex: 1, marginLeft: 14 },
  matchName: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  matchSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
});

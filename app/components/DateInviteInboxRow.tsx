import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePhoto } from './ProfilePhoto';
import { COLORS } from '../utils/constants';
import type { InboxDateInvite } from '../types';

interface DateInviteInboxRowProps {
  invite: InboxDateInvite;
  onPress: () => void;
}

export function DateInviteInboxRow({ invite, onPress }: DateInviteInboxRowProps) {
  const other = invite.otherUser;
  const name = other?.name ?? 'Match';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatarWrap}>
        {other?.photos[0] ? (
          <ProfilePhoto uri={other.photos[0]} style={styles.avatar} label={name} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{name[0] ?? '?'}</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Ionicons name="calendar" size={12} color={COLORS.text} />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{name}</Text>
          {invite.isUnread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.inviteLabel}>Date invite from {name}</Text>
        <Text style={styles.when} numberOfLines={1}>
          {invite.when}
        </Text>
        {invite.reason ? (
          <Text style={styles.reason} numberOfLines={1}>
            For: {invite.reason}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 10,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  inviteLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  when: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  reason: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

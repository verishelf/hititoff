import type { RealtimeChannel } from '@supabase/supabase-js';
import type { InboxDateInvite, MatchRecord, Message, MessageType } from '../types';
import { FREE_MESSAGES_PER_MATCH } from '../utils/constants';
import { isDateInviteMessage, parseDateInviteMessage, formatDateInviteMessage } from '../utils/dateInviteOptions';
import { generateConversationStarters, moderateContent, type OpenerTone } from './aiService';
import { heartbeat, updateRespectfulBadge } from './activityService';
import { getProfile } from './matchService';
import { supabase } from './supabase';

async function verifyMatchParticipant(
  matchId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('matches')
    .select('user_a, user_b')
    .eq('id', matchId)
    .single();

  if (error || !data) return false;
  return data.user_a === userId || data.user_b === userId;
}

export async function getMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export function subscribeToMessages(
  matchId: string,
  callback: (messages: Message[]) => void,
): RealtimeChannel {
  getMessages(matchId).then(callback);

  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        getMessages(matchId).then(callback);
      },
    )
    .subscribe();

  return channel;
}

export async function getMessageCount(matchId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function canSendMessage(
  matchId: string,
  senderId: string,
  isPremium?: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  let premium = isPremium;
  if (premium === undefined) {
    const profile = await getProfile(senderId);
    premium = profile?.is_premium ?? false;
  }

  if (premium) {
    return { allowed: true, remaining: Infinity };
  }

  const count = await getMessageCount(matchId);
  const remaining = Math.max(0, FREE_MESSAGES_PER_MATCH - count);
  return { allowed: remaining > 0, remaining };
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  text: string,
  options?: {
    messageType?: MessageType;
    audioUrl?: string;
    audioDurationMs?: number;
  },
): Promise<Message> {
  const trimmed = text.trim();
  if (!trimmed && !options?.audioUrl) throw new Error('Message cannot be empty');

  const isParticipant = await verifyMatchParticipant(matchId, senderId);
  if (!isParticipant) throw new Error('Not authorized to send messages');

  const { allowed } = await canSendMessage(matchId, senderId);
  if (!allowed) throw new Error('Message limit reached');

  // Moderate text messages
  if (
    trimmed &&
    options?.messageType !== 'quick_response' &&
    options?.messageType !== 'date_invite'
  ) {
    try {
      const modResult = await moderateContent(trimmed);
      if (!modResult.approved) {
        throw new Error('Message flagged by safety system. Please revise and try again.');
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('flagged')) throw e;
      // Continue if moderation service unavailable
    }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      text: trimmed || '🎤 Voice message',
      read_by: [senderId],
      message_type: options?.messageType ?? 'text',
      audio_url: options?.audioUrl ?? null,
      audio_duration_ms: options?.audioDurationMs ?? null,
      moderation_status: 'approved',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('matches')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', matchId);

  heartbeat(senderId).catch(() => {});
  updateRespectfulBadge(senderId).catch(() => {});

  return data as Message;
}

export async function sendDateInvite(
  matchId: string,
  senderId: string,
  when: string,
  reason: string,
  otherUserName: string,
): Promise<Message> {
  return sendMessage(matchId, senderId, formatDateInviteMessage(when, reason, otherUserName), {
    messageType: 'date_invite',
  });
}

export async function getInboxDateInvites(
  userId: string,
  matches: MatchRecord[],
): Promise<InboxDateInvite[]> {
  const matchIds = matches.map((match) => match.id);
  if (matchIds.length === 0) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, text, message_type, read_by, created_at')
    .in('match_id', matchIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const latestByMatch = new Map<string, (typeof data)[number]>();
  for (const message of data ?? []) {
    if (!latestByMatch.has(message.match_id)) {
      latestByMatch.set(message.match_id, message);
    }
  }

  const invites: InboxDateInvite[] = [];

  for (const match of matches) {
    const latest = latestByMatch.get(match.id);
    if (!latest || latest.sender_id === userId) continue;
    if (!isDateInviteMessage(latest)) continue;

    const parsed = parseDateInviteMessage(latest.text);
    if (!parsed) continue;

    invites.push({
      messageId: latest.id,
      matchId: match.id,
      senderId: latest.sender_id,
      when: parsed.when,
      reason: parsed.reason,
      createdAt: latest.created_at,
      isUnread: !latest.read_by.includes(userId),
      otherUser: match.otherUser,
    });
  }

  return invites.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function sendQuickResponse(
  matchId: string,
  senderId: string,
  templateKey: string,
  message: string,
): Promise<Message> {
  await supabase.from('quick_response_log').insert({
    match_id: matchId,
    sender_id: senderId,
    template_key: templateKey,
  });

  return sendMessage(matchId, senderId, message, { messageType: 'quick_response' });
}

export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('match_id, sender_id')
    .eq('id', messageId)
    .single();

  if (fetchError || !message) throw new Error('Message not found');
  if (message.sender_id !== userId) throw new Error('Not authorized to delete this message');

  const isParticipant = await verifyMatchParticipant(message.match_id, userId);
  if (!isParticipant) throw new Error('Not authorized to delete this message');

  const { data: deleted, error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!deleted) throw new Error('Could not delete message');

  const remaining = await getMessages(message.match_id);
  const lastAt =
    remaining.length > 0 ? remaining[remaining.length - 1].created_at : null;

  await supabase
    .from('matches')
    .update({ last_message_at: lastAt })
    .eq('id', message.match_id);
}

export async function deleteLastOwnMessage(
  matchId: string,
  userId: string,
): Promise<void> {
  const messages = await getMessages(matchId);
  const ownMessages = messages.filter((message) => message.sender_id === userId);
  if (ownMessages.length === 0) {
    throw new Error('No messages from you to delete');
  }

  const lastOwn = ownMessages[ownMessages.length - 1];
  await deleteMessage(lastOwn.id, userId);
}

export async function deleteAllOwnMessagesInMatch(
  matchId: string,
  userId: string,
): Promise<void> {
  const isParticipant = await verifyMatchParticipant(matchId, userId);
  if (!isParticipant) throw new Error('Not authorized to delete messages');

  const messages = await getMessages(matchId);
  const ownMessages = messages.filter((message) => message.sender_id === userId);
  if (ownMessages.length === 0) {
    throw new Error('No messages from you to delete');
  }

  for (const message of ownMessages) {
    await deleteMessage(message.id, userId);
  }
}

export async function markAsRead(
  matchId: string,
  userId: string,
): Promise<void> {
  const isParticipant = await verifyMatchParticipant(matchId, userId);
  if (!isParticipant) return;

  const messages = await getMessages(matchId);
  const unread = messages.filter((m) => !m.read_by.includes(userId));

  await Promise.all(
    unread.map((message) =>
      supabase
        .from('messages')
        .update({ read_by: [...message.read_by, userId] })
        .eq('id', message.id),
    ),
  );

  if (unread.length > 0) {
    const senders = [...new Set(unread.map((m) => m.sender_id))];
    await Promise.all(senders.map((id) => updateRespectfulBadge(id).catch(() => {})));
  }
}

/** @deprecated Use generateConversationStarters from aiService */
export async function generateIcebreakers(
  sharedInterests: string[],
  otherUserName: string,
): Promise<string[]> {
  const interest = sharedInterests[0] ?? 'life';
  return [
    `Hey ${otherUserName}! I noticed we both like ${interest} — what's your favorite thing about it?`,
    `Hi ${otherUserName}! Your profile caught my eye. What are you up to this weekend?`,
    `${otherUserName}, if you could plan the perfect first date, what would it look like?`,
  ];
}

export async function generateConversationStartersForMatch(
  matchId: string,
  tone: OpenerTone = 'funny',
): Promise<string[]> {
  return generateConversationStarters(matchId, tone);
}

export function isConversationStale(messages: Message[], hoursThreshold = 72): boolean {
  if (messages.length === 0) return false;
  const last = messages[messages.length - 1];
  const hoursSince = (Date.now() - new Date(last.created_at).getTime()) / (1000 * 60 * 60);
  return hoursSince >= hoursThreshold;
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { data: matchRows, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (matchError) throw new Error(matchError.message);

  const matchIds = (matchRows ?? []).map((m) => m.id);
  if (matchIds.length === 0) return 0;

  const { data, error } = await supabase
    .from('messages')
    .select('read_by, sender_id')
    .in('match_id', matchIds)
    .neq('sender_id', userId);

  if (error) throw new Error(error.message);
  return (data ?? []).filter((m) => !m.read_by.includes(userId)).length;
}

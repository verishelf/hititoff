import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '../types';
import { FREE_MESSAGES_PER_MATCH } from '../utils/constants';
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
): Promise<Message> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Message cannot be empty');

  const isParticipant = await verifyMatchParticipant(matchId, senderId);
  if (!isParticipant) throw new Error('Not authorized to send messages');

  const { allowed } = await canSendMessage(matchId, senderId);
  if (!allowed) throw new Error('Message limit reached');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      text: trimmed,
      read_by: [senderId],
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('matches')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', matchId);

  return data as Message;
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
}

export async function generateIcebreakers(
  sharedInterests: string[],
  otherUserName: string,
): Promise<string[]> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    const interest = sharedInterests[0] ?? 'life';
    return [
      `Hey ${otherUserName}! I noticed we both like ${interest} — what's your favorite thing about it?`,
      `Hi ${otherUserName}! Your profile caught my eye. What are you up to this weekend?`,
      `${otherUserName}, if you could plan the perfect first date, what would it look like?`,
    ];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Generate 3 short, friendly dating app icebreaker messages. Return only a JSON array of strings.',
          },
          {
            role: 'user',
            content: `Generate icebreakers for ${otherUserName}. Shared interests: ${sharedInterests.join(', ') || 'general'}.`,
          },
        ],
        temperature: 0.8,
      }),
    });

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '[]';
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3).map(String);
    }
  } catch {
    // fall through to defaults
  }

  return [
    `Hey ${otherUserName}! What's something you're excited about lately?`,
    `Hi ${otherUserName}! I'd love to hear about your favorite local spot.`,
    `${otherUserName}, what's the best thing that happened to you this week?`,
  ];
}

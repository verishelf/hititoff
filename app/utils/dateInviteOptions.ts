export const DATE_REASON_OPTIONS = [
  { id: 'coffee', label: 'Coffee & chat' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'walk', label: 'Walk or hike' },
  { id: 'movies', label: 'Movies' },
  { id: 'live_music', label: 'Live music' },
  { id: 'museum', label: 'Museum or gallery' },
  { id: 'activity', label: 'Mini golf or bowling' },
  { id: 'other', label: 'Other' },
] as const;

export type DateReasonId = (typeof DATE_REASON_OPTIONS)[number]['id'];

export function getDefaultDateTime(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(19, 0, 0, 0);
  return date;
}

export function formatInviteDateTime(date: Date): string {
  return date.toLocaleString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function resolveDateReason(
  reasonId: DateReasonId | null,
  otherReason: string,
): string {
  if (!reasonId) return '';
  if (reasonId === 'other') return otherReason.trim();
  return DATE_REASON_OPTIONS.find((option) => option.id === reasonId)?.label ?? '';
}

export interface ParsedDateInvite {
  when: string;
  reason: string;
}

const DATE_INVITE_PREFIX = "Let's go on a date";

export function formatDateInviteMessage(
  when: string,
  reason: string,
  otherUserName: string,
): string {
  const lines = [`${DATE_INVITE_PREFIX}, ${otherUserName}! 📅`, `When: ${when.trim()}`];
  if (reason.trim()) {
    lines.push(`For: ${reason.trim()}`);
  }
  return lines.join('\n');
}

export function parseDateInviteMessage(text: string): ParsedDateInvite | null {
  if (!text.includes(DATE_INVITE_PREFIX)) return null;

  const whenLine = text.split('\n').find((line) => line.startsWith('When:'));
  const reasonLine = text.split('\n').find((line) => line.startsWith('For:'));

  if (!whenLine) return null;

  return {
    when: whenLine.replace(/^When:\s*/, '').trim(),
    reason: reasonLine?.replace(/^For:\s*/, '').trim() ?? '',
  };
}

export function isDateInviteMessage(message: {
  text: string;
  message_type?: string | null;
}): boolean {
  return message.message_type === 'date_invite' || parseDateInviteMessage(message.text) != null;
}


import { supabase } from './supabase';

export const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment or bullying',
  'Fake profile',
  'Scam or fraud',
  'Underage user',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from('user_blocks').upsert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error) throw new Error(error.message);
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw new Error(error.message);
}

export async function isBlocked(userA: string, userB: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_blocked', {
    user_a: userA,
    user_b: userB,
  });
  if (error) return false;
  return Boolean(data);
}

export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: string,
  details = '',
): Promise<void> {
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    details,
  });
  if (error) throw new Error(error.message);
}

export async function submitVerificationRequest(
  userId: string,
  selfieUrl: string,
): Promise<void> {
  await supabase.from('verification_requests').insert({
    user_id: userId,
    selfie_url: selfieUrl,
    status: 'pending',
  });
  await supabase
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', userId);
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  return (data ?? []).map((r) => r.blocked_id);
}

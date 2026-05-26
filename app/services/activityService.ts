import { supabase } from './supabase';

export async function heartbeat(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function updateRespectfulBadge(userId: string): Promise<void> {
  await supabase.rpc('update_respectful_dater_badge', { p_user_id: userId });
}

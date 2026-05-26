import { supabase } from './supabase';

export interface PhoneExchangeStatus {
  iShared: boolean;
  theyShared: boolean;
  theirPhone: string | null;
  myPhone: string | null;
}

export async function getOwnPhone(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profile_phones')
    .select('phone_number')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.phone_number ?? null;
}

export async function upsertOwnPhone(userId: string, phoneNumber: string): Promise<void> {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    const { error } = await supabase.from('profile_phones').delete().eq('user_id', userId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('profile_phones').upsert(
    {
      user_id: userId,
      phone_number: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw new Error(error.message);
}

export async function getPhoneExchangeStatus(matchId: string): Promise<PhoneExchangeStatus> {
  const { data, error } = await supabase.rpc('get_phone_exchange_status', {
    p_match_id: matchId,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    iShared: Boolean(row?.i_shared),
    theyShared: Boolean(row?.they_shared),
    theirPhone: row?.their_phone ?? null,
    myPhone: row?.my_phone ?? null,
  };
}

export async function sharePhoneWithMatch(matchId: string): Promise<PhoneExchangeStatus> {
  const { error } = await supabase.rpc('share_phone_with_match', {
    p_match_id: matchId,
  });

  if (error) throw new Error(error.message);
  return getPhoneExchangeStatus(matchId);
}

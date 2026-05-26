import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface MatchChemistry {
  match_id: string;
  spark_meter: number;
  response_speed_score: number;
  engagement_score: number;
  depth_score: number;
  humor_alignment: number;
  mutual_energy: number;
  updated_at: string;
}

export interface ChemistryEvent {
  id: string;
  match_id: string;
  event_type: string;
  delta: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function getMatchChemistry(matchId: string): Promise<MatchChemistry | null> {
  const { data, error } = await supabase
    .from('match_chemistry')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as MatchChemistry | null;
}

export async function getChemistryEvents(matchId: string): Promise<ChemistryEvent[]> {
  const { data, error } = await supabase
    .from('chemistry_events')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []) as ChemistryEvent[];
}

export function subscribeToChemistry(
  matchId: string,
  callback: (chemistry: MatchChemistry | null) => void,
): RealtimeChannel {
  getMatchChemistry(matchId).then(callback);

  return supabase
    .channel(`chemistry:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_chemistry',
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        getMatchChemistry(matchId).then(callback);
      },
    )
    .subscribe();
}

export async function addChemistryEvent(
  matchId: string,
  eventType: string,
  delta: number,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from('chemistry_events').insert({
    match_id: matchId,
    event_type: eventType,
    delta,
    metadata: metadata as import('../types/database').Json,
  });
}

export async function recomputeChemistry(matchId: string): Promise<void> {
  await supabase.rpc('compute_match_chemistry', { p_match_id: matchId });
}

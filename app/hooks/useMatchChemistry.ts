import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  getChemistryEvents,
  getMatchChemistry,
  subscribeToChemistry,
  type ChemistryEvent,
  type MatchChemistry,
} from '../services/chemistryService';

export function useMatchChemistry(matchId: string | null) {
  const [chemistry, setChemistry] = useState<MatchChemistry | null>(null);
  const [events, setEvents] = useState<ChemistryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setChemistry(null);
      setEvents([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    const load = async () => {
      setLoading(true);
      try {
        const [chem, evts] = await Promise.all([
          getMatchChemistry(matchId),
          getChemistryEvents(matchId),
        ]);
        setChemistry(chem);
        setEvents(evts);
      } finally {
        setLoading(false);
      }
    };

    load();
    channel = subscribeToChemistry(matchId, setChemistry);

    return () => {
      channel?.unsubscribe();
    };
  }, [matchId]);

  return { chemistry, events, loading, sparkMeter: chemistry?.spark_meter ?? 0 };
}

// src/hooks/usePlayers.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { NbaPlayerStats } from '../types/types';

export function usePlayers() {
  const [players, setPlayers] = useState<NbaPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchPlayers() {
      const { data, error } = await supabase
        .from('nba_player_stats')
        .select('*')
        .order('player_name');

      if (error) {
        setError(error);
      } else {
        setPlayers(data || []);
      }
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  return { players, loading, error };
}

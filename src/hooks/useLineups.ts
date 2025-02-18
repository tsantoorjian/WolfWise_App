// src/hooks/useLineups.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineupWithAdvanced, NbaPlayerStats } from '../types/database.types';

type LineupsData = {
  twoMan: LineupWithAdvanced[];
  threeMan: LineupWithAdvanced[];
  fiveMan: LineupWithAdvanced[];
};

export function useLineups(showTopLineups: boolean, players: NbaPlayerStats[]): { lineups: LineupsData; loading: boolean; error: any } {
  const [lineups, setLineups] = useState<LineupsData>({
    twoMan: [],
    threeMan: [],
    fiveMan: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchLineups() {
      try {
        const fetchLineupsForSize = async (size: number, limit: number) => {
          const { data, error } = await supabase
            .from('lineups_advanced')
            .select('*, group_name, lineup_size, min, player1, player2, player3, player4, player5')
            .eq('team_abbreviation', 'MIN')
            .eq('lineup_size', size)
            .gte('min', 50)
            .order('net_rating', { ascending: !showTopLineups })
            .limit(limit);

          if (error) throw error;
          return data || [];
        };

        const [twoManData, threeManData, fiveManData] = await Promise.all([
          fetchLineupsForSize(2, 3),
          fetchLineupsForSize(3, 3),
          fetchLineupsForSize(5, 3),
        ]);

        const processLineup = (lineup: any): LineupWithAdvanced => {
          const playerNames = [
            lineup.player1,
            lineup.player2,
            lineup.player3,
            lineup.player4,
            lineup.player5,
          ].filter(Boolean);

          const processedPlayers = playerNames.map((playerName: string) => {
            if (!playerName) return { name: '', image_url: null };
            // Use the last name to match; adjust as needed
            const lastName = playerName.split('. ')[1];
            const matchedPlayer = players.find(p => p.player_name.split(' ').pop() === lastName);
            return {
              name: playerName,
              image_url: matchedPlayer?.image_url || null,
            };
          });

          return {
            group_name: lineup.group_name,
            lineup_size: lineup.lineup_size,
            min: lineup.min || 0,
            net_rating: lineup.net_rating || 0,
            off_rating: lineup.off_rating || 0,
            def_rating: lineup.def_rating || 0,
            ts_pct: lineup.ts_pct || 0,
            pace: lineup.pace || 0,
            players: processedPlayers,
          };
        };

        setLineups({
          twoMan: twoManData.map(processLineup),
          threeMan: threeManData.map(processLineup),
          fiveMan: fiveManData.map(processLineup),
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLineups();
  }, [showTopLineups, players]);

  return { lineups, loading, error };
}

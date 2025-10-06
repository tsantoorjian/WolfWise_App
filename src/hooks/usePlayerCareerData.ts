import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type PlayerCareerData = {
  id: number;
  player_id: number;
  player_name: string;
  birthdate: string;
  current_age: number;
  games_remaining_until_25: number;
  career_points: number;
  career_games_played: number;
  points_per_game: number;
  assists_per_game: number;
  rebounds_per_game: number;
  steals_per_game: number;
  blocks_per_game: number;
  fg3m_per_game: number;
  fgm_per_game: number;
  ftm_per_game: number;
  minutes_per_game: number;
  career_assists: number;
  career_rebounds: number;
  career_steals: number;
  career_blocks: number;
  career_3pt_made: number;
  career_fg_made: number;
  career_ft_made: number;
  career_minutes: number;
  created_at: string;
  updated_at: string;
};

export function usePlayerCareerData(playerName: string = 'Anthony Edwards') {
  const [playerData, setPlayerData] = useState<PlayerCareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('player_career_data')
          .select('*')
          .eq('player_name', playerName)
          .single();

        if (error) throw error;
        setPlayerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch player data');
        console.error('Error fetching player career data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerData();
  }, [playerName]);

  return {
    playerData,
    loading,
    error
  };
}

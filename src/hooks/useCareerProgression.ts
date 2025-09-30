import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kuthirbcjtofsdwsfhkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dGhpcmJjanRvZnNkd3NmaGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTAyOTQsImV4cCI6MjA1NDY4NjI5NH0.Mpt8HEXNEspVRnVs4i6bUNxGpLZxfMvTL8OcdY1x_e8'
);

export interface CareerProgressionData {
  year: number;
  value: number | null;
  team: string | null;
  games: number | null;
  minutes_played: number | null;
}

export interface AdvancedStatOption {
  key: string;
  label: string;
  description: string;
  format: 'decimal' | 'percentage' | 'integer';
  decimals: number;
}

export const ADVANCED_STAT_OPTIONS: AdvancedStatOption[] = [
  {
    key: 'per',
    label: 'PER',
    description: 'Player Efficiency Rating',
    format: 'decimal',
    decimals: 1
  },
  {
    key: 'win_shares',
    label: 'Win Shares',
    description: 'Total Win Shares',
    format: 'decimal',
    decimals: 1
  },
  {
    key: 'win_shares_per_48',
    label: 'WS/48',
    description: 'Win Shares per 48 Minutes',
    format: 'decimal',
    decimals: 3
  },
  {
    key: 'true_shooting',
    label: 'TS%',
    description: 'True Shooting Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'box_pm',
    label: 'BPM',
    description: 'Box Plus/Minus',
    format: 'decimal',
    decimals: 1
  },
  {
    key: 'value_over_replacement',
    label: 'VORP',
    description: 'Value Over Replacement Player',
    format: 'decimal',
    decimals: 1
  },
  {
    key: 'offensive_ws',
    label: 'OWS',
    description: 'Offensive Win Shares',
    format: 'decimal',
    decimals: 1
  },
  {
    key: 'defensive_ws',
    label: 'DWS',
    description: 'Defensive Win Shares',
    format: 'decimal',
    decimals: 1
  },
  {
    key: 'usage_pct',
    label: 'USG%',
    description: 'Usage Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'assist_pct',
    label: 'AST%',
    description: 'Assist Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'total_rebound_pct',
    label: 'TRB%',
    description: 'Total Rebound Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'steal_pct',
    label: 'STL%',
    description: 'Steal Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'block_pct',
    label: 'BLK%',
    description: 'Block Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'turnover_pct',
    label: 'TOV%',
    description: 'Turnover Percentage',
    format: 'percentage',
    decimals: 1
  },
  {
    key: 'three_point_rate',
    label: '3PAr',
    description: '3-Point Attempt Rate',
    format: 'decimal',
    decimals: 3
  },
  {
    key: 'free_throw_rate',
    label: 'FTr',
    description: 'Free Throw Attempt Rate',
    format: 'decimal',
    decimals: 3
  }
];

export function useCareerProgression(playerName: string, selectedStat: string) {
  const [data, setData] = useState<CareerProgressionData[]>([]);
  const [leagueAverages, setLeagueAverages] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName || !selectedStat) {
      setData([]);
      return;
    }

    const fetchCareerProgression = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: progressionData, error: fetchError } = await supabase
          .from('nba_advanced_stats')
          .select('year, player, team, games, minutes_played')
          .eq('player', playerName)
          .in('year', [2021, 2022, 2023, 2024, 2025])
          .order('year', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (!progressionData || progressionData.length === 0) {
          setData([]);
          return;
        }

        // Get the stat values for each year
        const statData = await Promise.all(
          progressionData.map(async (record) => {
            const { data: statRecord, error: statError } = await supabase
              .from('nba_advanced_stats')
              .select(selectedStat)
              .eq('player', playerName)
              .eq('year', record.year)
              .single();

            if (statError) {
              console.warn(`No ${selectedStat} data for ${playerName} in ${record.year}`);
              return {
                year: record.year,
                value: null,
                team: record.team,
                games: record.games,
                minutes_played: record.minutes_played
              };
            }

            return {
              year: record.year,
              value: statRecord[selectedStat as keyof typeof statRecord] as number | null,
              team: record.team,
              games: record.games,
              minutes_played: record.minutes_played
            };
          })
        );

        setData(statData);

        // Fetch league averages for top 200 players by minutes for each year
        const leagueAveragesData: Record<number, number> = {};
        
        for (const year of [2021, 2022, 2023, 2024, 2025]) {
          try {
            // Get top 200 players by minutes for this year
            const { data: topPlayers, error: topPlayersError } = await supabase
              .from('nba_advanced_stats')
              .select(selectedStat)
              .eq('year', year)
              .not(selectedStat, 'is', null)
              .order('minutes_played', { ascending: false })
              .limit(200);

            if (topPlayersError) {
              console.warn(`Error fetching top players for ${year}:`, topPlayersError);
              continue;
            }

            if (topPlayers && topPlayers.length > 0) {
              const validValues = topPlayers
                .map(player => player[selectedStat as keyof typeof player] as number | null)
                .filter(value => value !== null && !isNaN(Number(value)))
                .map(value => Number(value));

              if (validValues.length > 0) {
                const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                leagueAveragesData[year] = average;
              }
            }
          } catch (err) {
            console.warn(`Error calculating league average for ${year}:`, err);
          }
        }

        setLeagueAverages(leagueAveragesData);
      } catch (err) {
        console.error('Error fetching career progression:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch career progression data');
        setData([]);
        setLeagueAverages({});
      } finally {
        setLoading(false);
      }
    };

    fetchCareerProgression();
  }, [playerName, selectedStat]);

  return { data, leagueAverages, loading, error };
}

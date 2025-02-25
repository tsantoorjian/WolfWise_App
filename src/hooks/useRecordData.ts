import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RecordTrackerSeason } from '../types/database.types';

export type GameLog = {
  GAME_DATE: string;
  PTS: number;
  AST: number;
  REB: number;
  STL: number;
  BLK: number;
  TOV: number;
  FGM: number;
  FGA: number;
  FG3M: number;
  FG3A: number;
  FTM: number;
  FTA: number;
  PF: number;
};

export function useRecordData() {
  const [recordData, setRecordData] = useState<RecordTrackerSeason[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch record tracker data
        const { data: recordTrackerData, error: recordError } = await supabase
          .from('record_tracker_season')
          .select('*');

        if (recordError) throw recordError;

        // Fetch Ant's game logs
        const { data: gameLogsData, error: logsError } = await supabase
          .from('twolves_player_game_logs')
          .select('*')
          .eq('PLAYER_NAME', 'Anthony Edwards')
          .order('GAME_DATE', { ascending: true });

        if (logsError) throw logsError;

        setRecordData(recordTrackerData || []);
        setGameLogs(gameLogsData || []);
      } catch (error) {
        console.error('Error fetching record data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getProgressionData = (stat: string) => {
    if (!gameLogs.length) return [];

    // Convert stat from record_tracker_season (lowercase) to game logs (uppercase)
    const gameLogStat = stat.toUpperCase();
    
    let cumulativeValue = 0;
    return gameLogs.map((game, index) => {
      const statValue = Number(game[gameLogStat as keyof GameLog] || 0);
      cumulativeValue += statValue;
      return [index + 1, cumulativeValue];
    });
  };

  return { recordData, gameLogs, loading, getProgressionData };
}

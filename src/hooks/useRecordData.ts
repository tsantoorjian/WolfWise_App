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

export function useRecordData(selectedPlayerProp?: string) {
  const [recordData, setRecordData] = useState<RecordTrackerSeason[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  
  // Use prop if provided, otherwise use internal state
  const currentSelectedPlayer = selectedPlayerProp || selectedPlayer;

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch record tracker data
        const { data: recordTrackerData, error: recordError } = await supabase
          .from('record_tracker_season')
          .select('*');

        if (recordError) throw recordError;

        // Extract unique player names from record data
        const players = [...new Set(recordTrackerData?.map(record => record.name) || [])];
        setAvailablePlayers(players);
        
        // Set default selected player to first available player
        if (players.length > 0 && !selectedPlayer) {
          setSelectedPlayer(players[0]);
        }

        setRecordData(recordTrackerData || []);
      } catch (error) {
        console.error('Error fetching record data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch game logs when selected player changes
  useEffect(() => {
    async function fetchGameLogs() {
      if (!currentSelectedPlayer) return;
      
      try {
        const { data: gameLogsData, error: logsError } = await supabase
          .from('twolves_player_game_logs')
          .select('*')
          .eq('PLAYER_NAME', currentSelectedPlayer)
          .order('GAME_DATE', { ascending: true });

        if (logsError) throw logsError;
        setGameLogs(gameLogsData || []);
      } catch (error) {
        console.error('Error fetching game logs:', error);
        setGameLogs([]);
      }
    }

    fetchGameLogs();
  }, [currentSelectedPlayer]);

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

  const getPlayerRecordData = (playerName: string) => {
    return recordData.filter(record => record.name === playerName);
  };

  return { 
    recordData, 
    gameLogs, 
    loading, 
    selectedPlayer: currentSelectedPlayer, 
    setSelectedPlayer, 
    availablePlayers,
    getProgressionData, 
    getPlayerRecordData 
  };
}

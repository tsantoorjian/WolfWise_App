import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TimberwolvesPlayerStats,
  DistributionStats,
  RecordTrackerSeason, 
  ThreePointData, 
  LineupWithAdvanced
} from '../types/database.types';

export interface RecentStats {
  PTS: number;
  AST: number;
  REB: number;
  STL: number;
  BLK: number;
  PLUS_MINUS: number;
  NBA_FANTASY_PTS: number;
  PTS_RANK?: number;
  REB_RANK?: number;
  AST_RANK?: number;
  STL_RANK?: number;
  BLK_RANK?: number;
  PLUS_MINUS_RANK?: number;
  NBA_FANTASY_PTS_RANK?: number;
}

export interface PlayerWithStats extends TimberwolvesPlayerStats {
  position?: string;
  jersey_number?: string;
  image_url?: string | null;
}

const PERCENTAGE_STATS = ['3pt percentage', 'Fg %', 'EFG %'];

export function useSupabase() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributionData, setDistributionData] = useState<ThreePointData[]>([]);
  const [lineups, setLineups] = useState<{
    twoMan: LineupWithAdvanced[];
    threeMan: LineupWithAdvanced[];
    fiveMan: LineupWithAdvanced[];
  }>({
    twoMan: [],
    threeMan: [],
    fiveMan: [],
  });
  const [last5Stats, setLast5Stats] = useState<Record<string, RecentStats>>({});
  const [last10Stats, setLast10Stats] = useState<Record<string, RecentStats>>({});
  const [recordData, setRecordData] = useState<RecordTrackerSeason[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [playerImageUrl, setPlayerImageUrl] = useState<string | null>(null);

  const fetchDistributionData = useCallback(async (stat: string) => {
    try {
      const { data: distributionData, error: distributionError } = await supabase
        .from('distribution_stats')
        .select('*')
        .eq('stat', stat)
        .gte('minutes_played', 600);

      if (distributionError) {
        console.error('Error fetching distribution data:', distributionError);
        throw distributionError;
      }

      const processedData = processDistributionData(distributionData || [], stat);
      setDistributionData(processedData);
    } catch (error) {
      console.error('Error fetching distribution data:', error);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch player metadata from nba_player_stats
        const { data: playerMetadata, error: playerMetadataError } = await supabase
          .from('nba_player_stats')
          .select('player_id, player_name, position, jersey_number, image_url');
        
        if (playerMetadataError) throw playerMetadataError;

        // Get Anthony Edwards' image URL
        const antsImageUrl = playerMetadata.find(p => p.player_name === "Anthony Edwards")?.image_url || null;
        setPlayerImageUrl(antsImageUrl);

        // Fetch main stats from timberwolves_player_stats_season
        const { data: playerStats, error: playerStatsError } = await supabase
          .from('timberwolves_player_stats_season')
          .select('*')
          .order('MIN', { ascending: false });

        if (playerStatsError) throw playerStatsError;

        // Fetch ranks from full_season_base_per_game (per-game stats)
        const { data: seasonRanks, error: seasonRanksError } = await supabase
          .from('full_season_base_per_game')
          .select('PLAYER_ID, PTS_RANK, REB_RANK, AST_RANK, STL_RANK, BLK_RANK, PLUS_MINUS_RANK, NBA_FANTASY_PTS_RANK');
        if (seasonRanksError) throw seasonRanksError;

        // Combine the data
        const combinedPlayerData = playerStats.map(stats => {
          const metadata = playerMetadata.find(p => p.player_name === stats.PLAYER_NAME);
          const ranks: any = seasonRanks.find(r => r.PLAYER_ID === stats.PLAYER_ID) || {};
          return {
            ...stats,
            position: metadata?.position,
            jersey_number: metadata?.jersey_number,
            image_url: metadata?.image_url,
            PTS_RANK: ranks.PTS_RANK,
            REB_RANK: ranks.REB_RANK,
            AST_RANK: ranks.AST_RANK,
            STL_RANK: ranks.STL_RANK,
            BLK_RANK: ranks.BLK_RANK,
            PLUS_MINUS_RANK: ranks.PLUS_MINUS_RANK,
            NBA_FANTASY_PTS_RANK: ranks.NBA_FANTASY_PTS_RANK,
          };
        });

        setPlayers(combinedPlayerData);

        // Initial distribution data fetch
        await fetchDistributionData('3pt percentage');

        // Fetch lineups
        const [twoManData, threeManData, fiveManData] = await Promise.all([
          fetchLineups(2, 3),
          fetchLineups(3, 3),
          fetchLineups(5, 3),
        ]);

        setLineups({
          twoMan: twoManData.map(processLineup),
          threeMan: threeManData.map(processLineup),
          fiveMan: fiveManData.map(processLineup),
        });

        // Fetch last 5 and last 10 game stats
        const { data: last5Data, error: last5Error } = await supabase
          .from('timberwolves_player_stats_last_5')
          .select('*');
        
        const { data: last10Data, error: last10Error } = await supabase
          .from('timberwolves_player_stats_last_10')
          .select('*');

        if (last5Error) throw last5Error;
        if (last10Error) throw last10Error;

        console.log('Raw Last 5 Data:', last5Data);
        console.log('Raw Last 10 Data:', last10Data);

        // Fetch ranks for last 5 and last 10 games (per-game)
        const { data: last5Ranks, error: last5RanksError } = await supabase
          .from('last_5_base_per_game')
          .select('PLAYER_ID, PTS_RANK, REB_RANK, AST_RANK, STL_RANK, BLK_RANK, PLUS_MINUS_RANK, NBA_FANTASY_PTS_RANK');
        if (last5RanksError) throw last5RanksError;

        const { data: last10Ranks, error: last10RanksError } = await supabase
          .from('last_10_base_per_game')
          .select('PLAYER_ID, PTS_RANK, REB_RANK, AST_RANK, STL_RANK, BLK_RANK, PLUS_MINUS_RANK, NBA_FANTASY_PTS_RANK');
        if (last10RanksError) throw last10RanksError;

        const processed5 = processRecentStats(last5Data || []);
        const processed10 = processRecentStats(last10Data || []);

        // Merge ranks into the processed stats objects
        const last5StatsWithRanks: Record<string, RecentStats> = {};
        Object.keys(processed5).forEach(playerId => {
          const stats = processed5[playerId];
          const ranks: any = last5Ranks.find(r => r.PLAYER_ID === Number(playerId)) || {};
          last5StatsWithRanks[playerId] = {
            ...stats,
            PTS_RANK: ranks.PTS_RANK,
            REB_RANK: ranks.REB_RANK,
            AST_RANK: ranks.AST_RANK,
            STL_RANK: ranks.STL_RANK,
            BLK_RANK: ranks.BLK_RANK,
            PLUS_MINUS_RANK: ranks.PLUS_MINUS_RANK,
            NBA_FANTASY_PTS_RANK: ranks.NBA_FANTASY_PTS_RANK,
          };
        });

        const last10StatsWithRanks: Record<string, RecentStats> = {};
        Object.keys(processed10).forEach(playerId => {
          const stats = processed10[playerId];
          const ranks: any = last10Ranks.find(r => r.PLAYER_ID === Number(playerId)) || {};
          last10StatsWithRanks[playerId] = {
            ...stats,
            PTS_RANK: ranks.PTS_RANK,
            REB_RANK: ranks.REB_RANK,
            AST_RANK: ranks.AST_RANK,
            STL_RANK: ranks.STL_RANK,
            BLK_RANK: ranks.BLK_RANK,
            PLUS_MINUS_RANK: ranks.PLUS_MINUS_RANK,
            NBA_FANTASY_PTS_RANK: ranks.NBA_FANTASY_PTS_RANK,
          };
        });

        console.log('Processed Last 5 Stats:', processed5);
        console.log('Processed Last 10 Stats:', processed10);

        setLast5Stats(last5StatsWithRanks);
        setLast10Stats(last10StatsWithRanks);

        // Fetch record tracker data
        const { data: recordTrackerData, error: recordTrackerError } = await supabase
          .from('record_tracker_season')
          .select('*');

        if (recordTrackerError) throw recordTrackerError;
        setRecordData(recordTrackerData || []);

        // Fetch leaderboard data
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('players_on_league_leaderboard')
          .select(`
            "Stat Category",
            Player,
            Value,
            Ranking
          `);

        if (leaderboardError) throw leaderboardError;

        // Process the data to combine leaderboard data with images
        const processedLeaderboardData = leaderboardData?.map(entry => ({
          "Stat Category": entry["Stat Category"],
          Player: entry.Player,
          Value: entry.Value,
          Ranking: entry.Ranking,
          image_url: playerMetadata?.find(p => p.player_name === entry.Player)?.image_url
        })) || [];

        setLeaderboardData(processedLeaderboardData);

      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fetchDistributionData]);

  return {
    players,
    loading,
    distributionData,
    lineups,
    last5Stats,
    last10Stats,
    recordData,
    leaderboardData,
    playerImageUrl,
    fetchDistributionData,
  };
}

// Helper functions
function processDistributionData(data: DistributionStats[], stat: string): ThreePointData[] {
  const isPercentage = PERCENTAGE_STATS.includes(stat);
  
  return data.map(player => ({
    player_name: player.player_name,
    value: isPercentage && player.value > 1 ? player.value / 100 : player.value,
    team_abbreviation: player.team_abbreviation,
    minutes_played: player.minutes_played
  }));
}

async function fetchLineups(size: number, limit: number) {
  const { data, error } = await supabase
    .from('lineups_advanced')
    .select('*, group_name, lineup_size, min, player1, player2, player3, player4, player5')
    .eq('team_abbreviation', 'MIN')
    .eq('lineup_size', size)
    .gte('min', 50)
    .order('net_rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching ${size}-man lineups:`, error);
    return [];
  }

  return data || [];
}

function processLineup(lineup: any): LineupWithAdvanced {
  const playerNames = [
    lineup.player1,
    lineup.player2,
    lineup.player3,
    lineup.player4,
    lineup.player5,
  ].filter(Boolean);

  const players = playerNames.map(playerName => {
    if (!playerName) return { name: '', image_url: null };
    return {
      name: playerName,
      image_url: null
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
    players,
  };
}

function processRecentStats(data: any[]): Record<string, RecentStats> {
  return data.reduce((acc, curr) => {
    acc[curr.PLAYER_ID] = { // Key by PLAYER_ID
      PTS: curr.PTS || 0,
      AST: curr.AST || 0,
      REB: curr.REB || 0,
      STL: curr.STL || 0,
      BLK: curr.BLK || 0,
      PLUS_MINUS: curr.PLUS_MINUS || 0,
      NBA_FANTASY_PTS: curr.NBA_FANTASY_PTS || 0
    };
    return acc;
  }, {} as Record<string, RecentStats>);
}
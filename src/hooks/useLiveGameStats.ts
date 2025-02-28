import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PlayerGameStats {
  player: string;
  pts: number;
  reb: number;
  ast: number;
  blk: number;
  stl: number;
  tov: number;
  fgs: string;
  threept: string;
  plusminuspoints: number;
  player_image?: string;
  fgp: string;       // Field goal percentage
  threeptp: string;  // Three-point percentage
  min: string;       // Minutes played
}

interface GameInfo {
  game_id: string;
  game_status: string;
  game_clock: string;
  period: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  game_date: string;
  arena: string;
  city: string;
  is_halftime: boolean;
  is_end_of_period: boolean;
}

interface PlayByPlay {
  id: number;
  game_id: string;
  event_num: number;
  clock: string;
  period: number;
  event_type: string;
  description: string;
  home_score: number;
  away_score: number;
  team_tricode: string;
  player_name: string;
  is_scoring_play: boolean;
  score_margin: number;
  time_seconds: number;
  created_at: string;
}

export const useLiveGameStats = () => {
  const [playerStats, setPlayerStats] = useState<PlayerGameStats[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [playByPlay, setPlayByPlay] = useState<PlayByPlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseMinutes = (minutesStr: string): string => {
    // Handle the PT23M format
    if (minutesStr.startsWith('PT') && minutesStr.endsWith('M')) {
      const minutes = parseInt(minutesStr.substring(2, minutesStr.length - 1), 10);
      return `${minutes}:00`;
    }
    
    // If it's already in MM:SS format, return as is
    if (/^\d+:\d{2}$/.test(minutesStr)) {
      return minutesStr;
    }
    
    // If it's just a number, format as MM:00
    if (/^\d+$/.test(minutesStr)) {
      return `${minutesStr}:00`;
    }
    
    // Default fallback
    return '0:00';
  };

  const fetchLiveGameStats = async () => {
    try {
      console.log('Fetching live game stats...');
      setLoading(true);
      
      // First get the in-game stats
      const { data: gameStatsData, error: gameStatsError } = await supabase
        .from('in_game_player_stats')
        .select('*');

      if (gameStatsError) {
        console.error('Error fetching in-game stats:', gameStatsError);
        throw new Error(`Error fetching in-game stats: ${gameStatsError.message}`);
      }

      // Fetch game information
      const { data: gameInfoData, error: gameInfoError } = await supabase
        .from('in_game_info')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (gameInfoError) {
        console.error('Error fetching game info:', gameInfoError);
        throw new Error(`Error fetching game info: ${gameInfoError.message}`);
      }

      // Set game info if available
      if (gameInfoData && gameInfoData.length > 0) {
        setGameInfo(gameInfoData[0] as GameInfo);
      } else {
        setGameInfo(null);
      }

      console.log('Game stats data:', JSON.stringify(gameStatsData, null, 2));

      // Check if the table exists but is empty
      if (!gameStatsData || gameStatsData.length === 0) {
        console.log('No in-game stats found');
        setPlayerStats([]);
        return;
      }

      // Get player images from nba_player_stats table with correct field name
      const { data: playerImagesData, error: playerImagesError } = await supabase
        .from('nba_player_stats')
        .select('player_name, image_url');

      if (playerImagesError) {
        console.error('Error fetching player images:', playerImagesError);
        throw new Error(`Error fetching player images: ${playerImagesError.message}`);
      }

      console.log('Player images data count:', playerImagesData?.length);

      // Create a map of player names to images
      const playerImageMap = new Map();
      if (playerImagesData) {
        playerImagesData.forEach((player) => {
          if (player.player_name && player.image_url) {
            playerImageMap.set(player.player_name.toLowerCase(), player.image_url);
          }
        });
      }

      console.log('Player image map size:', playerImageMap.size);

      // Combine the data and normalize field names
      const combinedData = gameStatsData.map((stat) => {
        // Convert field names to lowercase to match our interface
        const normalizedStat = {
          player: stat.Player || stat.player,
          pts: stat.PTS || stat.pts || 0,
          reb: stat.REB || stat.reb || 0,
          ast: stat.AST || stat.ast || 0,
          blk: stat.BLK || stat.blk || 0,
          stl: stat.STL || stat.stl || 0,
          tov: stat.TOV || stat.tov || 0,
          fgs: stat.FGs || stat.fgs || '0-0',
          threept: stat.threePt || stat.threept || '0-0',
          plusminuspoints: parseFloat(stat.plusMinusPoints) || stat.plusminuspoints || 0,
          fgp: stat.FGp || stat.fgp || '0.0%',
          threeptp: stat.threePtP || stat.threeptp || '0.0%',
          min: parseMinutes(stat.minutes || stat.Min || stat.min || 'PT0M')
        };
        
        if (!normalizedStat.player) {
          console.log('Found stat without player name:', stat);
          return normalizedStat;
        }
        
        const playerImage = playerImageMap.get(normalizedStat.player.toLowerCase());
        console.log(`Player: ${normalizedStat.player}, Image found: ${Boolean(playerImage)}`);
        
        return {
          ...normalizedStat,
          player_image: playerImage || null
        };
      });

      console.log('Combined data after normalization:', combinedData);
      setPlayerStats(combinedData as PlayerGameStats[]);

      // Fetch play-by-play data
      if (gameInfoData && gameInfoData.length > 0) {
        const gameId = gameInfoData[0].game_id;
        
        const { data: playByPlayData, error: playByPlayError } = await supabase
          .from('in_game_play_by_play')
          .select('*')
          .eq('game_id', gameId)
          .order('event_num', { ascending: true });

        if (playByPlayError) {
          console.error('Error fetching play-by-play data:', playByPlayError);
          throw new Error(`Error fetching play-by-play data: ${playByPlayError.message}`);
        }

        setPlayByPlay(playByPlayData as PlayByPlay[]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error in fetchLiveGameStats:', errorMessage);
      setError(`Failed to load live game stats: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveGameStats();

    // Set up real-time subscription for player stats
    const playerStatsSubscription = supabase
      .channel('in_game_player_stats_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'in_game_player_stats' }, 
        () => {
          fetchLiveGameStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for game info
    const gameInfoSubscription = supabase
      .channel('in_game_info_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'in_game_info' }, 
        () => {
          fetchLiveGameStats();
        }
      )
      .subscribe();

    return () => {
      playerStatsSubscription.unsubscribe();
      gameInfoSubscription.unsubscribe();
    };
  }, []);

  return { playerStats, gameInfo, playByPlay, loading, error, refreshStats: fetchLiveGameStats };
};

export default useLiveGameStats; 
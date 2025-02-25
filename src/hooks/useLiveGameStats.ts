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
}

export const useLiveGameStats = () => {
  const [playerStats, setPlayerStats] = useState<PlayerGameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          plusminuspoints: parseFloat(stat.plusMinusPoints) || stat.plusminuspoints || 0
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

    // Set up real-time subscription
    const subscription = supabase
      .channel('in_game_player_stats_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'in_game_player_stats' }, 
        () => {
          fetchLiveGameStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { playerStats, loading, error, refreshStats: fetchLiveGameStats };
};

export default useLiveGameStats; 
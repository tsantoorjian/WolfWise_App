import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AgeBasedAchievement } from '../types/database.types';
import { usePlayerCareerData, PlayerCareerData } from './usePlayerCareerData';

export type AgeTrackerData = {
  statCategory: string;
  currentValue: number;
  projectedValue: number;
  rankPosition: number;
  topRecord: AgeBasedAchievement;
  isOnTrack: boolean;
  gamesRemaining: number;
  currentAge: number;
  birthday: string;
};

export function useAgeBasedAchievements(playerName: string = 'Anthony Edwards') {
  const [achievements, setAchievements] = useState<AgeBasedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get player career data
  const { playerData, loading: playerDataLoading, error: playerDataError } = usePlayerCareerData(playerName);

  // Use data from Supabase if available, otherwise fallback to hardcoded values
  const playerBirthday = playerData?.birthdate || '2001-08-05';
  const currentAge = playerData?.current_age || 24;
  const gamesRemaining = playerData?.games_remaining_until_25 || 82;

  useEffect(() => {
    async function fetchAchievements() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('age_based_achievements')
          .select('*')
          .order('stat_category', { ascending: true })
          .order('rank_position', { ascending: true });

        if (error) throw error;
        setAchievements(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
        console.error('Error fetching age-based achievements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  const getTopRecordForCategory = (category: string): AgeBasedAchievement | null => {
    return achievements.find(a => a.stat_category === category && a.rank_position === 1) || null;
  };

  const calculateProjection = (currentStats: any, statCategory: string): number => {
    if (!currentStats) return 0;
    
    // Map stat categories to current stats fields
    const statMapping: Record<string, string> = {
      'Career Points': 'PTS',
      'Career Assists': 'AST', 
      'Career Rebounds': 'REB',
      'Career Steals': 'STL',
      'Career Blocks': 'BLK',
      'Career 3-Pointers Made': 'FG3M',
      'Career Field Goals Made': 'FGM',
      'Career Free Throws Made': 'FTM',
      'Career Minutes': 'MIN',
      'Career Games Played': 'GP'
    };

    let currentValue = 0;
    let perGame = 0;

    if (playerData) {
      // Use player career data for current values
      currentValue = statCategory === 'Career Points' ? playerData.career_points :
                    statCategory === 'Career Assists' ? playerData.career_assists :
                    statCategory === 'Career Rebounds' ? playerData.career_rebounds :
                    statCategory === 'Career Steals' ? playerData.career_steals :
                    statCategory === 'Career Blocks' ? playerData.career_blocks :
                    statCategory === 'Career 3-Pointers Made' ? playerData.career_3pt_made :
                    statCategory === 'Career Field Goals Made' ? playerData.career_fg_made :
                    statCategory === 'Career Free Throws Made' ? playerData.career_ft_made :
                    statCategory === 'Career Minutes' ? playerData.career_minutes :
                    statCategory === 'Career Games Played' ? playerData.career_games_played : 0;
      
      // Use most recent season per-game stats for projections
      perGame = statCategory === 'Career Points' ? playerData.points_per_game :
                statCategory === 'Career Assists' ? playerData.assists_per_game :
                statCategory === 'Career Rebounds' ? playerData.rebounds_per_game :
                statCategory === 'Career Steals' ? playerData.steals_per_game :
                statCategory === 'Career Blocks' ? playerData.blocks_per_game :
                statCategory === 'Career 3-Pointers Made' ? playerData.fg3m_per_game :
                statCategory === 'Career Field Goals Made' ? playerData.fgm_per_game :
                statCategory === 'Career Free Throws Made' ? playerData.ftm_per_game :
                statCategory === 'Career Minutes' ? playerData.minutes_per_game :
                statCategory === 'Career Games Played' ? 1 : 0; // Games played is always 1 per game
    } else {
      // Use currentStats fallback
      const statField = statMapping[statCategory];
      if (!statField || !currentStats[statField]) return 0;
      currentValue = currentStats[statField];
      const gamesPlayed = currentStats.GP || 1;
      perGame = currentValue / gamesPlayed;
    }
    
    // Project based on remaining games until age 25
    return currentValue + (perGame * gamesRemaining);
  };

  const getAgeTrackerData = (currentStats: any): AgeTrackerData[] => {
    if (!currentStats && !playerData) return [];

    const categories = [
      'Career Points',
      'Career Assists', 
      'Career Rebounds',
      'Career Steals',
      'Career Blocks',
      'Career 3-Pointers Made',
      'Career Field Goals Made',
      'Career Free Throws Made',
      'Career Minutes',
      'Career Games Played'
    ];

    return categories.map(category => {
      const topRecord = getTopRecordForCategory(category);
      
      // Use player career data if available, otherwise fallback to currentStats
      let currentValue = 0;
      if (playerData) {
        currentValue = category === 'Career Points' ? playerData.career_points :
                      category === 'Career Assists' ? playerData.career_assists :
                      category === 'Career Rebounds' ? playerData.career_rebounds :
                      category === 'Career Steals' ? playerData.career_steals :
                      category === 'Career Blocks' ? playerData.career_blocks :
                      category === 'Career 3-Pointers Made' ? playerData.career_3pt_made :
                      category === 'Career Field Goals Made' ? playerData.career_fg_made :
                      category === 'Career Free Throws Made' ? playerData.career_ft_made :
                      category === 'Career Minutes' ? playerData.career_minutes :
                      category === 'Career Games Played' ? playerData.career_games_played : 0;
      } else if (currentStats) {
        currentValue = currentStats[category === 'Career Points' ? 'PTS' : 
                                   category === 'Career Assists' ? 'AST' :
                                   category === 'Career Rebounds' ? 'REB' :
                                   category === 'Career Steals' ? 'STL' :
                                   category === 'Career Blocks' ? 'BLK' :
                                   category === 'Career 3-Pointers Made' ? 'FG3M' :
                                   category === 'Career Field Goals Made' ? 'FGM' :
                                   category === 'Career Free Throws Made' ? 'FTM' :
                                   category === 'Career Minutes' ? 'MIN' :
                                   category === 'Career Games Played' ? 'GP' : 'PTS'] || 0;
      }
      
      const projectedValue = calculateProjection(currentStats || playerData, category);
      const isOnTrack = topRecord ? projectedValue >= topRecord.stat_value : false;
      
      // Calculate Anthony Edwards' actual rank for this category
      const anthonyEdwardsRecord = achievements.find(a => 
        a.stat_category === category && a.player_name === playerName
      );
      const actualRank = anthonyEdwardsRecord?.rank_position || 0;
      
      return {
        statCategory: category,
        currentValue,
        projectedValue,
        rankPosition: actualRank,
        topRecord: topRecord!,
        isOnTrack,
        gamesRemaining,
        currentAge,
        birthday: playerBirthday
      };
    }).filter(data => data.topRecord); // Only include categories with records
  };

  return {
    achievements,
    loading: loading || playerDataLoading,
    error: error || playerDataError,
    getAgeTrackerData,
    currentAge,
    gamesRemaining,
    playerBirthday,
    playerData
  };
}

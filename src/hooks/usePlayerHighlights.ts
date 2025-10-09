import { useMemo } from 'react';
import { PlayerWithStats, RecentStats } from './useSupabase';

export type HighlightType = 'league' | 'last5' | 'last10' | 'record' | 'age-based';

export interface PlayerHighlight {
  id: string;
  type: HighlightType;
  title: string;
  description: string;
  stat: string;
  value: string | number;
  rank?: number;
  gradient: string;
  icon: string;
  badge?: string;
  context?: string;
  top10Players?: Array<{
    name: string;
    value: string | number;
    rank: number;
  }>;
}

interface UsePlayerHighlightsProps {
  player: PlayerWithStats | null;
  last5Stats: Record<string, RecentStats>;
  last10Stats: Record<string, RecentStats>;
  leaderboardData: any[];
  recordData: any[];
  ageBasedData?: any[];
  allPlayers?: PlayerWithStats[];
  last5Rankings?: any[];
  last10Rankings?: any[];
}

export function usePlayerHighlights({
  player,
  last5Stats,
  last10Stats,
  leaderboardData,
  recordData,
  ageBasedData = [],
  allPlayers = [],
  last5Rankings = [],
  last10Rankings = []
}: UsePlayerHighlightsProps) {
  
  // Helper function to get top 10 players for a stat category
  const getTop10ForStat = (statCategory: string, playerRank: number) => {
    const statEntries = leaderboardData.filter(entry => entry["Stat Category"] === statCategory);
    return statEntries
      .sort((a, b) => {
        const rankA = typeof a.Ranking === 'number' ? a.Ranking : parseInt(a.Ranking.replace(/[^0-9]/g, ''));
        const rankB = typeof b.Ranking === 'number' ? b.Ranking : parseInt(b.Ranking.replace(/[^0-9]/g, ''));
        return rankA - rankB;
      })
      .slice(0, 10)
      .map(entry => ({
        name: entry.Player,
        value: formatValue(statCategory, entry.Value),
        rank: typeof entry.Ranking === 'number' ? entry.Ranking : parseInt(entry.Ranking.replace(/[^0-9]/g, ''))
      }));
  };

  // Helper function to get top 10 players for last 5 games
  const getTop10ForLast5Games = (statKey: string, playerRank: number) => {
    // Map stat keys to database columns
    const statColumnMap: Record<string, string> = {
      'PTS': 'PTS',
      'REB': 'REB', 
      'AST': 'AST',
      'STL': 'STL',
      'BLK': 'BLK',
      'PLUS_MINUS': 'PLUS_MINUS'
    };
    
    const statColumn = statColumnMap[statKey];
    if (!statColumn || last5Rankings.length === 0) return [];
    
    // Sort by the stat value and get top 10
    const sortedPlayers = last5Rankings
      .sort((a, b) => (b[statColumn] || 0) - (a[statColumn] || 0))
      .slice(0, 10)
      .map((player, index) => ({
        name: player.PLAYER_NAME,
        value: player[statColumn]?.toFixed(1) || '0.0',
        rank: index + 1
      }));
    
    return sortedPlayers;
  };

  // Helper function to get top 10 players for last 10 games  
  const getTop10ForLast10Games = (statKey: string, playerRank: number) => {
    // Map stat keys to database columns
    const statColumnMap: Record<string, string> = {
      'PTS': 'PTS',
      'REB': 'REB', 
      'AST': 'AST',
      'STL': 'STL',
      'BLK': 'BLK',
      'PLUS_MINUS': 'PLUS_MINUS'
    };
    
    const statColumn = statColumnMap[statKey];
    if (!statColumn || last10Rankings.length === 0) return [];
    
    // Sort by the stat value and get top 10
    const sortedPlayers = last10Rankings
      .sort((a, b) => (b[statColumn] || 0) - (a[statColumn] || 0))
      .slice(0, 10)
      .map((player, index) => ({
        name: player.PLAYER_NAME,
        value: player[statColumn]?.toFixed(1) || '0.0',
        rank: index + 1
      }));
    
    return sortedPlayers;
  };

  const highlights = useMemo(() => {
    if (!player) return [];
    
    const highlights: PlayerHighlight[] = [];
    
    // 1. League-wide top 5 rankings (from leaderboard)
    const playerLeaderboard = leaderboardData.filter(
      entry => entry.Player === player.PLAYER_NAME
    );
    
    playerLeaderboard.forEach(entry => {
      const ranking = typeof entry.Ranking === 'number' 
        ? entry.Ranking 
        : parseInt(entry.Ranking.replace(/[^0-9]/g, ''));
      
      if (ranking <= 5) {
        highlights.push({
          id: `league-${entry["Stat Category"]}`,
          type: 'league',
          title: `${player.PLAYER_NAME} is #${ranking} in the League this season`,
          description: `In ${entry["Stat Category"]}`,
          stat: entry["Stat Category"],
          value: formatValue(entry["Stat Category"], entry.Value),
          rank: ranking,
          gradient: getRankGradient(ranking),
          icon: getStatIcon(entry["Stat Category"]),
          badge: getRankBadge(ranking),
          context: `Ranked #${ranking} out of all NBA players this season`,
          top10Players: getTop10ForStat(entry["Stat Category"], ranking)
        });
      }
    });
    
    // 2. Last 5 games top 5 rankings
    const last5Data = last5Stats[player.PLAYER_ID];
    if (last5Data) {
      const statKeys = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'PLUS_MINUS'] as const;
      statKeys.forEach(statKey => {
        const rankKey = `${statKey}_RANK` as keyof RecentStats;
        const rank = last5Data[rankKey] as number | undefined;
        const value = last5Data[statKey];
        
        if (rank && rank <= 5 && value !== undefined) {
          highlights.push({
            id: `last5-${statKey}`,
            type: 'last5',
            title: `${player.PLAYER_NAME} is #${rank} in the League over the last 5 games`,
            description: `In ${getStatDisplayName(statKey)}`,
            stat: statKey,
            value: value.toFixed(1),
            rank: rank,
            gradient: 'from-purple-500 to-pink-500',
            icon: getStatIcon(statKey),
            badge: '🔥',
            context: `Hot streak: #${rank} in the NBA over last 5 games`,
            top10Players: getTop10ForLast5Games(statKey, rank)
          });
        }
      });
    }
    
    // 3. Last 10 games top 5 rankings
    const last10Data = last10Stats[player.PLAYER_ID];
    if (last10Data) {
      const statKeys = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'PLUS_MINUS'] as const;
      statKeys.forEach(statKey => {
        const rankKey = `${statKey}_RANK` as keyof RecentStats;
        const rank = last10Data[rankKey] as number | undefined;
        const value = last10Data[statKey];
        
        if (rank && rank <= 5 && value !== undefined) {
          // Only add if not already in last 5 highlights or if rank is better
          const existingLast5 = highlights.find(h => h.id === `last5-${statKey}`);
          if (!existingLast5 || (existingLast5.rank && rank < existingLast5.rank)) {
            highlights.push({
              id: `last10-${statKey}`,
              type: 'last10',
              title: `${player.PLAYER_NAME} is #${rank} in the League over the last 10 games`,
              description: `In ${getStatDisplayName(statKey)}`,
              stat: statKey,
              value: value.toFixed(1),
              rank: rank,
              gradient: 'from-blue-500 to-cyan-500',
              icon: getStatIcon(statKey),
              badge: '📈',
              context: `Recent form: #${rank} in the NBA over last 10 games`,
              top10Players: getTop10ForLast10Games(statKey, rank)
            });
          }
        }
      });
    }
    
    // 4. Records on pace to break
    const playerRecords = recordData.filter(
      record => record.player_name === player.PLAYER_NAME
    );
    
    playerRecords.forEach(record => {
      // Check if they're on pace to break personal record
      if (record.projection > record.personal_record) {
        highlights.push({
          id: `record-personal-${record.stat}`,
          type: 'record',
          title: `${player.PLAYER_NAME} is on pace to break his personal record`,
          description: `This season in ${getStatDisplayName(record.stat)}`,
          stat: record.stat,
          value: `${record.projection.toFixed(0)} (projected)`,
          gradient: 'from-yellow-400 to-orange-500',
          icon: '🎯',
          badge: 'PR',
          context: `Previous best: ${record.personal_record.toFixed(0)} | Current pace: ${record.projection.toFixed(0)}`
        });
      }
      
      // Check if close to franchise record (within 90%)
      if (record.projection / record.franchise_record >= 0.9) {
        highlights.push({
          id: `record-franchise-${record.stat}`,
          type: 'record',
          title: `${player.PLAYER_NAME} is chasing the franchise record`,
          description: `This season in ${getStatDisplayName(record.stat)}`,
          stat: record.stat,
          value: `${record.projection.toFixed(0)} / ${record.franchise_record.toFixed(0)}`,
          gradient: 'from-green-400 to-emerald-600',
          icon: '🏆',
          badge: 'FR',
          context: `Franchise record holder: ${record.franchise_player} | ${((record.projection / record.franchise_record) * 100).toFixed(0)}% of record`
        });
      }
    });
    
    // 5. Age-based achievements (projected top 10)
    if (player.PLAYER_NAME === 'Anthony Edwards' && ageBasedData.length > 0) {
      ageBasedData.forEach((achievement: any) => {
        if (achievement.projected_rank && achievement.projected_rank <= 10) {
          highlights.push({
            id: `age-${achievement.stat_category}`,
            type: 'age-based',
            title: `${player.PLAYER_NAME} is projected #${achievement.projected_rank} under 25`,
            description: `Career ${achievement.stat_category.replace('Career ', '')}`,
            stat: achievement.stat_category,
            value: achievement.projected_value.toLocaleString(),
            rank: achievement.projected_rank,
            gradient: 'from-indigo-500 to-purple-600',
            icon: '⭐',
            badge: 'U25',
            context: `Current rank: #${achievement.current_rank || 'N/A'} | Projected to be #${achievement.projected_rank} by age 25`
          });
        }
      });
    }
    
    // Sort by rank/importance
    return highlights.sort((a, b) => {
      // Prioritize league rankings, then hot streaks, then records
      const typeOrder: Record<HighlightType, number> = {
        'league': 1,
        'last5': 2,
        'last10': 3,
        'record': 4,
        'age-based': 5
      };
      
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      
      // Within same type, sort by rank
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      }
      
      return 0;
    });
  }, [player, last5Stats, last10Stats, leaderboardData, recordData, ageBasedData]);
  
  return { highlights };
}

// Helper functions
function formatValue(category: string, value: number): string | number {
  const lowerCategory = category.toLowerCase();
  if (
    lowerCategory.includes('percentage') ||
    lowerCategory.includes('%') ||
    lowerCategory.includes('pct')
  ) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (lowerCategory.includes('per game')) {
    return value.toFixed(1);
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function getStatDisplayName(stat: string): string {
  const statMap: Record<string, string> = {
    'PTS': 'Points',
    'AST': 'Assists',
    'REB': 'Rebounds',
    'STL': 'Steals',
    'BLK': 'Blocks',
    'PLUS_MINUS': 'Plus/Minus',
    'pts': 'Points',
    'ast': 'Assists',
    'reb': 'Rebounds',
    'stl': 'Steals',
    'blk': 'Blocks',
  };
  return statMap[stat] || stat;
}

function getStatIcon(stat: string): string {
  const lowerStat = stat.toLowerCase();
  if (lowerStat.includes('point')) return '🏀';
  if (lowerStat.includes('assist')) return '🎯';
  if (lowerStat.includes('rebound')) return '💪';
  if (lowerStat.includes('steal')) return '🤚';
  if (lowerStat.includes('block')) return '🚫';
  if (lowerStat.includes('plus') || lowerStat.includes('+/-')) return '➕';
  if (lowerStat.includes('3')) return '🎯';
  if (lowerStat.includes('fg') || lowerStat.includes('field goal')) return '🔥';
  return '⭐';
}

function getRankGradient(rank: number): string {
  if (rank === 1) return 'from-yellow-400 via-yellow-500 to-amber-600';
  if (rank === 2) return 'from-gray-300 via-gray-400 to-gray-500';
  if (rank === 3) return 'from-orange-400 via-orange-500 to-orange-600';
  return 'from-emerald-400 via-emerald-500 to-green-600';
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '⭐';
}


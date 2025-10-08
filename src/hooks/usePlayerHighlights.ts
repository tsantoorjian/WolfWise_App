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
}

interface UsePlayerHighlightsProps {
  player: PlayerWithStats | null;
  last5Stats: Record<string, RecentStats>;
  last10Stats: Record<string, RecentStats>;
  leaderboardData: any[];
  recordData: any[];
  ageBasedData?: any[];
}

export function usePlayerHighlights({
  player,
  last5Stats,
  last10Stats,
  leaderboardData,
  recordData,
  ageBasedData = []
}: UsePlayerHighlightsProps) {
  
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
          title: `#${ranking} in the League`,
          description: entry["Stat Category"],
          stat: entry["Stat Category"],
          value: formatValue(entry["Stat Category"], entry.Value),
          rank: ranking,
          gradient: getRankGradient(ranking),
          icon: getStatIcon(entry["Stat Category"]),
          badge: getRankBadge(ranking)
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
            title: `#${rank} Last 5 Games`,
            description: getStatDisplayName(statKey),
            stat: statKey,
            value: value.toFixed(1),
            rank: rank,
            gradient: 'from-purple-500 to-pink-500',
            icon: getStatIcon(statKey),
            badge: '🔥',
            context: 'Hot Streak'
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
              title: `#${rank} Last 10 Games`,
              description: getStatDisplayName(statKey),
              stat: statKey,
              value: value.toFixed(1),
              rank: rank,
              gradient: 'from-blue-500 to-cyan-500',
              icon: getStatIcon(statKey),
              badge: '📈',
              context: 'Recent Form'
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
          title: 'Breaking Personal Record',
          description: `${getStatDisplayName(record.stat)} - On Pace`,
          stat: record.stat,
          value: `${record.projection.toFixed(0)} (proj)`,
          gradient: 'from-yellow-400 to-orange-500',
          icon: '🎯',
          badge: 'PR',
          context: `Previous: ${record.personal_record.toFixed(0)}`
        });
      }
      
      // Check if close to franchise record (within 90%)
      if (record.projection / record.franchise_record >= 0.9) {
        highlights.push({
          id: `record-franchise-${record.stat}`,
          type: 'record',
          title: 'Chasing Franchise Record',
          description: `${getStatDisplayName(record.stat)} - ${((record.projection / record.franchise_record) * 100).toFixed(0)}% of record`,
          stat: record.stat,
          value: `${record.projection.toFixed(0)} / ${record.franchise_record.toFixed(0)}`,
          gradient: 'from-green-400 to-emerald-600',
          icon: '🏆',
          badge: 'FR',
          context: `Record holder: ${record.franchise_player}`
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
            title: `Projected #${achievement.projected_rank} Under 25`,
            description: achievement.stat_category.replace('Career ', ''),
            stat: achievement.stat_category,
            value: achievement.projected_value.toLocaleString(),
            rank: achievement.projected_rank,
            gradient: 'from-indigo-500 to-purple-600',
            icon: '⭐',
            badge: 'U25',
            context: `Current: #${achievement.current_rank || 'N/A'}`
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


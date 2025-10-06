import { useState } from 'react';
import { Trophy, Target, TrendingUp, ChevronDown, Award } from 'lucide-react';
import { useAgeBasedAchievements } from '../hooks/useAgeBasedAchievements';
import { useSupabase } from '../hooks/useSupabase';

type AgeTrackerProps = {
  selectedPlayer: string;
};

export function AgeTracker({ selectedPlayer }: AgeTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Career Points');
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const { achievements, loading, getAgeTrackerData, currentAge, gamesRemaining, playerBirthday, playerData } = useAgeBasedAchievements(selectedPlayer);
  const { players } = useSupabase();

  console.log('AgeTracker rendered for:', selectedPlayer);
  console.log('Loading:', loading);
  console.log('Achievements:', achievements);
  console.log('Player Data:', playerData);

  // Get current player stats (fallback if playerData is not available)
  const currentPlayer = players.find(p => p.PLAYER_NAME === selectedPlayer);

  if (loading) {
    return <div className="text-gray-400">Loading age-based achievements...</div>;
  }

  if (!playerData && !currentPlayer) {
    return <div className="text-gray-400">Player data not found</div>;
  }

  const ageTrackerData = getAgeTrackerData(playerData);
  const selectedData = ageTrackerData.find(d => d.statCategory === selectedCategory);


  if (!selectedData) {
    return <div className="text-gray-400">No data available for selected category</div>;
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Career Points': 'Points',
      'Career Assists': 'Assists',
      'Career Rebounds': 'Rebounds',
      'Career Steals': 'Steals',
      'Career Blocks': 'Blocks',
      'Career 3-Pointers Made': '3-Pointers',
      'Career Field Goals Made': 'Field Goals',
      'Career Free Throws Made': 'Free Throws',
      'Career Minutes': 'Minutes',
      'Career Games Played': 'Games'
    };
    return categoryMap[category] || category;
  };

  // Get top 25 players for this category (including current player if in top 25)
  const getTop10ForCategory = (category: string) => {
    return achievements
      .filter(a => a.stat_category === category)
      .sort((a, b) => b.stat_value - a.stat_value)
      .slice(0, 10);
  };

  const top10Players = getTop10ForCategory(selectedCategory);
  
  // Get all players for ranking calculation (still use top 25 for accurate ranking)
  const allPlayersForRanking = achievements
    .filter(a => a.stat_category === selectedCategory)
    .sort((a, b) => b.stat_value - a.stat_value)
    .slice(0, 25);
  
  // Get Anthony Edwards' actual rank for the selected category
  const anthonyEdwardsRecord = achievements.find(a => 
    a.stat_category === selectedCategory && a.player_name === selectedPlayer
  );
  const currentPlayerRank = anthonyEdwardsRecord?.rank_position || 0;
  
  
  const projectedRankIndex = allPlayersForRanking.findIndex(p => selectedData.projectedValue >= p.stat_value);
  const projectedRank = projectedRankIndex === -1 ? 26 : projectedRankIndex + 1;
  

  return (
    <div className="bg-[#0A0E1A] rounded-lg border border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-[#78BE20] rounded-full flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Under 25 Rankings</h2>
          <p className="text-gray-400">Where Anthony Edwards ranks now and projects to be (24 and under)</p>
        </div>
      </div>

      {/* Category Selector */}
      <div className="mb-8">
        <div className="bg-[#141923] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-[#78BE20]" />
              <span className="text-white font-medium">Currently Viewing:</span>
              <span className="text-[#78BE20] font-bold text-xl">{getCategoryDisplayName(selectedCategory)}</span>
            </div>

            <div className="relative ml-auto">
              <button
                onClick={() => setShowCategorySelect(!showCategorySelect)}
                className="px-4 py-2 bg-[#78BE20] text-white rounded-lg flex items-center gap-2 hover:bg-[#8CD43A] transition-colors font-medium"
              >
                <span>Change Stat</span>
                <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${showCategorySelect ? 'rotate-180' : ''}`} />
              </button>

              {showCategorySelect && (
                <div className="absolute z-10 mt-2 w-48 bg-[#141923] rounded-lg shadow-lg border border-gray-700/50 py-1">
                  {ageTrackerData.map(data => (
                    <button
                      key={data.statCategory}
                      onClick={() => {
                        setSelectedCategory(data.statCategory);
                        setShowCategorySelect(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-[#1e2129] ${
                        selectedCategory === data.statCategory ? 'text-white bg-[#78BE20]/20 font-medium' : 'text-white'
                      }`}
                    >
                      {getCategoryDisplayName(data.statCategory)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Rankings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#78BE20]" />
          Top 10 Under 25
        </h3>
        <div className="bg-[#141923] rounded-lg border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1e2129]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Value</th>
                </tr>
              </thead>
              <tbody>
                {top10Players.map((player, index) => (
                  <tr
                    key={player.player_name}
                    className={`border-t border-gray-700/50 ${
                      player.player_name === selectedPlayer ? 'bg-[#78BE20]/10' : 'hover:bg-[#1e2129]/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          index < 3 ? 'text-[#78BE20]' : 'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        {player.player_name === selectedPlayer && (
                          <Award className="w-4 h-4 text-[#78BE20]" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        player.player_name === selectedPlayer ? 'text-[#78BE20]' : 'text-white'
                      }`}>
                        {player.player_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${
                        player.player_name === selectedPlayer ? 'text-[#78BE20]' : 'text-white'
                      }`}>
                        {player.stat_value.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Projection Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Standing */}
        <div className="bg-[#141923] rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-[#78BE20]" />
            <h3 className="text-lg font-semibold text-white">Current Standing</h3>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${currentPlayerRank > 0 && currentPlayerRank <= 3 ? 'text-[#78BE20]' : 'text-white'}`}>
              {currentPlayerRank > 0 ? `#${currentPlayerRank}` : '-'}
            </div>
            <p className="text-gray-400">Current Rank</p>
            <div className="mt-4 p-3 bg-[#1e2129] rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${currentPlayerRank > 0 && currentPlayerRank <= 3 ? 'text-[#78BE20]' : 'text-white'}`}>
                {selectedData.currentValue.toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">Current Total</p>
            </div>
          </div>
        </div>

        {/* Projected Standing */}
        <div className="bg-[#141923] rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#78BE20]" />
            <h3 className="text-lg font-semibold text-white">Projected Standing</h3>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${projectedRank <= 3 ? 'text-[#78BE20]' : 'text-white'}`}>
              {projectedRank <= 25 ? `#${projectedRank}` : '-'}
            </div>
            <p className="text-gray-400">Projected Rank (Under 25)</p>
            <div className="mt-4 p-3 bg-[#1e2129] rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${projectedRank <= 3 ? 'text-[#78BE20]' : 'text-white'}`}>
                {Math.round(selectedData.projectedValue).toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">Projected Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Player Info Summary */}
      {playerData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141923] rounded-lg p-4 text-center border border-gray-700/50">
            <div className="text-2xl font-bold text-white mb-1">
              {playerData.current_age}
            </div>
            <div className="text-sm text-gray-400">Current Age</div>
          </div>
          <div className="bg-[#141923] rounded-lg p-4 text-center border border-gray-700/50">
            <div className="text-2xl font-bold text-white mb-1">
              {playerData.games_remaining_until_25}
            </div>
            <div className="text-sm text-gray-400">Games Until Age 25</div>
          </div>
          <div className="bg-[#141923] rounded-lg p-4 text-center border border-gray-700/50">
            <div className={`text-2xl font-bold mb-1 ${currentPlayerRank > 0 && currentPlayerRank <= 3 ? 'text-[#78BE20]' : 'text-white'}`}>
              {(() => {
                const perGameStat = selectedCategory === 'Career Points' ? playerData.points_per_game :
                                  selectedCategory === 'Career Assists' ? playerData.assists_per_game :
                                  selectedCategory === 'Career Rebounds' ? playerData.rebounds_per_game :
                                  selectedCategory === 'Career Steals' ? playerData.steals_per_game :
                                  selectedCategory === 'Career Blocks' ? playerData.blocks_per_game :
                                  selectedCategory === 'Career 3-Pointers Made' ? playerData.fg3m_per_game :
                                  selectedCategory === 'Career Field Goals Made' ? playerData.fgm_per_game :
                                  selectedCategory === 'Career Free Throws Made' ? playerData.ftm_per_game :
                                  selectedCategory === 'Career Minutes' ? playerData.minutes_per_game :
                                  selectedCategory === 'Career Games Played' ? 1 : 0;
                return perGameStat.toFixed(1);
              })()}
            </div>
            <div className="text-sm text-gray-400">{getCategoryDisplayName(selectedCategory)}/G This Season</div>
          </div>
          <div className="bg-[#141923] rounded-lg p-4 text-center border border-gray-700/50">
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round((parseFloat(selectedData.topRecord.stat_value) - selectedData.currentValue) / playerData.games_remaining_until_25)}
            </div>
            <div className="text-sm text-gray-400">{getCategoryDisplayName(selectedCategory)} Needed Per Game to Reach #1</div>
          </div>
        </div>
      )}
    </div>
  );
}

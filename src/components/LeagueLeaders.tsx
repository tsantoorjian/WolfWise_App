import { useState } from 'react';
import { Trophy, Medal, UserRound, TrendingUp, Info, Crown, ChevronDown, ChevronUp } from 'lucide-react';

type LeaderboardEntry = {
  "Stat Category": string;
  Player: string;
  Value: number;
  Ranking: number;
  image_url?: string;
};

type LeagueLeadersProps = {
  leaderboardData: LeaderboardEntry[];
};

type PlayerStats = {
  player: string;
  image_url?: string;
  stats: LeaderboardEntry[];
};

export function LeagueLeaders({ leaderboardData = [] }: LeagueLeadersProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<{ [key: string]: boolean }>({});

  const togglePlayerStats = (player: string) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [player]: !prev[player]
    }));
  };

  const getRankingNumber = (rankText: string | number): number => {
    if (typeof rankText === 'number') return rankText;
    return parseInt(rankText.replace(/[^0-9]/g, ''));
  };

  const playerStats = leaderboardData
    .filter(entry => !entry["Stat Category"].toLowerCase().includes('games'))
    .reduce((acc: { [key: string]: PlayerStats }, entry) => {
      if (!acc[entry.Player]) {
        acc[entry.Player] = {
          player: entry.Player,
          image_url: entry.image_url,
          stats: []
        };
      }
      acc[entry.Player].stats.push(entry);
      acc[entry.Player].stats.sort((a, b) => getRankingNumber(a.Ranking) - getRankingNumber(b.Ranking));
      return acc;
    }, {});

  const formatValue = (category: string, value: number) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('steal')) {
      return `${value.toFixed(1)}%`;
    }
    if (lowerCategory.includes('percentage') || 
        lowerCategory.includes('%') ||
        lowerCategory.includes('pct')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) {
      return (
        <div className="relative">
          <Trophy className="w-6 h-6 text-[#FFD700] drop-shadow-lg animate-pulse" />
          <div className="absolute inset-0 bg-[#FFD700] opacity-20 blur-sm rounded-full animate-ping"></div>
        </div>
      );
    }
    if (ranking === 2) {
      return <Medal className="w-6 h-6 text-[#C0C0C0] drop-shadow-lg" />;
    }
    if (ranking === 3) {
      return <Medal className="w-6 h-6 text-[#CD7F32] drop-shadow-lg" />;
    }
    if (ranking <= 10) {
      return (
        <div className="w-6 h-6 bg-[#10b981] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
          {ranking}
        </div>
      );
    }
    return (
      <div className="w-6 h-6 bg-[#141923] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
        {ranking}
      </div>
    );
  };

  const isNegativeStat = (category: string): boolean => {
    const lowerCategory = category.toLowerCase();
    return lowerCategory.includes('turnover') ||
           lowerCategory.includes('turnovers') ||
           lowerCategory.includes('foul') ||
           lowerCategory.includes('violation') ||
           lowerCategory.includes('technical');
  };

  const getRowBackgroundColor = (rankText: string | number, category: string) => {
    const ranking = getRankingNumber(rankText);
    const isNegative = isNegativeStat(category);
    
    if (ranking === 1) {
      return isNegative 
        ? 'bg-gradient-to-r from-red-500/20 to-transparent' 
        : 'bg-gradient-to-r from-[#FFD700]/20 to-transparent';
    }
    if (ranking <= 3) {
      return isNegative 
        ? 'bg-gradient-to-r from-red-400/20 to-transparent'
        : 'bg-gradient-to-r from-[#10b981]/20 to-transparent';
    }
    if (ranking <= 5) {
      return isNegative 
        ? 'bg-gradient-to-r from-red-300/10 to-transparent'
        : 'bg-gradient-to-r from-[#10b981]/10 to-transparent';
    }
    if (ranking <= 10) {
      return isNegative 
        ? 'bg-gradient-to-r from-red-200/5 to-transparent'
        : 'bg-gradient-to-r from-[#10b981]/5 to-transparent';
    }
    return 'hover:bg-[#1e2129]';
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-4 md:p-6">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
            <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#78BE20]" />
            <h2 className="text-xl md:text-2xl font-bold text-white">League Leaders</h2>
          </div>
          <p className="text-sm md:text-base text-gray-400">Timberwolves players ranked in the top 20 league-wide</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {Object.values(playerStats).map((playerStat) => (
            <div 
              key={playerStat.player}
              className="bg-[#141923] rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-700/50 flex flex-col"
            >
              <div className="p-4 md:p-6 space-y-4 flex-grow">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative group flex-shrink-0">
                    {playerStat.image_url ? (
                      <img
                        src={playerStat.image_url}
                        alt={playerStat.player}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-[#78BE20] bg-[#1e2129] group-hover:border-[#4ade80] transition-colors duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/64';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-[#78BE20] bg-[#1e2129] flex items-center justify-center group-hover:border-[#4ade80] transition-colors duration-300">
                        <UserRound className="w-7 h-7 md:w-8 md:h-8 text-[#78BE20]" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h3 className="text-lg md:text-xl font-bold text-white truncate group-hover:text-[#78BE20] transition-colors duration-300">
                      {playerStat.player}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400">
                      {playerStat.stats.length} League Rankings
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {playerStat.stats
                    .slice(0, expandedPlayers[playerStat.player] ? undefined : 3)
                    .map((stat, index) => (
                      <div 
                        key={`${stat["Stat Category"]}-${index}`}
                        className={`flex items-center justify-between p-2 rounded transition-all duration-300 ${getRowBackgroundColor(stat.Ranking, stat["Stat Category"])}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-shrink-0">
                            {getRankingBadge(stat.Ranking)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm md:text-base text-white font-medium block truncate">
                              {stat["Stat Category"]}
                            </span>
                            <div className="text-[10px] md:text-xs text-gray-400">
                              League Rank: #{stat.Ranking}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="text-sm md:text-base font-bold text-white">
                            {formatValue(stat["Stat Category"], stat.Value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  
                  {playerStat.stats.length > 3 && (
                    <button
                      onClick={() => togglePlayerStats(playerStat.player)}
                      className="w-full mt-2 py-1.5 md:py-2 px-3 md:px-4 text-xs md:text-sm font-medium text-[#78BE20] hover:text-[#4ade80] transition-colors duration-300 flex items-center justify-center gap-1 md:gap-2"
                    >
                      {expandedPlayers[playerStat.player] ? (
                        <>Show Less <ChevronUp className="w-3 h-3 md:w-4 md:h-4" /></>
                      ) : (
                        <>Show {playerStat.stats.length - 3} More <ChevronDown className="w-3 h-3 md:w-4 md:h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 md:px-6 py-2 md:py-3 border-t border-gray-700/50 bg-[#0f1119] rounded-b-lg mt-auto">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Best Rank:</span>
                  </div>
                  <span className="font-medium text-white">
                    #{Math.min(...playerStat.stats.map(s => getRankingNumber(s.Ranking)))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-[#141923]/60 rounded-lg p-2 md:p-3">
          <Info className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span>Rankings are based on players with minimum qualifying minutes</span>
        </div>
      </div>
    </div>
  );
}
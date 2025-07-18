import { useState } from 'react';
import { Trophy, Medal, UserRound, TrendingUp, Info, Crown, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

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
    if (
      lowerCategory.includes('percentage') ||
      lowerCategory.includes('%') ||
      lowerCategory.includes('pct')
    ) {
      // Percent stats: show as percentage, rounded to 1 decimal
      return `${(value * 100).toFixed(1)}%`;
    }
    if (lowerCategory.includes('per game')) {
      // Per game stats: rounded to 1 decimal
      return value.toFixed(1);
    }
    // Total stats: whole numbers, comma formatted
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const getRankingBadgeIcon = (ranking: number) => {
    if (ranking === 1) {
      return <Trophy className="w-4 h-4 text-[#FFD700] drop-shadow-lg z-20" />;
    }
    if (ranking === 2) {
      return <Medal className="w-4 h-4 text-[#C0C0C0] drop-shadow-lg z-20" />;
    }
    if (ranking === 3) {
      return <Medal className="w-4 h-4 text-[#CD7F32] drop-shadow-lg z-20" />;
    }
    return null;
  };

  const getRankingNumberBadge = (ranking: number) => {
    let bg = '#10b981';
    if (ranking === 1) bg = '#FFD700';
    else if (ranking === 2) bg = '#C0C0C0';
    else if (ranking === 3) bg = '#CD7F32';
    else if (ranking >= 4) bg = '#141923'; // 4 and above use dark background
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold`} style={{ background: bg, color: ranking >= 4 ? 'white' : 'black' }}>
        {ranking}
      </div>
    );
  };

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) {
      return (
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700]/60 to-[#fffbe6]/10 animate-pulse opacity-80 blur-sm z-0"></div>
          <Trophy className="w-8 h-8 text-[#FFD700] drop-shadow-lg z-10" />
          <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-[#FFD700] drop-shadow-md z-20 animate-bounce" />
        </div>
      );
    }
    if (ranking === 2) {
      return (
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C0C0C0]/50 to-[#f8fafc]/10 animate-pulse opacity-70 blur-sm z-0"></div>
          <Medal className="w-8 h-8 text-[#C0C0C0] drop-shadow-lg z-10" />
          <div className="absolute inset-0 rounded-full border-2 border-[#C0C0C0] z-20"></div>
        </div>
      );
    }
    if (ranking === 3) {
      return (
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#CD7F32]/50 to-[#f8fafc]/10 animate-pulse opacity-60 blur-sm z-0"></div>
          <Medal className="w-8 h-8 text-[#CD7F32] drop-shadow-lg z-10" />
          <div className="absolute inset-0 rounded-full border-2 border-[#CD7F32] z-20"></div>
        </div>
      );
    }
    if (ranking <= 10) {
      return (
        <div className="w-8 h-8 bg-[#10b981] text-white rounded-full flex items-center justify-center text-[13px] font-bold">
          {ranking}
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-[#141923] text-white rounded-full flex items-center justify-center text-[13px] font-bold">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
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
                    .map((stat, index) => {
                      const ranking = getRankingNumber(stat.Ranking);
                      return (
                        <div 
                          key={`${stat["Stat Category"]}-${index}`}
                          className={`relative flex items-center justify-between p-2 rounded transition-all duration-300 ${getRowBackgroundColor(stat.Ranking, stat["Stat Category"])}`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="flex-shrink-0">
                              {getRankingNumberBadge(ranking)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm md:text-base text-white font-medium block truncate">
                                {stat["Stat Category"]}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2 relative pr-6"> {/* Add pr-6 for badge space */}
                            <span className="text-sm md:text-base font-bold text-white">
                              {formatValue(stat["Stat Category"], stat.Value)}
                            </span>
                            {ranking <= 3 && (
                              <span className="absolute right-0 top-1/2 -translate-y-1/2">{getRankingBadgeIcon(ranking)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  
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
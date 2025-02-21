import { Trophy, Medal, UserRound, TrendingUp, Info, Crown } from 'lucide-react';

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
  const getRankingNumber = (rankText: string | number): number => {
    if (typeof rankText === 'number') return rankText;
    return parseInt(rankText.replace(/[^0-9]/g, ''));
  };

  const playerStats = leaderboardData.reduce((acc: { [key: string]: PlayerStats }, entry) => {
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
    if (category.toLowerCase().includes('percentage') || category.toLowerCase().includes('%')) {
      return `${value.toFixed(1)}%`;
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
        <div className="w-6 h-6 bg-[#236192] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
          {ranking}
        </div>
      );
    }
    return (
      <div className="w-6 h-6 bg-[#0C2340] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
        {ranking}
      </div>
    );
  };

  const getRowBackgroundColor = (rankText: string | number) => {
    const ranking = getRankingNumber(rankText);
    if (ranking === 1) return 'bg-gradient-to-r from-[#FFD700]/20 to-transparent';
    if (ranking <= 3) return 'bg-gradient-to-r from-[#78BE20]/20 to-transparent';
    if (ranking <= 5) return 'bg-gradient-to-r from-[#78BE20]/10 to-transparent';
    if (ranking <= 10) return 'bg-gradient-to-r from-[#78BE20]/5 to-transparent';
    return 'hover:bg-gray-50';
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-[#78BE20]" />
            <h2 className="text-2xl font-bold text-[#0C2340]">League Leaders</h2>
          </div>
          <p className="text-[#9EA2A2]">Timberwolves players ranked in the top 20 league-wide</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(playerStats).map((playerStat) => (
            <div 
              key={playerStat.player}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {playerStat.image_url ? (
                      <img
                        src={playerStat.image_url}
                        alt={playerStat.player}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#236192] bg-white group-hover:border-[#78BE20] transition-colors duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/64';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-[#236192] bg-white flex items-center justify-center group-hover:border-[#78BE20] transition-colors duration-300">
                        <UserRound className="w-8 h-8 text-[#236192]" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0C2340] group-hover:text-[#78BE20] transition-colors duration-300">
                      {playerStat.player}
                    </h3>
                    <p className="text-sm text-[#9EA2A2]">
                      {playerStat.stats.length} League Rankings
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {playerStat.stats.map((stat, index) => (
                    <div 
                      key={`${stat["Stat Category"]}-${index}`}
                      className={`flex items-center justify-between p-2 rounded transition-all duration-300 ${getRowBackgroundColor(stat.Ranking)}`}
                    >
                      <div className="flex items-center gap-2">
                        {getRankingBadge(stat.Ranking)}
                        <div>
                          <span className="text-[#0C2340] font-medium">{stat["Stat Category"]}</span>
                          <div className="text-xs text-[#9EA2A2]">
                            League Rank: #{stat.Ranking}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#0C2340]">
                          {formatValue(stat["Stat Category"], stat.Value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-[#9EA2A2]">
                    <TrendingUp className="w-4 h-4" />
                    <span>Best Rank:</span>
                  </div>
                  <span className="font-medium text-[#0C2340]">
                    #{Math.min(...playerStat.stats.map(s => getRankingNumber(s.Ranking)))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-[#9EA2A2] bg-gray-50 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>Rankings are based on players with minimum qualifying minutes</span>
        </div>
      </div>
    </div>
  );
}
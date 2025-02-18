import { Trophy, Medal, UserRound } from 'lucide-react';

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

// Group stats by player
type PlayerStats = {
  player: string;
  image_url?: string;
  stats: LeaderboardEntry[];
};

export function LeagueLeaders({ leaderboardData = [] }: LeagueLeadersProps) {
  // Helper function to convert ranking text to number
  const getRankingNumber = (rankText: string | number): number => {
    if (typeof rankText === 'number') return rankText;
    return parseInt(rankText.replace(/[^0-9]/g, ''));
  };

  // Group stats by player
  const playerStats = leaderboardData.reduce((acc: { [key: string]: PlayerStats }, entry) => {
    if (!acc[entry.Player]) {
      acc[entry.Player] = {
        player: entry.Player,
        image_url: entry.image_url,
        stats: []
      };
    }
    acc[entry.Player].stats.push(entry);
    
    // Sort stats using the numeric ranking value
    acc[entry.Player].stats.sort((a, b) => 
      getRankingNumber(a.Ranking) - getRankingNumber(b.Ranking)
    );
    
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
      return <Trophy className="w-6 h-6 text-[#FFD700] drop-shadow-lg" />;
    }
    if (ranking === 2) {
      return <Medal className="w-6 h-6 text-[#C0C0C0] drop-shadow-lg" />;
    }
    if (ranking === 3) {
      return <Medal className="w-6 h-6 text-[#CD7F32] drop-shadow-lg" />;
    }
    if (ranking <= 10) {
      return (
        <div className="w-6 h-6 bg-[#236192] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
          {ranking}
        </div>
      );
    }
    return (
      <div className="w-6 h-6 bg-[#0C2340] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
        {ranking}
      </div>
    );
  };

  const getRowBackgroundColor = (rankText: string | number) => {
    const ranking = getRankingNumber(rankText);
    if (ranking === 1) return 'bg-green-200';
    if (ranking <= 3) return 'bg-green-100';
    if (ranking <= 5) return 'bg-green-50';
    if (ranking <= 10) return 'bg-green-50/80';
    if (ranking <= 15) return 'bg-green-50/60';
    if (ranking <= 20) return 'bg-green-50/40';
    return 'bg-gray-50'; // default background for ranks > 20
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0C2340]">Timberwolves League Leaders</h2>
        <p className="text-[#9EA2A2]">Highlighting Timberwolves players ranked in the top 20 league wide in key stats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(playerStats).map((playerStat) => (
          <div key={playerStat.player} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4 mb-4">
              {playerStat.image_url ? (
                <img
                  src={playerStat.image_url}
                  alt={playerStat.player}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#236192] bg-white"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/64';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-[#236192] bg-white flex items-center justify-center">
                  <UserRound className="w-8 h-8 text-[#236192]" />
                </div>
              )}
              <h3 className="text-xl font-bold text-[#0C2340]">{playerStat.player}</h3>
            </div>

            <div className="space-y-2">
              {playerStat.stats.map((stat, index) => (
                <div 
                  key={`${stat["Stat Category"]}-${index}`}
                  className={`flex items-center justify-between p-2 rounded transition-colors ${getRowBackgroundColor(stat.Ranking)}`}
                >
                  <div className="flex items-center gap-2">
                    {getRankingBadge(stat.Ranking)}
                    <span className="text-[#0C2340]">{stat["Stat Category"]}</span>
                  </div>
                  <span className="font-bold text-[#0C2340]">
                    {formatValue(stat["Stat Category"], stat.Value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
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

export function LeagueLeaders({ leaderboardData = [] }: LeagueLeadersProps) {
  const sortedData = [...leaderboardData].sort((a, b) => {
    const aRank = parseInt(a.Ranking.toString().replace(/[^0-9]/g, ''));
    const bRank = parseInt(b.Ranking.toString().replace(/[^0-9]/g, ''));
    return aRank - bRank;
  });

  const formatValue = (category: string, value: number) => {
    if (category.toLowerCase().includes('percentage') || category.toLowerCase().includes('%')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) {
      return (
        <div className="absolute left-2 top-2 w-8 h-8 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-[#FFD700] drop-shadow-lg" />
        </div>
      );
    }
    if (ranking === 2) {
      return (
        <div className="absolute left-2 top-2 w-8 h-8 flex items-center justify-center">
          <Medal className="w-8 h-8 text-[#C0C0C0] drop-shadow-lg" />
        </div>
      );
    }
    if (ranking === 3) {
      return (
        <div className="absolute left-2 top-2 w-8 h-8 flex items-center justify-center">
          <Medal className="w-8 h-8 text-[#CD7F32] drop-shadow-lg" />
        </div>
      );
    }
    if (ranking <= 10) {
      return (
        <div className="absolute left-2 top-2 w-7 h-7 bg-[#236192] text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
          {ranking}
        </div>
      );
    }
    return (
      <div className="absolute left-2 top-2 w-7 h-7 bg-[#0C2340] text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
        {ranking}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0C2340]">Timberwolves League Leaders</h2>
        <p className="text-[#9EA2A2]">Tracking our players' rankings across key NBA statistics</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0C2340] text-white">
              <th className="px-4 py-3 text-left w-16">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((entry, index) => (
              <tr 
                key={`${entry.Player}-${entry["Stat Category"]}-${index}`}
                className={`border-b border-gray-100 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100 transition-colors duration-150`}
              >
                <td className="px-4 py-3 relative">
                  <div className="flex items-center">
                    {getRankingBadge(entry.Ranking)}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-[#0C2340]">
                  <div className="flex items-center gap-3">
                    {entry.image_url ? (
                      <img
                        src={entry.image_url}
                        alt={entry.Player}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#236192]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/40';
                        }}
                      />
                    ) : (
                      <div className="bg-[#0C2340] p-1 rounded-full">
                        <UserRound className="w-8 h-8 text-white" />
                      </div>
                    )}
                    {entry.Player}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#0C2340]">
                  {entry["Stat Category"]}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#0C2340]">
                  {formatValue(entry["Stat Category"], entry.Value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
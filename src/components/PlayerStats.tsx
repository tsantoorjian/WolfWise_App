import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import PlayerList from './PlayerList';
import { UserRound, ChevronDown } from 'lucide-react';
import StatCard from './StatCard';
import { PlayerWithStats, RecentStats } from '../hooks/useSupabase';
import { LeagueLeaders } from './LeagueLeaders';

type PlayerStatsViewProps = {
  player: PlayerWithStats | null;
  last5Stats: Record<string, RecentStats>;
  last10Stats: Record<string, RecentStats>;
};

function PlayerStatsView({ player, last5Stats, last10Stats }: PlayerStatsViewProps) {
  const { leaderboardData } = useSupabase();
  
  if (!player) {
    return (
      <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#141923] flex items-center justify-center border-4 border-gray-700/30">
          <UserRound className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Select a Player</h3>
          <p className="text-gray-400 text-sm">Choose a player to view their detailed statistics</p>
        </div>
      </div>
    );
  }

  // Filter leaderboard data for the selected player
  const playerLeaderboardData = leaderboardData.filter(entry => entry.Player === player.PLAYER_NAME);

  // Ensure numeric values have defaults to prevent undefined errors
  const stats = {
    PTS: player.PTS ?? 0,
    REB: player.REB ?? 0,
    AST: player.AST ?? 0,
    STL: player.STL ?? 0,
    BLK: player.BLK ?? 0,
    PLUS_MINUS: player.PLUS_MINUS ?? 0,
    GP: player.GP ?? 0,
    MIN: player.MIN ?? 0,
    W_PCT: player.W_PCT ?? 0,
    NBA_FANTASY_PTS: player.NBA_FANTASY_PTS ?? 0
  };

  return (
    <div className="bg-gradient-to-br from-[#1e2129] via-[#1e2129]/95 to-[#1a1d24] backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-3 md:p-6">
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="relative group mx-auto md:mx-0">
          {player.image_url ? (
            <img
              src={player.image_url}
              alt={player.PLAYER_NAME}
              className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover border-4 border-[#4ade80]/60 group-hover:border-[#78BE20] transition-all duration-300 shadow-[0_0_25px_rgba(74,222,128,0.4)] group-hover:shadow-[0_0_35px_rgba(120,190,32,0.6)]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/128?text=' + player.PLAYER_NAME?.substring(0,1);
              }}
            />
          ) : (
            <div className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-[#141923] to-[#0f1119] flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#1e2129] group-hover:to-[#141923] transition-all duration-300 border-4 border-[#4ade80]/30 group-hover:border-[#78BE20]/50 shadow-[0_0_25px_rgba(74,222,128,0.3)] group-hover:shadow-[0_0_35px_rgba(120,190,32,0.5)]">
              <UserRound className="w-10 h-10 md:w-20 md:h-20 text-[#4ade80]" />
            </div>
          )}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#78BE20] to-[#4ade80] text-white text-xs px-3 py-1 rounded-full shadow-lg font-medium">
            #{player.jersey_number || '00'}
          </div>
        </div>

        <div className="flex-grow w-full flex flex-col items-center md:items-start gap-2 md:gap-4">
          <div className="text-center md:text-left w-full">
            <h2 className="text-xl md:text-4xl font-bold text-white leading-tight">{player.PLAYER_NAME}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <p className="text-sm md:text-base text-gray-400">{player.position || 'N/A'}</p>
              <span className="text-gray-600">•</span>
              <p className="text-sm md:text-base text-gray-400">#{player.jersey_number || '00'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center md:justify-start w-full gap-3 md:gap-6 mt-1 md:mt-0">
            <div className="flex-1 md:flex-none flex flex-col items-center px-3 md:px-4 py-2 md:py-3 rounded-xl bg-gradient-to-br from-[#141923]/90 to-[#0f1119]/90 border border-gray-700/40 hover:border-[#78BE20]/30 transition-all duration-300 shadow-md hover:shadow-lg">
              <p className="text-[0.6rem] md:text-[0.7rem] text-gray-400 uppercase font-medium tracking-wider">Games</p>
              <p className="text-sm md:text-lg font-bold text-white mt-0.5 md:mt-1">{stats.GP}</p>
            </div>
            <div className="flex-1 md:flex-none flex flex-col items-center px-3 md:px-4 py-2 md:py-3 rounded-xl bg-gradient-to-br from-[#141923]/90 to-[#0f1119]/90 border border-gray-700/40 hover:border-[#78BE20]/30 transition-all duration-300 shadow-md hover:shadow-lg">
              <p className="text-[0.6rem] md:text-[0.7rem] text-gray-400 uppercase font-medium tracking-wider">MPG</p>
              <p className="text-sm md:text-lg font-bold text-white mt-0.5 md:mt-1">{stats.MIN.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
        <StatCard
          label="Points"
          value={stats.PTS}
          rank={player.PTS_RANK}
          bgColor=""
          textColor="text-white"
          playerId={player.PLAYER_ID}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Rebounds"
          value={stats.REB}
          rank={player.REB_RANK}
          bgColor=""
          textColor="text-white"
          playerId={player.PLAYER_ID}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Assists"
          value={stats.AST}
          rank={player.AST_RANK}
          bgColor=""
          textColor="text-white"
          playerId={player.PLAYER_ID}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Steals"
          value={stats.STL}
          rank={player.STL_RANK}
          bgColor=""
          textColor="text-white"
          playerId={player.PLAYER_ID}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Blocks"
          value={stats.BLK}
          rank={player.BLK_RANK}
          bgColor=""
          textColor="text-white"
          playerId={player.PLAYER_ID}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="+/-"
          value={stats.PLUS_MINUS}
          rank={player.PLUS_MINUS_RANK}
          bgColor=""
          textColor="text-white"
          playerId={player.PLAYER_ID}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
      </div>

      {/* League Leaders for Selected Player */}
      {playerLeaderboardData.length > 0 && (
        <div className="mt-8 pt-8 relative">
          {/* Subtle separator with gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
          
          {/* League Leaders with enhanced styling */}
          <div className="bg-[#141923]/40 backdrop-blur-sm rounded-xl border border-gray-700/30 p-4 md:p-6 shadow-inner">
            <LeagueLeaders leaderboardData={playerLeaderboardData} />
          </div>
        </div>
      )}
    </div>
  );
}

export function PlayerStats() {
  const { players, loading, last5Stats, last10Stats } = useSupabase();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null);
  const [showPlayerList, setShowPlayerList] = useState(false);

  useEffect(() => {
    if (!loading && players.length > 0 && !selectedPlayer) {
      setSelectedPlayer(players[0]);
    }
  }, [loading, players, selectedPlayer]);

  return (
    <div className="space-y-4">
      {/* Mobile Player Select Button */}
      <div className="md:hidden">
        <button
          onClick={() => setShowPlayerList(!showPlayerList)}
          className="w-full px-4 py-3 bg-gradient-to-r from-[#1e2129] to-[#1a1d24] backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 hover:border-[#78BE20]/30 text-white font-medium flex items-center justify-between transition-all duration-300 hover:shadow-xl"
        >
          <span>{selectedPlayer ? selectedPlayer.PLAYER_NAME : 'Select Player'}</span>
          <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${showPlayerList ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player List - Hidden on mobile unless toggled */}
        <div className={`${showPlayerList ? 'block' : 'hidden'} md:block md:sticky md:top-4 h-fit`}>
          <PlayerList
            players={players}
            loading={loading}
            selectedPlayerId={selectedPlayer?.PLAYER_ID || null}
            onSelectPlayer={(player) => {
              setSelectedPlayer(player);
              setShowPlayerList(false);
            }}
          />
        </div>

        {/* Stats View - Full width on mobile */}
        <div className="md:col-span-2">
          <PlayerStatsView
            player={selectedPlayer}
            last5Stats={last5Stats}
            last10Stats={last10Stats}
          />
        </div>
      </div>
    </div>
  );
}
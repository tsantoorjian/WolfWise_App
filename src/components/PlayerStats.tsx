import { useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import PlayerList from './PlayerList';
import { UserRound, ChevronDown } from 'lucide-react';
import StatCard from './StatCard';
import { PlayerWithStats } from '../hooks/useSupabase';

type PlayerStatsViewProps = {
  player: PlayerWithStats | null;
  last5Stats: Record<string, any>;
  last10Stats: Record<string, any>;
};

function PlayerStatsView({ player, last5Stats, last10Stats }: PlayerStatsViewProps) {
  if (!player) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <UserRound className="w-10 h-10 text-[#9EA2A2]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#0C2340]">Select a Player</h3>
          <p className="text-[#9EA2A2] text-sm">Choose a player to view their detailed statistics</p>
        </div>
      </div>
    );
  }

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
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6">
        <div className="relative group">
          {player.image_url ? (
            <img
              src={player.image_url}
              alt={player.PLAYER_NAME}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#236192] group-hover:border-[#78BE20] transition-colors duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/128';
              }}
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#0C2340] flex items-center justify-center group-hover:bg-[#78BE20] transition-colors duration-300">
              <UserRound className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>
          )}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#78BE20] text-white text-xs px-2 py-1 rounded-full">
            #{player.jersey_number || '00'}
          </div>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0C2340] mb-1">{player.PLAYER_NAME}</h2>
          <p className="text-[#9EA2A2] text-sm md:text-base">{player.position || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        <StatCard
          label="Points"
          value={stats.PTS}
          bgColor="bg-gradient-to-br from-[#0C2340] to-[#1E3A5F]"
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Rebounds"
          value={stats.REB}
          bgColor="bg-gradient-to-br from-[#1E3A5F] to-[#2F547E]"
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Assists"
          value={stats.AST}
          bgColor="bg-gradient-to-br from-[#2F547E] to-[#0C2340]"
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Steals"
          value={stats.STL}
          bgColor="bg-gradient-to-br from-[#0C2340] to-[#1E3A5F]"
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Blocks"
          value={stats.BLK}
          bgColor="bg-gradient-to-br from-[#1E3A5F] to-[#2F547E]"
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="+/-"
          value={stats.PLUS_MINUS}
          bgColor="bg-gradient-to-br from-[#2F547E] to-[#0C2340]"
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#0C2340] uppercase tracking-wide">Game Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#9EA2A2] text-xs uppercase">Games</p>
              <p className="text-xl font-bold text-[#0C2340]">{stats.GP}</p>
            </div>
            <div>
              <p className="text-[#9EA2A2] text-xs uppercase">Minutes</p>
              <p className="text-xl font-bold text-[#0C2340]">{stats.MIN.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#0C2340] uppercase tracking-wide">Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#9EA2A2] text-xs uppercase">Win %</p>
              <p className="text-xl font-bold text-[#0C2340]">{(stats.W_PCT * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[#9EA2A2] text-xs uppercase">Fantasy</p>
              <p className="text-xl font-bold text-[#0C2340]">{stats.NBA_FANTASY_PTS.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlayerStats() {
  const { players, loading, last5Stats, last10Stats } = useSupabase();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null);
  const [showPlayerList, setShowPlayerList] = useState(false);

  return (
    <div className="space-y-4">
      {/* Mobile Player Select Button */}
      <div className="md:hidden">
        <button
          onClick={() => setShowPlayerList(!showPlayerList)}
          className="w-full px-4 py-3 bg-white rounded-lg shadow-md text-[#0C2340] font-medium flex items-center justify-between"
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
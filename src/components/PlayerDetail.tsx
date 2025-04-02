import React from 'react';
import { PlayerWithStats, RecentStats } from '../hooks/useSupabase';
import StatCard from './StatCard';
import { UserRound } from 'lucide-react';

type PlayerDetailProps = {
  player: PlayerWithStats | null;
  last5Stats: Record<string, RecentStats>;
  last10Stats: Record<string, RecentStats>;
};

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, last5Stats, last10Stats }) => {
  if (!player) {
    return (
      <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-6 flex items-center justify-center text-gray-400">
        Select a player to view their statistics
      </div>
    );
  }

  return (
    <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-6">
      <div className="flex items-center gap-6 mb-6">
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.PLAYER_NAME}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#4ade80]/60 shadow-[0_0_15px_rgba(74,222,128,0.3)]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/96?text=' + player.PLAYER_NAME?.substring(0,1);
            }}
          />
        ) : (
          <div className="bg-gradient-to-br from-[#1e2129] to-[#141923] p-3 rounded-full border-4 border-[#4ade80]/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
            <UserRound className="w-12 h-12 text-[#4ade80]" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">{player.PLAYER_NAME}</h2>
          <p className="text-gray-400">#{player.jersey_number || '00'} • {player.position || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Points"
          value={player.PTS}
          bgColor=""
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Rebounds"
          value={player.REB}
          bgColor=""
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Assists"
          value={player.AST}
          bgColor=""
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Steals"
          value={player.STL}
          bgColor=""
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Blocks"
          value={player.BLK}
          bgColor=""
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Plus/Minus"
          value={player.PLUS_MINUS}
          bgColor=""
          textColor="text-white"
          playerName={player.PLAYER_NAME}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2 bg-[#141923]/60 p-4 rounded-lg border border-gray-700/30">
          <p className="text-gray-400">
            Games Played: <span className="font-semibold text-white">{player.GP}</span>
          </p>
          <p className="text-gray-400">
            Minutes/Game: <span className="font-semibold text-white">{player.MIN}</span>
          </p>
        </div>
        <div className="space-y-2 bg-[#141923]/60 p-4 rounded-lg border border-gray-700/30">
          <p className="text-gray-400">
            Win %: <span className="font-semibold text-white">{(player.W_PCT * 100).toFixed(1)}%</span>
          </p>
          <p className="text-gray-400">
            Fantasy Points: <span className="font-semibold text-white">{player.NBA_FANTASY_PTS}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
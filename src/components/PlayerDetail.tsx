// src/components/PlayerDetail.tsx
import React from 'react';
import { NbaPlayerStats, RecentStats } from '../types/database.types';
import StatCard from './StatCard';
import { UserRound } from 'lucide-react';

type PlayerDetailProps = {
  player: NbaPlayerStats | null;
  last5Stats: Record<string, RecentStats>;
  last10Stats: Record<string, RecentStats>;
};

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, last5Stats, last10Stats }) => {
  if (!player) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-[#9EA2A2]">
        Select a player to view their statistics
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-6 mb-6">
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.player_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#236192]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/96';
            }}
          />
        ) : (
          <div className="bg-[#0C2340] p-3 rounded-full">
            <UserRound className="w-12 h-12 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-[#0C2340]">{player.player_name}</h2>
          {player.nickname && <p className="text-[#9EA2A2]">"{player.nickname}"</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Points"
          value={player.points}
          bgColor="bg-[#0C2340]"
          textColor="text-white"
          playerName={player.player_name}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Rebounds"
          value={player.total_rebounds}
          bgColor="bg-[#236192]"
          textColor="text-white"
          playerName={player.player_name}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Assists"
          value={player.assists}
          bgColor="bg-[#78BE20]"
          textColor="text-white"
          playerName={player.player_name}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Steals"
          value={player.steals}
          bgColor="bg-[#0C2340]"
          textColor="text-white"
          playerName={player.player_name}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Blocks"
          value={player.blocks}
          bgColor="bg-[#236192]"
          textColor="text-white"
          playerName={player.player_name}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
        <StatCard
          label="Plus/Minus"
          value={player.plus_minus}
          bgColor="bg-[#78BE20]"
          textColor="text-white"
          playerName={player.player_name}
          last5Stats={last5Stats}
          last10Stats={last10Stats}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <p className="text-[#9EA2A2]">
            Games Played: <span className="font-semibold text-[#0C2340]">{player.games_played}</span>
          </p>
          <p className="text-[#9EA2A2]">
            Minutes/Game: <span className="font-semibold text-[#0C2340]">{player.minutes_per_game}</span>
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[#9EA2A2]">
            Win %: <span className="font-semibold text-[#0C2340]">{(player.win_percentage * 100).toFixed(1)}%</span>
          </p>
          <p className="text-[#9EA2A2]">
            Fantasy Points: <span className="font-semibold text-[#0C2340]">{player.nba_fantasy_pts}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;

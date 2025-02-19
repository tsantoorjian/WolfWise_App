import { useState } from 'react';
import { NbaPlayerStats } from '../types/database.types';
import { useSupabase } from '../hooks/useSupabase';
import PlayerList from './PlayerList';
import { UserRound } from 'lucide-react';
import StatCard from './StatCard';

type PlayerStatsViewProps = {
  player: NbaPlayerStats | null;
  last5Stats: Record<string, any>;
  last10Stats: Record<string, any>;
};

function PlayerStatsView({ player, last5Stats, last10Stats }: PlayerStatsViewProps) {
  if (!player) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-[#9EA2A2]">
        Select a player to view their statistics
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6">
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.player_name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-[#236192]"
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
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-[#0C2340]">{player.player_name}</h2>
          {player.nickname && <p className="text-[#9EA2A2]">"{player.nickname}"</p>}
        </div>
      </div>

      {/* Updated grid to maintain 3 columns on all screen sizes */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
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

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
}

export function PlayerStats() {
  const { players, loading, last5Stats, last10Stats } = useSupabase();
  const [selectedPlayer, setSelectedPlayer] = useState<NbaPlayerStats | null>(null);
  const [showPlayerList, setShowPlayerList] = useState(false);

  return (
    <div className="space-y-4">
      {/* Mobile Player Select Button */}
      <div className="md:hidden">
        <button
          onClick={() => setShowPlayerList(!showPlayerList)}
          className="w-full px-4 py-2 bg-white rounded-lg shadow-md text-[#0C2340] font-medium"
        >
          {selectedPlayer ? selectedPlayer.player_name : 'Select Player'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player List - Hidden on mobile unless toggled */}
        <div className={`${showPlayerList ? 'block' : 'hidden'} md:block`}>
          <PlayerList
            players={players}
            loading={loading}
            selectedPlayerId={selectedPlayer?.id || null}
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
import React from 'react';
import { NbaPlayerStats } from '../types/database.types';

type PlayerListProps = {
  players: NbaPlayerStats[];
  loading: boolean;
  selectedPlayerId: number | null;
  onSelectPlayer: (player: NbaPlayerStats) => void;
};

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  loading,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-[#0C2340]">
        <h2 className="text-xl font-semibold text-white">Players</h2>
      </div>
      <div className="divide-y divide-gray-200 max-h-[60vh] md:max-h-[calc(100vh-250px)] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-[#9EA2A2]">Loading players...</div>
        ) : (
          players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                selectedPlayerId === player.id ? 'bg-[#236192] text-white' : ''
              }`}
            >
              <img
                src={player.image_url || ''}
                alt={player.player_name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/40';
                }}
              />
              <span className="truncate">{player.player_name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PlayerList;
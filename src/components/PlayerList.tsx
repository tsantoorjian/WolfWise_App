import React from 'react';
import { PlayerWithStats } from '../hooks/useSupabase';
import { UserRound, Search } from 'lucide-react';

type PlayerListProps = {
  players: PlayerWithStats[];
  loading: boolean;
  selectedPlayerId: number | null;
  onSelectPlayer: (player: PlayerWithStats) => void;
};

const PlayerList: React.FC<PlayerListProps> = ({
  players = [],
  loading,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredPlayers = players
    .filter(Boolean)
    .filter(player => 
      player.PLAYER_NAME?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-[#141923] to-[#1e2129]">
        <h2 className="text-xl font-semibold text-white mb-3">Players</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-10 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78BE20] focus:bg-white/20 transition-all border border-white/10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
      </div>
      <div className="divide-y divide-gray-700/30 max-h-[60vh] md:max-h-[calc(100vh-250px)] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-400 text-center">Loading players...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">No players found</div>
        ) : (
          filteredPlayers.map((player) => (
            <button
              key={player.PLAYER_ID}
              onClick={() => onSelectPlayer(player)}
              className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-3 group
                ${
                  selectedPlayerId === player.PLAYER_ID 
                    ? 'bg-gradient-to-r from-[#78BE20]/20 to-transparent text-white' 
                    : 'hover:bg-white/5 text-gray-300'
                }
              `}
            >
              <div className="relative w-10 h-10 transform transition-transform duration-200 group-hover:scale-105">
                {player.image_url ? (
                  <img
                    src={player.image_url}
                    alt={player.PLAYER_NAME}
                    className={`w-10 h-10 rounded-full object-cover border-2 transition-colors duration-200 
                      ${
                        selectedPlayerId === player.PLAYER_ID 
                          ? 'border-[#4ade80] group-hover:border-[#4ade80]/80 shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                          : 'border-gray-700/50 group-hover:border-[#78BE20]/50'
                      }`
                    }
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/40?text=' + player.PLAYER_NAME?.substring(0,1);
                    }}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200
                    ${
                      selectedPlayerId === player.PLAYER_ID 
                        ? 'bg-[#78BE20] group-hover:bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                        : 'bg-gray-700/70 group-hover:bg-[#78BE20]/50'
                    }`}
                  >
                    <UserRound className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
              <div className="transform transition-transform duration-200 group-hover:translate-x-1">
                <span className={`block truncate font-medium transition-colors duration-200
                  ${
                    selectedPlayerId === player.PLAYER_ID 
                      ? 'text-white' 
                      : 'text-gray-300 group-hover:text-white'
                  }`}
                >
                  {player.PLAYER_NAME}
                </span>
                <span className={`text-xs transition-colors duration-200
                  ${
                    selectedPlayerId === player.PLAYER_ID 
                      ? 'text-white/70' 
                      : 'text-gray-400 group-hover:text-white/70'
                  }`}
                >
                  {player.position || 'N/A'} • #{player.jersey_number || '00'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PlayerList;
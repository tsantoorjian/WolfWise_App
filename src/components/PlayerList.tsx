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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-[#0C2340]">
        <h2 className="text-xl font-semibold text-white mb-3">Players</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-10 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78BE20] focus:bg-white/20 transition-all"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-[60vh] md:max-h-[calc(100vh-250px)] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-[#9EA2A2] text-center">Loading players...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="p-4 text-[#9EA2A2] text-center">No players found</div>
        ) : (
          filteredPlayers.map((player) => (
            <button
              key={player.PLAYER_ID}
              onClick={() => onSelectPlayer(player)}
              className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-3 group
                ${
                  selectedPlayerId === player.PLAYER_ID 
                    ? 'bg-[#236192] text-white hover:bg-[#1a4a6e]' 
                    : 'hover:bg-gray-50'
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
                          ? 'border-[#78BE20] group-hover:border-[#78BE20]/80' 
                          : 'border-[#236192] group-hover:border-[#78BE20]'
                      }`
                    }
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/40';
                    }}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200
                    ${
                      selectedPlayerId === player.PLAYER_ID 
                        ? 'bg-[#78BE20] group-hover:bg-[#78BE20]/80' 
                        : 'bg-[#236192] group-hover:bg-[#78BE20]'
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
                      : 'text-[#0C2340] group-hover:text-[#236192]'
                  }`}
                >
                  {player.PLAYER_NAME}
                </span>
                <span className={`text-xs transition-colors duration-200
                  ${
                    selectedPlayerId === player.PLAYER_ID 
                      ? 'text-white/70' 
                      : 'text-[#9EA2A2] group-hover:text-[#236192]/70'
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
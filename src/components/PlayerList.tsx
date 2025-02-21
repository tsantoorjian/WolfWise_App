import React from 'react';
import { NbaPlayerStats } from '../types/database.types';
import { UserRound, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredPlayers = players.filter(player =>
    player.player_name.toLowerCase().includes(searchQuery.toLowerCase())
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
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-all flex items-center gap-3 group ${
                selectedPlayerId === player.id 
                  ? 'bg-[#236192] text-white hover:bg-[#236192]' 
                  : ''
              }`}
            >
              <div className="relative w-10 h-10">
                {player.image_url ? (
                  <img
                    src={player.image_url}
                    alt={player.player_name}
                    className={`w-10 h-10 rounded-full object-cover border-2 transition-colors ${
                      selectedPlayerId === player.id 
                        ? 'border-[#78BE20]' 
                        : 'border-[#236192] group-hover:border-[#78BE20]'
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/40';
                    }}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    selectedPlayerId === player.id 
                      ? 'bg-[#78BE20]' 
                      : 'bg-[#236192] group-hover:bg-[#78BE20]'
                  }`}>
                    <UserRound className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div>
                <span className={`block truncate font-medium ${
                  selectedPlayerId === player.id ? 'text-white' : 'text-[#0C2340]'
                }`}>
                  {player.player_name}
                </span>
                <span className={`text-xs ${
                  selectedPlayerId === player.id ? 'text-white/70' : 'text-[#9EA2A2]'
                }`}>
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
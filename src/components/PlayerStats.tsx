import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { UserRound, Edit3, Award } from 'lucide-react';
import StatCard from './StatCard';
import { PlayerWithStats, RecentStats } from '../hooks/useSupabase';
import { LeagueLeaders } from './LeagueLeaders';
import { SpiderChart } from './SpiderChart';
import { RecordTracker } from './RecordTracker';
import { CareerProgressionChart } from './CareerProgressionChart';
import { PlayerStories } from './PlayerStories';
import { usePlayerHighlights } from '../hooks/usePlayerHighlights';

type PlayerStatsViewProps = {
  player: PlayerWithStats | null;
  last5Stats: Record<string, RecentStats>;
  last10Stats: Record<string, RecentStats>;
  availablePlayers: PlayerWithStats[];
  onSelectPlayer: (player: PlayerWithStats) => void;
};

function PlayerStatsView({ player, last5Stats, last10Stats, availablePlayers, onSelectPlayer }: PlayerStatsViewProps) {
  const { leaderboardData, recordData } = useSupabase();
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  
  // Get player highlights for stories
  const { highlights } = usePlayerHighlights({
    player,
    last5Stats,
    last10Stats,
    leaderboardData,
    recordData,
    ageBasedData: []
  });

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showPlayerSelect && !target.closest('.player-image-container')) {
        setShowPlayerSelect(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlayerSelect]);

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
      {/* Player Stories Section */}
      {highlights.length > 0 && (
        <PlayerStories 
          highlights={highlights}
          playerName={player.PLAYER_NAME}
          playerImage={player.image_url}
        />
      )}
      
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="relative group player-image-container mx-auto md:mx-0">
          {player.image_url ? (
            <img
              src={player.image_url}
              alt={player.PLAYER_NAME}
              className={`w-20 h-20 md:w-36 md:h-36 rounded-full object-cover border-4 transition-all duration-300 cursor-pointer ${
                showPlayerSelect 
                  ? 'border-[#78BE20] ring-2 ring-[#78BE20]/30' 
                  : 'border-[#4ade80]/60 group-hover:border-[#78BE20]'
              }`}
              onClick={() => setShowPlayerSelect(!showPlayerSelect)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/128?text=' + player.PLAYER_NAME?.substring(0,1);
              }}
            />
          ) : (
            <div 
              className={`w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-[#141923] to-[#0f1119] flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#1e2129] group-hover:to-[#141923] transition-all duration-300 border-4 cursor-pointer ${
                showPlayerSelect 
                  ? 'border-[#78BE20] ring-2 ring-[#78BE20]/30' 
                  : 'border-[#4ade80]/30 group-hover:border-[#78BE20]/50'
              }`}
              onClick={() => setShowPlayerSelect(!showPlayerSelect)}
            >
              <UserRound className="w-10 h-10 md:w-20 md:h-20 text-[#4ade80]" />
            </div>
          )}
          
          {/* Edit Icon Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
          
          {/* Dropdown Status Indicator */}
          {showPlayerSelect && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#78BE20] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          
          {/* Player Selection Dropdown */}
          {showPlayerSelect && (
            <div className="absolute z-50 mt-2 left-0 w-64 bg-[#141923] rounded-lg shadow-xl border border-gray-700/50 py-2 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 text-sm text-[#78BE20]/80 border-b border-gray-700/50 font-medium">
                Select a player to view stats
              </div>
              <div className="max-h-80 overflow-y-auto">
                {availablePlayers.map(availablePlayer => (
                  <button
                    key={availablePlayer.PLAYER_ID}
                    onClick={() => {
                      onSelectPlayer(availablePlayer);
                      setShowPlayerSelect(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-[#1e2129] flex items-center gap-3 ${
                      player.PLAYER_ID === availablePlayer.PLAYER_ID 
                        ? 'text-white bg-[#78BE20]/20 font-medium border-l-4 border-[#78BE20]' 
                        : 'text-white'
                    }`}
                  >
                    {availablePlayer.image_url ? (
                      <img
                        src={availablePlayer.image_url}
                        alt={availablePlayer.PLAYER_NAME}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/32';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#141923] flex items-center justify-center">
                        <UserRound className="w-4 h-4 text-[#78BE20]" />
                      </div>
                    )}
                    <span className="flex-1">{availablePlayer.PLAYER_NAME}</span>
                    {player.PLAYER_ID === availablePlayer.PLAYER_ID && <Award className="w-4 h-4 text-[#78BE20]" />}
                  </button>
                ))}
              </div>
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
            <p className="text-[#78BE20] text-xs font-medium mt-1">Click image to change player</p>
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

      {/* League Leaders and Spider Chart - Side by Side */}
      <div className="mt-8 pt-8 relative">
        {/* Subtle separator with gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* League Leaders */}
          {playerLeaderboardData.length > 0 && (
            <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <LeagueLeaders leaderboardData={playerLeaderboardData} />
            </div>
          )}
          
          {/* Spider Chart */}
          <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <SpiderChart player={player} />
          </div>
        </div>
      </div>

      {/* Career Progression Chart */}
      {player?.PLAYER_NAME && (
        <div className="mt-8 pt-8 relative">
          {/* Subtle separator with gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
          
          <CareerProgressionChart 
            playerName={player.PLAYER_NAME} 
          />
        </div>
      )}

      {/* Record Tracker */}
      {player?.PLAYER_NAME && (
        <div className="mt-8 pt-8 relative">
          {/* Subtle separator with gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
          
          <RecordTracker 
            selectedPlayer={player.PLAYER_NAME} 
          />
        </div>
      )}
    </div>
  );
}

export function PlayerStats() {
  const { players, loading, last5Stats, last10Stats } = useSupabase();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null);

  useEffect(() => {
    if (!loading && players.length > 0 && !selectedPlayer) {
      setSelectedPlayer(players[0]);
    }
  }, [loading, players, selectedPlayer]);

  return (
    <div className="space-y-4">
      <PlayerStatsView
        player={selectedPlayer}
        last5Stats={last5Stats}
        last10Stats={last10Stats}
        availablePlayers={players}
        onSelectPlayer={setSelectedPlayer}
      />
    </div>
  );
}
import React from 'react';
import { LineupWithAdvanced } from '../types/database.types';
import { UserRound, TrendingUp, TrendingDown } from 'lucide-react';

type LineupCardProps = {
  lineup: LineupWithAdvanced;
};

const LineupCard: React.FC<LineupCardProps> = ({ lineup }) => {
  const isPositiveRating = lineup.net_rating >= 0;

  return (
    <div className="bg-[#141923] rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-700/50 hover:border-[#78BE20]/30 flex flex-col">
      {/* Header with player avatars and net rating */}
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="relative flex items-center">
            {lineup.players.map((player, playerIndex) => (
              <div
                key={playerIndex}
                className="relative transition-transform duration-300 hover:scale-110 hover:z-10 group"
                style={{
                  marginLeft: playerIndex > 0 ? '-0.75rem' : '0',
                  zIndex: lineup.players.length - playerIndex,
                }}
              >
                {player.image_url ? (
                  <img
                    src={player.image_url}
                    alt={player.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#78BE20]/60 bg-[#1e2129] object-cover group-hover:border-[#78BE20] transition-colors"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/48?text=${player.name.charAt(0)}`;
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#78BE20]/60 bg-[#1e2129] flex items-center justify-center group-hover:border-[#78BE20] transition-colors">
                    <UserRound className="w-5 h-5 md:w-6 md:h-6 text-[#78BE20]" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Tooltip with player name */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#1e2129] text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 border border-[#78BE20]/20">
                  {player.name}
                </div>
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 md:gap-2 ${isPositiveRating ? 'text-[#78BE20]' : 'text-[#DC2626]'}`}>
            {isPositiveRating ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="text-xl md:text-2xl font-bold">
              {isPositiveRating ? '+' : ''}{lineup.net_rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          <div className="bg-[#1e2129] rounded-lg p-2 md:p-3 transition-colors hover:bg-[#1e2129]/80">
            <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wide">Minutes</div>
            <div className="font-semibold text-white text-sm md:text-base">{lineup.min.toFixed(1)}</div>
          </div>
          <div className="bg-[#1e2129] rounded-lg p-2 md:p-3 transition-colors hover:bg-[#1e2129]/80">
            <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wide">Off Rtg</div>
            <div className="font-semibold text-white text-sm md:text-base">{lineup.off_rating.toFixed(1)}</div>
          </div>
          <div className="bg-[#1e2129] rounded-lg p-2 md:p-3 transition-colors hover:bg-[#1e2129]/80">
            <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wide">Def Rtg</div>
            <div className="font-semibold text-white text-sm md:text-base">{lineup.def_rating.toFixed(1)}</div>
          </div>
          <div className="bg-[#1e2129] rounded-lg p-2 md:p-3 transition-colors hover:bg-[#1e2129]/80">
            <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wide">Pace</div>
            <div className="font-semibold text-white text-sm md:text-base">{lineup.pace.toFixed(1)}</div>
          </div>
        </div>

        {/* True Shooting Progress Bar */}
        <div className="mt-3 md:mt-4 bg-[#1e2129] rounded-lg p-2 md:p-3 transition-colors hover:bg-[#1e2129]/80">
          <div className="flex justify-between items-center mb-2">
            <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wide">True Shooting</div>
            <div className="font-semibold text-white text-sm md:text-base">
              {(lineup.ts_pct * 100).toFixed(1)}%
            </div>
          </div>
          <div className="h-1.5 md:h-2 bg-[#141923] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#78BE20] to-[#4ade80] transition-all duration-300"
              style={{ 
                width: `${Math.min(lineup.ts_pct * 100, 100)}%`,
                backgroundColor: lineup.ts_pct >= 0.6 ? '#4ade80' : 
                               lineup.ts_pct >= 0.5 ? '#facc15' : '#f87171'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineupCard;
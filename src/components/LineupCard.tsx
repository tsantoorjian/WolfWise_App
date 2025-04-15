import React from 'react';
import { LineupWithAdvanced } from '../types/database.types';
import { UserRound } from 'lucide-react';

type LineupCardProps = {
  lineup: LineupWithAdvanced;
};

const LineupCard: React.FC<LineupCardProps> = ({ lineup }) => {
  const isPositiveRating = lineup.net_rating >= 0;

  return (
    <div className="col-span-full bg-[#141923] rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-700/50 hover:border-[#78BE20]/30">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
          {/* Player Images Section */}
          <div className="flex items-center justify-center md:justify-start gap-2">
            {lineup.players.map((player, playerIndex) => (
              <div
                key={playerIndex}
                className="relative transition-transform duration-300 hover:scale-110 group"
              >
                {player.image_url ? (
                  <img
                    src={player.image_url}
                    alt={player.name}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-[#78BE20]/60 bg-[#1e2129] object-cover group-hover:border-[#78BE20] transition-colors"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/96?text=${player.name.charAt(0)}`;
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-[#78BE20]/60 bg-[#1e2129] flex items-center justify-center group-hover:border-[#78BE20] transition-colors">
                    <UserRound className="w-8 h-8 md:w-12 md:h-12 text-[#78BE20]" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1e2129] text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 border border-[#78BE20]/20">
                  {player.name}
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 md:flex items-center gap-4 md:gap-8">
            {/* Net Rating */}
            <div className="flex flex-col items-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1">NET RTG</div>
              <div className={`${isPositiveRating ? 'text-[#78BE20]' : 'text-[#DC2626]'}`}>
                <span className="text-xl md:text-3xl font-bold">
                  {isPositiveRating ? '+' : ''}{lineup.net_rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1">MIN</div>
              <div className="text-white text-xl md:text-2xl font-semibold">{lineup.min.toFixed(1)}</div>
            </div>

            {/* Off Rating */}
            <div className="flex flex-col items-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1">OFF RTG</div>
              <div className="text-white text-xl md:text-2xl font-semibold">{lineup.off_rating.toFixed(1)}</div>
            </div>

            {/* Def Rating */}
            <div className="flex flex-col items-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1">DEF RTG</div>
              <div className="text-white text-xl md:text-2xl font-semibold">{lineup.def_rating.toFixed(1)}</div>
            </div>

            {/* True Shooting */}
            <div className="flex flex-col items-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1">TS%</div>
              <div className="text-white text-xl md:text-2xl font-semibold">
                {(lineup.ts_pct * 100).toFixed(1)}%
              </div>
            </div>

            {/* Pace */}
            <div className="flex flex-col items-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1">PACE</div>
              <div className="text-white text-xl md:text-2xl font-semibold">{lineup.pace.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineupCard;
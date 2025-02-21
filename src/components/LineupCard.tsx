import React from 'react';
import { LineupWithAdvanced } from '../types/database.types';
import { UserRound, TrendingUp, TrendingDown } from 'lucide-react';

type LineupCardProps = {
  lineup: LineupWithAdvanced;
};

const LineupCard: React.FC<LineupCardProps> = ({ lineup }) => {
  const isPositiveRating = lineup.net_rating >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex items-center">
          {lineup.players.map((player, playerIndex) => (
            <div
              key={playerIndex}
              className="relative transition-transform duration-300 hover:scale-110 hover:z-10"
              style={{
                marginLeft: playerIndex > 0 ? '-1rem' : '0',
                zIndex: lineup.players.length - playerIndex,
              }}
            >
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-12 h-12 rounded-full border-2 border-[#236192] bg-white object-cover hover:border-[#78BE20] transition-colors"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/48';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-[#236192] bg-white flex items-center justify-center hover:border-[#78BE20] transition-colors">
                  <UserRound className="w-6 h-6 text-[#236192]" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-2 ${isPositiveRating ? 'text-[#78BE20]' : 'text-[#DC2626]'}`}>
          {isPositiveRating ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <span className="text-2xl font-bold">
            {isPositiveRating ? '+' : ''}{lineup.net_rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[#9EA2A2] text-xs">MIN</div>
          <div className="font-semibold text-[#0C2340]">{lineup.min.toFixed(1)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[#9EA2A2] text-xs">ORTG</div>
          <div className="font-semibold text-[#0C2340]">{lineup.off_rating.toFixed(1)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[#9EA2A2] text-xs">DRTG</div>
          <div className="font-semibold text-[#0C2340]">{lineup.def_rating.toFixed(1)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[#9EA2A2] text-xs">PACE</div>
          <div className="font-semibold text-[#0C2340]">{lineup.pace.toFixed(1)}</div>
        </div>
      </div>

      <div className="mt-3 bg-gray-50 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <div className="text-[#9EA2A2] text-xs">True Shooting %</div>
          <div className="font-semibold text-[#0C2340]">{(lineup.ts_pct * 100).toFixed(1)}%</div>
        </div>
        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#78BE20] to-[#236192] transition-all duration-300"
            style={{ width: `${lineup.ts_pct * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LineupCard;
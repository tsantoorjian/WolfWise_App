// src/components/LineupCard.tsx
import React from 'react';
import { LineupWithAdvanced } from '../types/database.types';
import { UserRound } from 'lucide-react';

type LineupCardProps = {
  lineup: LineupWithAdvanced;
};

const LineupCard: React.FC<LineupCardProps> = ({ lineup }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex items-center">
          {lineup.players.map((player, playerIndex) => (
            <div
              key={playerIndex}
              className="relative"
              style={{
                marginLeft: playerIndex > 0 ? '-1rem' : '0',
                zIndex: lineup.players.length - playerIndex,
              }}
            >
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-12 h-12 rounded-full border-2 border-white bg-[#0C2340] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/48';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white bg-[#0C2340] flex items-center justify-center">
                  <UserRound className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={`text-2xl font-bold ${lineup.net_rating >= 0 ? 'text-[#78BE20]' : 'text-[#DC2626]'}`}>
          {lineup.net_rating > 0 ? '+' : ''}{lineup.net_rating.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div>
          <div className="text-[#9EA2A2]">MIN</div>
          <div className="font-semibold">{lineup.min.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">ORTG</div>
          <div className="font-semibold">{lineup.off_rating.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">DRTG</div>
          <div className="font-semibold">{lineup.def_rating.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">PACE</div>
          <div className="font-semibold">{lineup.pace.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">TS%</div>
          <div className="font-semibold">{(lineup.ts_pct * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};

export default LineupCard;

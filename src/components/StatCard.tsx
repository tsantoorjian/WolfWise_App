// src/components/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RecentStats } from '../types/database.types';

type StatCardProps = {
  label: string;
  value: number | null;
  bgColor: string;
  textColor: string;
  playerName?: string;
  last5Stats?: Record<string, RecentStats>;
  last10Stats?: Record<string, RecentStats>;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  bgColor,
  textColor,
  playerName,
  last5Stats,
  last10Stats,
}) => {
  const getStatKey = () => {
    switch (label.toUpperCase()) {
      case 'POINTS':
        return 'PTS';
      case 'REBOUNDS':
        return 'REB';
      case 'ASSISTS':
        return 'AST';
      case 'STEALS':
        return 'STL';
      case 'BLOCKS':
        return 'BLK';
      case 'PLUS/MINUS':
        return 'PLUS_MINUS';
      default:
        return '';
    }
  };

  const statKey = getStatKey();
  const last5Value =
    playerName && last5Stats ? last5Stats[playerName]?.[statKey as keyof RecentStats] : undefined;
  const last10Value =
    playerName && last10Stats ? last10Stats[playerName]?.[statKey as keyof RecentStats] : undefined;

  const getPerformanceIndicator = (recentValue: number, seasonValue: number) => {
    const threshold = 0.1; // 10% difference threshold
    const percentDiff = Math.abs(recentValue - seasonValue) / seasonValue;
    if (percentDiff > threshold) {
      return recentValue > seasonValue ? (
        <TrendingUp className={`w-3 h-3 ${bgColor === 'bg-[#78BE20]' ? 'text-[#2A4708]' : 'text-[#78BE20]'}`} />
      ) : (
        <TrendingDown className="w-3 h-3 text-[#DC2626]" />
      );
    }
    return <Minus className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className={`${bgColor} rounded-lg p-4 relative`}>
      <p className="text-sm font-medium text-white opacity-90">{label}</p>
      <div className="flex justify-between items-end mt-1">
        <div>
          <p className={`text-2xl font-bold ${textColor}`}>
            {value !== null ? value.toFixed(1) : '0.0'}
          </p>
          <p className="text-[0.65rem] text-white/60 mt-1">Season Average</p>
        </div>
        {last5Value !== undefined && last10Value !== undefined && (
          <div className="text-[0.65rem] text-white/80 text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <span className="opacity-70">L5</span>
              <span className="font-medium">{(last5Value as number).toFixed(1)}</span>
              {value && getPerformanceIndicator(last5Value as number, value)}
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="opacity-70">L10</span>
              <span className="font-medium">{(last10Value as number).toFixed(1)}</span>
              {value && getPerformanceIndicator(last10Value as number, value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

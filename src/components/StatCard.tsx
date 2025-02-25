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
      case 'POINTS': return 'PTS';
      case 'REBOUNDS': return 'REB';
      case 'ASSISTS': return 'AST';
      case 'STEALS': return 'STL';
      case 'BLOCKS': return 'BLK';
      case '+/-': return 'PLUS_MINUS';
      default: return '';
    }
  };

  const statKey = getStatKey();
  const last5Value = playerName && last5Stats ? last5Stats[playerName]?.[statKey as keyof RecentStats] : undefined;
  const last10Value = playerName && last10Stats ? last10Stats[playerName]?.[statKey as keyof RecentStats] : undefined;

  const getPerformanceIndicator = (recentValue: number, seasonValue: number) => {
    const threshold = 0.1; // 10% difference threshold
    const percentDiff = Math.abs(recentValue - seasonValue) / seasonValue;
    
    if (percentDiff > threshold) {
      if (recentValue > seasonValue) {
        return <TrendingUp className="w-3 h-3 text-[#78BE20]" />;
      } else {
        return <TrendingDown className="w-3 h-3 text-[#DC2626]" />;
      }
    }
    return <Minus className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className={`${bgColor} rounded-lg p-3 md:p-4 relative overflow-hidden transition-transform hover:scale-105 duration-200`}>
      <div className="relative z-10">
        <p className="text-xs md:text-sm font-medium text-white opacity-90">{label}</p>
        <div className="flex justify-between items-end mt-1">
          <div>
            <p className={`text-lg md:text-2xl font-bold ${textColor}`}>
              {value !== null ? value.toFixed(1) : '0.0'}
            </p>
            <p className="text-[0.6rem] md:text-[0.65rem] text-white/60 mt-1">Avg</p>
          </div>
          {last5Value !== undefined && last10Value !== undefined && (
            <div className="text-[0.55rem] md:text-[0.65rem] text-white/80 text-right">
              <div className="flex items-center justify-end gap-0.5 md:gap-1 mb-0.5 md:mb-1">
                <span className="opacity-70">L5</span>
                <span className="font-medium">{(last5Value as number).toFixed(1)}</span>
                {value && getPerformanceIndicator(last5Value as number, value)}
              </div>
              <div className="flex items-center justify-end gap-0.5 md:gap-1">
                <span className="opacity-70">L10</span>
                <span className="font-medium">{(last10Value as number).toFixed(1)}</span>
                {value && getPerformanceIndicator(last10Value as number, value)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
    </div>
  );
};

export default StatCard;
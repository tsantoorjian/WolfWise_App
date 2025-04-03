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
  accentColor?: string;
  className?: string;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  bgColor,
  textColor,
  playerName,
  last5Stats,
  last10Stats,
  accentColor = '#78BE20',
  className
}) => {
  const getStatKey = () => {
    switch (label.toUpperCase()) {
      case 'POINTS': return 'PTS';
      case 'REBOUNDS': return 'REB';
      case 'ASSISTS': return 'AST';
      case 'STEALS': return 'STL';
      case 'BLOCKS': return 'BLK';
      case '+/-': return 'PLUS_MINUS';
      case 'PLUS/MINUS': return 'PLUS_MINUS';
      default: return '';
    }
  };

  const statKey = getStatKey();
  const last5Value = playerName && last5Stats ? last5Stats[playerName]?.[statKey as keyof RecentStats] : undefined;
  const last10Value = playerName && last10Stats ? last10Stats[playerName]?.[statKey as keyof RecentStats] : undefined;

  // Modern card styles
  const getCardStyles = () => {
    return {
      bg: 'bg-[#1a1f2b]',
      border: 'border-[#2a3142]',
      accent: '#10b981',
      secondaryAccent: '#0891b2',
      textPrimary: 'text-white',
      textSecondary: 'text-gray-300'
    };
  };

  const cardStyles = getCardStyles();

  const getPerformanceIndicator = (recentValue: number, seasonValue: number) => {
    // Round both values to 1 decimal place for comparison
    const roundedRecent = Number(recentValue.toFixed(1));
    const roundedSeason = Number(seasonValue.toFixed(1));
    
    if (roundedRecent > roundedSeason) {
      return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    } else if (roundedRecent < roundedSeason) {
      return <TrendingDown className="w-3 h-3 text-rose-400" />;
    }
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div 
      className={`${cardStyles.bg} rounded-xl p-3 md:p-4 relative overflow-hidden transition-all hover:translate-y-[-4px] duration-300 border ${cardStyles.border} ${className || ''}`}
    >
      <div className="relative z-10">
        {/* Header with accent line */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 md:h-5 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-full"></div>
            <p className="text-xs md:text-sm font-medium text-white">
              {label}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex justify-between items-end mt-1 md:mt-2">
          <div>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white">
              {value !== null ? value.toFixed(1) : '0.0'}
            </p>
            <p className="text-[0.6rem] md:text-[0.65rem] lg:text-[0.7rem] text-gray-400 mt-0.5 md:mt-1 font-medium uppercase tracking-wide">Season Avg</p>
          </div>
          
          {last5Value !== undefined && last10Value !== undefined && (
            <div className="text-[0.6rem] md:text-[0.65rem] lg:text-[0.7rem] text-gray-300 text-right bg-[#232838] p-1.5 md:p-2 rounded-lg">
              <div className="flex items-center justify-end gap-1 md:gap-1.5 lg:gap-2 mb-1 md:mb-1.5">
                <span className="text-gray-400 font-medium">L5</span>
                <span className="font-semibold">{(last5Value as number).toFixed(1)}</span>
                {value && getPerformanceIndicator(last5Value as number, value)}
              </div>
              <div className="flex items-center justify-end gap-1 md:gap-1.5 lg:gap-2">
                <span className="text-gray-400 font-medium">L10</span>
                <span className="font-semibold">{(last10Value as number).toFixed(1)}</span>
                {value && getPerformanceIndicator(last10Value as number, value)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle design elements */}
      <div className="absolute bottom-0 left-0 w-1/3 h-1 bg-[#2a3142] rounded-tr"></div>
    </div>
  );
};

export default StatCard;
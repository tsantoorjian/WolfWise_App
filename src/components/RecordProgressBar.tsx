import React from 'react';

type RecordProgressBarProps = {
  current: number;
  max: number;
  label: string;
  player: string;
};

const RecordProgressBar: React.FC<RecordProgressBarProps> = ({ current, max, label, player }) => {
  const percentage = (current / max) * 100;
  const isClose = percentage >= 90;

  const formatNumber = (num: number) => {
    // If the number is a whole number, don't show decimals
    const hasDecimal = num % 1 !== 0;
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: hasDecimal ? 1 : 0,
      maximumFractionDigits: hasDecimal ? 1 : 0
    }).format(num);
  };

  return (
    <div className="group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-sm text-[#9EA2A2]">{formatNumber(max)} • {player}</span>
      </div>
      <div className="relative h-2.5 bg-[#141923] rounded-full overflow-visible cursor-pointer">
        <div
          className={`absolute h-full rounded-full transition-all duration-500 ${
            isClose ? 'bg-[#DC2626]' : 'bg-[#78BE20]'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        
        {/* Tooltip */}
        <div className="invisible group-hover:visible absolute -top-14 left-1/2 -translate-x-1/2 bg-[#0F1119] px-4 py-2 rounded-lg shadow-lg border border-gray-700/50 whitespace-nowrap z-50">
          <div className="text-center text-sm">
            <span className="text-white font-medium">{formatNumber(current)}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-[#78BE20]">{formatNumber(max)}</span>
          </div>
          <div className="text-[11px] text-center text-gray-400 mt-0.5">
            {Math.round(percentage)}% complete
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#0F1119] border-b border-r border-gray-700/50 transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default RecordProgressBar;
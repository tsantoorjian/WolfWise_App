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
  const isHalfway = percentage >= 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[#0C2340]">{label}</span>
        <span className="text-sm text-[#9EA2A2]">{player}</span>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute h-full rounded-full transition-all duration-500 ${
            isClose ? 'bg-[#DC2626]' : isHalfway ? 'bg-[#78BE20]' : 'bg-[#236192]'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-end px-2">
          <span className="text-xs font-semibold text-white mix-blend-difference">
            {current.toFixed(1)} / {max.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordProgressBar;
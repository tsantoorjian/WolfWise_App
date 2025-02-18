// src/components/RecordProgressBar.tsx
import React from 'react';

type RecordProgressBarProps = {
  current: number;
  max: number;
  label: string;
  player: string;
};

const RecordProgressBar: React.FC<RecordProgressBarProps> = ({ current, max, label, player }) => {
  const percentage = (current / max) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-[#0C2340]">{label}</span>
        <span className="text-sm text-[#9EA2A2]">{player}</span>
      </div>
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-[#78BE20] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-end px-2">
          <span className="text-xs font-semibold text-white">
            {current.toFixed(1)} / {max.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordProgressBar;

import React, { useState } from 'react';
import { useCareerProgression, ADVANCED_STAT_OPTIONS, AdvancedStatOption } from '../hooks/useCareerProgression';
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CareerProgressionChartProps {
  playerName: string;
}

export function CareerProgressionChart({ playerName }: CareerProgressionChartProps) {
  const [selectedStat, setSelectedStat] = useState('per');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const { data, leagueAverages, loading, error } = useCareerProgression(playerName, selectedStat);
  
  const selectedStatOption = ADVANCED_STAT_OPTIONS.find(option => option.key === selectedStat);

  const formatValue = (value: number | null, statOption: AdvancedStatOption) => {
    if (value === null) return 'N/A';
    
    const formatted = value.toFixed(statOption.decimals);
    
    switch (statOption.format) {
      case 'percentage':
        return `${(value * 100).toFixed(statOption.decimals)}%`;
      case 'integer':
        return Math.round(value).toString();
      default:
        return formatted;
    }
  };

  const getTrendIcon = (data: any[]) => {
    if (data.length < 2) return <Minus className="w-4 h-4 text-gray-400" />;
    
    const firstValue = data[0]?.value;
    const lastValue = data[data.length - 1]?.value;
    
    if (firstValue === null || lastValue === null) return <Minus className="w-4 h-4 text-gray-400" />;
    
    if (lastValue > firstValue) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (lastValue < firstValue) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendText = (data: any[]) => {
    if (data.length < 2) return 'No trend data';
    
    const firstValue = data[0]?.value;
    const lastValue = data[data.length - 1]?.value;
    
    if (firstValue === null || lastValue === null) return 'No trend data';
    
    const change = lastValue - firstValue;
    const changePercent = ((change / firstValue) * 100).toFixed(1);
    
    if (change > 0) {
      return `+${change.toFixed(selectedStatOption?.decimals || 1)} (+${changePercent}%)`;
    } else if (change < 0) {
      return `${change.toFixed(selectedStatOption?.decimals || 1)} (${changePercent}%)`;
    } else {
      return 'No change';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-xl border border-gray-700/50 shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700/50 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700/30 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-700/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-xl border border-red-500/30 shadow-lg p-6">
        <div className="text-red-400 text-center">
          <p className="font-medium">Error loading career progression</p>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-xl border border-gray-700/50 shadow-lg p-6">
        <div className="text-center text-gray-400">
          <p className="font-medium">No career progression data available</p>
          <p className="text-sm mt-1">Data for {playerName} not found in the last 4 seasons</p>
        </div>
      </div>
    );
  }

  const validData = data.filter(d => d.value !== null);
  const allValues = [...validData.map(d => d.value!), ...Object.values(leagueAverages)];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue;

  return (
    <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Career Progression</h3>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e2129] hover:bg-[#2a2d35] border border-gray-600/50 rounded-lg text-white transition-colors"
            >
              <span className="text-sm font-medium">
                {selectedStatOption?.label || 'Select Stat'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e2129] border border-gray-600/50 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {ADVANCED_STAT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSelectedStat(option.key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedStat === option.key
                          ? 'bg-[#78BE20]/20 text-[#78BE20] border border-[#78BE20]/30'
                          : 'text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {selectedStatOption && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>{selectedStatOption.description}</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(data)}
                <span className="text-white font-medium">{getTrendText(data)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-px border-t border-dashed border-amber-500"></div>
              <span>League Avg (Top 200 by MPG)</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        {validData.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No data available for {selectedStatOption?.label}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Line Chart */}
            <div className="relative px-4">
              {/* Chart Container with proper padding */}
              <div className="relative" style={{ height: '200px' }}>
                {/* Grid lines background */}
                <div className="absolute left-0 right-0 top-8 bottom-4 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-px bg-gray-700/30" />
                  ))}
                </div>
                
                {/* SVG Chart with proper viewBox */}
                <div className="absolute left-0 right-0 top-0" style={{ height: '200px' }}>
                  <svg 
                    className="w-full h-full overflow-visible" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                  >
                    {/* Area fill under the line */}
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#78BE20" />
                        <stop offset="50%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#78BE20" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {(() => {
                      const padding = 5; // Padding from edges
                      const chartHeight = 100 - (padding * 2);
                      
                      // Calculate positions
                      const positions = data.map((item, index) => {
                        const x = (index / (data.length - 1)) * 100;
                        const y = item.value !== null && range > 0
                          ? padding + ((maxValue - item.value) / range) * chartHeight
                          : 50;
                        return { x, y, value: item.value };
                      });
                      
                      const validPositions = positions.filter(p => p.value !== null);
                      
                      if (validPositions.length === 0) return null;
                      
                      // Create path for area fill
                      const areaPath = `
                        M ${validPositions[0].x} ${100 - padding}
                        ${validPositions.map(p => `L ${p.x} ${p.y}`).join(' ')}
                        L ${validPositions[validPositions.length - 1].x} ${100 - padding}
                        Z
                      `;
                      
                      // Create path for line
                      const linePath = validPositions
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                        .join(' ');
                      
                      // Create league average line
                      const leagueAveragePath = data
                        .map((item, index) => {
                          const x = (index / (data.length - 1)) * 100;
                          const leagueAvg = leagueAverages[item.year];
                          if (leagueAvg === undefined) return null;
                          
                          const y = padding + ((maxValue - leagueAvg) / range) * chartHeight;
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <g>
                          {/* League average line - draw first so it's behind player line */}
                          {leagueAveragePath && (
                            <path
                              d={leagueAveragePath}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="0.8"
                              strokeDasharray="4,3"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.9"
                            />
                          )}
                          
                          {/* Player line */}
                          <path
                            d={linePath}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      );
                    })()}
                  </svg>
                  
                  {/* Data points - positioned absolutely for perfect alignment */}
                  {data.map((item, index) => {
                    if (item.value === null) return null;
                    
                    const padding = 5;
                    const chartHeight = 100 - (padding * 2);
                    const xPercent = (index / (data.length - 1)) * 100;
                    const yPercent = padding + ((maxValue - item.value) / range) * chartHeight;
                    
                    return (
                      <div
                        key={item.year}
                        className="absolute"
                        style={{
                          left: `${xPercent}%`,
                          top: `${yPercent}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {/* Main dot */}
                        <div className="relative w-3 h-3 rounded-full bg-gradient-to-br from-[#78BE20] to-[#4ade80] border-2 border-[#1e2129] shadow-lg" />
                      </div>
                    );
                  })}
                </div>
                
                {/* Value labels above dots - positioned absolutely for perfect alignment */}
                <div className="absolute left-0 right-0 top-0" style={{ height: '200px' }}>
                  {data.map((item, index) => {
                    if (item.value === null) return null;
                    
                    const padding = 5;
                    const chartHeight = 100 - (padding * 2);
                    const xPercent = (index / (data.length - 1)) * 100;
                    const yPercent = padding + ((maxValue - item.value) / range) * chartHeight;
                    
                    return (
                      <div
                        key={item.year}
                        className="absolute"
                        style={{
                          left: `${xPercent}%`,
                          top: `${yPercent}%`,
                          transform: 'translate(-50%, -120%)',
                          width: '80px'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-sm font-bold text-[#78BE20]">
                            {formatValue(item.value, selectedStatOption!)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* League average label for latest point only */}
                  {(() => {
                    const latestYear = Math.max(...data.map(d => d.year));
                    const latestData = data.find(d => d.year === latestYear);
                    const latestLeagueAvg = leagueAverages[latestYear];
                    
                    if (!latestData || latestLeagueAvg === undefined) return null;
                    
                    const padding = 5;
                    const chartHeight = 100 - (padding * 2);
                    const latestIndex = data.findIndex(d => d.year === latestYear);
                    const xPercent = (latestIndex / (data.length - 1)) * 100;
                    const yPercent = padding + ((maxValue - latestLeagueAvg) / range) * chartHeight;
                    
                    return (
                      <div
                        className="absolute"
                        style={{
                          left: `${xPercent}%`,
                          top: `${yPercent}%`,
                          transform: 'translate(-50%, -80%)', // Positioned lower to avoid overlap
                          width: '80px'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-sm font-bold text-amber-500">
                            {formatValue(latestLeagueAvg, selectedStatOption!)}
                          </div>
                          <div className="text-xs text-amber-400/80">
                            League Avg
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Year labels below chart - positioned absolutely for perfect alignment - no MIN labels */}
                <div className="absolute left-0 right-0" style={{ top: '200px' }}>
                  {data.map((item, index) => {
                    const xPercent = (index / (data.length - 1)) * 100;
                    
                    return (
                      <div
                        key={item.year}
                        className="absolute"
                        style={{
                          left: `${xPercent}%`,
                          transform: 'translateX(-50%)',
                          width: '80px'
                        }}
                      >
                        <div className="flex flex-col items-center text-center space-y-1">
                          <div className="text-xs font-medium text-white">
                            {item.year}
                          </div>
                          {item.team && item.team !== 'MIN' && (
                            <div className="text-xs text-gray-500">
                              {item.team}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-700/50">
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Best Season</div>
                <div className="text-lg font-bold text-white">
                  {formatValue(maxValue, selectedStatOption!)}
                </div>
                <div className="text-xs text-gray-500">
                  {data.find(d => d.value === maxValue)?.year}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Worst Season</div>
                <div className="text-lg font-bold text-white">
                  {formatValue(minValue, selectedStatOption!)}
                </div>
                <div className="text-xs text-gray-500">
                  {data.find(d => d.value === minValue)?.year}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Average</div>
                <div className="text-lg font-bold text-white">
                  {formatValue(
                    validData.reduce((sum, d) => sum + d.value!, 0) / validData.length,
                    selectedStatOption!
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {validData.length} seasons
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">4-Year Change</div>
                <div className="text-lg font-bold text-white">
                  {getTrendText(data)}
                </div>
                <div className="text-xs text-gray-500">
                  {data[0]?.year} → {data[data.length - 1]?.year}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

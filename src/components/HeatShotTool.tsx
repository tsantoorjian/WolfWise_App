import { useEffect, useState, useRef } from 'react';
import { PlayerWithStats } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { FullSeasonBase, FullSeasonAdvanced } from '../types/database.types';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ScatterChart as ScatterChartIcon, Settings, TrendingUp } from 'lucide-react';

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Register required components
echarts.use([ScatterChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// Combined stat list from both tables
const BASE_STATS = [
  { key: 'PTS', label: 'Points', table: 'base' },
  { key: 'REB', label: 'Rebounds', table: 'base' },
  { key: 'AST', label: 'Assists', table: 'base' },
  { key: 'STL', label: 'Steals', table: 'base' },
  { key: 'BLK', label: 'Blocks', table: 'base' },
  { key: 'FG_PCT', label: 'FG %', table: 'base' },
  { key: 'FG3_PCT', label: '3PT %', table: 'base' },
  { key: 'FT_PCT', label: 'FT %', table: 'base' },
  { key: 'TOV', label: 'Turnovers', table: 'base' },
  { key: 'FGM', label: 'FGM', table: 'base' },
  { key: 'FGA', label: 'FGA', table: 'base' },
  { key: 'FG3M', label: '3PM', table: 'base' },
  { key: 'FG3A', label: '3PA', table: 'base' },
  { key: 'FTM', label: 'FTM', table: 'base' },
  { key: 'FTA', label: 'FTA', table: 'base' },
  { key: 'OREB', label: 'OREB', table: 'base' },
  { key: 'DREB', label: 'DREB', table: 'base' },
  { key: 'PF', label: 'Fouls', table: 'base' },
  { key: 'PLUS_MINUS', label: '+/-', table: 'base' },
  { key: 'MIN', label: 'Minutes', table: 'base' },
];

const ADVANCED_STATS = [
  { key: 'TS_PCT', label: 'TS %', table: 'advanced' },
  { key: 'EFG_PCT', label: 'eFG %', table: 'advanced' },
  { key: 'USG_PCT', label: 'Usage %', table: 'advanced' },
  { key: 'AST_PCT', label: 'AST %', table: 'advanced' },
  { key: 'REB_PCT', label: 'REB %', table: 'advanced' },
  { key: 'STL_PCT', label: 'STL %', table: 'advanced' },
  { key: 'BLK_PCT', label: 'BLK %', table: 'advanced' },
  { key: 'TOV_PCT', label: 'TOV %', table: 'advanced' },
  { key: 'OFF_RATING', label: 'ORTG', table: 'advanced' },
  { key: 'DEF_RATING', label: 'DRTG', table: 'advanced' },
  { key: 'NET_RATING', label: 'NetRTG', table: 'advanced' },
  { key: 'PIE', label: 'PIE', table: 'advanced' },
  { key: 'AST_TO', label: 'AST/TO', table: 'advanced' },
  { key: 'AST_RATIO', label: 'AST Ratio', table: 'advanced' },
  { key: 'OREB_PCT', label: 'OREB %', table: 'advanced' },
  { key: 'DREB_PCT', label: 'DREB %', table: 'advanced' },
  { key: 'PACE', label: 'Pace', table: 'advanced' },
];

const ALL_STATS = [...BASE_STATS, ...ADVANCED_STATS];

const NEGATIVE_STATS = ['TOV', 'TOV_PCT', 'DEF_RATING', 'PF'];
const PERCENTAGE_STATS = ['FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT', 'USG_PCT', 'AST_PCT', 'REB_PCT', 'STL_PCT', 'BLK_PCT', 'TOV_PCT', 'OREB_PCT', 'DREB_PCT', 'W_PCT'];

function formatStatValue(stat: string, value: number) {
  if (PERCENTAGE_STATS.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(1);
}

interface StatData {
  player_name: string;
  value: number;
  team_abbreviation: string;
  minutes: number;
}

interface DragDropZoneProps {
  onDrop: (stat: string) => void;
  currentStat: string | null;
  label: string;
  axis: 'x' | 'y';
  isMobile?: boolean;
  onMobileSelect?: () => void;
}

function DragDropZone({ onDrop, currentStat, label, axis, isMobile = false, onMobileSelect }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only clear drag state if we're actually leaving the drop zone
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      const margin = 5; // Small margin to prevent flickering
      if (clientX < rect.left - margin || clientX > rect.right + margin || 
          clientY < rect.top - margin || clientY > rect.bottom + margin) {
        setIsDragOver(false);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const stat = e.dataTransfer.getData('text/plain');
    onDrop(stat);
  };

  const handleMobileClick = () => {
    if (isMobile && onMobileSelect) {
      onMobileSelect();
    }
  };

  const isYAxis = axis === 'y';
  const baseClasses = `border-2 border-dashed rounded-xl transition-all duration-300 flex items-center justify-center relative`;
  
  const sizeClasses = isYAxis 
    ? 'w-20 h-full writing-mode-vertical'
    : 'w-full h-16';

  const colorClasses = isDragOver 
    ? 'border-[#78BE20] bg-[#78BE20]/20' 
    : currentStat 
    ? 'border-[#78BE20] bg-[#78BE20]/10'
    : 'border-gray-600 bg-[#1e2129]/50';

  const statInfo = ALL_STATS.find(s => s.key === currentStat);

  return (
    <div
      ref={dropZoneRef}
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${isMobile ? 'cursor-pointer' : ''}`}
      onDragOver={!isMobile ? handleDragOver : undefined}
      onDragEnter={!isMobile ? handleDragEnter : undefined}
      onDragLeave={!isMobile ? handleDragLeave : undefined}
      onDrop={!isMobile ? handleDrop : undefined}
      onClick={isMobile ? handleMobileClick : undefined}
    >
      <div className={`text-center ${isYAxis ? 'transform -rotate-90' : ''} pointer-events-none select-none`}>
        <div className="text-xs text-gray-400 font-semibold mb-1">{label}</div>
        {currentStat ? (
          <div className="text-white font-bold text-sm">{statInfo?.label || currentStat}</div>
        ) : (
          <div className="text-gray-500 text-sm">{isMobile ? 'Tap to select' : 'Drop stat here'}</div>
        )}
      </div>
    </div>
  );
}

interface StatChipProps {
  stat: { key: string; label: string; table: string };
  onDragStart: (stat: string) => void;
  onMobileClick?: (stat: string) => void;
  isMobile?: boolean;
}

function StatChip({ stat, onDragStart, onMobileClick, isMobile = false }: StatChipProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', stat.key);
    onDragStart(stat.key);
  };

  const handleMobileClick = () => {
    if (isMobile && onMobileClick) {
      onMobileClick(stat.key);
    }
  };

  const isAdvanced = stat.table === 'advanced';

  return (
    <div
      draggable={!isMobile}
      onDragStart={!isMobile ? handleDragStart : undefined}
      onClick={isMobile ? handleMobileClick : undefined}
      className={`px-3 py-2 bg-gradient-to-r ${
        isAdvanced 
          ? 'from-[#2a1f3d] to-[#1f1a2e] border-purple-500/30' 
          : 'from-[#23263a] to-[#1e2129] border-gray-600'
      } border rounded-lg text-white text-sm font-medium transition-all duration-200 select-none ${
        isMobile 
          ? 'cursor-pointer hover:border-[#78BE20] hover:shadow-lg hover:shadow-[#78BE20]/20 active:scale-95' 
          : 'cursor-grab active:cursor-grabbing hover:border-[#78BE20] hover:shadow-lg hover:shadow-[#78BE20]/20'
      }`}
    >
      <div className="flex items-center gap-1">
        {stat.label}
      </div>
    </div>
  );
}

export function HeatShotTool({ players }: { players: PlayerWithStats[] }) {
  const [baseData, setBaseData] = useState<FullSeasonBase[]>([]);
  const [advancedData, setAdvancedData] = useState<FullSeasonAdvanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [xAxisStat, setXAxisStat] = useState<string | null>(null);
  const [yAxisStat, setYAxisStat] = useState<string | null>(null);
  const [draggedStat, setDraggedStat] = useState<string | null>(null);
  const [showMobileStatSelector, setShowMobileStatSelector] = useState(false);
  const [mobileSelectingFor, setMobileSelectingFor] = useState<'x' | 'y' | null>(null);
  const [minMinutes, setMinMinutes] = useState(600);
  const [viewMode, setViewMode] = useState<'percentile' | 'raw'>('percentile');
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchAllStats() {
      setLoading(true);
      try {
        const [{ data: baseStats, error: baseError }, { data: advancedStats, error: advancedError }] = await Promise.all([
          supabase.from('full_season_base').select('*'),
          supabase.from('full_season_advanced').select('*')
        ]);

        if (baseError) throw baseError;
        if (advancedError) throw advancedError;

        setBaseData(baseStats || []);
        setAdvancedData(advancedStats || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    }
    fetchAllStats();
  }, []);

  // Filter Timberwolves players
  const wolvesPlayers = players.filter(p => p.PLAYER_NAME && (Number(p.MIN) * Number(p.GP)) >= minMinutes);
  const wolvesNames = wolvesPlayers.map(p => p.PLAYER_NAME);

  // Get stat data for a specific stat
  function getStatData(statKey: string): StatData[] {
    const statInfo = ALL_STATS.find(s => s.key === statKey);
    if (!statInfo) return [];

    const data = statInfo.table === 'base' ? baseData : advancedData;
    
    const filteredData = data
      .filter(player => {
        // For base table, filter by total minutes (MIN field)
        // For advanced table, filter by minutes per game (MIN field) * games played (GP field)
        if (statInfo.table === 'base') {
          const totalMinutes = parseFloat(player.MIN as any) || 0;
          return totalMinutes >= minMinutes;
        } else {
          // Advanced table: MIN is MPG, so we need MPG * GP >= minMinutes
          const mpg = parseFloat(player.MIN as any) || 0;
          const gp = player.GP || 0;
          return (mpg * gp) >= minMinutes;
        }
      })
      .map((player, index) => {
        const statValue = (player as any)[statKey];
        
        // Parse numeric values from strings for both base and advanced stats
        let parsedValue = statValue;
        if (typeof statValue === 'string') {
          parsedValue = parseFloat(statValue) || 0;
        }
        
        return {
          player_name: player.PLAYER_NAME,
          value: parsedValue || 0,
          team_abbreviation: player.TEAM_ABBREVIATION,
          minutes: statInfo.table === 'base' 
            ? parseFloat(player.MIN as any) || 0 
            : (parseFloat(player.MIN as any) || 0) * (player.GP || 0),
        };
      });

    return filteredData;
  }

  // Calculate percentile for a player in a specific stat
  function getPercentile(statKey: string, value: number) {
    const data = getStatData(statKey);
    if (data.length === 0) return 0;
    
    const values = data.map(d => d.value).sort((a, b) => a - b);
    let lower = 0;
    while (lower < values.length && values[lower] < value) lower++;
    let rawPercentile = lower / (values.length - 1);
    
    const isNegative = NEGATIVE_STATS.includes(statKey);
    return isNegative ? 1 - rawPercentile : rawPercentile;
  }

  // Get min/max values for raw stat mode
  function getStatRange(statKey: string) {
    const data = getStatData(statKey);
    if (data.length === 0) return { min: 0, max: 100 };
    
    const values = data.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  // Prepare scatter plot data
  const getScatterData = () => {
    if (!xAxisStat || !yAxisStat) {
      return { timberwolvesData: [], leagueData: [] };
    }

    const xData = getStatData(xAxisStat);
    const yData = getStatData(yAxisStat);

    const timberwolvesData: any[] = [];
    const leagueData: any[] = [];

    xData.forEach(xPlayer => {
      const yPlayer = yData.find(y => y.player_name === xPlayer.player_name);
      if (!yPlayer) return;

      let xValue, yValue;
      
      if (viewMode === 'percentile') {
        xValue = getPercentile(xAxisStat, xPlayer.value) * 100;
        yValue = getPercentile(yAxisStat, yPlayer.value) * 100;
      } else {
        xValue = xPlayer.value;
        yValue = yPlayer.value;
      }

      const playerData = {
        name: xPlayer.player_name,
        value: [xValue, yValue],
        xRawValue: xPlayer.value,
        yRawValue: yPlayer.value,
        team: xPlayer.team_abbreviation,
      };

      if (wolvesNames.includes(xPlayer.player_name)) {
        const playerInfo = wolvesPlayers.find(p => p.PLAYER_NAME === xPlayer.player_name);
        timberwolvesData.push({
          ...playerData,
          imageUrl: playerInfo?.image_url || '',
        });
      } else {
        leagueData.push(playerData);
      }
    });

    return { timberwolvesData, leagueData };
  };

  const { timberwolvesData, leagueData } = getScatterData();

  // Mobile selection handlers
  const handleMobileAxisSelect = (axis: 'x' | 'y') => {
    setMobileSelectingFor(axis);
    setShowMobileStatSelector(true);
  };

  const handleMobileStatSelect = (stat: string) => {
    if (mobileSelectingFor === 'x') {
      setXAxisStat(stat);
    } else if (mobileSelectingFor === 'y') {
      setYAxisStat(stat);
    }
    setShowMobileStatSelector(false);
    setMobileSelectingFor(null);
  };

  const handleMobileStatChipClick = (stat: string) => {
    if (mobileSelectingFor) {
      handleMobileStatSelect(stat);
    }
  };

  // ECharts configuration
  const getChartOptions = () => {
    const xRange = viewMode === 'raw' && xAxisStat ? getStatRange(xAxisStat) : { min: 0, max: 100 };
    const yRange = viewMode === 'raw' && yAxisStat ? getStatRange(yAxisStat) : { min: 0, max: 100 };
    
    const xStatInfo = ALL_STATS.find(s => s.key === xAxisStat);
    const yStatInfo = ALL_STATS.find(s => s.key === yAxisStat);

    return {
      backgroundColor: 'transparent',
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: xAxisStat ? `${xStatInfo?.label || xAxisStat}${viewMode === 'percentile' ? ' Percentile' : ''}` : 'X-Axis',
        nameLocation: 'middle',
        nameGap: 30,
        min: xRange.min,
        max: xRange.max,
        axisLine: { lineStyle: { color: '#666' } },
        axisTick: { lineStyle: { color: '#666' } },
        axisLabel: { 
          color: '#ccc',
          formatter: (value: number) => viewMode === 'percentile' ? `${value}%` : value.toFixed(1)
        },
        splitLine: { 
          lineStyle: { color: '#333', type: 'dashed' } 
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisStat ? `${yStatInfo?.label || yAxisStat}${viewMode === 'percentile' ? ' Percentile' : ''}` : 'Y-Axis',
        nameLocation: 'middle',
        nameGap: 50,
        min: yRange.min,
        max: yRange.max,
        axisLine: { lineStyle: { color: '#666' } },
        axisTick: { lineStyle: { color: '#666' } },
        axisLabel: { 
          color: '#ccc',
          formatter: (value: number) => viewMode === 'percentile' ? `${value}%` : value.toFixed(1)
        },
        splitLine: { 
          lineStyle: { color: '#333', type: 'dashed' } 
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(35, 38, 58, 0.95)',
        borderColor: '#78BE20',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const data = params.data;
          if (!data) return '';
          
          const xStatLabel = xStatInfo?.label || 'X';
          const yStatLabel = yStatInfo?.label || 'Y';
          const xValueFormatted = xAxisStat ? formatStatValue(xAxisStat, data.xRawValue) : '';
          const yValueFormatted = yAxisStat ? formatStatValue(yAxisStat, data.yRawValue) : '';
          
          let tooltip = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; color: #78BE20; margin-bottom: 4px;">${data.name}</div>
              <div style="color: #ccc; font-size: 12px; margin-bottom: 6px;">${data.team}</div>
              <div>${xStatLabel}: ${xValueFormatted}`;
          
          if (viewMode === 'percentile') {
            tooltip += ` (${data.value[0].toFixed(1)}%)`;
          }
          
          tooltip += `</div><div>${yStatLabel}: ${yValueFormatted}`;
          
          if (viewMode === 'percentile') {
            tooltip += ` (${data.value[1].toFixed(1)}%)`;
          }
          
          tooltip += `</div></div>`;
          
          return tooltip;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: '#ccc' },
      },
      series: [
        {
          name: 'Other NBA Players',
          type: 'scatter',
          data: leagueData,
          symbolSize: 6,
          itemStyle: {
            color: '#666',
            opacity: 0.6,
          },
          emphasis: {
            itemStyle: {
              color: '#999',
              opacity: 0.8,
            },
          },
        },
        {
          name: 'Timberwolves',
          type: 'scatter',
          data: timberwolvesData,
          symbolSize: 36,
          symbol: (value: any, params: any) => {
            const player = timberwolvesData[params.dataIndex];
            if (player && player.imageUrl) {
              return `image://${player.imageUrl}`;
            }
            return 'circle';
          },
          itemStyle: {
            color: '#78BE20',
            borderColor: '#fff',
            borderWidth: 2,
          },
          emphasis: {
            symbolSize: 48,
            itemStyle: {
              color: '#4ade80',
              borderColor: '#fff',
              borderWidth: 3,
            },
          },
        },
      ],
    };
  };

  if (loading) {
    return <div className="text-gray-400">Loading Headshot Tool...</div>;
  }

  return (
    <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2 drop-shadow-glow">
          Headshot Tool
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-[#23263a] border border-gray-600 rounded-lg hover:border-[#78BE20] transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-[#23263a]/60 rounded-lg border border-gray-600/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Minutes
              </label>
              <input
                type="number"
                value={minMinutes}
                onChange={(e) => setMinMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#1e2129] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#78BE20]"
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                View Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('percentile')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'percentile'
                      ? 'bg-[#78BE20] text-black font-semibold'
                      : 'bg-[#1e2129] text-white border border-gray-600 hover:border-[#78BE20]'
                  }`}
                >
                  Percentile
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'raw'
                      ? 'bg-[#78BE20] text-black font-semibold'
                      : 'bg-[#1e2129] text-white border border-gray-600 hover:border-[#78BE20]'
                  }`}
                >
                  Raw Values
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-[#23263a]/60 rounded-lg border border-gray-600/30">
        <p className="text-gray-300 text-sm hidden md:block">
          Drag and drop stats from below onto the X and Y axes to create a scatter plot. 
          Purple chips are advanced stats, gray chips are basic stats.
          {viewMode === 'percentile' 
            ? ' Position is based on league percentile rankings.' 
            : ' Position is based on raw stat values.'}
        </p>
        <p className="text-gray-300 text-sm md:hidden">
          Click on the X and Y axis boxes to select stats and create a scatter plot.
          {viewMode === 'percentile' 
            ? ' Position is based on league percentile rankings.' 
            : ' Position is based on raw stat values.'}
        </p>
      </div>

      {/* Available Stats - Desktop Only */}
      <div className="mb-4 hidden md:block">
        <h3 className="text-lg font-bold text-white mb-3">Available Stats</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Basic Stats</h4>
            <div className="flex flex-wrap gap-2">
              {BASE_STATS.map(stat => (
                <StatChip
                  key={stat.key}
                  stat={stat}
                  onDragStart={setDraggedStat}
                  onMobileClick={handleMobileStatChipClick}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Advanced Stats</h4>
            <div className="flex flex-wrap gap-2">
              {ADVANCED_STATS.map(stat => (
                <StatChip
                  key={stat.key}
                  stat={stat}
                  onDragStart={setDraggedStat}
                  onMobileClick={handleMobileStatChipClick}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-[#141923]/60 rounded-lg p-3">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <DragDropZone
              onDrop={setYAxisStat}
              currentStat={yAxisStat}
              label="Y-Axis"
              axis="x"
              isMobile={isMobile}
              onMobileSelect={() => handleMobileAxisSelect('y')}
            />
            <DragDropZone
              onDrop={setXAxisStat}
              currentStat={xAxisStat}
              label="X-Axis"
              axis="x"
              isMobile={isMobile}
              onMobileSelect={() => handleMobileAxisSelect('x')}
            />
          </div>
          
          <div className="aspect-square max-w-[400px] mx-auto">
            {xAxisStat && yAxisStat ? (
              <ReactEChartsCore
                echarts={echarts}
                option={getChartOptions()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ScatterChartIcon className="w-16 h-16 mb-4 mx-auto text-gray-500" />
                  <div className="text-lg">Select stats for both axes to see the scatter plot</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex gap-4">
          <div className="flex flex-col justify-center">
            <DragDropZone
              onDrop={setYAxisStat}
              currentStat={yAxisStat}
              label="Y-Axis"
              axis="y"
              isMobile={isMobile}
            />
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="aspect-square mb-3 max-h-[60vh]">
              {xAxisStat && yAxisStat ? (
                <ReactEChartsCore
                  echarts={echarts}
                  option={getChartOptions()}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <ScatterChartIcon className="w-16 h-16 mb-4 mx-auto text-gray-500" />
                    <div className="text-lg">Select stats for both axes to see the scatter plot</div>
                  </div>
                </div>
              )}
            </div>
            
            <DragDropZone
              onDrop={setXAxisStat}
              currentStat={xAxisStat}
              label="X-Axis"
              axis="x"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      {xAxisStat && yAxisStat && (
        <div className="mt-3 text-xs text-gray-400 bg-[#141923]/60 rounded-lg p-2 shadow-inner">
          <div className="flex items-center gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              <span>Other NBA Players ({leagueData.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#78BE20] border border-white"></div>
              <span>Timberwolves ({timberwolvesData.length})</span>
            </div>
          </div>
          <div className="text-center mt-2">
            Filtered by {minMinutes}+ minutes. 
            {viewMode === 'percentile' 
              ? ' Position based on league percentile ranking.' 
              : ' Position based on raw stat values.'}
          </div>
        </div>
      )}

      {/* Mobile Stat Selector Modal */}
      {showMobileStatSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 md:hidden">
          <div className="bg-[#23263a] rounded-lg p-6 m-4 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-white font-bold text-lg mb-4">
              Select {mobileSelectingFor === 'x' ? 'X-Axis' : 'Y-Axis'} Stat
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Basic Stats</h4>
                <div className="grid grid-cols-2 gap-2">
                  {BASE_STATS.map(stat => (
                    <button
                      key={stat.key}
                      onClick={() => handleMobileStatSelect(stat.key)}
                      className="px-3 py-2 bg-gradient-to-r from-[#1e2129] to-[#23263a] border border-gray-600 rounded-lg text-white text-sm font-medium hover:border-[#78BE20] hover:shadow-lg hover:shadow-[#78BE20]/20 transition-all duration-200 active:scale-95"
                    >
                      {stat.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Advanced Stats</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ADVANCED_STATS.map(stat => (
                    <button
                      key={stat.key}
                      onClick={() => handleMobileStatSelect(stat.key)}
                      className="px-3 py-2 bg-gradient-to-r from-[#2a1f3d] to-[#1f1a2e] border border-purple-500/30 rounded-lg text-white text-sm font-medium hover:border-[#78BE20] hover:shadow-lg hover:shadow-[#78BE20]/20 transition-all duration-200 active:scale-95"
                    >
                      {stat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowMobileStatSelector(false);
                setMobileSelectingFor(null);
              }}
              className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
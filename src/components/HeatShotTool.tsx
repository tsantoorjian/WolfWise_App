import { useEffect, useState, useRef } from 'react';
import { PlayerWithStats } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { ThreePointData, DistributionStats } from '../types/database.types';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register required components
echarts.use([ScatterChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// Same stat list from PerformanceGrid
const STAT_LIST = [
  '3pt percentage',
  'Fg %',
  'Steals per game',
  'Assists per game',
  'Turnovers per game',
  'Blocks per game',
  'Points Per Game',
  'EFG %'
];

const NEGATIVE_STATS = ['Turnovers per game'];
const PERCENTAGE_STATS = ['3pt percentage', 'Fg %', 'EFG %'];

function getStatLabel(stat: string) {
  const map: Record<string, string> = {
    '3pt percentage': '3PT %',
    'Fg %': 'FG %',
    'Steals per game': 'Steals',
    'Assists per game': 'Assists',
    'Turnovers per game': 'Turnovers',
    'Blocks per game': 'Blocks',
    'Points Per Game': 'Points',
    'EFG %': 'eFG %',
  };
  return map[stat] || stat;
}

function formatStatValue(stat: string, value: number) {
  if (PERCENTAGE_STATS.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(1);
}

interface DragDropZoneProps {
  onDrop: (stat: string) => void;
  currentStat: string | null;
  label: string;
  axis: 'x' | 'y';
}

function DragDropZone({ onDrop, currentStat, label, axis }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const stat = e.dataTransfer.getData('text/plain');
    onDrop(stat);
  };

  // Different styles for x and y axis zones
  const isYAxis = axis === 'y';
  const baseClasses = `border-2 border-dashed rounded-xl transition-all duration-300 flex items-center justify-center relative`;
  
  const sizeClasses = isYAxis 
    ? 'w-20 h-full writing-mode-vertical' // Vertical for Y-axis
    : 'w-full h-16'; // Horizontal for X-axis

  const colorClasses = isDragOver 
    ? 'border-[#78BE20] bg-[#78BE20]/20' 
    : currentStat 
    ? 'border-[#78BE20] bg-[#78BE20]/10' // Green when stat is selected
    : 'border-gray-600 bg-[#1e2129]/50';

  return (
    <div
      className={`${baseClasses} ${sizeClasses} ${colorClasses}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`text-center ${isYAxis ? 'transform -rotate-90' : ''}`}>
        <div className="text-xs text-gray-400 font-semibold mb-1">{label}</div>
        {currentStat ? (
          <div className="text-white font-bold text-sm">{getStatLabel(currentStat)}</div>
        ) : (
          <div className="text-gray-500 text-sm">Drop stat here</div>
        )}
      </div>
    </div>
  );
}

interface StatChipProps {
  stat: string;
  onDragStart: (stat: string) => void;
}

function StatChip({ stat, onDragStart }: StatChipProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', stat);
    onDragStart(stat);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="px-3 py-2 bg-gradient-to-r from-[#23263a] to-[#1e2129] border border-gray-600 rounded-lg text-white text-sm font-medium cursor-grab active:cursor-grabbing hover:border-[#78BE20] hover:shadow-lg hover:shadow-[#78BE20]/20 transition-all duration-200 select-none"
    >
      {getStatLabel(stat)}
    </div>
  );
}

export function HeatShotTool({ players }: { players: PlayerWithStats[] }) {
  const [statData, setStatData] = useState<Record<string, ThreePointData[]>>({});
  const [loading, setLoading] = useState(true);
  const [xAxisStat, setXAxisStat] = useState<string | null>(null);
  const [yAxisStat, setYAxisStat] = useState<string | null>(null);
  const [draggedStat, setDraggedStat] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllStats() {
      setLoading(true);
      const allStats: Record<string, ThreePointData[]> = {};
      for (const stat of STAT_LIST) {
        const { data, error } = await supabase
          .from('distribution_stats')
          .select('*')
          .eq('stat', stat)
          .gte('minutes_played', 600);
        if (!error && data) {
          allStats[stat] = data.map((row: DistributionStats) => ({
            player_name: row.player_name,
            value: PERCENTAGE_STATS.includes(stat) && row.value > 1 ? row.value / 100 : row.value,
            team_abbreviation: row.team_abbreviation,
            minutes_played: row.minutes_played,
          }));
        }
      }
      setStatData(allStats);
      setLoading(false);
    }
    fetchAllStats();
  }, []);

  // Filter Timberwolves players
  const wolvesPlayers = players.filter(p => p.PLAYER_NAME && (Number(p.MIN) * Number(p.GP)) >= 600);
  const wolvesNames = wolvesPlayers.map(p => p.PLAYER_NAME);

  // Calculate percentile for a player in a specific stat
  function getPercentile(stat: string, value: number) {
    const data = statData[stat] || [];
    if (data.length === 0) return 0;
    const values = data.map(d => d.value).sort((a, b) => a - b);
    let lower = 0;
    while (lower < values.length && values[lower] < value) lower++;
    let rawPercentile = lower / (values.length - 1);
    const isNegative = NEGATIVE_STATS.includes(stat);
    return isNegative ? 1 - rawPercentile : rawPercentile;
  }

  // Prepare scatter plot data
  const getScatterData = () => {
    if (!xAxisStat || !yAxisStat || !statData[xAxisStat] || !statData[yAxisStat]) {
      return { timberwolvesData: [], leagueData: [] };
    }

    const timberwolvesData: any[] = [];
    const leagueData: any[] = [];

    // Get all players who have data for both stats
    const xData = statData[xAxisStat];
    const yData = statData[yAxisStat];

    xData.forEach(xPlayer => {
      const yPlayer = yData.find(y => y.player_name === xPlayer.player_name);
      if (!yPlayer) return;

      const xPercentile = getPercentile(xAxisStat, xPlayer.value);
      const yPercentile = getPercentile(yAxisStat, yPlayer.value);

      const playerData = {
        name: xPlayer.player_name,
        value: [xPercentile * 100, yPercentile * 100],
        xValue: xPlayer.value,
        yValue: yPlayer.value,
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

  // ECharts configuration
  const getChartOptions = () => {
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
        name: xAxisStat ? getStatLabel(xAxisStat) + ' Percentile' : 'X-Axis',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#666' } },
        axisTick: { lineStyle: { color: '#666' } },
        axisLabel: { 
          color: '#ccc',
          formatter: (value: number) => `${value}%`
        },
        splitLine: { 
          lineStyle: { color: '#333', type: 'dashed' } 
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisStat ? getStatLabel(yAxisStat) + ' Percentile' : 'Y-Axis',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#666' } },
        axisTick: { lineStyle: { color: '#666' } },
        axisLabel: { 
          color: '#ccc',
          formatter: (value: number) => `${value}%`
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
          
          const xStatLabel = xAxisStat ? getStatLabel(xAxisStat) : 'X';
          const yStatLabel = yAxisStat ? getStatLabel(yAxisStat) : 'Y';
          const xValueFormatted = xAxisStat ? formatStatValue(xAxisStat, data.xValue) : '';
          const yValueFormatted = yAxisStat ? formatStatValue(yAxisStat, data.yValue) : '';
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; color: #78BE20; margin-bottom: 4px;">${data.name}</div>
              <div style="color: #ccc; font-size: 12px; margin-bottom: 6px;">${data.team}</div>
              <div>${xStatLabel}: ${xValueFormatted} (${data.value[0].toFixed(1)}%)</div>
              <div>${yStatLabel}: ${yValueFormatted} (${data.value[1].toFixed(1)}%)</div>
            </div>
          `;
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
          symbolSize: 12,
          itemStyle: {
            color: '#78BE20',
            borderColor: '#fff',
            borderWidth: 2,
          },
          emphasis: {
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
    return <div className="text-gray-400">Loading HeatShot Tool...</div>;
  }

  return (
    <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-4 md:p-8">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-8 flex items-center gap-2 drop-shadow-glow">
        HeatShot Tool
      </h2>
      
      {/* Instructions */}
      <div className="mb-6 p-4 bg-[#23263a]/60 rounded-lg border border-gray-600/30">
        <p className="text-gray-300 text-sm">
          Drag and drop stats from below onto the X and Y axes to create a scatter plot. 
          Timberwolves players appear as green dots, while other NBA players appear as gray dots.
          Position is based on league percentile rankings.
        </p>
      </div>

      {/* Available Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-3">Available Stats</h3>
        <div className="flex flex-wrap gap-2">
          {STAT_LIST.map(stat => (
            <StatChip
              key={stat}
              stat={stat}
              onDragStart={setDraggedStat}
            />
          ))}
        </div>
      </div>

      {/* Chart Area with Positioned Drop Zones */}
      <div className="bg-[#141923]/60 rounded-lg p-4">
        {/* Mobile Layout - Drop zones above chart */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <DragDropZone
              onDrop={setYAxisStat}
              currentStat={yAxisStat}
              label="Y-Axis"
              axis="x"
            />
            <DragDropZone
              onDrop={setXAxisStat}
              currentStat={xAxisStat}
              label="X-Axis"
              axis="x"
            />
          </div>
          
          {/* Chart */}
          <div className="min-h-[400px]">
            {xAxisStat && yAxisStat ? (
              <ReactEChartsCore
                echarts={echarts}
                option={getChartOptions()}
                style={{ height: '400px', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <div className="text-lg">Select stats for both axes to see the scatter plot</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout - Drop zones positioned around chart */}
        <div className="hidden md:flex gap-4">
          {/* Y-Axis Drop Zone - Vertical on the left */}
          <div className="flex flex-col justify-center">
            <DragDropZone
              onDrop={setYAxisStat}
              currentStat={yAxisStat}
              label="Y-Axis"
              axis="y"
            />
          </div>
          
          {/* Chart and X-Axis Drop Zone Container */}
          <div className="flex-1 flex flex-col">
            {/* Chart */}
            <div className="min-h-[500px] mb-4">
              {xAxisStat && yAxisStat ? (
                <ReactEChartsCore
                  echarts={echarts}
                  option={getChartOptions()}
                  style={{ height: '500px', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-lg">Select stats for both axes to see the scatter plot</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* X-Axis Drop Zone - Horizontal below chart */}
            <DragDropZone
              onDrop={setXAxisStat}
              currentStat={xAxisStat}
              label="X-Axis"
              axis="x"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      {xAxisStat && yAxisStat && (
        <div className="mt-4 text-xs text-gray-400 bg-[#141923]/60 rounded-lg p-3 shadow-inner">
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
            Only players with 600+ total minutes shown. Position based on league percentile ranking.
          </div>
        </div>
      )}
    </div>
  );
} 
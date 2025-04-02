import { useState } from 'react';
import { ThreePointData } from '../types/database.types';
import ReactECharts from 'echarts-for-react';
import { ChevronDown, Info } from 'lucide-react';
import { PlayerWithStats } from '../hooks/useSupabase';

type DistributionProps = {
  distributionData: ThreePointData[];
  players: PlayerWithStats[];
  onStatChange: (stat: string) => void;
  selectedStat: string;
};

const AVAILABLE_STATS = [
  { value: '3pt percentage', label: '3PT %', isPercentage: true },
  { value: 'Fg %', label: 'FG %', isPercentage: true },
  { value: 'Steals per game', label: 'Steals', isPercentage: false },
  { value: 'Assists per game', label: 'Assists', isPercentage: false },
  { value: 'Turnovers per game', label: 'Turnovers', isPercentage: false },
  { value: 'Blocks per game', label: 'Blocks', isPercentage: false },
  { value: 'Points Per Game', label: 'Points', isPercentage: false },
  { value: 'EFG %', label: 'eFG %', isPercentage: true }
];

export function ThreePointDistribution({ 
  distributionData, 
  players, 
  onStatChange,
  selectedStat 
}: DistributionProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<ThreePointData | null>(null);
  const [showStatSelect, setShowStatSelect] = useState(false);

  // Sort data for line chart
  const sortedData = [...distributionData].sort((a, b) => a.value - b.value);
  const twolvesData = sortedData.filter(p => p.team_abbreviation === 'MIN');

  // Now we can log after twolvesData is defined
  console.log('Players:', players.map(p => ({name: p.PLAYER_NAME, image: p.image_url})));
  console.log('Timberwolves Data:', twolvesData);

  const isPercentageStat = AVAILABLE_STATS.find(s => s.value === selectedStat)?.isPercentage ?? false;

  const getStatLabel = (value: number) => {
    if (isPercentageStat) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  const getStatName = () => {
    const stat = AVAILABLE_STATS.find(s => s.value === selectedStat);
    return stat?.label || selectedStat;
  };

  // Calculate kernel density estimation with dynamic bandwidth
  const calculateKDE = (data: ThreePointData[]) => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    const bandwidth = range / Math.sqrt(values.length);
    const points = 200;
    const step = range / points;

    const result = [];
    for (let x = min - bandwidth; x <= max + bandwidth; x += step) {
      let density = 0;
      for (const value of values) {
        const u = (x - value) / bandwidth;
        density += Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI));
      }
      density /= values.length;
      density *= data.length * bandwidth * 2;
      result.push([x, density]);
    }
    return result;
  };

  const allKDE = calculateKDE(sortedData);

  const findDensity = (value: number) => {
    const points = allKDE.filter(point => Math.abs(point[0] - value) <= 0.5);
    if (points.length === 0) return 0;
    
    points.sort((a, b) => Math.abs(a[0] - value) - Math.abs(b[0] - value));
    
    if (points.length >= 2) {
      const [x1, y1] = points[0];
      const [x2, y2] = points[1];
      const ratio = (value - x1) / (x2 - x1);
      return y1 + (y2 - y1) * ratio;
    }
    
    return points[0][1];
  };

  const twolvesScatter = twolvesData.map(player => {
    const value = player.value;
    const density = findDensity(value);
    const playerData = players.find(p => p.PLAYER_NAME === player.player_name);
    
    return {
      value: [value, density],
      symbol: `image://${playerData?.image_url || 'https://via.placeholder.com/40'}`,
      symbolSize: 50,
      name: player.player_name,
      itemStyle: {
        borderColor: '#78BE20',
        borderWidth: 2,
        borderType: 'solid',
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.2)'
      }
    };
  });

  const calculateHistogram = (data: ThreePointData[]) => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const bucketSize = range / 20;
    const buckets: { [key: number]: number } = {};
    
    for (let x = min; x <= max; x += bucketSize) {
      buckets[x] = 0;
    }
    
    values.forEach(value => {
      const bucketIndex = Math.floor((value - min) / bucketSize) * bucketSize + min;
      buckets[bucketIndex] = (buckets[bucketIndex] || 0) + 1;
    });
    
    return Object.entries(buckets).map(([x, count]) => [parseFloat(x), count]);
  };

  const histogramData = calculateHistogram(sortedData);

  const option = {
    backgroundColor: '#1e2129',
    title: {
      text: `League-wide ${getStatName()} Distribution`,
      left: 'center',
      top: 10,
      textStyle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      axisPointer: { type: 'none' },
      backgroundColor: '#141923',
      borderColor: '#141923',
      textStyle: { color: '#FFFFFF' },
      formatter: function(params: any) {
        if (params.seriesName === 'Timberwolves Players') {
          return `${params.name}<br/>${getStatName()}: ${getStatLabel(params.value[0])}`;
        }
        return '';
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: getStatName(),
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      axisLabel: {
        formatter: (value: number) => getStatLabel(value),
        color: '#FFFFFF'
      },
      axisLine: { lineStyle: { color: '#FFFFFF' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Players',
      nameLocation: 'middle',
      nameGap: 40,
      minInterval: 1,
      axisLabel: { color: '#FFFFFF' },
      axisLine: { lineStyle: { color: '#FFFFFF' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#333844' } }
    },
    series: [
      {
        name: 'League Distribution',
        type: 'line',
        smooth: true,
        data: allKDE,
        lineStyle: {
          color: '#9EA2A2',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(158, 162, 162, 0.3)' },
              { offset: 1, color: 'rgba(158, 162, 162, 0.05)' }
            ]
          }
        },
        tooltip: { show: false },
        z: 1
      },
      {
        name: 'Player Count',
        type: 'bar',
        data: histogramData,
        barWidth: '90%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#333844' },
              { offset: 1, color: 'rgba(51, 56, 68, 0.3)' }
            ]
          }
        },
        tooltip: {
          formatter: function(params: any) {
            const value = params.data[0];
            const count = params.data[1];
            return `${getStatLabel(value)}: ${count} players`;
          }
        },
        z: 0
      },
      {
        name: 'Timberwolves Players',
        type: 'scatter',
        data: twolvesScatter,
        emphasis: {
          scale: true,
          itemStyle: {
            borderColor: '#4ade80',
            borderWidth: 3
          }
        },
        z: 2
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setShowStatSelect(!showStatSelect)}
              className="w-full md:w-auto px-4 py-2 bg-[#141923] text-white rounded-lg flex items-center justify-between gap-2 hover:bg-[#78BE20] transition-colors"
            >
              <span>{getStatName()}</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${showStatSelect ? 'rotate-180' : ''}`} />
            </button>
            {showStatSelect && (
              <div className="absolute z-10 mt-2 w-full md:w-48 bg-[#141923] rounded-lg shadow-lg border border-gray-700/50 py-1">
                {AVAILABLE_STATS.map(stat => (
                  <button
                    key={stat.value}
                    onClick={() => {
                      onStatChange(stat.value);
                      setShowStatSelect(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-[#1e2129] ${
                      selectedStat === stat.value ? 'text-[#78BE20] font-medium' : 'text-white'
                    }`}
                  >
                    {stat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-[#78BE20] to-[#4ade80] rounded"></div>
              <span className="text-white">Timberwolves Players</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-[#9EA2A2] to-[#333844] rounded"></div>
              <span className="text-white">League Distribution</span>
            </div>
          </div>
        </div>

        <div className="h-[400px]">
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <h3 className="text-sm font-medium text-white">Timberwolves Players:</h3>
            <div className="flex flex-wrap gap-2">
              {twolvesData.map(player => {
                const playerData = players.find(p => p.PLAYER_NAME === player.player_name);
                if (!playerData?.image_url) return null;

                return (
                  <div
                    key={player.player_name}
                    className="relative group"
                  >
                    <div className="relative">
                      <img
                        src={playerData.image_url}
                        alt={player.player_name}
                        className="w-10 h-10 rounded-full border-2 border-[#78BE20] bg-[#141923] object-cover hover:border-[#4ade80] transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredPlayer(player)}
                        onMouseLeave={() => setHoveredPlayer(null)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/40';
                        }}
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    {hoveredPlayer?.player_name === player.player_name && (
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#0f1119] text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10 shadow-lg border border-gray-700/50">
                        <div className="font-semibold mb-1">{player.player_name}</div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-white/70">{getStatName()}:</span>
                            <span className="font-medium">{getStatLabel(player.value)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-white/70">Minutes:</span>
                            <span className="font-medium">{player.minutes_played.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#141923]/60 rounded-lg p-3">
            <Info className="w-4 h-4" />
            <span>Minimum 600 minutes played required for inclusion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
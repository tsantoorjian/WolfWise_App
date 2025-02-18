import { useState } from 'react';
import { NbaPlayerStats, ThreePointData } from '../types/database.types';
import ReactECharts from 'echarts-for-react';

type DistributionProps = {
  distributionData: ThreePointData[];
  players: NbaPlayerStats[];
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

  // Sort data for line chart
  const sortedData = [...distributionData].sort((a, b) => a.value - b.value);
  const twolvesData = sortedData.filter(p => p.team_abbreviation === 'MIN');

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
      // Scale density to match histogram height
      density *= data.length * bandwidth * 2;  // Increased scaling factor
      result.push([x, density]);
    }
    return result;
  };

  const allKDE = calculateKDE(sortedData);

  // Find density for a specific value using interpolation
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

  // Create scatter data for Timberwolves players with images
  const twolvesScatter = twolvesData.map(player => {
    const value = player.value;
    const density = findDensity(value);
    const playerData = players.find(p => p.player_name === player.player_name);
    
    return {
      value: [value, density],
      symbol: `image://${playerData?.image_url || 'https://via.placeholder.com/40'}`,
      symbolSize: 50, // Increased size
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

  // Calculate histogram data
  const calculateHistogram = (data: ThreePointData[]) => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Use around 20 buckets
    const bucketSize = range / 20;
    const buckets: { [key: number]: number } = {};
    
    // Initialize buckets
    for (let x = min; x <= max; x += bucketSize) {
      buckets[x] = 0;
    }
    
    // Count values in each bucket
    values.forEach(value => {
      const bucketIndex = Math.floor((value - min) / bucketSize) * bucketSize + min;
      buckets[bucketIndex] = (buckets[bucketIndex] || 0) + 1;
    });
    
    // Convert to array of [x, count] pairs
    return Object.entries(buckets).map(([x, count]) => [parseFloat(x), count]);
  };

  const histogramData = calculateHistogram(sortedData);

  const option = {
    backgroundColor: '#FFFFFF',
    title: {
      text: `League-wide ${getStatName()} Distribution`,
      left: 'center',
      top: 10,
      textStyle: {
        color: '#0C2340',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'none'
      },
      formatter: function(params: any) {
        // Only show tooltip for player points
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
      min: 0,  // Set minimum value to 0
      axisLabel: {
        formatter: (value: number) => getStatLabel(value)
      }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Players',
      nameLocation: 'middle',
      nameGap: 40,
      minInterval: 1  // Ensure whole numbers for player counts
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
          color: '#9EA2A2',
          opacity: 0.1
        },
        tooltip: {
          show: false
        },
        z: 1
      },
      {
        name: 'Player Count',
        type: 'bar',
        data: histogramData,
        barWidth: '90%',
        itemStyle: {
          color: '#9EA2A2',
          opacity: 0.3
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
            borderColor: '#236192',
            borderWidth: 3
          }
        },
        z: 2
      }
    ]
  };

  // Player markers for legend
  const playerMarkers = twolvesData.map(player => {
    const playerData = players.find(p => p.player_name === player.player_name);
    if (!playerData?.image_url) return null;

    return (
      <div
        key={player.player_name}
        className="relative inline-block mx-1"
      >
        <img
          src={playerData.image_url}
          alt={player.player_name}
          className="w-8 h-8 rounded-full border-2 border-[#78BE20] bg-white object-cover hover:border-[#236192] transition-colors cursor-pointer"
          onMouseEnter={() => setHoveredPlayer(player)}
          onMouseLeave={() => setHoveredPlayer(null)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/32';
          }}
        />
        {hoveredPlayer?.player_name === player.player_name && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#0C2340] text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
            <div className="font-semibold">{player.player_name}</div>
            <div>{getStatName()}: {getStatLabel(player.value)}</div>
            <div>Minutes: {player.minutes_played.toFixed(0)}</div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedStat}
            onChange={(e) => onStatChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#78BE20] focus:border-transparent"
          >
            {AVAILABLE_STATS.map(stat => (
              <option key={stat.value} value={stat.value}>
                {stat.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#78BE20] rounded"></div>
              <span className="text-[#0C2340]">Timberwolves Players</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#9EA2A2] rounded"></div>
              <span className="text-[#0C2340]">League Distribution</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-[#0C2340] font-medium">Timberwolves Players:</span>
        {playerMarkers}
      </div>
      
      <div className="mt-2 text-sm text-[#9EA2A2]">
        * Minimum 600 minutes played required
      </div>
    </div>
  );
}
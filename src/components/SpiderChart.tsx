import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FullSeasonBasePerGame } from '../types/database.types';
import { Info, BarChart3 } from 'lucide-react';

interface SpiderChartProps {
  player: {
    PLAYER_NAME: string;
    PTS: number;
    REB: number;
    AST: number;
    STL: number;
    FG3_PCT: number;
    FG_PCT: number;
    FT_PCT: number;
  };
}

interface StatData {
  player_name: string;
  value: number;
  team_abbreviation: string;
  minutes: number;
}

const SPIDER_STATS = [
  { key: 'PTS', label: 'Points' },
  { key: 'REB', label: 'Rebounds' },
  { key: 'AST', label: 'Assists' },
  { key: 'STL', label: 'Steals' },
  { key: 'FG3_PCT', label: '3PT %' },
  { key: 'FG_PCT', label: 'FG %' },
  { key: 'FT_PCT', label: 'FT %' },
];

const NEGATIVE_STATS: string[] = []; // None of our spider stats are negative

export function SpiderChart({ player }: SpiderChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [baseData, setBaseData] = useState<FullSeasonBasePerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentiles, setPercentiles] = useState<Record<string, number>>({});
  const [hoveredStat, setHoveredStat] = useState<{ key: string; label: string; value: number; canvasX: number; canvasY: number } | null>(null);

  useEffect(() => {
    async function fetchBaseStats() {
      try {
        const { data: baseStats, error } = await supabase
          .from('full_season_base_per_game')
          .select('*');

        if (error) throw error;
        setBaseData(baseStats || []);
      } catch (error) {
        console.error('Error fetching base stats:', error);
      }
      setLoading(false);
    }
    fetchBaseStats();
  }, []);

  // Get stat data for a specific stat
  function getStatData(statKey: string): StatData[] {
    const data = baseData
      .filter(player => {
        const mpg = parseFloat(player.MIN as any) || 0;
        const gp = player.GP || 0;
        return (mpg * gp) >= 600; // 600 total minutes minimum
      })
      .map((player) => {
        const statValue = (player as any)[statKey];
        
        let parsedValue = statValue;
        if (typeof statValue === 'string') {
          parsedValue = parseFloat(statValue) || 0;
        }
        
        return {
          player_name: player.PLAYER_NAME,
          value: parsedValue || 0,
          team_abbreviation: player.TEAM_ABBREVIATION,
          minutes: (parseFloat(player.MIN as any) || 0) * (player.GP || 0),
        };
      });

    return data;
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

  // Calculate percentiles for the current player
  useEffect(() => {
    if (baseData.length === 0) return;

    const newPercentiles: Record<string, number> = {};
    SPIDER_STATS.forEach(stat => {
      let playerValue = (player as any)[stat.key];
      
      // Handle percentage values that come as strings with % symbol
      if (typeof playerValue === 'string' && playerValue.includes('%')) {
        playerValue = parseFloat(playerValue.replace('%', '')) / 100;
      } else if (typeof playerValue === 'string') {
        playerValue = parseFloat(playerValue) || 0;
      }
      
      if (playerValue !== undefined && !isNaN(playerValue)) {
        const percentile = getPercentile(stat.key, playerValue);
        newPercentiles[stat.key] = percentile;
      }
    });
    setPercentiles(newPercentiles);
  }, [baseData, player]);

  // Draw the spider chart
  useEffect(() => {
    if (loading || Object.keys(percentiles).length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with proper device pixel ratio for crisp rendering
    const size = Math.min(400, window.innerWidth * 0.8);
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set the actual canvas size in memory (scaled for device pixel ratio)
    canvas.width = size * devicePixelRatio;
    canvas.height = size * devicePixelRatio;
    
    // Scale the canvas back down using CSS
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    // Scale the drawing context so everything draws at the correct size
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Improve rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    const numStats = SPIDER_STATS.length;
    const angleStep = (2 * Math.PI) / numStats;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circles
    ctx.strokeStyle = 'rgba(120, 190, 32, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const circleRadius = (radius * i) / 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(120, 190, 32, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < numStats; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw data area
    ctx.fillStyle = 'rgba(120, 190, 32, 0.15)';
    ctx.strokeStyle = 'rgba(120, 190, 32, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    SPIDER_STATS.forEach((stat, index) => {
      const percentile = percentiles[stat.key] || 0;
      const angle = index * angleStep - Math.PI / 2;
      const distance = radius * percentile;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#78BE20';
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    
    SPIDER_STATS.forEach((stat, index) => {
      const percentile = percentiles[stat.key] || 0;
      const angle = index * angleStep - Math.PI / 2;
      const distance = radius * percentile;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    SPIDER_STATS.forEach((stat, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);

      // Add background for better readability
      const textWidth = ctx.measureText(stat.label).width;
      const padding = 8;
      ctx.fillStyle = 'rgba(30, 33, 41, 0.9)';
      ctx.fillRect(x - textWidth/2 - padding, y - 10, textWidth + padding * 2, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(stat.label, x, y);
    });

    // Draw percentile labels
    ctx.fillStyle = '#78BE20';
    ctx.font = 'bold 10px Inter, sans-serif';
    
    SPIDER_STATS.forEach((stat, index) => {
      const percentile = percentiles[stat.key] || 0;
      const angle = index * angleStep - Math.PI / 2;
      const distance = radius * percentile;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle) - 15;

      const percentileText = `${(percentile * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(percentileText).width;
      
      // Add background for better readability
      ctx.fillStyle = 'rgba(30, 33, 41, 0.9)';
      ctx.fillRect(x - textWidth/2 - 4, y - 8, textWidth + 8, 16);
      
      ctx.fillStyle = '#78BE20';
      ctx.fillText(percentileText, x, y);
    });

  }, [loading, percentiles]);

  // Handle mouse movement for hover detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || Object.keys(percentiles).length === 0) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Use the actual rendered canvas size
      const size = canvas.clientWidth;
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.35;
      const numStats = SPIDER_STATS.length;
      const angleStep = (2 * Math.PI) / numStats;

      let foundHover = false;

      // Check each data point
      SPIDER_STATS.forEach((stat, index) => {
        const percentile = percentiles[stat.key] || 0;
        const angle = index * angleStep - Math.PI / 2;
        const distance = radius * percentile;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        // Check if mouse is within dot radius (6px dot + 4px tolerance = 10px)
        const distanceToMouse = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        
        if (distanceToMouse <= 10) {
          let playerValue = (player as any)[stat.key];
          
          // Handle percentage values that come as strings with % symbol
          if (typeof playerValue === 'string' && playerValue.includes('%')) {
            playerValue = parseFloat(playerValue.replace('%', '')) / 100;
          } else if (typeof playerValue === 'string') {
            playerValue = parseFloat(playerValue) || 0;
          }

          // Format the value for display
          let displayValue: number;
          if (stat.key.includes('PCT')) {
            // Convert to percentage for display
            displayValue = Math.round(playerValue * 1000) / 10; // Show as percentage with 1 decimal
          } else {
            displayValue = Math.round(playerValue * 10) / 10; // 1 decimal place
          }

          setHoveredStat({
            key: stat.key,
            label: stat.label,
            value: displayValue,
            canvasX: x,
            canvasY: y
          });
          foundHover = true;
        }
      });

      if (!foundHover) {
        setHoveredStat(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredStat(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [loading, percentiles, player]);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#78BE20]/20 to-[#4ade80]/20 rounded-full">
              <BarChart3 className="w-5 h-5 text-[#78BE20] animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white">Performance Percentiles</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4">League percentile ranking (0-100%)</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading spider chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-[#78BE20]/20 to-[#4ade80]/20 rounded-full">
              <BarChart3 className="w-5 h-5 text-[#78BE20]" />
          </div>
          <h3 className="text-xl font-bold text-white">Performance Percentiles</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">League percentile ranking (0-100%)</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-6 relative">
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto cursor-pointer"
            style={{ 
              maxWidth: '350px', 
              maxHeight: '350px',
              imageRendering: '-webkit-optimize-contrast'
            }}
          />
          
          {/* Tooltip positioned relative to canvas */}
          {hoveredStat && (
            <div
              ref={tooltipRef}
              className="absolute pointer-events-none z-50 px-3 py-2 bg-gray-900/95 border border-[#78BE20]/30 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap"
              style={{
                left: `${hoveredStat.canvasX + 10}px`,
                top: `${hoveredStat.canvasY - 40}px`,
              }}
            >
              <div className="text-xs font-semibold text-white">{hoveredStat.label}</div>
              <div className="text-lg font-bold text-[#78BE20]">
                {hoveredStat.key.includes('PCT') ? `${hoveredStat.value}%` : hoveredStat.value}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-700/30 bg-gradient-to-r from-[#0f1119] to-[#141923]">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <div className="p-1.5 bg-[#78BE20]/20 rounded-full">
            <Info className="w-3 h-3 text-[#78BE20]" />
          </div>
          <span>Percentiles based on players with 600+ total minutes</span>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Scale,
  TooltipItem
} from 'chart.js';
import { supabase } from '../lib/supabase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Team abbreviation to full team name mapping
const getFullTeamName = (abbr: string): string => {
  const teamMap: Record<string, string> = {
    'ATL': 'atlanta_hawks',
    'BOS': 'boston_celtics',
    'BKN': 'brooklyn_nets',
    'CHA': 'charlotte_hornets',
    'CHI': 'chicago_bulls',
    'CLE': 'cleveland_cavaliers',
    'DAL': 'dallas_mavericks',
    'DEN': 'denver_nuggets',
    'DET': 'detroit_pistons',
    'GSW': 'golden_state_warriors',
    'HOU': 'houston_rockets',
    'IND': 'indiana_pacers',
    'LAC': 'los_angeles_clippers',
    'LAL': 'los_angeles_lakers',
    'MEM': 'memphis_grizzlies',
    'MIA': 'miami_heat',
    'MIL': 'milwaukee_bucks',
    'MIN': 'minnesota_timberwolves',
    'NOP': 'new_orleans_pelicans',
    'NYK': 'new_york_knicks',
    'OKC': 'oklahoma_city_thunder',
    'ORL': 'orlando_magic',
    'PHI': 'philadelphia_76ers',
    'PHX': 'phoenix_suns',
    'POR': 'portland_trail_blazers',
    'SAC': 'sacramento_kings',
    'SAS': 'san_antonio_spurs',
    'TOR': 'toronto_raptors',
    'UTA': 'utah_jazz',
    'WAS': 'washington_wizards'
  };
  
  return teamMap[abbr] || abbr.toLowerCase();
};

// Helper function to get team logo URL
const getTeamLogoUrl = (teamAbbr: string): string => {
  const fullTeamName = getFullTeamName(teamAbbr);
  return `${supabase.storage.from('nba-logos').getPublicUrl(fullTeamName + '.png').data.publicUrl}`;
};

interface PlayByPlay {
  id: number;
  game_id: string;
  event_num: number;
  clock: string;
  period: number;
  event_type: string;
  description: string;
  home_score: number;
  away_score: number;
  team_tricode: string;
  player_name: string;
  is_scoring_play: boolean;
  score_margin: number;
  time_seconds: number;
  created_at: string;
}

interface GameFlowChartProps {
  playByPlay: PlayByPlay[];
  homeTeam: string;
  awayTeam: string;
}

// Helper function to add at the top of the file
function interpolateZeroCrossing(value1: number, value2: number, index: number): number {
  // If values are on opposite sides of zero, calculate the interpolated index
  if (value1 * value2 < 0) {
    return index + Math.abs(value1) / Math.abs(value2 - value1);
  }
  return -1;
}

// Helper function to format clock time
function formatClockTime(clock: string): string {
  // Check if the format is PT followed by minutes and seconds
  if (clock.startsWith('PT') && clock.includes('M') && clock.includes('S')) {
    // Extract minutes and seconds
    const minutes = clock.match(/(\d+)M/)?.[1] || '0';
    const seconds = parseFloat(clock.match(/(\d+\.\d+|\d+)S/)?.[1] || '0').toFixed(0);
    
    // Format as M:SS
    return `${minutes}:${seconds.padStart(2, '0')}`;
  }
  
  return clock; // Return original if not in expected format
}

const GameFlowChart: React.FC<GameFlowChartProps> = ({ playByPlay, homeTeam, awayTeam }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  
  // Get team logo URLs
  const homeTeamLogoUrl = useMemo(() => getTeamLogoUrl(homeTeam), [homeTeam]);
  const awayTeamLogoUrl = useMemo(() => getTeamLogoUrl(awayTeam), [awayTeam]);

  // Preload the team logos to ensure they're available for the chart
  useEffect(() => {
    const preloadImages = (urls: string[]) => {
      urls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };
    
    preloadImages([homeTeamLogoUrl, awayTeamLogoUrl]);
  }, [homeTeamLogoUrl, awayTeamLogoUrl]);

  // Create an external tooltip div that can contain HTML including images
  useEffect(() => {
    // Create tooltip container if it doesn't exist
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      tooltipEl.innerHTML = '<table></table>';
      document.body.appendChild(tooltipEl);
      
      // Add tooltip styling
      tooltipEl.style.opacity = '0';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      tooltipEl.style.color = 'white';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.padding = '12px';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.transform = 'translate(-50%, 0)';
      tooltipEl.style.transition = 'opacity 0.2s ease';
      tooltipEl.style.zIndex = '100';
      tooltipEl.style.minWidth = '200px';
      tooltipEl.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    }
  }, []);

  const chartData = useMemo(() => {
    // Sort plays by event number to ensure chronological order
    const sortedPlays = [...playByPlay].sort((a, b) => a.event_num - b.event_num);
    
    // Include all plays where either score changes
    const scoringPlays = sortedPlays.filter(play => {
      if (play.is_scoring_play === true) return true;
      if (play.description && (
        play.description.includes("SCORE") || 
        play.description.includes("made") || 
        play.description.includes("free throw")
      )) return true;
      return false;
    });
    
    if (scoringPlays.length === 0) {
      const differentials = sortedPlays.map(play => play.away_score - play.home_score);
      
      // Create arrays with interpolated zero crossings
      const allPoints: [number, number][] = [];
      for (let i = 0; i < differentials.length; i++) {
        allPoints.push([i, differentials[i]]);
        if (i < differentials.length - 1) {
          const zeroCrossing = interpolateZeroCrossing(differentials[i], differentials[i + 1], i);
          if (zeroCrossing >= 0) {
            allPoints.push([zeroCrossing, 0]);
          }
        }
      }
      
      const positiveData = allPoints.map(([x, y]) => y >= 0 ? y : null);
      const negativeData = allPoints.map(([x, y]) => y <= 0 ? y : null);
      
      return {
        labels: allPoints.map(([x, _]) => {
          const originalIndex = Math.floor(x);
          const play = sortedPlays[originalIndex];
          return `Q${play.period} ${formatClockTime(play.clock)}`;
        }),
        datasets: [
          {
            label: `${awayTeam} Lead`,
            data: positiveData,
            borderColor: '#78BE20',
            backgroundColor: 'rgba(120, 190, 32, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.3,
            fill: false
          },
          {
            label: `${homeTeam} Lead`,
            data: negativeData,
            borderColor: '#DC2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.3,
            fill: false
          }
        ]
      };
    }
    
    // Calculate point differential from away team perspective (away - home)
    const pointDifferential = scoringPlays.map(play => play.away_score - play.home_score);
    
    // Do the same for the scoring plays section
    const allPoints: [number, number][] = [];
    for (let i = 0; i < pointDifferential.length; i++) {
      allPoints.push([i, pointDifferential[i]]);
      if (i < pointDifferential.length - 1) {
        const zeroCrossing = interpolateZeroCrossing(pointDifferential[i], pointDifferential[i + 1], i);
        if (zeroCrossing >= 0) {
          allPoints.push([zeroCrossing, 0]);
        }
      }
    }
    
    const positiveData = allPoints.map(([x, y]) => y > 0 ? y : null);
    const negativeData = allPoints.map(([x, y]) => y < 0 ? y : null);
    const zeroData = allPoints.map(([x, y]) => y === 0 ? 0 : null);
    
    return {
      labels: allPoints.map(([x, _]) => {
        const originalIndex = Math.floor(x);
        if (originalIndex >= scoringPlays.length) {
          return "";
        }
        const play = scoringPlays[originalIndex];
        return `Q${play.period} ${formatClockTime(play.clock)}`;
      }),
      datasets: [
        {
          label: `${awayTeam} Lead`,
          data: positiveData,
          borderColor: '#78BE20',
          backgroundColor: 'rgba(120, 190, 32, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.3,
          fill: false
        },
        {
          label: `${homeTeam} Lead`,
          data: negativeData,
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.3,
          fill: false
        },
        {
          label: 'Tied',
          data: zeroData,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          pointRadius: 2,
          pointBackgroundColor: 'rgba(255, 255, 255, 0.8)',
          fill: false,
          borderWidth: 0
        }
      ]
    };
  }, [playByPlay, homeTeam, awayTeam]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        }
      },
      y: {
        suggestedMin: -20,
        suggestedMax: 20,
        border: {
          display: false
        },
        grid: {
          color: (context) => {
            return context.tick.value === 0 
              ? 'rgba(255, 255, 255, 0.5)' 
              : 'rgba(255, 255, 255, 0.1)';
          },
          lineWidth: (context) => {
            return context.tick.value === 0 ? 2 : 0.5;
          }
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10
          },
          padding: 10,
          stepSize: 5,
          callback: function(value) {
            return value === 0 ? '0' : Math.abs(Number(value));
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyColor: 'white',
        bodyFont: {
          size: 12
        },
        padding: 12,
        caretPadding: 6,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            if (tooltipItems.length === 0) return '';
            const label = tooltipItems[0].label;
            
            if (!label) return '';
            
            // Parse the quarter and clock time
            const parts = label.split(' ');
            if (parts.length >= 2) {
              const quarter = parts[0]; // Q1, Q2, etc.
              const clock = formatClockTime(parts[1]);
              return `${quarter} ${clock}`;
            }
            
            return label;
          },
          label: (tooltipItem: TooltipItem<'line'>) => {
            const dataIndex = tooltipItem.dataIndex;
            const value = tooltipItem.parsed.y;
            
            if (value === null) return '';
            
            if (value === 0) {
              return 'Game Tied';
            } else if (value > 0) {
              return `${awayTeam} leads by ${Math.abs(value)}`;
            } else {
              return `${homeTeam} leads by ${Math.abs(value)}`;
            }
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 0,
      }
    },
    animation: {
      duration: 1000
    }
  };

  if (!chartData || playByPlay.length === 0) {
    return (
      <div className="game-flow-empty">
        <p>No play-by-play data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <Line data={chartData} options={chartOptions} height={130} />
    </div>
  );
};

export default GameFlowChart; 
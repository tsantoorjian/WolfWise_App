import React, { useMemo } from 'react';
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

const GameFlowChart: React.FC<GameFlowChartProps> = ({ playByPlay, homeTeam, awayTeam }) => {
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
          return `Q${play.period} ${play.clock}`;
        }),
        datasets: [
          {
            label: `${awayTeam} Lead`,
            data: positiveData,
            borderColor: '#78BE20',
            backgroundColor: 'rgba(120, 190, 32, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: true
          },
          {
            label: `${awayTeam} Deficit`,
            data: negativeData,
            borderColor: '#DC2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: true
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
    
    const positiveData = allPoints.map(([x, y]) => y >= 0 ? y : null);
    const negativeData = allPoints.map(([x, y]) => y <= 0 ? y : null);
    
    return {
      labels: allPoints.map(([x, _]) => {
        const originalIndex = Math.floor(x);
        const play = scoringPlays[originalIndex];
        return `Q${play.period} ${play.clock}`;
      }),
      datasets: [
        {
          label: `${awayTeam} Lead`,
          data: positiveData,
          borderColor: '#78BE20',
          backgroundColor: 'rgba(120, 190, 32, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: true
        },
        {
          label: `${awayTeam} Deficit`,
          data: negativeData,
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [playByPlay, homeTeam, awayTeam]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false, // Hide the x-axis completely
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Point Differential',
          color: '#333',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#333',
          font: {
            weight: 'bold'
          }
        },
        // Add a zero line to show when teams are tied
        afterFit: (scale: any) => {
          scale.options.grid = {
            ...scale.options.grid,
            zeroLineColor: 'rgba(0, 0, 0, 0.3)',
            zeroLineWidth: 2
          };
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        titleFont: {
          weight: 'bold',
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          title: (items: any[]) => {
            if (items.length > 0) {
              const index = items[0].dataIndex;
              const filteredPlays = playByPlay.filter((p: PlayByPlay) => 
                p.is_scoring_play || 
                (p.description && (
                  p.description.includes("SCORE") || 
                  p.description.includes("made") || 
                  p.description.includes("free throw")
                ))
              ).sort((a: PlayByPlay, b: PlayByPlay) => a.event_num - b.event_num);
              
              if (filteredPlays[index]) {
                return `${filteredPlays[index].description} (${filteredPlays[index].clock}, Q${filteredPlays[index].period})`;
              }
            }
            return '';
          },
          label: (context: any) => {
            const value = context.parsed.y;
            if (value > 0) {
              return `${awayTeam} +${value}`;
            } else if (value < 0) {
              return `${homeTeam} +${Math.abs(value)}`;
            } else {
              return 'Tied';
            }
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        hitRadius: 8 // Larger hit area for tooltips
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
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
    <div className="game-flow-chart">
      <h3 className="chart-title">Game Flow</h3>
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} height={200} />
      </div>
    </div>
  );
};

export default GameFlowChart; 
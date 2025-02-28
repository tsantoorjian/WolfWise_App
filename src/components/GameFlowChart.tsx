import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler
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
      // If no scoring plays are found, just use all plays to show game progression
      const differentials = sortedPlays.map(play => play.away_score - play.home_score);
      
      return {
        labels: sortedPlays.map(play => `Q${play.period} ${play.clock}`),
        datasets: [{
          label: `${awayTeam} Lead/Deficit`,
          data: differentials,
          segment: {
            borderColor: ctx => differentials[ctx.p0DataIndex] >= 0 ? 
              '#78BE20' : // Green when winning
              '#DC2626', // Red when losing
          },
          backgroundColor: ctx => {
            const diff = differentials[ctx.p0DataIndex];
            return diff >= 0 ? 
              'rgba(120, 190, 32, 0.1)' : // Green with transparency
              'rgba(220, 38, 38, 0.1)';   // Red with transparency
          },
          borderWidth: 2,
          pointRadius: 0, // Hide the dots
          pointHoverRadius: 4, // Show dots on hover
          tension: 0.3, // Smoother curve
          fill: 'origin'
        }]
      };
    }
    
    // Create labels for each scoring play (period and time)
    const labels = scoringPlays.map(play => `Q${play.period} ${play.clock}`);
    
    // Calculate point differential from away team perspective (away - home)
    const pointDifferential = scoringPlays.map(play => play.away_score - play.home_score);
    
    return {
      labels,
      datasets: [
        {
          label: `${awayTeam} Lead/Deficit`,
          data: pointDifferential,
          segment: {
            borderColor: ctx => pointDifferential[ctx.p0DataIndex] >= 0 ? 
              '#78BE20' : // Green when winning
              '#DC2626', // Red when losing
          },
          backgroundColor: ctx => {
            const diff = pointDifferential[ctx.p0DataIndex];
            return diff >= 0 ? 
              'rgba(120, 190, 32, 0.1)' : // Green with transparency
              'rgba(220, 38, 38, 0.1)';   // Red with transparency
          },
          borderWidth: 2,
          pointRadius: 0, // Hide the dots
          pointHoverRadius: 4, // Show dots on hover
          tension: 0.3, // Smoother curve
          fill: 'origin'
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
        afterFit: (scale) => {
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
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          color: '#333',
          font: {
            weight: 'bold'
          }
        }
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
          title: (items) => {
            if (items.length > 0) {
              const index = items[0].dataIndex;
              const filteredPlays = playByPlay.filter(p => 
                p.is_scoring_play || 
                (p.description && (
                  p.description.includes("SCORE") || 
                  p.description.includes("made") || 
                  p.description.includes("free throw")
                ))
              ).sort((a, b) => a.event_num - b.event_num);
              
              if (filteredPlays[index]) {
                return `${filteredPlays[index].description} (${filteredPlays[index].clock}, Q${filteredPlays[index].period})`;
              }
            }
            return '';
          },
          label: (context) => {
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
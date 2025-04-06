import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trophy, UserRound, ChevronDown, Info, Target, Award, Medal, BarChart2 } from 'lucide-react';
import RecordProgressBar from './RecordProgressBar';
import { useRecordData } from '../hooks/useRecordData';

type RecordTrackerProps = {
  playerImageUrl?: string;
};

export function RecordTracker({ playerImageUrl }: RecordTrackerProps) {
  const [selectedStat, setSelectedStat] = useState<string>('pts');
  const [showStatSelect, setShowStatSelect] = useState(false);
  const { recordData, loading, getProgressionData } = useRecordData();

  const getStatDisplayName = (stat: string) => {
    const statMap: Record<string, string> = {
      pts: 'Points',
      ast: 'Assists',
      reb: 'Rebounds',
      stl: 'Steals',
      blk: 'Blocks',
      tov: 'Turnovers',
      fgm: 'FG Made',
      fga: 'FG Attempts',
      fg3m: '3PT Made',
      fg3a: '3PT Attempts',
      ftm: 'FT Made',
      fta: 'FT Attempts',
      pf: 'Personal Fouls'
    };
    return statMap[stat] || stat.toUpperCase();
  };

  const statOrder = ['pts', 'ast', 'reb', 'stl', 'blk', 'tov', 'fgm', 'fga', 'fg3m', 'fg3a', 'ftm', 'fta', 'pf'];
  
  const sortedStats = Array.from(new Set(recordData.map(d => d.stat)))
    .sort((a, b) => statOrder.indexOf(a) - statOrder.indexOf(b));

  if (loading || !recordData.length) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const currentRecord = recordData.find(d => d.stat === selectedStat);
  const progressionData = getProgressionData(selectedStat);
  const currentPoint = [currentRecord?.GP || 0, currentRecord?.current || 0];
  
  // Fill in missing data points between last progression point and current point
  const fullProgressionData = [...progressionData];
  const lastProgressionPoint = progressionData[progressionData.length - 1];
  
  if (lastProgressionPoint && currentPoint[0] > lastProgressionPoint[0]) {
    const gamesGap = currentPoint[0] - lastProgressionPoint[0];
    const valueDiff = currentPoint[1] - lastProgressionPoint[1];
    const valuePerGame = valueDiff / gamesGap;
    
    // Add interpolated points for each missing game
    for (let i = 1; i <= gamesGap; i++) {
      const game = lastProgressionPoint[0] + i;
      const value = lastProgressionPoint[1] + (valuePerGame * i);
      fullProgressionData.push([game, value]);
    }
  } else if (!lastProgressionPoint) {
    fullProgressionData.push(currentPoint);
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1e2129]/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={playerImageUrl || 'https://via.placeholder.com/80'}
                alt="Anthony Edwards"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-[#78BE20]/60 group-hover:border-[#78BE20] transition-colors duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/96';
                  target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  target.classList.add('hidden');
                }}
              />
              <div className="fallback-icon hidden">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#141923] flex items-center justify-center">
                  <UserRound className="w-10 h-10 md:w-12 md:h-12 text-[#78BE20]" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Record Tracker</h2>
              <p className="text-gray-400 text-sm">Track progress towards NBA milestones</p>
            </div>
          </div>
        </div>
        
        {/* Prominent Stat Selector Card */}
        <div className="mt-6 mb-8 bg-[#141923] rounded-lg p-4 border border-gray-700/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-[#78BE20]" />
              <span className="text-white font-medium">Currently Tracking:</span>
              <span className="text-[#78BE20] font-bold text-xl">{getStatDisplayName(selectedStat)}</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowStatSelect(!showStatSelect)}
                className="px-5 py-2.5 bg-[#78BE20] text-white rounded-lg flex items-center gap-2 hover:bg-[#8CD43A] transition-colors shadow-md font-medium"
                aria-label="Choose a different stat to track"
              >
                <Target className="w-5 h-5" />
                <span>Change Stat</span>
                <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${showStatSelect ? 'rotate-180' : ''}`} />
              </button>
              
              {showStatSelect && (
                <div className="absolute z-10 mt-8 w-56 bg-[#141923] rounded-lg shadow-lg border border-gray-700/50 py-1 max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 text-xs text-[#78BE20]/80 border-b border-gray-700/50 font-medium">
                    Select a stat to track progress
                  </div>
                  {sortedStats.map(stat => (
                    <button
                      key={stat}
                      onClick={() => {
                        setSelectedStat(stat);
                        setShowStatSelect(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#1e2129] flex items-center gap-2 ${
                        selectedStat === stat 
                          ? 'text-white bg-[#78BE20]/20 font-medium border-l-4 border-[#78BE20]' 
                          : 'text-white'
                      }`}
                    >
                      {selectedStat === stat && <Award className="w-4 h-4" />}
                      {getStatDisplayName(stat)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {recordData.filter(d => d.stat === selectedStat).map((record, index) => {
          const totalGames = record.GP + record.GAMES_REMAINING;
          const chartOption = {
            backgroundColor: '#1e2129',
            title: {
              text: `${getStatDisplayName(record.stat)} Progress`,
              left: 'center',
              top: 10,
              textStyle: {
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            grid: {
              top: 40,
              right: 10,
              bottom: 30,
              left: 30,
              containLabel: true
            },
            tooltip: {
              trigger: 'axis',
              backgroundColor: '#141923',
              borderColor: '#141923',
              textStyle: { color: '#FFFFFF' },
              formatter: function(params: any) {
                const param = Array.isArray(params) ? params[0] : params;
                
                if (param.componentType === 'markLine') {
                  return `${param.name}: ${param.value.toFixed(1)}`;
                }

                let games = param.data[0];
                let value = param.data[1];
                
                // Check if this is the final projected point
                if (param.seriesName === 'Projected' && games === totalGames) {
                  return `Games: ${games} (End of Season)<br/>Projected ${getStatDisplayName(record.stat)}: ${value.toFixed(1)}`;
                }
                
                return `Games: ${games}<br/>${getStatDisplayName(record.stat)}: ${value.toFixed(1)}`;
              }
            },
            xAxis: {
              type: 'value',
              name: 'Games',
              nameLocation: 'middle',
              nameGap: 25,
              min: 0,
              max: totalGames,
              nameTextStyle: { 
                color: '#FFFFFF',
                fontSize: 12,
                padding: [5, 0, 0, 0]
              },
              axisLabel: {
                color: '#FFFFFF',
                margin: 8,
                fontSize: 11,
                formatter: function(value: number) {
                  if (value === 0) return 'Start';
                  if (value === record.GP) return `Current`;
                  if (value === totalGames) return `Total`;
                  return value;
                }
              },
              axisLine: { lineStyle: { color: '#FFFFFF' } },
              splitLine: { show: false }
            },
            yAxis: {
              type: 'value',
              name: getStatDisplayName(record.stat),
              nameLocation: 'middle',
              nameGap: 25,
              nameTextStyle: { 
                color: '#FFFFFF',
                fontSize: 12,
                padding: [0, 0, 0, -25]
              },
              axisLabel: { 
                color: '#FFFFFF',
                margin: 8,
                fontSize: 11,
                align: 'right',
                padding: [0, 15, 0, 0]
              },
              axisLine: { lineStyle: { color: '#FFFFFF' } },
              splitLine: { lineStyle: { type: 'dashed', color: '#333844' } }
            },
            series: [
              {
                name: 'Current Progress',
                type: 'line',
                symbolSize: 4,
                data: fullProgressionData,
                itemStyle: { color: '#78BE20' },
                lineStyle: { width: 3 }
              },
              {
                name: 'Projected',
                type: 'line',
                symbolSize: 8,
                data: [[currentPoint[0], currentPoint[1]], [totalGames, record.projection]],
                itemStyle: { color: '#FFFFFF' },
                lineStyle: { 
                  width: 2,
                  type: 'dashed',
                  color: '#FFFFFF',
                  opacity: 0.6
                }
              },
              {
                name: 'Current Point',
                type: 'effectScatter',
                symbolSize: 12,
                data: [currentPoint],
                itemStyle: { color: '#78BE20' },
                showEffectOn: 'render',
                rippleEffect: {
                  period: 4,
                  scale: 4,
                  brushType: 'stroke'
                },
                zlevel: 1
              },
              {
                name: 'Records',
                type: 'line',
                data: [],
                markLine: {
                  silent: true,
                  symbol: 'none',
                  label: { 
                    show: true, 
                    position: 'middle',
                    distance: [0, -8],
                    align: 'center',
                    fontSize: 11,
                    padding: [4, 8],
                    backgroundColor: 'rgba(20, 25, 35, 0.8)',
                    avoidLabelOverlap: true
                  },
                  data: [
                    {
                      name: 'Personal Best',
                      yAxis: record.personal_record,
                      lineStyle: { color: '#9EA2A2', type: 'dashed' },
                      label: { 
                        formatter: `Personal Best: ${record.personal_record.toFixed(1)}`,
                        color: '#9EA2A2' 
                      }
                    },
                    {
                      name: 'Franchise Record',
                      yAxis: record.franchise_record,
                      lineStyle: { color: '#78BE20', type: 'dashed' },
                      label: { 
                        formatter: `Franchise Record: ${record.franchise_record.toFixed(1)}`,
                        color: '#78BE20' 
                      }
                    },
                    {
                      name: 'NBA Record',
                      yAxis: record.nba_record,
                      lineStyle: { color: '#DC2626', type: 'dashed' },
                      label: { 
                        formatter: `NBA Record: ${record.nba_record.toFixed(1)}`,
                        color: '#DC2626' 
                      }
                    }
                  ]
                }
              }
            ]
          };

          return (
            <div key={index} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-lg p-6 text-white border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Current Pace</h4>
                      <Trophy className="w-5 h-5 text-[#78BE20]" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm">Games Played</p>
                        <p className="text-2xl font-bold">{record.GP}</p>
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#78BE20]"
                            style={{ width: `${(record.GP / totalGames) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm">Games Left</p>
                        <p className="text-2xl font-bold">{record.GAMES_REMAINING}</p>
                        <div className="h-1 bg-white/20 rounded-full"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm">Current Total</p>
                        <p className="text-2xl font-bold">{record.current.toFixed(1)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm">Per Game</p>
                        <p className="text-2xl font-bold">{record.per_game.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-white/70 text-sm mb-1">Season Projection</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-[#78BE20]">
                          {record.projection.toFixed(1)}
                        </p>
                        <p className="text-white/50 text-sm">projected</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#141923] rounded-lg p-6 shadow-md space-y-4 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className="w-5 h-5 text-gray-400" />
                      <h4 className="text-lg font-semibold text-white">Record Progress</h4>
                    </div>
                    <RecordProgressBar
                      current={record.current}
                      max={record.personal_record}
                      label="Personal Record"
                      player="Previous Best"
                    />
                    <RecordProgressBar
                      current={record.current}
                      max={record.franchise_record}
                      label="Franchise Record"
                      player={record.franchise_player}
                    />
                    <RecordProgressBar
                      current={record.current}
                      max={record.nba_record}
                      label="NBA Record"
                      player={record.nba_player.replace('*', '')}
                    />
                  </div>
                </div>

                <div className="bg-[#141923] rounded-lg shadow-md p-4 h-[600px] border border-gray-700/50">
                  <ReactECharts
                    option={chartOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#141923]/60 rounded-lg p-3">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Projections are based on current per-game averages and remaining games</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
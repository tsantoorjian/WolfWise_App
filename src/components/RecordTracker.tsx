import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trophy, UserRound, ChevronDown, Info, Target, Award, Medal } from 'lucide-react';
import { RecordTrackerSeason } from '../types/database.types';
import RecordProgressBar from './RecordProgressBar';

type RecordTrackerProps = {
  recordData: RecordTrackerSeason[];
  playerImageUrl?: string;
};

export function RecordTracker({ recordData, playerImageUrl }: RecordTrackerProps) {
  const [selectedStat, setSelectedStat] = useState<string>('pts');
  const [showStatSelect, setShowStatSelect] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={playerImageUrl || 'https://via.placeholder.com/80'}
                alt="Anthony Edwards"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-[#236192] group-hover:border-[#78BE20] transition-colors duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/96';
                  target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  target.classList.add('hidden');
                }}
              />
              <div className="fallback-icon hidden">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#0C2340] flex items-center justify-center">
                  <UserRound className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#78BE20]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0C2340]">Record Tracker</h2>
              <p className="text-[#9EA2A2] text-sm">Track progress towards NBA milestones</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatSelect(!showStatSelect)}
              className="px-4 py-2 bg-[#0C2340] text-white rounded-lg flex items-center gap-2 hover:bg-[#236192] transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>{getStatDisplayName(selectedStat)}</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${showStatSelect ? 'rotate-180' : ''}`} />
            </button>
            {showStatSelect && (
              <div className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {sortedStats.map(stat => (
                  <button
                    key={stat}
                    onClick={() => {
                      setSelectedStat(stat);
                      setShowStatSelect(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                      selectedStat === stat ? 'text-[#78BE20] font-medium' : 'text-[#0C2340]'
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

        {recordData.filter(d => d.stat === selectedStat).map((record, index) => {
          const totalGames = record.GP + record.GAMES_REMAINING;
          const chartOption = {
            backgroundColor: '#FFFFFF',
            title: {
              text: `${getStatDisplayName(record.stat)} Progress`,
              left: 'center',
              top: 10,
              textStyle: {
                color: '#0C2340',
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            grid: {
              top: 100,
              right: 40,
              bottom: 60,
              left: 60,
              containLabel: true
            },
            legend: {
              top: 40,
              textStyle: { color: '#0C2340' }
            },
            tooltip: {
              trigger: 'axis',
              backgroundColor: '#0C2340',
              borderColor: '#0C2340',
              textStyle: { color: '#FFFFFF' },
              formatter: function(params: any) {
                const param = Array.isArray(params) ? params[0] : params;
                
                if (param.componentType === 'markLine') {
                  return `${param.name}: ${param.value.toFixed(1)}`;
                }

                let games = param.data[0];
                let value = param.data[1];
                
                return `Games: ${games}<br/>${getStatDisplayName(record.stat)}: ${value.toFixed(1)}`;
              }
            },
            xAxis: {
              type: 'value',
              name: 'Games',
              nameLocation: 'middle',
              nameGap: 35,
              min: 0,
              max: totalGames,
              nameTextStyle: { color: '#0C2340' },
              axisLabel: {
                color: '#0C2340',
                formatter: function(value: number) {
                  if (value === 0) return 'Start';
                  if (value === record.GP) return `Current (${record.GP})`;
                  if (value === totalGames) return `Total (${totalGames})`;
                  return value;
                }
              },
              axisLine: { lineStyle: { color: '#0C2340' } },
              splitLine: { show: false }
            },
            yAxis: {
              type: 'value',
              name: getStatDisplayName(record.stat),
              nameLocation: 'middle',
              nameGap: 50,
              nameTextStyle: { color: '#0C2340' },
              axisLabel: { color: '#0C2340' },
              axisLine: { lineStyle: { color: '#0C2340' } },
              splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } }
            },
            series: [
              {
                name: 'Current Progress',
                type: 'line',
                symbolSize: 8,
                data: [[0, 0], [record.GP, record.current]],
                itemStyle: { color: '#78BE20' },
                lineStyle: { width: 3 }
              },
              {
                name: 'Projected',
                type: 'line',
                symbolSize: 8,
                data: [[record.GP, record.current], [totalGames, record.projection]],
                itemStyle: { color: '#236192' },
                lineStyle: { width: 3, type: 'dashed' }
              },
              {
                name: 'Current Point',
                type: 'effectScatter',
                symbolSize: 12,
                data: [[record.GP, record.current]],
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
                  label: { show: true, position: 'end' },
                  data: [
                    {
                      name: 'Personal Best',
                      yAxis: record.personal_record,
                      lineStyle: { color: '#9EA2A2', type: 'dashed' },
                      label: { color: '#9EA2A2' }
                    },
                    {
                      name: 'Franchise Record',
                      yAxis: record.franchise_record,
                      lineStyle: { color: '#0C2340', type: 'dashed' },
                      label: { color: '#0C2340' }
                    },
                    {
                      name: 'NBA Record',
                      yAxis: record.nba_record,
                      lineStyle: { color: '#DC2626', type: 'dashed' },
                      label: { color: '#DC2626' }
                    }
                  ]
                }
              }
            ]
          };

          return (
            <div key={index} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#0C2340] to-[#236192] rounded-lg p-6 text-white">
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

                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className="w-5 h-5 text-[#9EA2A2]" />
                      <h4 className="text-lg font-semibold text-[#0C2340]">Record Progress</h4>
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
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
                <ReactECharts
                  option={chartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-[#9EA2A2] bg-gray-50 rounded-lg p-3">
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
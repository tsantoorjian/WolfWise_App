import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trophy, UserRound, ChevronDown, Info, Target, Award, Medal, BarChart2 } from 'lucide-react';
import RecordProgressBar from './RecordProgressBar';
import { useRecordData } from '../hooks/useRecordData';

type RecordTrackerProps = {
  selectedPlayer: string;
};

export function RecordTracker({ selectedPlayer }: RecordTrackerProps) {
  const [selectedStat, setSelectedStat] = useState<string>('pts');
  const [showStatSelect, setShowStatSelect] = useState(false);
  const { 
    loading, 
    getProgressionData, 
    getPlayerRecordData 
  } = useRecordData(selectedPlayer);


  // Function to get player image URL based on selected player
  const getPlayerImageUrl = (playerName: string) => {
    // You can customize this mapping based on your image naming convention
    const playerImageMap: Record<string, string> = {
      'Anthony Edwards': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png',
      'Karl-Anthony Towns': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1626157.png',
      'Rudy Gobert': 'https://cdn.nba.com/headshots/nba/latest/1040x760/203497.png',
      'Mike Conley': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201144.png',
      'Jaden McDaniels': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630183.png',
      'Kyle Anderson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/203937.png',
      'Nickeil Alexander-Walker': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629638.png',
      'Naz Reid': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629673.png',
      'Jordan McLaughlin': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629162.png',
      'Shake Milton': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629003.png',
      'Troy Brown Jr.': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628972.png',
      'Josh Minott': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631169.png',
      'Wendell Moore Jr.': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631111.png',
      'Luka Garza': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630568.png',
      'Daishen Nix': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630227.png',
      'Leonard Miller': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641757.png',
      'Jaylen Clark': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631648.png',
      'Donte DiVincenzo': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628978.png',
      'Monte Morris': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628420.png',
      'Austin Rivers': 'https://cdn.nba.com/headshots/nba/latest/1040x760/203085.png',
      'Taurean Prince': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627752.png',
      'Matt Ryan': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630346.png',
      'Garrison Mathews': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629726.png',
      'Ty Jerome': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628980.png',
      'Peyton Watson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631212.png',
      'Christian Braun': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631128.png',
      'Reggie Jackson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/202704.png',
      'Kentavious Caldwell-Pope': 'https://cdn.nba.com/headshots/nba/latest/1040x760/203484.png',
      'Bruce Brown': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629151.png',
      'Jeff Green': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201145.png',
      'DeAndre Jordan': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201599.png',
      'Zeke Nnaji': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630192.png',
      'Vlatko Cancar': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628427.png',
      'Julian Strawther': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641731.png',
      'Hunter Tyson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641732.png',
      'Braxton Key': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629663.png',
      'Jalen Pickett': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641759.png',
      'Andre Jackson Jr.': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641760.png',
      'Toumani Camara': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641761.png',
      'Kris Murray': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641762.png',
      'Rayan Rupert': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641763.png',
      'Mouhamed Gueye': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641764.png',
      'Trayce Jackson-Davis': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641765.png',
      'Ben Sheppard': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641766.png',
      'Noah Clowney': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641767.png',
      'Dereck Lively II': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641768.png',
      'Olivier-Maxence Prosper': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641769.png',
      'Marcus Sasser': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641770.png',
      'Colby Jones': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641771.png',
      'Nick Smith Jr.': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641772.png',
      'Cason Wallace': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641773.png',
      'Keyonte George': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641774.png',
      'Gradey Dick': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641775.png',
      'Jett Howard': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641776.png',
      'Kobe Bufkin': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641777.png',
      'Bilal Coulibaly': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641778.png',
      'Jordan Hawkins': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641779.png',
      'Jalen Hood-Schifino': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641780.png',
      'Brandon Miller': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641781.png',
      'Amen Thompson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641782.png',
      'Ausar Thompson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641783.png',
      'Anthony Black': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641784.png',
      'Taylor Hendricks': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641785.png',
      'Dariq Whitehead': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641786.png',
      'Brice Sensabaugh': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641787.png',
      'Sidy Cissoko': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641788.png',
      'GG Jackson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641789.png',
      'Seth Lundy': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641790.png',
      'Ricky Council IV': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641791.png',
      'Mojave King': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641792.png',
      'Jordan Walsh': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641793.png',
      'Emoni Bates': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641794.png',
      'Maxwell Lewis': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641795.png',
      'James Nnaji': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641796.png',
      'Jalen Wilson': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641797.png',
      'Colin Castleton': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641798.png'
    };
    
    return playerImageMap[playerName] || 'https://via.placeholder.com/96';
  };

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
  
  // Get record data for the selected player
  const playerRecordData = getPlayerRecordData(selectedPlayer);
  const sortedStats = Array.from(new Set(playerRecordData.map(d => d.stat)))
    .sort((a, b) => statOrder.indexOf(a) - statOrder.indexOf(b));

  if (loading || !playerRecordData.length) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const currentRecord = playerRecordData.find(d => d.stat === selectedStat);
  if (!currentRecord) {
    return <div className="text-gray-400">No data available for selected stat</div>;
  }

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
            {/* Player Image - Display Only */}
            <div className="relative group">
              <div className="relative">
                <img
                  src={getPlayerImageUrl(selectedPlayer)}
                  alt={selectedPlayer || 'Player'}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-[#78BE20]/60"
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
              </div>
            </div>
            
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Record Tracker</h2>
              <p className="text-gray-400 text-sm">Track progress towards NBA milestones</p>
              <p className="text-[#78BE20] text-sm font-medium mt-1">Player selected from stats above</p>
            </div>
          </div>
        </div>
        
        {/* Stat Selector Card - Simplified */}
        <div className="mt-6 mb-8">
          <div className="bg-[#141923] rounded-lg p-4 border border-gray-700/50 shadow-lg">
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
        </div>

        {playerRecordData.filter(d => d.stat === selectedStat).map((record, index) => {
          const totalGames = record.GP + record.GAMES_REMAINING;
          const chartOption = {
            backgroundColor: '#1e2129',
            title: {
              text: `${selectedPlayer} - ${getStatDisplayName(record.stat)} Progress`,
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
              right: 25,
              bottom: 30,
              left: 15,
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
                },
                overflow: 'truncate'
              },
              axisLine: { lineStyle: { color: '#FFFFFF' } },
              splitLine: { show: false }
            },
            yAxis: {
              type: 'value',
              name: '',
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
                showSymbol: false,
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
                data: [fullProgressionData[fullProgressionData.length - 1]],
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
              {/* Mobile Layout - Exact desktop layout but scaled down */}
              <div className="block md:hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-[#141923] to-[#0f1119] rounded-lg p-3 text-white border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Current Pace</h4>
                        <Trophy className="w-3 h-3 text-[#78BE20]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-white/70 text-xs">Games Played</p>
                          <p className="text-lg font-bold">{record.GP}</p>
                          <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#78BE20]"
                              style={{ width: `${(record.GP / totalGames) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/70 text-xs">Games Left</p>
                          <p className="text-lg font-bold">{record.GAMES_REMAINING}</p>
                          <div className="h-0.5 bg-white/20 rounded-full"></div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/70 text-xs">Current Total</p>
                          <p className="text-lg font-bold">{record.current.toFixed(1)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/70 text-xs">Per Game</p>
                          <p className="text-lg font-bold">{record.per_game.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <p className="text-white/70 text-xs mb-1">Season Projection</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl font-bold text-[#78BE20]">
                            {record.projection.toFixed(1)}
                          </p>
                          <p className="text-white/50 text-xs">projected</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#141923] rounded-lg p-3 shadow-md space-y-2 border border-gray-700/50">
                      <div className="flex items-center gap-1 mb-1">
                        <Medal className="w-3 h-3 text-gray-400" />
                        <h4 className="text-sm font-semibold text-white">Record Progress</h4>
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

                  <div className="bg-[#141923] rounded-lg shadow-md p-2 h-[300px] border border-gray-700/50">
                    <ReactECharts
                      option={{
                        ...chartOption,
                        title: {
                          ...chartOption.title,
                          textStyle: {
                            ...chartOption.title.textStyle,
                            fontSize: 10
                          }
                        },
                        grid: {
                          ...chartOption.grid,
                          top: 25,
                          right: 25,
                          bottom: 35,
                          left: 35,
                          containLabel: true
                        },
                        xAxis: {
                          ...chartOption.xAxis,
                          nameTextStyle: { 
                            ...chartOption.xAxis.nameTextStyle,
                            fontSize: 8
                          },
                          axisLabel: {
                            ...chartOption.xAxis.axisLabel,
                            fontSize: 8,
                            margin: 5
                          }
                        },
                        yAxis: {
                          ...chartOption.yAxis,
                          nameTextStyle: { 
                            ...chartOption.yAxis.nameTextStyle,
                            fontSize: 8
                          },
                          axisLabel: { 
                            ...chartOption.yAxis.axisLabel,
                            fontSize: 8,
                            margin: 5,
                            align: 'right',
                            padding: [0, 10, 0, 0]
                          }
                        }
                      }}
                      style={{ height: '100%', width: '100%' }}
                      notMerge={true}
                      lazyUpdate={true}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Original */}
              <div className="hidden md:block">
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
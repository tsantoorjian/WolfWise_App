import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trophy } from 'lucide-react';
import { RecordTrackerSeason } from '../types/database.types';
import RecordProgressBar from './RecordProgressBar';

type RecordTrackerProps = {
  recordData: RecordTrackerSeason[];
};

export function RecordTracker({ recordData }: RecordTrackerProps) {
  const [selectedStat, setSelectedStat] = useState<string>('pts');

  const getStatDisplayName = (stat: string) => {
    const statMap: Record<string, string> = {
      pts: 'Points',
      ast: 'Assists',
      stl: 'Steals',
      blk: 'Blocks',
      fg3a: '3PT Attempts',
      fga: 'FG Attempts',
      fta: 'FT Attempts',
      tov: 'Turnovers',
      pf: 'Personal Fouls'
    };
    return statMap[stat] || stat.toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#0C2340]">Anthony Edwards Record Tracker</h3>
        <div className="flex gap-2">
          {Array.from(new Set(recordData.map(d => d.stat))).map(stat => (
            <button
              key={stat}
              onClick={() => setSelectedStat(stat)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedStat === stat
                  ? 'bg-[#78BE20] text-white'
                  : 'bg-gray-100 text-[#0C2340] hover:bg-gray-200'
              }`}
            >
              {getStatDisplayName(stat)}
            </button>
          ))}
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
          <div key={index} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0C2340] rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold">Current Pace</h4>
                  <Trophy className="w-5 h-5 text-[#78BE20]" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/70">Games Played</p>
                    <p className="text-2xl font-bold">{record.GP}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Games Remaining</p>
                    <p className="text-2xl font-bold">{record.GAMES_REMAINING}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Current Total</p>
                    <p className="text-2xl font-bold">{record.current.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Per Game</p>
                    <p className="text-2xl font-bold">{record.per_game.toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-white/70">Season Projection</p>
                  <p className="text-3xl font-bold text-[#78BE20]">
                    {record.projection.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
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

            <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
              <ReactECharts
                option={chartOption}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
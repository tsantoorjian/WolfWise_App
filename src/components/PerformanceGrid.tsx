import { useEffect, useState, useRef } from 'react';
import { PlayerWithStats } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { ThreePointData, DistributionStats } from '../types/database.types';

// List of stats to show (from stat_distributions.py and ThreePointDistribution)
const STAT_LIST = [
  '3pt percentage',
  'Fg %',
  'Steals per game',
  'Assists per game',
  'Turnovers per game',
  'Blocks per game',
  'Points Per Game',
  'EFG %'
];

const PERCENTAGE_STATS = ['3pt percentage', 'Fg %', 'EFG %'];

function getStatLabel(stat: string) {
  const map: Record<string, string> = {
    '3pt percentage': '3PT %',
    'Fg %': 'FG %',
    'Steals per game': 'Steals',
    'Assists per game': 'Assists',
    'Turnovers per game': 'Turnovers',
    'Blocks per game': 'Blocks',
    'Points Per Game': 'Points',
    'EFG %': 'eFG %',
  };
  return map[stat] || stat;
}

function formatStatValue(stat: string, value: number) {
  if (PERCENTAGE_STATS.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(1);
}

// New: Custom color scale based on provided palette
function getHeatColor(percentile: number) {
  // Palette: 0 = #ED2938, 0.25 = #B25F4A, 0.5 = #77945C, 0.75 = #3BCA6D, 1 = #00FF7F
  const palette = [
    { pct: 0.0, color: [237, 41, 56] },    // #ED2938
    { pct: 0.25, color: [178, 95, 74] },  // #B25F4A
    { pct: 0.5, color: [119, 148, 92] },  // #77945C
    { pct: 0.75, color: [59, 202, 109] }, // #3BCA6D
    { pct: 1.0, color: [0, 255, 127] }    // #00FF7F
  ];
  let i = 1;
  for (; i < palette.length - 1; i++) {
    if (percentile < palette[i].pct) break;
  }
  const lower = palette[i - 1];
  const upper = palette[i];
  const range = upper.pct - lower.pct;
  const rangePct = (percentile - lower.pct) / range;
  const color = lower.color.map((c, idx) => Math.round(c + rangePct * (upper.color[idx] - c)));
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

export function PerformanceGrid({ players }: { players: PlayerWithStats[] }) {
  const [statData, setStatData] = useState<Record<string, ThreePointData[]>>({});
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<{ row: number; col: number; x: number; y: number; value: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAllStats() {
      setLoading(true);
      const allStats: Record<string, ThreePointData[]> = {};
      for (const stat of STAT_LIST) {
        const { data, error } = await supabase
          .from('distribution_stats')
          .select('*')
          .eq('stat', stat)
          .gte('minutes_played', 600);
        if (!error && data) {
          allStats[stat] = data.map((row: DistributionStats) => ({
            player_name: row.player_name,
            value: PERCENTAGE_STATS.includes(stat) && row.value > 1 ? row.value / 100 : row.value,
            team_abbreviation: row.team_abbreviation,
            minutes_played: row.minutes_played,
          }));
        }
      }
      setStatData(allStats);
      setLoading(false);
    }
    fetchAllStats();
  }, []);

  // Debug: log incoming players
  console.log('PerformanceGrid players', players);

  // Use total minutes played for filter
  const wolvesPlayers = players.filter(p => p.PLAYER_NAME && (Number(p.MIN) * Number(p.GP)) >= 600);
  console.log('PerformanceGrid wolvesPlayers', wolvesPlayers);
  const wolvesNames = wolvesPlayers.map(p => p.PLAYER_NAME);

  if (wolvesPlayers.length === 0) {
    return (
      <div className="text-gray-400">
        No Timberwolves players found with 600+ total minutes.<br />
        Total players received: {players.length}.<br />
        <div className="mt-4 text-xs text-white bg-[#222] p-2 rounded">
          <b>Debug: Player MIN values</b>
          <ul>
            {players.map((p, i) => (
              <li key={i}>{p.PLAYER_NAME} — MIN/g: {String(p.MIN)}, GP: {String(p.GP)}, Total MIN: {Number(p.MIN) * Number(p.GP)}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // For each stat, get league-wide sorted values and compute percentile for each Wolves player
  function getPercentile(stat: string, value: number) {
    const data = statData[stat] || [];
    const sorted = [...data].sort((a, b) => a.value - b.value);
    const idx = sorted.findIndex(d => d.value === value);
    if (idx === -1) return 0;
    return idx / (sorted.length - 1);
  }

  if (loading) {
    return <div className="text-gray-400">Loading Performance Grid...</div>;
  }

  return (
    <div ref={scrollContainerRef} className="overflow-x-auto bg-[#1e2129]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-4 md:p-8 relative">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-8 flex items-center gap-2 drop-shadow-glow">
        Performance Grid
      </h2>
      {/* Mobile scroll hint */}
      <div className="block md:hidden text-xs text-gray-400 mb-2 text-center select-none">
        <span className="inline-block bg-[#23263a]/80 px-2 py-1 rounded">Swipe left/right to see more players →</span>
      </div>
      <div className="overflow-x-auto">
        <table ref={tableRef} className="min-w-full border-separate border-spacing-0 relative">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gradient-to-br from-[#23263a]/80 to-[#1e2129]/90 backdrop-blur-lg text-left px-2 md:px-4 py-2 md:py-3 text-white font-extrabold text-base md:text-lg rounded-tl-2xl shadow-glass w-24 md:w-32 min-w-[5.5rem] md:min-w-[8rem] max-w-[7rem] md:max-w-[8rem]">
                Stat
              </th>
              {wolvesPlayers.map((player, colIdx) => (
                <th key={player.PLAYER_NAME} className="px-1 md:px-2 py-2 md:py-3 text-white font-extrabold text-xs md:text-base bg-gradient-to-br from-[#23263a]/80 to-[#1e2129]/90 backdrop-blur-lg shadow-glass w-16 md:w-24 min-w-[3.5rem] md:min-w-[6rem] max-w-[4.5rem] md:max-w-[6rem]">
                  <div className="flex flex-col items-center gap-1">
                    <img
                      src={player.image_url || ''}
                      alt={player.PLAYER_NAME}
                      className="w-8 h-8 md:w-12 md:h-12 rounded-full mb-1 border-2 border-[#78BE20] bg-[#1e2129] object-cover shadow-lg"
                      onError={e => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                    />
                    <span
                      className="text-[10px] md:text-xs text-white/90 font-semibold whitespace-nowrap max-w-[3.5rem] md:max-w-[6rem] overflow-hidden text-ellipsis block drop-shadow-glow"
                      title={player.PLAYER_NAME}
                    >
                      {player.PLAYER_NAME}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAT_LIST.map((stat, rowIdx) => (
              <tr key={stat}>
                <td className="sticky left-0 z-10 bg-gradient-to-br from-[#23263a]/80 to-[#1e2129]/90 backdrop-blur-lg px-2 md:px-4 py-2 md:py-3 text-white font-bold border-r border-gray-700/50 shadow-glass rounded-l-2xl text-xs md:text-base w-24 md:w-32 min-w-[5.5rem] md:min-w-[8rem] max-w-[7rem] md:max-w-[8rem]">
                  {getStatLabel(stat)}
                </td>
                {wolvesPlayers.map((player, colIdx) => {
                  const playerStat = (statData[stat] || []).find(d => d.player_name === player.PLAYER_NAME);
                  if (!playerStat) return <td key={player.PLAYER_NAME} className="px-1 md:px-2 py-2 md:py-3 text-gray-500 bg-[#141923] w-16 md:w-24 min-w-[3.5rem] md:min-w-[6rem] max-w-[4.5rem] md:max-w-[6rem] text-xs md:text-base">–</td>;
                  const percentile = getPercentile(stat, playerStat.value);
                  const color = getHeatColor(percentile);
                  // Only show hover effect on non-touch devices
                  const isHovered = hovered && (hovered.row === rowIdx || hovered.col === colIdx);
                  return (
                    <td
                      key={player.PLAYER_NAME}
                      className={`px-1 md:px-2 py-2 md:py-3 font-bold text-center transition-all duration-200 rounded-xl shadow-md cursor-pointer w-16 md:w-24 min-w-[3.5rem] md:min-w-[6rem] max-w-[4.5rem] md:max-w-[6rem] text-xs md:text-base text-[#23263a] ${isHovered ? 'ring-2 ring-[#78BE20] ring-offset-2 ring-offset-[#1e2129] z-10' : ''}`}
                      style={{ background: color, boxShadow: '0 2px 12px 0 rgba(120,190,32,0.10)' }}
                      onMouseEnter={e => {
                        if ('ontouchstart' in window) return; // skip hover on touch
                        const cell = e.currentTarget as HTMLElement;
                        const container = scrollContainerRef.current;
                        if (container) {
                          const containerRect = container.getBoundingClientRect();
                          const cellRect = cell.getBoundingClientRect();
                          setHovered({
                            row: rowIdx,
                            col: colIdx,
                            x: cellRect.left - containerRect.left + cellRect.width / 2 + container.scrollLeft,
                            y: cellRect.top - containerRect.top + container.scrollTop,
                            value: percentile
                          });
                        }
                      }}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {formatStatValue(stat, playerStat.value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Custom tooltip for percentile */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-50"
            style={{
              left: `min(${hovered.x}px, calc(100% - 10px))`,
              top: hovered.y - 8,
              transform: 'translate(-50%, -100%)',
              maxWidth: '16rem',
            }}
          >
            <div className="relative animate-fade-in">
              <div className="bg-[#23263a] text-white text-sm font-bold px-4 py-3 rounded-xl shadow-2xl border-2 border-[#78BE20] max-w-xs break-words flex flex-col items-center gap-1 drop-shadow-glow">
                <span className="text-xs text-gray-300 font-semibold">{wolvesPlayers[hovered.col]?.PLAYER_NAME}</span>
                <span className="text-xs text-gray-400 font-medium">{getStatLabel(STAT_LIST[hovered.row])}</span>
                <span className="mt-1">Percentile: <span className="text-[#78BE20] font-extrabold">{(hovered.value * 100).toFixed(1)}%</span></span>
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 w-4 h-4 overflow-visible" style={{top: '100%'}}>
                <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0L8 8L16 0H0Z" fill="#23263a" stroke="#78BE20" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 text-xs text-gray-400 bg-[#141923]/60 rounded-lg p-3 shadow-inner">
        Cell color = league percentile (red = low, green = high). Only players with 600+ total minutes shown.<br />
        <span className="text-[#78BE20]">Tip:</span> Hover a cell to see the percentile.
      </div>
    </div>
  );
} 
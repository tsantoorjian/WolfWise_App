import { useEffect, useState, useRef } from 'react';
import { PlayerWithStats } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { FullSeasonBasePerGame, FullSeasonAdvancedPerGame } from '../types/database.types';
import { Settings } from 'lucide-react';

// Basic stats from HeatShotTool
const BASE_STATS = [
  { key: 'PTS', label: 'Points', table: 'base' },
  { key: 'REB', label: 'Rebounds', table: 'base' },
  { key: 'AST', label: 'Assists', table: 'base' },
  { key: 'STL', label: 'Steals', table: 'base' },
  { key: 'BLK', label: 'Blocks', table: 'base' },
  { key: 'FG_PCT', label: 'FG %', table: 'base' },
  { key: 'FG3_PCT', label: '3PT %', table: 'base' },
  { key: 'FT_PCT', label: 'FT %', table: 'base' },
  { key: 'TOV', label: 'Turnovers', table: 'base' },
  { key: 'FGM', label: 'FGM', table: 'base' },
  { key: 'FGA', label: 'FGA', table: 'base' },
  { key: 'FG3M', label: '3PM', table: 'base' },
  { key: 'FG3A', label: '3PA', table: 'base' },
  { key: 'FTM', label: 'FTM', table: 'base' },
  { key: 'FTA', label: 'FTA', table: 'base' },
  { key: 'OREB', label: 'OREB', table: 'base' },
  { key: 'DREB', label: 'DREB', table: 'base' },
  { key: 'PF', label: 'Fouls', table: 'base' },
  { key: 'PLUS_MINUS', label: '+/-', table: 'base' },
  { key: 'MIN', label: 'Minutes', table: 'base' },
];

// Advanced stats from HeatShotTool
const ADVANCED_STATS = [
  { key: 'TS_PCT', label: 'TS %', table: 'advanced' },
  { key: 'EFG_PCT', label: 'eFG %', table: 'advanced' },
  { key: 'USG_PCT', label: 'Usage %', table: 'advanced' },
  { key: 'AST_PCT', label: 'AST %', table: 'advanced' },
  { key: 'REB_PCT', label: 'REB %', table: 'advanced' },
  { key: 'STL_PCT', label: 'STL %', table: 'advanced' },
  { key: 'BLK_PCT', label: 'BLK %', table: 'advanced' },
  { key: 'TM_TOV_PCT', label: 'TOV %', table: 'advanced' },
  { key: 'OFF_RATING', label: 'ORTG', table: 'advanced' },
  { key: 'DEF_RATING', label: 'DRTG', table: 'advanced' },
  { key: 'NET_RATING', label: 'NetRTG', table: 'advanced' },
  { key: 'PIE', label: 'PIE', table: 'advanced' },
  { key: 'AST_TO', label: 'AST/TO', table: 'advanced' },
  { key: 'AST_RATIO', label: 'AST Ratio', table: 'advanced' },
  { key: 'OREB_PCT', label: 'OREB %', table: 'advanced' },
  { key: 'DREB_PCT', label: 'DREB %', table: 'advanced' },
  { key: 'PACE', label: 'Pace', table: 'advanced' },
];

const NEGATIVE_STATS = ['TOV', 'TM_TOV_PCT', 'DEF_RATING', 'PF'];
const PERCENTAGE_STATS = ['FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT', 'USG_PCT', 'AST_PCT', 'REB_PCT', 'STL_PCT', 'BLK_PCT', 'TM_TOV_PCT', 'OREB_PCT', 'DREB_PCT', 'W_PCT'];

function formatStatValue(stat: string, value: number) {
  if (PERCENTAGE_STATS.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(1);
}

// Updated color function: solid purple (low) to green (high) without transparency
function getHeatColor(percentile: number) {
  const purple = [109, 40, 217]; // #6D28D9
  const green = [34, 197, 94]; // #22C55E
  const t = percentile;
  const color = purple.map((c, i) => Math.round(c + t * (green[i] - c)));
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

// New: Function to determine text color based on background luminance
function getTextColor(bgColor: string) {
  const rgb = bgColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return '#ffffff';
  const [r, g, b] = rgb.map(Number);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140 ? '#1f2937' : '#ffffff';
}

interface StatData {
  player_name: string;
  value: number;
  team_abbreviation: string;
  minutes: number;
}

export function PerformanceGrid({ players }: { players: PlayerWithStats[] }) {
  const [baseData, setBaseData] = useState<FullSeasonBasePerGame[]>([]);
  const [advancedData, setAdvancedData] = useState<FullSeasonAdvancedPerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<{ row: number; col: number; x: number; y: number; value: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAllStats() {
      setLoading(true);
      try {
        const [{ data: baseStats, error: baseError }, { data: advancedStats, error: advancedError }] = await Promise.all([
          supabase.from('full_season_base_per_game').select('*'),
          supabase.from('full_season_advanced_per_game').select('*')
        ]);

        if (baseError) throw baseError;
        if (advancedError) throw advancedError;

        setBaseData(baseStats || []);
        setAdvancedData(advancedStats || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    }
    fetchAllStats();
  }, []);

  // Get stat data for a specific stat
  function getStatData(statKey: string): StatData[] {
    const statInfo = [...BASE_STATS, ...ADVANCED_STATS].find(s => s.key === statKey);
    if (!statInfo) return [];

    const data = statInfo.table === 'base' ? baseData : advancedData;
    
    const filteredData = data
      .filter(player => {
        // For per-game tables, filter by minutes per game (MIN field) * games played (GP field)
        const mpg = parseFloat(player.MIN as any) || 0;
        const gp = player.GP || 0;
        return (mpg * gp) >= 600; // 600 total minutes minimum
      })
      .map((player, index) => {
        const statValue = (player as any)[statKey];
        
        // Parse numeric values from strings for both base and advanced stats
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

    return filteredData;
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

  // Get current stat list based on toggle
  const currentStats = showAdvanced ? ADVANCED_STATS : BASE_STATS;

  if (loading) {
    return <div className="text-gray-400">Loading Performance Grid...</div>;
  }

  return (
    <div ref={scrollContainerRef} className="overflow-x-auto bg-[#1e2129]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-4 md:p-8 relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2 drop-shadow-glow">
          Performance Grid
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-[#23263a] border border-gray-600 rounded-lg hover:border-[#78BE20] transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-[#23263a]/60 rounded-lg border border-gray-600/30">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stats Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvanced(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !showAdvanced
                    ? 'bg-[#78BE20] text-black font-semibold'
                    : 'bg-[#1e2129] text-white border border-gray-600 hover:border-[#78BE20]'
                }`}
              >
                Basic Stats
              </button>
              <button
                onClick={() => setShowAdvanced(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showAdvanced
                    ? 'bg-[#78BE20] text-black font-semibold'
                    : 'bg-[#1e2129] text-white border border-gray-600 hover:border-[#78BE20]'
                }`}
              >
                Advanced Stats
              </button>
            </div>
          </div>
        </div>
      )}

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
            {currentStats.map((stat, rowIdx) => (
              <tr key={stat.key}>
                <td className="sticky left-0 z-10 bg-gradient-to-br from-[#23263a]/80 to-[#1e2129]/90 backdrop-blur-lg px-2 md:px-4 py-2 md:py-3 text-white font-bold border-r border-gray-700/50 shadow-glass rounded-l-2xl text-xs md:text-base w-24 md:w-32 min-w-[5.5rem] md:min-w-[8rem] max-w-[7rem] md:max-w-[8rem]">
                  {stat.label}
                </td>
                {wolvesPlayers.map((player, colIdx) => {
                  const playerStat = getStatData(stat.key).find(d => d.player_name === player.PLAYER_NAME);
                  if (!playerStat) return <td key={player.PLAYER_NAME} className="px-1 md:px-2 py-2 md:py-3 text-gray-500 bg-[#141923] w-16 md:w-24 min-w-[3.5rem] md:min-w-[6rem] max-w-[4.5rem] md:max-w-[6rem] text-xs md:text-base">–</td>;
                  const percentile = getPercentile(stat.key, playerStat.value);
                  const bgColor = getHeatColor(percentile);
                  const textColor = getTextColor(bgColor);
                  // Only show hover effect on non-touch devices
                  const isHovered = hovered && (hovered.row === rowIdx || hovered.col === colIdx);
                  return (
                    <td
                      key={player.PLAYER_NAME}
                      className={`px-1 md:px-2 py-2 md:py-3 font-bold text-center transition-all duration-200 rounded-xl shadow-md cursor-pointer w-16 md:w-24 min-w-[3.5rem] md:min-w-[6rem] max-w-[4.5rem] md:max-w-[6rem] text-xs md:text-base ${isHovered ? 'ring-2 ring-[#78BE20] ring-offset-2 ring-offset-[#1e2129] z-10' : ''}`}
                      style={{ background: bgColor, color: textColor, boxShadow: '0 2px 12px 0 rgba(120,190,32,0.10)' }}
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
                      {formatStatValue(stat.key, playerStat.value)}
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
                <span className="text-xs text-gray-400 font-medium">{currentStats[hovered.row]?.label}</span>
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
        Cell color = league percentile (purple = low, green = high). Only players with 600+ total minutes shown.<br />
        <span className="text-[#78BE20]">Tip:</span> Hover a cell to see the percentile. Currently showing {showAdvanced ? 'advanced' : 'basic'} stats (per game).
      </div>
    </div>
  );
} 
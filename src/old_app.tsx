import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { NbaPlayerStats, RecordTrackerSeason } from './types/database.types';
import { UserRound, TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

type ThreePointData = {
  player_name: string;
  fg3_pct: number;
  fg3a: number;
  team_abbreviation: string;
};

type ThreePointBucket = {
  range: string;
  count: number;
  players: ThreePointData[];
};

type LineupWithAdvanced = {
  group_name: string;
  lineup_size: number;
  min: number;
  net_rating: number;
  off_rating: number;
  def_rating: number;
  ts_pct: number;
  pace: number;
  players: {
    name: string;
    image_url: string | null;
  }[];
};

type RecentStats = {
  PTS: number;
  AST: number;
  REB: number;
  STL: number;
  BLK: number;
  PLUS_MINUS: number;
};

function App() {
  const [players, setPlayers] = useState<NbaPlayerStats[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<NbaPlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'distribution' | 'lineups' | 'records'>('stats');
  const [threePointBuckets, setThreePointBuckets] = useState<ThreePointBucket[]>([]);
  const [showTopLineups, setShowTopLineups] = useState(true);
  const [hoveredPlayer, setHoveredPlayer] = useState<ThreePointData | null>(null);
  const [lineups, setLineups] = useState<{
    twoMan: LineupWithAdvanced[];
    threeMan: LineupWithAdvanced[];
    fiveMan: LineupWithAdvanced[];
  }>({
    twoMan: [],
    threeMan: [],
    fiveMan: [],
  });
  const [last5Stats, setLast5Stats] = useState<Record<string, RecentStats>>({});
  const [last10Stats, setLast10Stats] = useState<Record<string, RecentStats>>({});
  const [recordData, setRecordData] = useState<RecordTrackerSeason[]>([]);
  const [selectedStat, setSelectedStat] = useState<string>('pts');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: twolvesData, error: twolvesError } = await supabase
          .from('nba_player_stats')
          .select('*')
          .order('player_name');
        
        if (twolvesError) throw twolvesError;
        setPlayers(twolvesData || []);

        const { data: allPlayersData, error: allPlayersError } = await supabase
          .from('all_player_3pt')
          .select('player_name, fg3_pct, fg3a, team_abbreviation');

        if (allPlayersError) throw allPlayersError;

        const buckets: ThreePointBucket[] = [];
        const bucketSize = 0.05;
        const minPct = 0;
        const maxPct = 0.55;

        for (let i = minPct; i < maxPct; i += bucketSize) {
          buckets.push({
            range: `${(i * 100).toFixed(1)}% - ${((i + bucketSize) * 100).toFixed(1)}%`,
            count: 0,
            players: []
          });
        }

        const validPlayers = (allPlayersData || []).filter(player => 
          player.fg3_pct !== null && 
          player.fg3a >= 1
        );

        validPlayers.forEach(player => {
          const bucketIndex = Math.min(
            Math.floor(player.fg3_pct / bucketSize),
            buckets.length - 1
          );
          if (bucketIndex >= 0 && bucketIndex < buckets.length) {
            buckets[bucketIndex].count++;
            buckets[bucketIndex].players.push(player);
          }
        });

        setThreePointBuckets(buckets);

        const fetchLineups = async (size: number, limit: number) => {
          const { data, error } = await supabase
            .from('lineups_advanced')
            .select('*, group_name, lineup_size, min, player1, player2, player3, player4, player5')
            .eq('team_abbreviation', 'MIN')
            .eq('lineup_size', size)
            .gte('min', 50)
            .order('net_rating', { ascending: !showTopLineups })
            .limit(limit);

          if (error) {
            console.error(`Error fetching ${size}-man lineups:`, error);
            return [];
          }

          return data || [];
        };

        const [twoManData, threeManData, fiveManData] = await Promise.all([
          fetchLineups(2, 3),
          fetchLineups(3, 3),
          fetchLineups(5, 3),
        ]);

        const processLineup = (lineup: any): LineupWithAdvanced => {
          const playerNames = [
            lineup.player1,
            lineup.player2,
            lineup.player3,
            lineup.player4,
            lineup.player5,
          ].filter(Boolean);

          const players = playerNames.map(playerName => {
            if (!playerName) return { name: '', image_url: null };
            const lastName = playerName.split('. ')[1];
            const player = twolvesData?.find(p => p.player_name.split(' ').pop() === lastName);
            return {
              name: playerName,
              image_url: player?.image_url || null,
            };
          });

          return {
            group_name: lineup.group_name,
            lineup_size: lineup.lineup_size,
            min: lineup.min || 0,
            net_rating: lineup.net_rating || 0,
            off_rating: lineup.off_rating || 0,
            def_rating: lineup.def_rating || 0,
            ts_pct: lineup.ts_pct || 0,
            pace: lineup.pace || 0,
            players,
          };
        };

        setLineups({
          twoMan: twoManData.map(processLineup),
          threeMan: threeManData.map(processLineup),
          fiveMan: fiveManData.map(processLineup),
        });

        const { data: last5Data, error: last5Error } = await supabase
          .from('timberwolves_player_stats_last_5')
          .select('*');
        
        const { data: last10Data, error: last10Error } = await supabase
          .from('timberwolves_player_stats_last_10')
          .select('*');

        if (last5Error) throw last5Error;
        if (last10Error) throw last10Error;

        const last5Record = (last5Data || []).reduce((acc, curr) => {
          acc[curr.PLAYER_NAME] = curr;
          return acc;
        }, {} as Record<string, RecentStats>);

        const last10Record = (last10Data || []).reduce((acc, curr) => {
          acc[curr.PLAYER_NAME] = curr;
          return acc;
        }, {} as Record<string, RecentStats>);

        setLast5Stats(last5Record);
        setLast10Stats(last10Record);

        const { data: recordTrackerData, error: recordTrackerError } = await supabase
          .from('record_tracker_season')
          .select('*');

        if (recordTrackerError) throw recordTrackerError;
        setRecordData(recordTrackerData || []);

      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showTopLineups]);

  const RecordProgressBar = ({ current, max, label, player }: {
    current: number;
    max: number;
    label: string;
    player: string;
  }) => {
    const percentage = (current / max) * 100;
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-[#0C2340]">{label}</span>
          <span className="text-sm text-[#9EA2A2]">{player}</span>
        </div>
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-[#78BE20] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-end px-2">
            <span className="text-xs font-semibold text-white">
              {current.toFixed(1)} / {max.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    );
  };

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

  const LineupCard = ({ lineup }: { lineup: LineupWithAdvanced }) => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex items-center">
          {lineup.players.map((player, playerIndex) => (
            <div
              key={playerIndex}
              className="relative"
              style={{
                marginLeft: playerIndex > 0 ? '-1rem' : '0',
                zIndex: lineup.players.length - playerIndex
              }}
            >
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-12 h-12 rounded-full border-2 border-white bg-[#0C2340] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/48';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white bg-[#0C2340] flex items-center justify-center">
                  <UserRound className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={`text-2xl font-bold ${lineup.net_rating >= 0 ? 'text-[#78BE20]' : 'text-[#DC2626]'}`}>
          {lineup.net_rating > 0 ? '+' : ''}{lineup.net_rating.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div>
          <div className="text-[#9EA2A2]">MIN</div>
          <div className="font-semibold">{lineup.min.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">ORTG</div>
          <div className="font-semibold">{lineup.off_rating.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">DRTG</div>
          <div className="font-semibold">{lineup.def_rating.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">PACE</div>
          <div className="font-semibold">{lineup.pace.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[#9EA2A2]">TS%</div>
          <div className="font-semibold">{(lineup.ts_pct * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ label, value, bgColor, textColor, playerName }: {
    label: string;
    value: number | null;
    bgColor: string;
    textColor: string;
    playerName?: string;
  }) => {
    const getStatKey = () => {
      switch (label.toUpperCase()) {
        case 'POINTS': return 'PTS';
        case 'REBOUNDS': return 'REB';
        case 'ASSISTS': return 'AST';
        case 'STEALS': return 'STL';
        case 'BLOCKS': return 'BLK';
        case 'PLUS/MINUS': return 'PLUS_MINUS';
        default: return '';
      }
    };

    const statKey = getStatKey();
    const last5Value = playerName && last5Stats[playerName]?.[statKey as keyof RecentStats];
    const last10Value = playerName && last10Stats[playerName]?.[statKey as keyof RecentStats];

    const getPerformanceIndicator = (recentValue: number, seasonValue: number) => {
      const threshold = 0.1; // 10% difference threshold
      const percentDiff = Math.abs(recentValue - seasonValue) / seasonValue;
      
      if (percentDiff > threshold) {
        if (recentValue > seasonValue) {
          return <TrendingUp className={`w-3 h-3 ${bgColor === 'bg-[#78BE20]' ? 'text-[#2A4708]' : 'text-[#78BE20]'}`} />;
        } else {
          return <TrendingDown className="w-3 h-3 text-[#DC2626]" />;
        }
      }
      return <Minus className="w-3 h-3 text-white/40" />;
    };

    return (
      <div className={`${bgColor} rounded-lg p-4 relative`}>
        <p className="text-sm font-medium text-white opacity-90">{label}</p>
        <div className="flex justify-between items-end mt-1">
          <div>
            <p className={`text-2xl font-bold ${textColor}`}>
              {value !== null ? value.toFixed(1) : '0.0'}
            </p>
            <p className="text-[0.65rem] text-white/60 mt-1">Season Average</p>
          </div>
          {last5Value !== undefined && last10Value !== undefined && (
            <div className="text-[0.65rem] text-white/80 text-right">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="opacity-70">L5</span>
                <span className="font-medium">{(last5Value as number).toFixed(1)}</span>
                {value && getPerformanceIndicator(last5Value as number, value)}
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className="opacity-70">L10</span>
                <span className="font-medium">{(last10Value as number).toFixed(1)}</span>
                {value && getPerformanceIndicator(last10Value as number, value)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#0C2340] mb-8">Minnesota Timberwolves Statistics</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                    : 'text-[#9EA2A2] hover:text-[#0C2340]'
                }`}
              >
                Player Stats
              </button>
              <button
                onClick={() => setActiveTab('distribution')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'distribution'
                    ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                    : 'text-[#9EA2A2] hover:text-[#0C2340]'
                }`}
              >
                3PT Distribution
              </button>
              <button
                onClick={() => setActiveTab('lineups')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'lineups'
                    ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                    : 'text-[#9EA2A2] hover:text-[#0C2340]'
                }`}
              >
                Lineups
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'records'
                    ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                    : 'text-[#9EA2A2] hover:text-[#0C2340]'
                }`}
              >
                Record Tracker
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-[#0C2340]">
                <h2 className="text-xl font-semibold text-white">Players</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-250px)] overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-[#9EA2A2]">Loading players...</div>
                ) : (
                  players.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                        selectedPlayer?.id === player.id ? 'bg-[#236192] text-white' : ''
                      }`}
                    >
                      <img
                        src={player.image_url || ''}
                        alt={player.player_name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/40';
                        }}
                      />
                      <span>{player.player_name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedPlayer ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-6 mb-6">
                    {selectedPlayer.image_url ? (
                      <img
                        src={selectedPlayer.image_url}
                        alt={selectedPlayer.player_name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#236192]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/96';
                        }}
                      />
                    ) : (
                      <div className="bg-[#0C2340] p-3 rounded-full">
                        <UserRound className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-[#0C2340]">
                        {selectedPlayer.player_name}
                      </h2>
                      {selectedPlayer.nickname && (
                        <p className="text-[#9EA2A2]">"{selectedPlayer.nickname}"</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                      label="Points"
                      value={selectedPlayer.points}
                      bgColor="bg-[#0C2340]"
                      textColor="text-white"
                      playerName={selectedPlayer.player_name}
                    />
                    <StatCard
                      label="Rebounds"
                      value={selectedPlayer.total_rebounds}
                      bgColor="bg-[#236192]"
                      textColor="text-white"
                      playerName={selectedPlayer.player_name}
                    />
                    <StatCard
                      label="Assists"
                      value={selectedPlayer.assists}
                      bgColor="bg-[#78BE20]"
                      textColor="text-white"
                      playerName={selectedPlayer.player_name}
                    />
                    <StatCard
                      label="Steals"
                      value={selectedPlayer.steals}
                      bgColor="bg-[#0C2340]"
                      textColor="text-white"
                      playerName={selectedPlayer.player_name}
                    />
                    <StatCard
                      label="Blocks"
                      value={selectedPlayer.blocks}
                      bgColor="bg-[#236192]"
                      textColor="text-white"
                      playerName={selectedPlayer.player_name}
                    />
                    <StatCard
                      label="Plus/Minus"
                      value={selectedPlayer.plus_minus}
                      bgColor="bg-[#78BE20]"
                      textColor="text-white"
                      playerName={selectedPlayer.player_name}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="text-[#9EA2A2]">
                        Games Played: <span className="font-semibold text-[#0C2340]">{selectedPlayer.games_played}</span>
                      </p>
                      <p className="text-[#9EA2A2]">
                        Minutes/Game: <span className="font-semibold text-[#0C2340]">{selectedPlayer.minutes_per_game}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[#9EA2A2]">
                        Win %: <span className="font-semibold text-[#0C2340]">{(selectedPlayer.win_percentage * 100).toFixed(1)}%</span>
                      </p>
                      <p className="text-[#9EA2A2]">
                        Fantasy Points: <span className="font-semibold text-[#0C2340]">{selectedPlayer.nba_fantasy_pts}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-[#9EA2A2]">
                  Select a player to view their statistics
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-[#0C2340] mb-4">League-wide 3PT Percentage Distribution</h3>
            <div className="relative h-96 pb-12">
              <div className="absolute left-0 h-[calc(100%-48px)] flex flex-col justify-between text-xs text-[#9EA2A2]">
                {Array.from({ length: 6 }, (_, i) => {
                  const maxCount = Math.max(...threePointBuckets.map(b => b.count));
                  const value = Math.round((5 - i) * maxCount / 5);
                  return <span key={i}>{value}</span>;
                })}
              </div>
              
              <div className="absolute inset-0 ml-8 flex items-end h-[calc(100%-48px)]">
                {threePointBuckets.map((bucket, index) => {
                  const maxCount = Math.max(...threePointBuckets.map(b => b.count));
                  const heightPercentage = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                  const twolvesPlayers = bucket.players.filter(p => p.team_abbreviation === 'MIN');
                  
                  return (
                    <div
                      key={index}
                      className="relative flex-1 mx-1 h-full"
                    >
                      <div
                        className={`absolute bottom-0 w-full ${twolvesPlayers.length > 0 ? 'bg-[#78BE20]' : 'bg-[#9EA2A2]'}`}
                        style={{
                          height: `${heightPercentage}%`
                        }}
                      />

                      {twolvesPlayers.length > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 mb-1">
                          {twolvesPlayers.map((player) => {
                            const playerData = players.find(p => p.player_name === player.player_name);
                            return playerData?.image_url ? (
                              <div key={player.player_name} className="relative group">
                                <img
                                  src={playerData.image_url}
                                  alt={player.player_name}
                                  className="w-8 h-8 rounded-full border-2 border-[#78BE20] bg-white object-cover hover:border-[#236192] transition-colors cursor-pointer"
                                  onMouseEnter={() => setHoveredPlayer(player)}
                                  onMouseLeave={() => setHoveredPlayer(null)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/32';
                                  }}
                                />
                                {hoveredPlayer?.player_name === player.player_name && (
                                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#0C2340] text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                    <div className="font-semibold">{player.player_name}</div>
                                    <div>3PT%: {(player.fg3_pct * 100).toFixed(1)}%</div>
                                    <div>3PA: {player.fg3a.toFixed(1)}</div>
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-[#9EA2A2] pt-4">
                {threePointBuckets.map((bucket, index) => (
                  <div 
                    key={index} 
                    className="flex-1 text-center transform -rotate-45 origin-top-left translate-y-6"
                  >
                    {index % 2 === 0 ? bucket.range.split(' - ')[0] : ''}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-16 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#78BE20] rounded"></div>
                <span className="text-[#0C2340]">Timberwolves Players</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#9EA2A2] rounded"></div>
                <span className="text-[#0C2340]">Other NBA Players</span>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-[#9EA2A2]">
              * Minimum 1 three-point attempt per game required
            </div>
          </div>
        )}

        {activeTab === 'lineups' && (
          <div className="space-y-8">
            {loading ? (
              <div className="text-center text-[#9EA2A2]">Loading lineup data...</div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <div className="bg-white rounded-lg shadow-md p-2">
                    <button
                      onClick={() => setShowTopLineups(!showTopLineups)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showTopLineups
                          ? 'bg-[#78BE20] text-white'
                          : 'bg-[#DC2626] text-white'
                      }`}
                    >
                      {showTopLineups ? 'Showing Top Lineups' : 'Showing Bottom Lineups'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#0C2340] mb-4">
                    {showTopLineups ? 'Top' : 'Bottom'} 2-Man Lineups
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lineups.twoMan.map((lineup, index) => (
                      <LineupCard key={index} lineup={lineup} />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-[#0C2340] mb-4">
                    {showTopLineups ? 'Top' : 'Bottom'} 3-Man Lineups
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lineups.threeMan.map((lineup, index) => (
                      <LineupCard key={index} lineup={lineup} />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-[#0C2340] mb-4">
                    {showTopLineups ? 'Top' : 'Bottom'} 5-Man Lineups
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {lineups.fiveMan.map((lineup, index) => (
                      <LineupCard key={index} lineup={lineup} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'records' && (
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
        )}
      </div>
    </div>
  );
}

export default App;
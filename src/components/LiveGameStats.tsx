import React from 'react';
import useLiveGameStats from '../hooks/useLiveGameStats';
import GameFlowChart from './GameFlowChart';
import './LiveGameStats.css';
import { Activity, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const LiveGameStats: React.FC = () => {
  const { playerStats, gameInfo, playByPlay, loading, error, refreshStats } = useLiveGameStats();

  const formatMinutes = (minutes: string) => {
    return minutes.split(':')[0];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Activity className="w-12 h-12 text-[#4ade80] animate-pulse" />
        <div className="loading">Loading live game stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
        <button 
          className="retry-button"
          onClick={refreshStats}
        >
          Refresh Data
        </button>
      </div>
    );
  }

  if ((!playerStats || playerStats.length === 0) && !gameInfo) {
    return (
      <div className="empty-container">
        <h1>Live Game Stats</h1>
        <div className="empty-message">
          <Activity className="w-16 h-16 text-gray-500 opacity-50" />
          <p>No live game stats available at the moment.</p>
          <p className="hint">Check back during the next game!</p>
        </div>
        <button 
          className="retry-button"
          onClick={refreshStats}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>
    );
  }

  // Filter out players with no stats and sort by points in descending order
  const sortedPlayerStats = [...(playerStats || [])]
    .filter(player => player && player.player && (player.pts > 0 || player.reb > 0 || player.ast > 0 || player.blk > 0 || player.stl > 0))
    .sort((a, b) => b.pts - a.pts);

  // Format period display
  const formatPeriod = (period: number) => {
    if (period <= 4) return `Q${period}`;
    return `OT${period - 4}`;
  };

  // Format game status for display
  const getGameStatusDisplay = () => {
    if (!gameInfo) return null;
    
    if (gameInfo.is_halftime) return "HALFTIME";
    if (gameInfo.is_end_of_period) return `END OF ${formatPeriod(gameInfo.period)}`;
    if (gameInfo.game_status === "in_progress") return `${formatPeriod(gameInfo.period)} • ${gameInfo.game_clock}`;
    if (gameInfo.game_status === "final") return "FINAL";
    if (gameInfo.game_status === "scheduled") return "SCHEDULED";
    
    return gameInfo.game_status.toUpperCase();
  };

  return (
    <div className="live-game-stats-container">
      <div className="stats-header">
        <h1>Live Game Stats</h1>
        
        {gameInfo && (
          <div className="game-info-container">
            <div className="scoreboard-wrapper">
              <div className="game-time">
                <span className="period-display">{getGameStatusDisplay()}</span>
              </div>
              
              <div className="team-row">
                <div className="team-info">
                  {gameInfo.home_team && (
                    <img 
                      src={getTeamLogoUrl(gameInfo.home_team)} 
                      alt={gameInfo.home_team} 
                      className="team-logo" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="team-abbr">{gameInfo.home_team}</span>
                </div>
                <div className="score-display">{gameInfo.home_score}</div>
              </div>
              
              <div className="team-row">
                <div className="team-info">
                  {gameInfo.away_team && (
                    <img 
                      src={getTeamLogoUrl(gameInfo.away_team)} 
                      alt={gameInfo.away_team} 
                      className="team-logo" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="team-abbr">{gameInfo.away_team}</span>
                </div>
                <div className="score-display">{gameInfo.away_score}</div>
              </div>
            </div>
            
            {playByPlay && playByPlay.length > 0 && (
              <div className="game-flow-container">
                <div className="lead-indicator-legend">
                  <div className="lead-item">
                    <span className="lead-dot away-team-lead"></span>
                    <span className="lead-team">{gameInfo.away_team} Lead</span>
                  </div>
                  <div className="lead-item">
                    <span className="lead-dot home-team-lead"></span>
                    <span className="lead-team">{gameInfo.home_team} Lead</span>
                  </div>
                </div>
                <GameFlowChart 
                  playByPlay={playByPlay} 
                  homeTeam={gameInfo.home_team} 
                  awayTeam={gameInfo.away_team} 
                />
                <div className="venue-display">Ball Arena, Denver</div>
              </div>
            )}
          </div>
        )}
        
        <button 
          className="refresh-button"
          onClick={refreshStats}
        >
          <RefreshCw className="w-4 h-4 mr-2 inline-block" />
          Refresh Stats
        </button>
      </div>
      
      <div className="player-stats-grid">
        {sortedPlayerStats.map((player, index) => {
          const isPlusMinus = parseFloat(String(player.plusminuspoints)) > 0;
          
          // Calculate stat performance levels for color coding
          const isPtsHigh = player.pts >= 20;
          const isPtsMedium = player.pts >= 10 && player.pts < 20;
          const isRebHigh = player.reb >= 10;
          const isRebMedium = player.reb >= 5 && player.reb < 10;
          const isAstHigh = player.ast >= 8;
          const isAstMedium = player.ast >= 4 && player.ast < 8;
          const isBlkHigh = player.blk > 2;
          const isBlkMedium = player.blk > 1;
          const isStlHigh = player.stl > 2;
          const isStlMedium = player.stl > 1;
          
          // Calculate FG and 3PT percentages
          const fgParts = player.fgs.split('-').map(n => parseInt(n, 10));
          const fgMade = fgParts[0] || 0;
          const fgAttempted = fgParts[1] || 0;
          const fgPercentage = fgAttempted > 0 ? (fgMade / fgAttempted * 100).toFixed(1) : '0.0';
          
          const threePtParts = player.threept.split('-').map(n => parseInt(n, 10));
          const threePtMade = threePtParts[0] || 0;
          const threePtAttempted = threePtParts[1] || 0;
          const threePtPercentage = threePtAttempted > 0 ? (threePtMade / threePtAttempted * 100).toFixed(1) : '0.0';
          
          return (
            <div key={index} className="player-stat-card">
              <div className="player-header">
                <div className="player-avatar">
                  {player.player_image ? (
                    <img 
                      src={player.player_image} 
                      alt={player.player}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=' + player.player.substring(0,1);
                      }}
                    />
                  ) : (
                    <img 
                      src={`/player-images/${player.player.replace(/\s+/g, '-').toLowerCase()}.jpg`} 
                      alt={player.player}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=' + player.player.substring(0,1);
                      }}
                    />
                  )}
                </div>
                <div className="player-info">
                  <h2 className="player-name">{player.player}</h2>
                  <div className="player-stats-row">
                    <div className={`player-plusminus ${isPlusMinus ? 'positive' : 'negative'}`}>
                      <span>{isPlusMinus ? '+' : ''}{player.plusminuspoints}</span>
                    </div>
                    <div className="player-minutes">
                      <span>{formatMinutes(player.min)} MIN</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="main-stats">
                <div className="stats-row">
                  <div className={`stat-box ${isPtsHigh ? 'high-stat' : isPtsMedium ? 'medium-stat' : ''}`}>
                    <span className="stat-value">{player.pts}</span>
                    <span className="stat-label">PTS</span>
                  </div>
                  
                  <div className={`stat-box ${isRebHigh ? 'high-stat' : isRebMedium ? 'medium-stat' : ''}`}>
                    <span className="stat-value">{player.reb}</span>
                    <span className="stat-label">REB</span>
                  </div>
                  
                  <div className={`stat-box ${isAstHigh ? 'high-stat' : isAstMedium ? 'medium-stat' : ''}`}>
                    <span className="stat-value">{player.ast}</span>
                    <span className="stat-label">AST</span>
                  </div>

                  <div className={`stat-box ${isBlkHigh ? 'high-stat' : isBlkMedium ? 'medium-stat' : ''}`}>
                    <span className="stat-value">{player.blk}</span>
                    <span className="stat-label">BLK</span>
                  </div>

                  <div className={`stat-box ${isStlHigh ? 'high-stat' : isStlMedium ? 'medium-stat' : ''}`}>
                    <span className="stat-value">{player.stl}</span>
                    <span className="stat-label">STL</span>
                  </div>

                  <div className={`stat-box ${player.tov > 3 ? 'high-turnover' : player.tov > 2 ? 'medium-turnover' : ''}`}>
                    <span className="stat-value">{player.tov}</span>
                    <span className="stat-label">TO</span>
                  </div>
                </div>
              </div>
              
              <div className="shooting-stats">
                <div className="shooting-stat">
                  <div className="shooting-header">
                    <span className="shooting-label">FG</span>
                    <span className="shooting-value">{player.fgs}</span>
                  </div>
                  <div className="shooting-bar-container">
                    <div 
                      className="shooting-bar" 
                      style={{ 
                        width: `${Math.min(parseFloat(fgPercentage), 100)}%`,
                        backgroundColor: parseFloat(fgPercentage) > 50 ? '#4ade80' : 
                                      parseFloat(fgPercentage) > 40 ? '#facc15' : '#f87171'
                      }}
                    ></div>
                  </div>
                  <span className="shooting-percentage">{fgPercentage}%</span>
                </div>
                
                <div className="shooting-stat">
                  <div className="shooting-header">
                    <span className="shooting-label">3PT</span>
                    <span className="shooting-value">{player.threept}</span>
                  </div>
                  <div className="shooting-bar-container">
                    <div 
                      className="shooting-bar" 
                      style={{ 
                        width: `${Math.min(parseFloat(threePtPercentage), 100)}%`,
                        backgroundColor: parseFloat(threePtPercentage) > 40 ? '#4ade80' : 
                                      parseFloat(threePtPercentage) > 33 ? '#facc15' : '#f87171'
                      }}
                    ></div>
                  </div>
                  <span className="shooting-percentage">{threePtPercentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveGameStats; 
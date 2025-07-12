import React, { useState } from 'react';
import useLiveGameStats from '../hooks/useLiveGameStats';
import GameFlowChart from './GameFlowChart';
import './LiveGameStats.css';
import { Activity, Clock, RefreshCw, Users, TrendingUp, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../hooks/useSupabase';
import { useLineups } from '../hooks/useLineups';
import LineupCard from './LineupCard';

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

// Helper function to get player image URL
const getPlayerImageUrl = (playerName: string): string => {
  // First try to use our local assets if they exist
  try {
    // Clean the name for URL
    const formattedName = playerName.replace(/\s+/g, '-').toLowerCase();
    // Using relative URL to current domain instead of absolute path
    return `${supabase.storage.from('nba-players').getPublicUrl(formattedName + '.jpg').data.publicUrl}`;
  } catch (error) {
    // Fallback to inline SVG data URL for a silhouette if no image found
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' fill='%23cccccc'%3E%3Crect width='60' height='60' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23ffffff'%3E${playerName[0]}%3C/text%3E%3C/svg%3E`;
  }
};

const LiveGameStats: React.FC = () => {
  // Add tab state
  const [activeTab, setActiveTab] = useState<'stats' | 'lineup' | 'flow'>('stats');
  
  const { 
    playerStats, 
    gameInfo, 
    playByPlay, 
    loading, 
    error, 
    refreshStats, 
    currentLineup 
  } = useLiveGameStats();

  // Add for lineup stats
  const { players, loading: playersLoading } = useSupabase();
  const { lineups: allLineups, loading: lineupsLoading } = useLineups(true, players);

  // Helper functions
  const formatMinutes = (minutes: string): string => {
    return minutes.split(':')[0];
  };

  // Format period display
  const formatPeriod = (period: number): string => {
    if (period <= 4) return `Q${period}`;
    return `OT${period - 4}`;
  };

  // Format game status for display
  const getGameStatusDisplay = (): string | null => {
    if (!gameInfo) return null;
    
    if (gameInfo.is_halftime) return "HALFTIME";
    if (gameInfo.is_end_of_period) return `END OF ${formatPeriod(gameInfo.period)}`;
    if (gameInfo.game_status === "in_progress") return `${formatPeriod(gameInfo.period)} • ${gameInfo.game_clock}`;
    if (gameInfo.game_status === "final") return "FINAL";
    if (gameInfo.game_status === "scheduled") return "SCHEDULED";
    
    return gameInfo.game_status.toUpperCase();
  };

  // Prepare sorted player stats
  const sortedPlayerStats = playerStats ? 
    [...playerStats].filter(player => 
      player && 
      player.player && 
      (player.pts > 0 || player.reb > 0 || player.ast > 0 || player.blk > 0 || player.stl > 0)
    ).sort((a, b) => b.pts - a.pts) : 
    [];

  // Render loading state
  if (loading) {
    return (
      <div className="loading-container">
        <Activity className="w-12 h-12 text-[#4ade80] animate-pulse" />
        <div className="loading">Loading live game stats...</div>
      </div>
    );
  }

  // Render error state
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

  // Render empty state
  if ((!playerStats || playerStats.length === 0) && !gameInfo) {
    return (
      <div className="empty-container">
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

  // Render Player Stats Tab content
  const renderPlayerStatsTab = () => (
    <div className="player-stats-grid">
      {sortedPlayerStats.map((player, index) => {
        const isPlusMinus = parseFloat(String(player.plusminuspoints)) > 0;
        
        // Calculate stat performance levels
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
        
        // Calculate percentages
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
                      // Use data URI for fallback to avoid network requests
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' fill='%23cccccc'%3E%3Crect width='60' height='60' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23ffffff'%3E${player.player[0]}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                ) : (
                  <img 
                    src={getPlayerImageUrl(player.player)} 
                    alt={player.player}
                    onError={(e) => {
                      // Use data URI for fallback to avoid network requests
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' fill='%23cccccc'%3E%3Crect width='60' height='60' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23ffffff'%3E${player.player[0]}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                )}
              </div>
              <div className="player-info">
                <h2 className="player-name">{player.player}</h2>
                <div className="player-stats-row">
                  <div className={`player-plusminus ${isPlusMinus ? 'positive' : 'negative'}`}>
                    {isPlusMinus ? '+' : ''}{player.plusminuspoints}
                  </div>
                  <div className="player-minutes">
                    {formatMinutes(player.min)} MIN
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
  );

  // Render On The Floor Tab content
  const renderOnTheFloorTab = () => {
    const onTheFloorNames = currentLineup?.names || [];
    const fiveManLineups = allLineups?.fiveMan || [];
    
    console.log('Current lineup names:', onTheFloorNames);
    console.log('Available five man lineups:', fiveManLineups);
    
    // More robust name matching
    const getLastName = (fullName: string) => {
      const parts = fullName.split(' ');
      // Handle case where it might be "Last, First"
      if (parts.length === 1 && fullName.includes(',')) {
        return fullName.split(',')[0].trim().toLowerCase();
      }
      // Return the last part (usually the last name)
      return parts[parts.length - 1].trim().toLowerCase();
    };
    
    // Check if two names might match despite different formats
    const namesMatch = (name1: string, name2: string) => {
      // Direct lowercase match
      if (name1.toLowerCase() === name2.toLowerCase()) return true;
      
      // Last name match
      const lastName1 = getLastName(name1);
      const lastName2 = getLastName(name2);
      if (lastName1 === lastName2) return true;
      
      // Partial match (e.g., "A. Edwards" vs "Anthony Edwards")
      // Check if one contains the other's last name
      if (name1.toLowerCase().includes(lastName2) || name2.toLowerCase().includes(lastName1)) return true;
      
      return false;
    };
    
    // More flexible lineup matching
    const matchingLineup = fiveManLineups.find(lineup => {
      // Only consider 5-man lineups
      if (lineup.players.length !== 5 || onTheFloorNames.length !== 5) return false;
      
      // Count how many players match between the lineups
      let matchCount = 0;
      
      for (const currentPlayer of onTheFloorNames) {
        for (const lineupPlayer of lineup.players) {
          if (namesMatch(currentPlayer, lineupPlayer.name)) {
            matchCount++;
            break; // Found a match for this player, move to next
          }
        }
      }
      
      console.log(`Lineup "${lineup.group_name}" matches ${matchCount}/5 players`);
      return matchCount === 5; // Require ALL 5 players to match exactly
    });
    
    console.log('Matching lineup found:', matchingLineup);
    
    const renderLineupStats = () => {
      if (playersLoading || lineupsLoading) {
        return <div className="text-gray-400 text-center">Loading lineup stats...</div>;
      }
      
      if (!matchingLineup) {
        return <div className="text-gray-400 text-center">No stats available for this lineup.</div>;
      }
      
      const { net_rating, min, off_rating, def_rating, ts_pct, pace } = matchingLineup;
      const isPositiveRating = net_rating >= 0;
      
      return (
        <div className="lineup-stats-container">
          <div className="lineup-stats-grid">
            <div className="lineup-stat-item">
              <div className="lineup-stat-label">NET RTG</div>
              <div className={`lineup-stat-value ${isPositiveRating ? 'positive' : 'negative'}`}>
                {isPositiveRating ? '+' : ''}{net_rating.toFixed(1)}
              </div>
            </div>
            
            <div className="lineup-stat-item">
              <div className="lineup-stat-label">MIN</div>
              <div className="lineup-stat-value">{min.toFixed(1)}</div>
            </div>
            
            <div className="lineup-stat-item">
              <div className="lineup-stat-label">OFF RTG</div>
              <div className="lineup-stat-value">{off_rating.toFixed(1)}</div>
            </div>
            
            <div className="lineup-stat-item">
              <div className="lineup-stat-label">DEF RTG</div>
              <div className="lineup-stat-value">{def_rating.toFixed(1)}</div>
            </div>
            
            <div className="lineup-stat-item">
              <div className="lineup-stat-label">TS%</div>
              <div className="lineup-stat-value">{(ts_pct * 100).toFixed(1)}%</div>
            </div>
            
            <div className="lineup-stat-item">
              <div className="lineup-stat-label">PACE</div>
              <div className="lineup-stat-value">{pace.toFixed(1)}</div>
            </div>
          </div>
        </div>
      );
    };
    
    return (
      currentLineup && currentLineup.names && currentLineup.names.length > 0 ? (
        <div className="on-the-floor-section tab-content">
          <div className="on-the-floor-teams">
            <div className="on-the-floor-team">
              <div className="on-the-floor-team-name">MIN</div>
              <div className="on-the-floor-players">
                {currentLineup.names.map((name: string, idx: number) => (
                  <div key={name} className="on-the-floor-player">
                    <img
                      src={currentLineup.images[idx] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' fill='%23cccccc'%3E%3Crect width='60' height='60' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23ffffff'%3E${name[0]}%3C/text%3E%3C/svg%3E`}
                      alt={name}
                      className="on-the-floor-player-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' fill='%23cccccc'%3E%3Crect width='60' height='60' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23ffffff'%3E${name[0]}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="on-the-floor-player-name">{name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Lineup stats below the player images */}
          <div className="lineup-stats-section">
            {renderLineupStats()}
          </div>
        </div>
      ) : (
        <div className="empty-tab-content">
          <div className="empty-message">
            <Users className="w-16 h-16 text-gray-500 opacity-50" />
            <p>No lineup information available.</p>
          </div>
        </div>
      )
    );
  };

  // Render Game Flow Tab content
  const renderGameFlowTab = () => (
    playByPlay && playByPlay.length > 0 && gameInfo ? (
      <div className="game-flow-tab-content tab-content">
        <div className="game-flow-header">
          <div className="game-flow-title">Game Flow</div>
          <div className="game-flow-subtitle">Score differential over time</div>
        </div>
        
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
        
        <div className="game-flow-expanded">
          <GameFlowChart 
            playByPlay={playByPlay} 
            homeTeam={gameInfo.home_team} 
            awayTeam={gameInfo.away_team} 
          />
        </div>
        
        <div className="game-flow-summary">
          <div className="game-flow-stat">
            <div className="game-flow-stat-label">Largest Lead</div>
            <div className="game-flow-stat-value">
              {Math.max(...playByPlay.map(p => Math.abs(p.score_margin)))} pts
            </div>
          </div>
          <div className="game-flow-stat">
            <div className="game-flow-stat-label">Lead Changes</div>
            <div className="game-flow-stat-value">
              {playByPlay.reduce((count, play, i, arr) => {
                if (i === 0) return 0;
                const prevMargin = arr[i-1].score_margin;
                const currMargin = play.score_margin;
                return (prevMargin > 0 && currMargin < 0) || (prevMargin < 0 && currMargin > 0) ? count + 1 : count;
              }, 0)}
            </div>
          </div>
          <div className="game-flow-stat">
            <div className="game-flow-stat-label">Tied</div>
            <div className="game-flow-stat-value">
              {playByPlay.filter(p => p.score_margin === 0).length} times
            </div>
          </div>
        </div>
        
        <div className="venue-display">{gameInfo.arena}, {gameInfo.city}</div>
      </div>
    ) : (
      <div className="empty-tab-content">
        <div className="empty-message">
          <TrendingUp className="w-16 h-16 text-gray-500 opacity-50" />
          <p>No game flow data available.</p>
        </div>
      </div>
    )
  );

  // Main render with tabs
  return (
    <div className="live-game-stats-container">
      <div className="stats-header">
        {gameInfo && (
          <div className="compact-scoreboard-container">
            <div className="compact-game-status">
              {getGameStatusDisplay()}
            </div>
            <div className="compact-scoreboard-row">
              <img 
                src={getTeamLogoUrl(gameInfo.home_team)} 
                alt={gameInfo.home_team} 
                className="compact-team-logo" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="compact-team-abbr">{gameInfo.home_team}</span>
              <span className="compact-score">{gameInfo.home_score}</span>
              <span className="compact-vs">–</span>
              <span className="compact-score">{gameInfo.away_score}</span>
              <span className="compact-team-abbr">{gameInfo.away_team}</span>
              <img 
                src={getTeamLogoUrl(gameInfo.away_team)} 
                alt={gameInfo.away_team} 
                className="compact-team-logo" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        )}
      </div>
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-navigation">
          <button 
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart2 className="tab-icon" />
            <span>Player Stats</span>
            <span className="tab-count">{sortedPlayerStats.length}</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'lineup' ? 'active' : ''}`}
            onClick={() => setActiveTab('lineup')}
          >
            <Users className="tab-icon" />
            <span>On the Floor</span>
            {currentLineup && currentLineup.names && (
              <span className="tab-count">{currentLineup.names.length}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            <TrendingUp className="tab-icon" />
            <span>Game Flow</span>
          </button>
        </div>
        {/* Tab Content */}
        <div className="tab-content-container">
          {activeTab === 'stats' && renderPlayerStatsTab()}
          {activeTab === 'lineup' && renderOnTheFloorTab()}
          {activeTab === 'flow' && renderGameFlowTab()}
        </div>
      </div>
      {/* Refresh Stats button at the bottom */}
      <div className="refresh-bottom-container">
        <button 
          className="refresh-button"
          onClick={refreshStats}
        >
          <RefreshCw className="w-4 h-4 mr-2 inline-block" />
          Refresh Stats
        </button>
      </div>
    </div>
  );
};

export default LiveGameStats; 
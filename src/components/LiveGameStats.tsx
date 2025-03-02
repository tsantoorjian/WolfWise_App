import React from 'react';
import useLiveGameStats from '../hooks/useLiveGameStats';
import GameFlowChart from './GameFlowChart';
import './LiveGameStats.css';
import { Activity, Clock } from 'lucide-react';

const LiveGameStats: React.FC = () => {
  const { playerStats, gameInfo, playByPlay, loading, error, refreshStats } = useLiveGameStats();

  const formatMinutes = (minutes: string) => {
    return minutes.split(':')[0];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Activity className="w-12 h-12 text-[#78BE20] animate-pulse" />
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
          <Activity className="w-16 h-16 text-gray-300" />
          <p>No live game stats available at the moment.</p>
          <p className="hint">Check back during the next game!</p>
        </div>
        <button 
          className="retry-button"
          onClick={refreshStats}
        >
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
            <div className="game-scoreboard">
              <div className="team-score">
                <span className="team-name">{gameInfo.home_team}</span>
                <span className="score">{gameInfo.home_score}</span>
              </div>
              
              <div className="game-status">
                <div className="status-indicator">
                  {gameInfo.game_status === "in_progress" ? (
                    <span className="live-indicator">LIVE</span>
                  ) : null}
                </div>
                <div className="period-time">
                  <Clock className="w-4 h-4 mr-1 inline-block" />
                  {getGameStatusDisplay()}
                </div>
              </div>
              
              <div className="team-score">
                <span className="team-name">{gameInfo.away_team}</span>
                <span className="score">{gameInfo.away_score}</span>
              </div>
            </div>
            
            {playByPlay && playByPlay.length > 0 && (
              <div className="game-flow-container">
                <GameFlowChart 
                  playByPlay={playByPlay} 
                  homeTeam={gameInfo.home_team} 
                  awayTeam={gameInfo.away_team} 
                />
              </div>
            )}
            
            <div className="game-details">
              <div className="venue">
                <span>{gameInfo.arena}, {gameInfo.city}</span>
              </div>
            </div>
          </div>
        )}
        
        <button 
          className="refresh-button"
          onClick={refreshStats}
        >
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
          const isBlkStlHigh = player.blk >= 3 || player.stl >= 3;
          const isBlkStlMedium = player.blk >= 1 || player.stl >= 1;
          
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
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                      }}
                    />
                  ) : (
                    <img 
                      src={`/player-images/${player.player.replace(/\s+/g, '-').toLowerCase()}.jpg`} 
                      alt={player.player}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                      }}
                    />
                  )}
                </div>
                <div className="player-info">
                  <h2 className="player-name">{player.player}</h2>
                  <div className={`player-plusminus ${isPlusMinus ? 'positive' : 'negative'}`}>
                    <span>{isPlusMinus ? '+' : ''}{player.plusminuspoints}</span>
                  </div>
                </div>
              </div>
              
              <div className="main-stats">
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
                
                <div className={`stat-box ${isBlkStlHigh ? 'high-stat' : isBlkStlMedium ? 'medium-stat' : ''}`}>
                  <span className="stat-value">{player.blk + player.stl}</span>
                  <span className="stat-label">BLK+STL</span>
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
                        backgroundColor: parseFloat(fgPercentage) > 50 ? '#78BE20' : 
                                        parseFloat(fgPercentage) > 40 ? '#F59E0B' : '#DC2626'
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
                        backgroundColor: parseFloat(threePtPercentage) > 40 ? '#78BE20' : 
                                        parseFloat(threePtPercentage) > 33 ? '#F59E0B' : '#DC2626'
                      }}
                    ></div>
                  </div>
                  <span className="shooting-percentage">{threePtPercentage}%</span>
                </div>
              </div>
              
              <div className="secondary-stats">
                <div className="stat-item">
                  <span className="stat-label">MIN</span>
                  <span className="stat-value">{formatMinutes(player.min)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">BLK</span>
                  <span className="stat-value">{player.blk}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">STL</span>
                  <span className="stat-value">{player.stl}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">TO</span>
                  <span className="stat-value">{player.tov}</span>
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
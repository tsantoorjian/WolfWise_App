import React from 'react';
import useLiveGameStats from '../hooks/useLiveGameStats';
import './LiveGameStats.css';
import { Activity, ArrowDown, ArrowUp } from 'lucide-react';

const LiveGameStats: React.FC = () => {
  const { playerStats, loading, error, refreshStats } = useLiveGameStats();

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

  if (!playerStats || playerStats.length === 0) {
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
  const sortedPlayerStats = [...playerStats]
    .filter(player => player && player.player && (player.pts > 0 || player.reb > 0 || player.ast > 0 || player.blk > 0 || player.stl > 0))
    .sort((a, b) => b.pts - a.pts);

  return (
    <div className="live-game-stats-container">
      <h1>Live Game Stats</h1>
      <div className="player-stats-grid">
        {sortedPlayerStats.map((player, index) => {
          const isPlusMinus = parseFloat(String(player.plusminuspoints)) > 0;
          
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
                    {isPlusMinus ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{isPlusMinus ? '+' : ''}{player.plusminuspoints}</span>
                  </div>
                </div>
              </div>
              
              <div className="main-stats">
                <div className="stat-box">
                  <span className="stat-value">{player.pts}</span>
                  <span className="stat-label">PTS</span>
                </div>
                
                <div className="stat-box">
                  <span className="stat-value">{player.reb}</span>
                  <span className="stat-label">REB</span>
                </div>
                
                <div className="stat-box">
                  <span className="stat-value">{player.ast}</span>
                  <span className="stat-label">AST</span>
                </div>
                
                <div className="stat-box">
                  <span className="stat-value">{player.fgs}</span>
                  <span className="stat-label">FG</span>
                </div>
              </div>
              
              <div className="secondary-stats">
                <div className="stat-item">
                  <span className="stat-label">3PT</span>
                  <span className="stat-value">{player.threept}</span>
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
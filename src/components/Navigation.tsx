import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/players">Players</Link></li>
        <li><Link to="/stats">Stats</Link></li>
        <li><Link to="/lineups">Lineups</Link></li>
        <li><Link to="/live-stats">Live Game Stats</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation; 
import React, { useState } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { PlayerStats } from './components/PlayerStats';
import { ThreePointDistribution } from './components/ThreePointDistribution';
import Lineups from './components/Lineups';
import { RecordTracker } from './components/RecordTracker';
import { LeagueLeaders } from './components/LeagueLeaders';
import LiveGameStats from './components/LiveGameStats';
import { 
  Menu, 
  LineChart, 
  Users2, 
  Trophy, 
  Crown,
  BarChart3,
  Activity,
  Home
} from 'lucide-react';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';

type Tab = 'live-stats' | 'stats' | 'lineups' | 'leaders' | 'records' | 'distribution';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('live-stats');
  const [selectedStat, setSelectedStat] = useState<string>('3pt percentage');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { players, distributionData, leaderboardData, playerImageUrl, fetchDistributionData } = useSupabase();

  const getTabIcon = (tab: Tab, isActive: boolean) => {
    const baseClasses = `w-5 h-5 ${isActive ? 'text-[#78BE20]' : 'text-[#9EA2A2] group-hover:text-[#0C2340]'}`;
    
    switch (tab) {
      case 'live-stats':
        return <Activity className={baseClasses} />;
      case 'stats':
        return <BarChart3 className={baseClasses} />;
      case 'lineups':
        return <Users2 className={baseClasses} />;
      case 'leaders':
        return <Crown className={baseClasses} />;
      case 'records':
        return <Trophy className={baseClasses} />;
      case 'distribution':
        return <LineChart className={baseClasses} />;
    }
  };

  const getTabLabel = (tab: Tab) => {
    switch (tab) {
      case 'live-stats':
        return 'Live Game Stats';
      case 'stats':
        return 'Player Stats';
      case 'lineups':
        return 'Lineups';
      case 'leaders':
        return 'League Leaders';
      case 'records':
        return 'Record Tracker';
      case 'distribution':
        return 'Distributions';
    }
  };

  return (
    <Router>
      <div className="App">
        <div className="min-h-screen bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0C2340] mb-8">
              WolfWise Statistics
            </h1>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-[#0C2340]"
              >
                <Menu className="w-5 h-5" />
                <span>{getTabLabel(activeTab)}</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block border-b border-gray-200 mb-6`}>
              <div className="flex flex-col md:flex-row md:border-b md:border-gray-200">
                {(['live-stats', 'stats', 'lineups', 'leaders', 'records', 'distribution'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMenuOpen(false);
                    }}
                    className={`group py-3 md:py-4 px-4 md:px-6 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-[#78BE20]/10 md:bg-transparent md:border-b-2 md:border-[#78BE20] text-[#0C2340]'
                        : 'text-[#9EA2A2] hover:text-[#0C2340] hover:bg-gray-50 md:hover:bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon(tab, activeTab === tab)}
                      <span className={activeTab === tab ? 'font-semibold' : ''}>
                        {getTabLabel(tab)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            {/* Render active page */}
            <div className="mt-4 md:mt-0">
              {activeTab === 'live-stats' && <LiveGameStats />}
              {activeTab === 'stats' && <PlayerStats />}
              {activeTab === 'lineups' && <Lineups />}
              {activeTab === 'leaders' && <LeagueLeaders leaderboardData={leaderboardData} />}
              {activeTab === 'records' && (
                <RecordTracker playerImageUrl={playerImageUrl || undefined} />
              )}
              {activeTab === 'distribution' && (
                <ThreePointDistribution 
                  distributionData={distributionData} 
                  players={players} 
                  onStatChange={(stat) => {
                    setSelectedStat(stat);
                    fetchDistributionData(stat);
                  }}
                  selectedStat={selectedStat}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
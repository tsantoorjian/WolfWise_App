import React, { useState } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { PlayerStats } from './components/PlayerStats';
import { ThreePointDistribution } from './components/ThreePointDistribution';
import Lineups from './components/Lineups';
import { RecordTracker } from './components/RecordTracker';
import { LeagueLeaders } from './components/LeagueLeaders';
import LiveGameStats from './components/LiveGameStats';
import { PerformanceGrid } from './components/PerformanceGrid';
import { 
  Menu, 
  LineChart, 
  Users2, 
  Trophy, 
  Crown,
  BarChart3,
  Activity,
  Home,
  Mail
} from 'lucide-react';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';

type Tab = 'live-stats' | 'stats' | 'lineups' | 'leaders' | 'records' | 'distribution' | 'performance-grid';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('live-stats');
  const [selectedStat, setSelectedStat] = useState<string>('3pt percentage');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { players, distributionData, leaderboardData, playerImageUrl, fetchDistributionData } = useSupabase();

  const getTabIcon = (tab: Tab, isActive: boolean) => {
    const baseClasses = `w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`;
    
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
      case 'performance-grid':
        return <BarChart3 className={baseClasses} />;
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
      case 'performance-grid':
        return 'Performance Grid';
    }
  };

  return (
    <Router>
      <div className="App min-h-screen grid-pattern">
        <div className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[85%] mx-auto px-4 py-8 flex flex-col min-h-screen">
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#78BE20] to-[#4ade80]">WolfWise</span> 
                    <span className="ml-2">Statistics</span>
                  </h1>
                  <span className="hidden md:inline-block h-6 w-px bg-gray-600 mx-1"></span>
                  <p className="hidden md:block text-gray-400 text-sm">Your home for deep insights into the Minnesota Timberwolves</p>
                </div>
                <div className="md:hidden text-gray-400 text-sm mt-1">Your home for deep insights into the Minnesota Timberwolves</div>
                <div className="w-16 h-1 bg-gradient-to-r from-[#78BE20] to-[#4ade80] mt-2 rounded-full"></div>
              </div>
              
              <div className="hidden md:flex space-x-3">
                <div className="w-3 h-3 rounded-full bg-[#78BE20] animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-[#4ade80] animate-pulse delay-100"></div>
                <div className="w-3 h-3 rounded-full bg-[#22d3ee] animate-pulse delay-200"></div>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg text-white"
              >
                <Menu className="w-5 h-5" />
                <span>{getTabLabel(activeTab)}</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block mb-6`}>
              <div className="flex flex-col md:flex-row gap-2 md:gap-1 glass-card p-1 rounded-lg">
                {(['live-stats', 'stats', 'lineups', 'leaders', 'records', 'distribution', 'performance-grid'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMenuOpen(false);
                    }}
                    className={`group py-3 md:py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-[#78BE20] to-[#4ade80] text-white shadow-lg shadow-[#78BE20]/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon(tab, activeTab === tab)}
                      <span className={`transition-all duration-300 ${
                        activeTab === tab ? 'transform translate-x-1' : ''
                      }`}>
                        {getTabLabel(tab)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            {/* Render active page */}
            <div className="mt-4 md:mt-6">
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
              {activeTab === 'performance-grid' && (
                <PerformanceGrid players={players} />
              )}
            </div>
          </div>

          {/* Contact Section */}
          <footer className="mt-12 glass-card rounded-lg p-6">
            <div className="flex items-center justify-center space-x-2 text-white/80 hover:text-white transition-colors duration-300">
              <Mail className="w-5 h-5" />
              <a 
                href="mailto:tsantoorjian@gmail.com"
                className="text-sm md:text-base hover:text-[#4ade80] transition-colors duration-300"
              >
                tsantoorjian@gmail.com
              </a>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;
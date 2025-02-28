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

type Tab = 'home' | 'stats' | 'distribution' | 'lineups' | 'records' | 'leaders' | 'live-stats';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedStat, setSelectedStat] = useState<string>('3pt percentage');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { players, distributionData, leaderboardData, playerImageUrl, fetchDistributionData } = useSupabase();

  const getTabIcon = (tab: Tab, isActive: boolean) => {
    const baseClasses = `w-5 h-5 ${isActive ? 'text-[#78BE20]' : 'text-[#9EA2A2] group-hover:text-[#0C2340]'}`;
    
    switch (tab) {
      case 'home':
        return <Home className={baseClasses} />;
      case 'stats':
        return <BarChart3 className={baseClasses} />;
      case 'distribution':
        return <LineChart className={baseClasses} />;
      case 'lineups':
        return <Users2 className={baseClasses} />;
      case 'records':
        return <Trophy className={baseClasses} />;
      case 'leaders':
        return <Crown className={baseClasses} />;
      case 'live-stats':
        return <Activity className={baseClasses} />;
    }
  };

  const getTabLabel = (tab: Tab) => {
    switch (tab) {
      case 'home':
        return 'Home';
      case 'stats':
        return 'Player Stats';
      case 'distribution':
        return 'Distributions';
      case 'lineups':
        return 'Lineups';
      case 'records':
        return 'Record Tracker';
      case 'leaders':
        return 'League Leaders';
      case 'live-stats':
        return 'Live Game Stats';
    }
  };

  const getTabColor = (tab: Tab) => {
    switch (tab) {
      case 'stats':
        return 'from-blue-500 to-blue-600 shadow-blue-200';
      case 'distribution':
        return 'from-emerald-500 to-emerald-600 shadow-emerald-200';
      case 'lineups':
        return 'from-violet-500 to-violet-600 shadow-violet-200';
      case 'records':
        return 'from-amber-500 to-amber-600 shadow-amber-200';
      case 'leaders':
        return 'from-rose-500 to-rose-600 shadow-rose-200';
      case 'live-stats':
        return 'from-orange-500 to-orange-600 shadow-orange-200';
      default:
        return 'from-gray-500 to-gray-600 shadow-gray-200';
    }
  };

  const getIconColor = () => {
    return 'text-white';
  };

  const getTabDescription = (tab: Tab): string => {
    switch (tab) {
      case 'stats':
        return 'View detailed player statistics and performance metrics';
      case 'distribution':
        return 'Analyze statistical distributions across different metrics';
      case 'lineups':
        return 'Explore team lineup combinations and their effectiveness';
      case 'records':
        return 'Track team and player records throughout the season';
      case 'leaders':
        return 'See who leads the league in various statistical categories';
      case 'live-stats':
        return 'Follow real-time statistics for ongoing games';
      default:
        return '';
    }
  };

  const renderHomePage = () => {
    const tileTabs: Tab[] = ['stats', 'distribution', 'lineups', 'records', 'leaders', 'live-stats'];
    
    return (
      <div className="mt-4">
        <h2 className="text-xl md:text-2xl font-bold text-[#0C2340] mb-4 md:mb-6 text-center">Choose Your Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {tileTabs.map((tile) => (
            <button
              key={tile}
              onClick={() => setActiveTab(tile)}
              className="group relative overflow-hidden rounded-lg md:rounded-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#78BE20] focus:ring-offset-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${getTabColor(tile)} opacity-90`}></div>
              <div className="relative p-3 md:p-6 flex flex-col items-center text-center h-full">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 md:mb-4 shadow-lg">
                  {React.cloneElement(getTabIcon(tile, false), { className: `w-5 h-5 md:w-7 md:h-7 ${getIconColor()}` })}
                </div>
                <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">{getTabLabel(tile)}</h3>
                <p className="text-white/80 text-xs md:text-sm font-medium hidden md:block">
                  {getTabDescription(tile)}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 group-hover:bg-white/50 transition-colors"></div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="App">
        <div className="min-h-screen bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0C2340] mb-8">
              WolfWise Statistics
            </h1>
            
            {/* Mobile Menu Button - Only show if not on home page */}
            {activeTab !== 'home' && (
              <div className="md:hidden mb-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-[#0C2340]"
                >
                  <Menu className="w-5 h-5" />
                  <span>{getTabLabel(activeTab)}</span>
                </button>
              </div>
            )}

            {/* Navigation - Only show if not on home page */}
            {activeTab !== 'home' && (
              <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block border-b border-gray-200 mb-6`}>
                <div className="flex flex-col md:flex-row md:border-b md:border-gray-200">
                  <button
                    onClick={() => {
                      setActiveTab('home');
                      setIsMenuOpen(false);
                    }}
                    className={`group py-3 md:py-4 px-4 md:px-6 text-sm font-medium transition-all duration-200 text-[#9EA2A2] hover:text-[#0C2340] hover:bg-gray-50 md:hover:bg-transparent`}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon('home', false)}
                      <span>Home</span>
                    </div>
                  </button>
                  {(['stats', 'distribution', 'lineups', 'records', 'leaders', 'live-stats'] as Tab[]).map((tab) => (
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
            )}

            {/* Render active page */}
            <div className="mt-4 md:mt-0">
              {activeTab === 'home' && renderHomePage()}
              {activeTab === 'stats' && <PlayerStats />}
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
              {activeTab === 'lineups' && <Lineups />}
              {activeTab === 'records' && (
                <RecordTracker playerImageUrl={playerImageUrl || undefined} />
              )}
              {activeTab === 'leaders' && <LeagueLeaders leaderboardData={leaderboardData} />}
              {activeTab === 'live-stats' && <LiveGameStats />}
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
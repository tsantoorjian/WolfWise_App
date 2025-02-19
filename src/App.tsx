import { useState } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { PlayerStats } from './components/PlayerStats';
import { ThreePointDistribution } from './components/ThreePointDistribution';
import Lineups from './components/Lineups';
import { RecordTracker } from './components/RecordTracker';
import { LeagueLeaders } from './components/LeagueLeaders';
import { Menu } from 'lucide-react';
import './index.css';

type Tab = 'stats' | 'distribution' | 'lineups' | 'records' | 'leaders';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [selectedStat, setSelectedStat] = useState<string>('3pt percentage');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { players, distributionData, recordData, leaderboardData, fetchDistributionData } = useSupabase();

  return (
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
            <span>{activeTab === 'stats' ? 'Player Stats' : 
                   activeTab === 'distribution' ? 'Distributions' :
                   activeTab === 'lineups' ? 'Lineups' :
                   activeTab === 'records' ? 'Record Tracker' : 'League Leaders'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block border-b border-gray-200 mb-6`}>
          <div className="flex flex-col md:flex-row md:border-b md:border-gray-200">
            <button
              onClick={() => {
                setActiveTab('stats');
                setIsMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-sm font-medium ${
                activeTab === 'stats'
                  ? 'bg-[#78BE20] md:bg-transparent md:border-b-2 md:border-[#78BE20] text-[#0C2340]'
                  : 'text-[#9EA2A2] hover:text-[#0C2340]'
              }`}
            >
              📊 Player Stats
            </button>
            <button
              onClick={() => {
                setActiveTab('distribution');
                setIsMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-sm font-medium ${
                activeTab === 'distribution'
                  ? 'bg-[#78BE20] md:bg-transparent md:border-b-2 md:border-[#78BE20] text-[#0C2340]'
                  : 'text-[#9EA2A2] hover:text-[#0C2340]'
              }`}
            >
              📈 Distributions
            </button>
            <button
              onClick={() => {
                setActiveTab('lineups');
                setIsMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-sm font-medium ${
                activeTab === 'lineups'
                  ? 'bg-[#78BE20] md:bg-transparent md:border-b-2 md:border-[#78BE20] text-[#0C2340]'
                  : 'text-[#9EA2A2] hover:text-[#0C2340]'
              }`}
            >
              👥 Lineups
            </button>
            <button
              onClick={() => {
                setActiveTab('records');
                setIsMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-sm font-medium ${
                activeTab === 'records'
                  ? 'bg-[#78BE20] md:bg-transparent md:border-b-2 md:border-[#78BE20] text-[#0C2340]'
                  : 'text-[#9EA2A2] hover:text-[#0C2340]'
              }`}
            >
              🏆 Record Tracker
            </button>
            <button
              onClick={() => {
                setActiveTab('leaders');
                setIsMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-sm font-medium ${
                activeTab === 'leaders'
                  ? 'bg-[#78BE20] md:bg-transparent md:border-b-2 md:border-[#78BE20] text-[#0C2340]'
                  : 'text-[#9EA2A2] hover:text-[#0C2340]'
              }`}
            >
              ⭐ League Leaders
            </button>
          </div>
        </nav>

        {/* Render active page */}
        <div className="mt-4 md:mt-0">
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
          {activeTab === 'records' && <RecordTracker recordData={recordData} />}
          {activeTab === 'leaders' && <LeagueLeaders leaderboardData={leaderboardData} />}
        </div>
      </div>
    </div>
  );
}

export default App;
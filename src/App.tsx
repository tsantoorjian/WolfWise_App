import { useState } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { PlayerStats } from './components/PlayerStats';
import { ThreePointDistribution } from './components/ThreePointDistribution';
import Lineups from './components/Lineups';
import { RecordTracker } from './components/RecordTracker';
import { LeagueLeaders } from './components/LeagueLeaders';
import './index.css';

type Tab = 'stats' | 'distribution' | 'lineups' | 'records' | 'leaders';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [selectedStat, setSelectedStat] = useState<string>('3pt percentage');
  const { players, distributionData, recordData, leaderboardData, fetchDistributionData } = useSupabase();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#0C2340] mb-8">
          WolfWise Statistics
        </h1>
        
        {/* Navigation */}
        <nav className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'stats'
                ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                : 'text-[#9EA2A2] hover:text-[#0C2340]'
            }`}
          >
            📊 Player Stats
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'distribution'
                ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                : 'text-[#9EA2A2] hover:text-[#0C2340]'
            }`}
          >
            📈 Distributions
          </button>
          <button
            onClick={() => setActiveTab('lineups')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'lineups'
                ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                : 'text-[#9EA2A2] hover:text-[#0C2340]'
            }`}
          >
            👥 Lineups
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'records'
                ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                : 'text-[#9EA2A2] hover:text-[#0C2340]'
            }`}
          >
            🏆 Record Tracker
          </button>
          <button
            onClick={() => setActiveTab('leaders')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'leaders'
                ? 'border-b-2 border-[#78BE20] text-[#0C2340]'
                : 'text-[#9EA2A2] hover:text-[#0C2340]'
            }`}
          >
            ⭐ League Leaders
          </button>
        </nav>

        {/* Render active page */}
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
  );
}

export default App;
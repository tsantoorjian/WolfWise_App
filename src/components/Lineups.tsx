import React, { useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useLineups } from '../hooks/useLineups';
import LineupCard from './LineupCard';
import { Users2, ChevronDown, Info } from 'lucide-react';

const Lineups: React.FC = () => {
  const [showTopLineups, setShowTopLineups] = useState(true);
  const { players, loading: playersLoading } = useSupabase();
  const { lineups, loading: lineupsLoading } = useLineups(showTopLineups, players);
  const loading = playersLoading || lineupsLoading;

  const [activeSection, setActiveSection] = useState<'two' | 'three' | 'five'>('two');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Users2 className="w-12 h-12 text-[#78BE20] animate-pulse mx-auto" />
          <p className="text-[#9EA2A2]">Loading lineups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0C2340]">Lineup Analysis</h2>
            <p className="text-[#9EA2A2] text-sm">Explore the performance of different Timberwolves lineup combinations</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTopLineups(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                showTopLineups
                  ? 'bg-[#78BE20] text-white shadow-lg shadow-[#78BE20]/20'
                  : 'bg-gray-100 text-[#9EA2A2] hover:bg-gray-200'
              }`}
            >
              Top Lineups
            </button>
            <button
              onClick={() => setShowTopLineups(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                !showTopLineups
                  ? 'bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20'
                  : 'bg-gray-100 text-[#9EA2A2] hover:bg-gray-200'
              }`}
            >
              Bottom Lineups
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveSection('two')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeSection === 'two'
                ? 'bg-[#0C2340] text-white'
                : 'bg-gray-100 text-[#9EA2A2] hover:bg-gray-200'
            }`}
          >
            2-Man Lineups
          </button>
          <button
            onClick={() => setActiveSection('three')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeSection === 'three'
                ? 'bg-[#0C2340] text-white'
                : 'bg-gray-100 text-[#9EA2A2] hover:bg-gray-200'
            }`}
          >
            3-Man Lineups
          </button>
          <button
            onClick={() => setActiveSection('five')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeSection === 'five'
                ? 'bg-[#0C2340] text-white'
                : 'bg-gray-100 text-[#9EA2A2] hover:bg-gray-200'
            }`}
          >
            5-Man Lineups
          </button>
        </div>

        <div className="relative">
          <div className={`transition-all duration-500 ${activeSection === 'two' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lineups.twoMan.map((lineup, index) => (
                <LineupCard key={index} lineup={lineup} />
              ))}
            </div>
          </div>

          <div className={`transition-all duration-500 ${activeSection === 'three' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lineups.threeMan.map((lineup, index) => (
                <LineupCard key={index} lineup={lineup} />
              ))}
            </div>
          </div>

          <div className={`transition-all duration-500 ${activeSection === 'five' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {lineups.fiveMan.map((lineup, index) => (
                <LineupCard key={index} lineup={lineup} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-[#9EA2A2] bg-gray-50 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>Minimum 50 minutes played together required for inclusion</span>
        </div>
      </div>
    </div>
  );
};

export default Lineups;
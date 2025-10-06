import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HustleStatsData {
  id: number;
  player_id: number;
  player_name: string;
  team_abbreviation: string;
  age: number;
  games_played: number;
  minutes_played: number;
  contested_shots: number;
  contested_shots_2pt: number;
  contested_shots_3pt: number;
  deflections: number;
  charges_drawn: number;
  screen_assists: number;
  screen_ast_pts: number;
  off_loose_balls_recovered: number;
  def_loose_balls_recovered: number;
  loose_balls_recovered: number;
  pct_loose_balls_recovered_off: number;
  pct_loose_balls_recovered_def: number;
  off_boxouts: number;
  def_boxouts: number;
  box_out_player_team_rebs: number;
  box_out_player_rebs: number;
  box_outs: number;
  pct_box_outs_off: number;
  pct_box_outs_def: number;
  pct_box_outs_team_reb: number;
  pct_box_outs_reb: number;
  season: string;
  season_type: string;
  per_mode: string;
}

const HustleStats: React.FC = () => {
  const [hustleStats, setHustleStats] = useState<HustleStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perMode, setPerMode] = useState<'PerGame' | 'Totals'>('PerGame');

  useEffect(() => {
    fetchHustleStats();
  }, [perMode]);

  const fetchHustleStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hustle_stats')
        .select('*')
        .eq('per_mode', perMode)
        .eq('season', '2024-25')
        .eq('season_type', 'Regular Season')
        .order('contested_shots', { ascending: false });

      if (error) {
        throw error;
      }

      setHustleStats(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, isPercentage: boolean = false) => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  const getStatColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading hustle stats: {error}</p>
      </div>
    );
  }

  if (hustleStats.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No hustle stats data available</p>
      </div>
    );
  }

  // Calculate max values for color coding
  const maxContestedShots = Math.max(...hustleStats.map(p => p.contested_shots));
  const maxDeflections = Math.max(...hustleStats.map(p => p.deflections));
  const maxChargesDrawn = Math.max(...hustleStats.map(p => p.charges_drawn));
  const maxScreenAssists = Math.max(...hustleStats.map(p => p.screen_assists));
  const maxLooseBalls = Math.max(...hustleStats.map(p => p.loose_balls_recovered));
  const maxBoxOuts = Math.max(...hustleStats.map(p => p.box_outs));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hustle Stats</h2>
          <p className="text-gray-600">Effort metrics that don't show up in traditional box scores</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPerMode('PerGame')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              perMode === 'PerGame'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Per Game
          </button>
          <button
            onClick={() => setPerMode('Totals')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              perMode === 'Totals'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Totals
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hustleStats.map((player) => (
          <div key={`${player.player_id}-${player.per_mode}`} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{player.player_name}</h3>
                <p className="text-sm text-gray-600">
                  {player.games_played} GP • {formatValue(player.minutes_played)} MPG
                </p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {player.per_mode}
              </span>
            </div>

            <div className="space-y-3">
              {/* Contested Shots */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Contested Shots</span>
                <span className={`font-semibold ${getStatColor(player.contested_shots, maxContestedShots)}`}>
                  {formatValue(player.contested_shots)}
                </span>
              </div>

              {/* Deflections */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Deflections</span>
                <span className={`font-semibold ${getStatColor(player.deflections, maxDeflections)}`}>
                  {formatValue(player.deflections)}
                </span>
              </div>

              {/* Charges Drawn */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Charges Drawn</span>
                <span className={`font-semibold ${getStatColor(player.charges_drawn, maxChargesDrawn)}`}>
                  {formatValue(player.charges_drawn)}
                </span>
              </div>

              {/* Screen Assists */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Screen Assists</span>
                <span className={`font-semibold ${getStatColor(player.screen_assists, maxScreenAssists)}`}>
                  {formatValue(player.screen_assists)}
                </span>
              </div>

              {/* Loose Balls Recovered */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Loose Balls</span>
                <span className={`font-semibold ${getStatColor(player.loose_balls_recovered, maxLooseBalls)}`}>
                  {formatValue(player.loose_balls_recovered)}
                </span>
              </div>

              {/* Box Outs */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Box Outs</span>
                <span className={`font-semibold ${getStatColor(player.box_outs, maxBoxOuts)}`}>
                  {formatValue(player.box_outs)}
                </span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">2PT Contested:</span> {formatValue(player.contested_shots_2pt)}
                </div>
                <div>
                  <span className="font-medium">3PT Contested:</span> {formatValue(player.contested_shots_3pt)}
                </div>
                <div>
                  <span className="font-medium">Screen Pts:</span> {formatValue(player.screen_ast_pts)}
                </div>
                <div>
                  <span className="font-medium">Box Out Rebs:</span> {formatValue(player.box_out_player_rebs)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">What These Stats Mean</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p><strong>Contested Shots:</strong> Shots where the player was the closest defender</p>
            <p><strong>Deflections:</strong> Touches that redirect opponent passes</p>
            <p><strong>Charges Drawn:</strong> Offensive fouls drawn by the player</p>
          </div>
          <div>
            <p><strong>Screen Assists:</strong> Screens that lead to teammate scores</p>
            <p><strong>Loose Balls:</strong> 50/50 balls recovered by the player</p>
            <p><strong>Box Outs:</strong> Boxing out opponents for rebounds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HustleStats;

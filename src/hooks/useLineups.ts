import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineupWithAdvanced } from '../types/database.types';
import { PlayerWithStats } from './useSupabase';

type LineupsData = {
  twoMan: LineupWithAdvanced[];
  threeMan: LineupWithAdvanced[];
  fiveMan: LineupWithAdvanced[];
};

function normalizeNameForMatching(name: string): string {
  if (!name) return '';
  
  // Convert to lowercase and remove all special characters
  let normalized = name.toLowerCase()
    .replace(/\./g, '')  // Remove periods
    .replace(/[^a-z0-9\s]/g, '') // Remove other special characters
    .trim();
  
  // Handle specific name variations
  const nameVariations: { [key: string]: string } = {
    'terrance': 'terrence',
    'mike': 'michael',
    // Add more variations as needed
  };

  // Apply name variations
  for (const [variant, standard] of Object.entries(nameVariations)) {
    if (normalized.includes(variant)) {
      normalized = normalized.replace(variant, standard);
    }
  }

  // Remove suffixes
  return normalized.replace(/\s+(jr|sr|iii|iv|v|ii)\s*$/i, '');
}

function getLastName(playerName: string): string {
  if (!playerName) return '';
  
  // Handle names with initials (e.g., "T. Shannon Jr.")
  if (playerName.includes('. ')) {
    const parts = playerName.split('. ');
    // Get the actual last name (first word after the initial, ignoring suffixes)
    return normalizeNameForMatching(parts[1].split(' ')[0]);
  }
  
  // Handle full names (e.g., "Terrence Shannon Jr.")
  const nameParts = playerName.split(' ');
  
  // For most players, the last name is the second word in their name
  // But we need to handle special cases with suffixes
  if (nameParts.length <= 1) {
    return normalizeNameForMatching(nameParts[0]);
  }
  
  // Check if the last part is a suffix (Jr., Sr., etc.)
  const lastPart = nameParts[nameParts.length - 1];
  if (lastPart.match(/^(Jr\.|Sr\.|III|IV|V|II)\.?$/i) && nameParts.length > 2) {
    // If it's a suffix, use the part before it
    return normalizeNameForMatching(nameParts[nameParts.length - 2]);
  }
  
  // Otherwise use the last part
  return normalizeNameForMatching(lastPart);
}

export function useLineups(showTopLineups: boolean, players: PlayerWithStats[]): { lineups: LineupsData; loading: boolean; error: any } {
  const [lineups, setLineups] = useState<LineupsData>({
    twoMan: [],
    threeMan: [],
    fiveMan: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchLineups() {
      try {
        const fetchLineupsForSize = async (size: number) => {
          const { data, error } = await supabase
            .from('lineups_advanced')
            .select('*, group_name, lineup_size, min, player1, player2, player3, player4, player5')
            .eq('team_abbreviation', 'MIN')
            .eq('lineup_size', size)
            .gte('min', 50)
            .order('net_rating', { ascending: !showTopLineups });

          if (error) throw error;
          return data || [];
        };

        const [twoManData, threeManData, fiveManData] = await Promise.all([
          fetchLineupsForSize(2),
          fetchLineupsForSize(3),
          fetchLineupsForSize(5),
        ]);

        // Create a map of normalized player names to their data for efficient lookup
        const playerMap = new Map();
        players.forEach(player => {
          const normalizedName = normalizeNameForMatching(player.PLAYER_NAME);
          playerMap.set(normalizedName, player);
        });

        const processLineup = (lineup: any): LineupWithAdvanced => {
          const playerNames = [
            lineup.player1,
            lineup.player2,
            lineup.player3,
            lineup.player4,
            lineup.player5,
          ].filter(Boolean);

          const processedPlayers = playerNames.map((playerName: string) => {
            if (!playerName) return { name: '', image_url: null };
            
            // For abbreviated names like "T. Shannon Jr.", get the last name
            const normalizedLineupName = normalizeNameForMatching(playerName);
            
            // Find the player by matching normalized names
            let matchedPlayer = null;
            
            // Try direct lookup first
            for (const [normalizedName, player] of playerMap.entries()) {
              // Check if the lineup player name is included in the full name
              // or if the full name includes the lineup name
              // This handles both "T. Shannon Jr." → "Terrence Shannon Jr." and 
              // full name matches like "Anthony Edwards" → "A. Edwards"
              if (normalizedName.includes(normalizedLineupName) || 
                  normalizedLineupName.includes(normalizedName.split(' ').pop() || '')) {
                matchedPlayer = player;
                break;
              }
            }

            return {
              name: playerName,
              image_url: matchedPlayer?.image_url || null,
            };
          });

          return {
            group_name: lineup.group_name,
            lineup_size: lineup.lineup_size,
            min: lineup.min || 0,
            net_rating: lineup.net_rating || 0,
            off_rating: lineup.off_rating || 0,
            def_rating: lineup.def_rating || 0,
            ts_pct: lineup.ts_pct || 0,
            pace: lineup.pace || 0,
            players: processedPlayers,
          };
        };

        setLineups({
          twoMan: twoManData.map(processLineup),
          threeMan: threeManData.map(processLineup),
          fiveMan: fiveManData.map(processLineup),
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLineups();
  }, [showTopLineups, players]);

  return { lineups, loading, error };
}
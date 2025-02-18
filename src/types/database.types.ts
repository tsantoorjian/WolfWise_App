export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export type NbaPlayerStats = {
  id: number;
  player_id: number;
  player_name: string;
  nickname: string | null;
  games_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  minutes_per_game: number;
  field_goals_made: number;
  field_goals_attempted: number;
  field_goal_percentage: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  three_point_percentage: number;
  free_throws_made: number;
  free_throws_attempted: number;
  free_throw_percentage: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  total_rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  blocked_attempts: number;
  personal_fouls: number;
  personal_fouls_drawn: number;
  points: number;
  plus_minus: number;
  nba_fantasy_pts: number;
  double_doubles: number;
  triple_doubles: number;
  image_url: string | null;
}

export type DistributionStats = {
  player_id: number;
  stat: string;
  player_name: string;
  team_abbreviation: string;
  value: number;
  minutes_played: number;
}

export type ThreePointData = {
  player_name: string;
  value: number;
  team_abbreviation: string;
  minutes_played: number;
}

export type ThreePointBucket = {
  range: string;
  count: number;
  players: ThreePointData[];
}

export type LineupWithAdvanced = {
  group_name: string;
  lineup_size: number;
  min: number;
  net_rating: number;
  off_rating: number;
  def_rating: number;
  ts_pct: number;
  pace: number;
  players: {
    name: string;
    image_url: string | null;
  }[];
}

export type RecentStats = {
  PTS: number;
  AST: number;
  REB: number;
  STL: number;
  BLK: number;
  PLUS_MINUS: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      nba_player_stats: {
        Row: NbaPlayerStats;
        Insert: Omit<NbaPlayerStats, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NbaPlayerStats, 'id' | 'created_at' | 'updated_at'>>;
      };
      distribution_stats: {
        Row: DistributionStats;
      };
      record_tracker_season: {
        Row: RecordTrackerSeason;
      };
    };
  };
};
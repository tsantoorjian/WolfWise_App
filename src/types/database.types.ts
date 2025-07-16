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
  position: string;
  jersey_number: string;
  image_url: string | null;
}

export type TimberwolvesPlayerStats = {
  PLAYER_ID: number;
  PLAYER_NAME: string;
  GP: number;
  W: number;
  L: number;
  W_PCT: number;
  MIN: number;
  FGM: number;
  FGA: number;
  FG_PCT: number;
  FG3M: number;
  FG3A: number;
  FG3_PCT: number;
  FTM: number;
  FTA: number;
  FT_PCT: number;
  OREB: number;
  DREB: number;
  REB: number;
  AST: number;
  TOV: number;
  STL: number;
  BLK: number;
  BLKA: number;
  PF: number;
  PFD: number;
  PTS: number;
  PLUS_MINUS: number;
  NBA_FANTASY_PTS: number;
  DD2: number;
  TD3: number;
  // Add rank fields
  PTS_RANK?: number;
  REB_RANK?: number;
  AST_RANK?: number;
  STL_RANK?: number;
  BLK_RANK?: number;
  PLUS_MINUS_RANK?: number;
  NBA_FANTASY_PTS_RANK?: number;
}

export type DistributionStats = {
  player_id: number;
  stat: string;
  player_name: string;
  team_abbreviation: string;
  value: number;
  minutes_played: number;
}

export type AllPlayer3pt = {
  id: number;
  player_id: bigint;
  player_name: string;
  team_abbreviation: string;
  fg3_pct: number;
  fg3a: number;
}

export type RecordTrackerSeason = {
  name: string;
  GP: number;
  GAMES_REMAINING: number;
  stat: string;
  current: number;
  per_game: number;
  projection: number;
  personal_record: number;
  franchise_record: number;
  franchise_player: string;
  nba_record: number;
  nba_player: string;
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
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  PLUS_MINUS: number;
  NBA_FANTASY_PTS: number;
  // Add rank fields
  PTS_RANK?: number;
  REB_RANK?: number;
  AST_RANK?: number;
  STL_RANK?: number;
  BLK_RANK?: number;
  PLUS_MINUS_RANK?: number;
  NBA_FANTASY_PTS_RANK?: number;
};

export type LeaderboardEntry = {
  "Stat Category": string;
  Player: string;
  Value: number;
  Ranking: number;
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
      timberwolves_player_stats_season: {
        Row: TimberwolvesPlayerStats;
      };
      all_player_3pt: {
        Row: AllPlayer3pt;
      };
      record_tracker_season: {
        Row: RecordTrackerSeason;
      };
      players_on_league_leaderboard: {
        Row: LeaderboardEntry;
      };
    };
  };
};
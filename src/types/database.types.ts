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

export type HustleStats = {
  id: number;
  player_id: number;
  player_name: string;
  team_id: number | null;
  team_abbreviation: string | null;
  age: number | null;
  games_played: number;
  minutes_played: number | null;
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
  created_at: string;
  updated_at: string;
};

export type AgeBasedAchievement = {
  id: number;
  player_id: number;
  player_name: string;
  stat_category: string;
  stat_value: number;
  rank_position: number;
  age_at_achievement: number;
  season_type: string;
  achievement_date: string;
  games_played: number;
};

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
      hustle_stats: {
        Row: HustleStats;
        Insert: Omit<HustleStats, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HustleStats, 'id' | 'created_at' | 'updated_at'>>;
      };
      age_based_achievements: {
        Row: AgeBasedAchievement;
        Insert: Omit<AgeBasedAchievement, 'id'>;
        Update: Partial<Omit<AgeBasedAchievement, 'id'>>;
      };
    };
  };
};

export type FullSeasonBase = {
  PLAYER_ID: number;
  PLAYER_NAME: string;
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  GP: number;
  W: number;
  L: number;
  W_PCT: number;
  MIN: string; // This is total minutes
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
  // Rank fields
  FGM_RANK?: number;
  FGA_RANK?: number;
  FG_PCT_RANK?: number;
  FG3M_RANK?: number;
  FG3A_RANK?: number;
  FG3_PCT_RANK?: number;
  FTM_RANK?: number;
  FTA_RANK?: number;
  FT_PCT_RANK?: number;
  OREB_RANK?: number;
  DREB_RANK?: number;
  REB_RANK?: number;
  AST_RANK?: number;
  TOV_RANK?: number;
  STL_RANK?: number;
  BLK_RANK?: number;
  BLKA_RANK?: number;
  PF_RANK?: number;
  PFD_RANK?: number;
  PTS_RANK?: number;
  PLUS_MINUS_RANK?: number;
  NBA_FANTASY_PTS_RANK?: number;
  DD2_RANK?: number;
  TD3_RANK?: number;
}

export type FullSeasonAdvanced = {
  PLAYER_ID: number;
  PLAYER_NAME: string;
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  GP: number;
  W: number;
  L: number;
  W_PCT: number;
  MIN: string; // This is actually minutes per game (MPG)
  E_OFF_RATING: number;
  OFF_RATING: number;
  E_DEF_RATING: number;
  DEF_RATING: number;
  E_NET_RATING: number;
  NET_RATING: number;
  AST_PCT: number;
  AST_TO: number;
  AST_RATIO: number;
  OREB_PCT: number;
  DREB_PCT: number;
  REB_PCT: number;
  TM_TOV_PCT: number;
  E_TOV_PCT: number;
  EFG_PCT: number;
  TS_PCT: number;
  USG_PCT: number;
  E_USG_PCT: number;
  E_PACE: number;
  PACE: number;
  PIE: number;
  // Rank fields
  GP_RANK?: number;
  W_RANK?: number;
  L_RANK?: number;
  W_PCT_RANK?: number;
  MIN_RANK?: number;
  E_OFF_RATING_RANK?: number;
  OFF_RATING_RANK?: number;
  E_DEF_RATING_RANK?: number;
  DEF_RATING_RANK?: number;
  E_NET_RATING_RANK?: number;
  NET_RATING_RANK?: number;
  AST_PCT_RANK?: number;
  AST_TO_RANK?: number;
  AST_RATIO_RANK?: number;
  OREB_PCT_RANK?: number;
  DREB_PCT_RANK?: number;
  REB_PCT_RANK?: number;
  TM_TOV_PCT_RANK?: number;
  E_TOV_PCT_RANK?: number;
  EFG_PCT_RANK?: number;
  TS_PCT_RANK?: number;
  USG_PCT_RANK?: number;
  E_USG_PCT_RANK?: number;
  E_PACE_RANK?: number;
  PACE_RANK?: number;
  PIE_RANK?: number;
}

export type FullSeasonBasePerGame = {
  PLAYER_ID: number;
  PLAYER_NAME: string;
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  GP: number;
  W: number;
  L: number;
  W_PCT: number;
  MIN: string; // This is minutes per game
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
  // Rank fields
  FGM_RANK?: number;
  FGA_RANK?: number;
  FG_PCT_RANK?: number;
  FG3M_RANK?: number;
  FG3A_RANK?: number;
  FG3_PCT_RANK?: number;
  FTM_RANK?: number;
  FTA_RANK?: number;
  FT_PCT_RANK?: number;
  OREB_RANK?: number;
  DREB_RANK?: number;
  REB_RANK?: number;
  AST_RANK?: number;
  TOV_RANK?: number;
  STL_RANK?: number;
  BLK_RANK?: number;
  BLKA_RANK?: number;
  PF_RANK?: number;
  PFD_RANK?: number;
  PTS_RANK?: number;
  PLUS_MINUS_RANK?: number;
  NBA_FANTASY_PTS_RANK?: number;
  DD2_RANK?: number;
  TD3_RANK?: number;
}

export type FullSeasonAdvancedPerGame = {
  PLAYER_ID: number;
  PLAYER_NAME: string;
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  GP: number;
  W: number;
  L: number;
  W_PCT: number;
  MIN: string; // This is minutes per game
  E_OFF_RATING: number;
  OFF_RATING: number;
  E_DEF_RATING: number;
  DEF_RATING: number;
  E_NET_RATING: number;
  NET_RATING: number;
  AST_PCT: number;
  AST_TO: number;
  AST_RATIO: number;
  OREB_PCT: number;
  DREB_PCT: number;
  REB_PCT: number;
  TM_TOV_PCT: number;
  E_TOV_PCT: number;
  EFG_PCT: number;
  TS_PCT: number;
  USG_PCT: number;
  E_USG_PCT: number;
  E_PACE: number;
  PACE: number;
  PIE: number;
  // Rank fields
  GP_RANK?: number;
  W_RANK?: number;
  L_RANK?: number;
  W_PCT_RANK?: number;
  MIN_RANK?: number;
  E_OFF_RATING_RANK?: number;
  OFF_RATING_RANK?: number;
  E_DEF_RATING_RANK?: number;
  DEF_RATING_RANK?: number;
  E_NET_RATING_RANK?: number;
  NET_RATING_RANK?: number;
  AST_PCT_RANK?: number;
  AST_TO_RANK?: number;
  AST_RATIO_RANK?: number;
  OREB_PCT_RANK?: number;
  DREB_PCT_RANK?: number;
  REB_PCT_RANK?: number;
  TM_TOV_PCT_RANK?: number;
  E_TOV_PCT_RANK?: number;
  EFG_PCT_RANK?: number;
  TS_PCT_RANK?: number;
  USG_PCT_RANK?: number;
  E_USG_PCT_RANK?: number;
  E_PACE_RANK?: number;
  PACE_RANK?: number;
  PIE_RANK?: number;
}
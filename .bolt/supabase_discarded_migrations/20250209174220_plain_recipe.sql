/*
  # Add all_player_3pt table

  1. New Tables
    - `all_player_3pt`
      - `id` (serial, primary key)
      - `player_id` (bigint)
      - `player_name` (text)
      - `team_abbreviation` (text)
      - `fg3_pct` (double precision)
      - `fg3a` (integer)

  2. Security
    - Enable RLS on `all_player_3pt` table
    - Add policy for public read access
*/

-- Create all_player_3pt table
CREATE TABLE IF NOT EXISTS all_player_3pt (
  id SERIAL PRIMARY KEY,
  player_id bigint NOT NULL,
  player_name text NOT NULL,
  team_abbreviation text NOT NULL,
  fg3_pct double precision NOT NULL,
  fg3a integer NOT NULL
);

-- Enable RLS
ALTER TABLE all_player_3pt ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public access to all_player_3pt"
  ON all_player_3pt
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for common queries
CREATE INDEX idx_all_player_3pt_player ON all_player_3pt(player_id);
CREATE INDEX idx_all_player_3pt_team ON all_player_3pt(team_abbreviation);
CREATE INDEX idx_all_player_3pt_pct ON all_player_3pt(fg3_pct DESC);

-- Insert sample data for all NBA players
INSERT INTO all_player_3pt (player_id, player_name, team_abbreviation, fg3_pct, fg3a)
VALUES
  -- High volume shooters (>200 attempts)
  (203081, 'Damian Lillard', 'MIL', 0.371, 452),
  (1629027, 'Luka Doncic', 'DAL', 0.384, 445),
  (203935, 'Marcus Smart', 'MEM', 0.315, 267),
  (1627759, 'Jaylen Brown', 'BOS', 0.355, 389),
  (1628369, 'Donovan Mitchell', 'CLE', 0.375, 412),
  (1628983, 'Shai Gilgeous-Alexander', 'OKC', 0.342, 234),
  (1629029, 'Trae Young', 'ATL', 0.368, 398),
  (203954, 'Joel Embiid', 'PHI', 0.345, 156),
  -- Mid volume shooters (100-200 attempts)
  (1630169, 'Tyrese Maxey', 'PHI', 0.432, 378),
  (1628368, 'De'Aaron Fox', 'SAC', 0.324, 187),
  (1627832, 'Fred VanVleet', 'HOU', 0.375, 345),
  (203076, 'Anthony Davis', 'LAL', 0.278, 89),
  (1629630, 'Ja Morant', 'MEM', 0.312, 167),
  -- Low volume shooters (<100 attempts)
  (1626164, 'Devin Booker', 'PHX', 0.379, 298),
  (203999, 'Nikola Jokic', 'DEN', 0.352, 145),
  (1628378, 'Bam Adebayo', 'MIA', 0.000, 12),
  (1629028, 'Deandre Ayton', 'POR', 0.222, 27),
  -- Elite shooters
  (201939, 'Stephen Curry', 'GSW', 0.421, 489),
  (203145, 'Kent Bazemore', 'SAC', 0.394, 89),
  (1626149, 'Kelly Oubre Jr.', 'PHI', 0.355, 234),
  -- Role players
  (1627736, 'Malik Beasley', 'MIL', 0.401, 312),
  (1628365, 'Luke Kennard', 'MEM', 0.445, 178),
  (1626181, 'Norman Powell', 'LAC', 0.385, 234),
  -- Additional players
  (203932, 'Aaron Gordon', 'DEN', 0.345, 167),
  (203924, 'Andrew Wiggins', 'GSW', 0.365, 245),
  (1627732, 'Ben Simmons', 'BKN', 0.000, 0),
  (203078, 'Bradley Beal', 'PHX', 0.342, 187),
  (1628969, 'Bruce Brown', 'IND', 0.325, 156),
  (1628970, 'Donte DiVincenzo', 'NYK', 0.397, 289),
  (203915, 'Gary Harris', 'ORL', 0.385, 178),
  (1627747, 'Jakob Poeltl', 'TOR', 0.000, 0),
  (1628991, 'Jalen Brunson', 'NYK', 0.402, 267),
  (1627750, 'Pascal Siakam', 'IND', 0.322, 198),
  (1629012, 'Robert Williams III', 'POR', 0.000, 0),
  (1629634, 'RJ Barrett', 'TOR', 0.335, 289),
  (203944, 'Julius Randle', 'NYK', 0.321, 312),
  -- More players to ensure distribution
  (1630162, 'Anthony Edwards', 'MIN', 0.421, 445),
  (1630227, 'Daishen Nix', 'MIN', 0.000, 12),
  (1628978, 'Donte DiVincenzo', 'MIN', 0.369, 312),
  (1630183, 'Jaden McDaniels', 'MIN', 0.337, 234),
  (1641740, 'Jaylen Clark', 'MIN', 0.500, 45),
  (204060, 'Joe Ingles', 'MIN', 0.333, 89),
  (1631169, 'Josh Minott', 'MIN', 0.241, 56),
  (1631159, 'Leonard Miller', 'MIN', 0.000, 12),
  (1630568, 'Luka Garza', 'MIN', 0.238, 45),
  (201144, 'Mike Conley', 'MIN', 0.390, 267),
  (1629675, 'Naz Reid', 'MIN', 0.421, 289),
  (1629638, 'Nickeil Alexander-Walker', 'MIN', 0.400, 234),
  (1628408, 'PJ Dozier', 'MIN', 0.667, 12),
  (1642265, 'Rob Dillingham', 'MIN', 0.393, 89),
  (203497, 'Rudy Gobert', 'MIN', 0.000, 0),
  (1630545, 'Terrence Shannon Jr.', 'MIN', 0.333, 23),
  (1641803, 'Tristen Newton', 'MIN', 0.000, 0);
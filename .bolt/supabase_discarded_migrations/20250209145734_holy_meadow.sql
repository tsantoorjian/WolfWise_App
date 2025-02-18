/*
  # Create all_player_3pt table

  1. New Tables
    - `all_player_3pt`
      - `id` (serial, primary key)
      - `player_name` (text, not null)
      - `three_point_percentage` (decimal, not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `all_player_3pt` table
    - Add policy for public read access
*/

-- Create the table
CREATE TABLE IF NOT EXISTS all_player_3pt (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  three_point_percentage DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE all_player_3pt ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public access to 3PT percentages"
  ON all_player_3pt
  FOR SELECT
  TO public
  USING (true);

-- Insert sample data (a mix of real NBA players with varying 3PT percentages)
INSERT INTO all_player_3pt (player_name, three_point_percentage)
VALUES 
  ('Stephen Curry', 0.432),
  ('Klay Thompson', 0.385),
  ('Anthony Edwards', 0.421),
  ('Naz Reid', 0.421),
  ('Mike Conley', 0.390),
  ('Nickeil Alexander-Walker', 0.400),
  ('Jaden McDaniels', 0.337),
  ('Damian Lillard', 0.371),
  ('Luka Doncic', 0.375),
  ('Devin Booker', 0.379),
  ('Trae Young', 0.368),
  ('Jayson Tatum', 0.382),
  ('Paul George', 0.392),
  ('Kevin Durant', 0.411),
  ('Bradley Beal', 0.359),
  ('Donovan Mitchell', 0.375),
  ('CJ McCollum', 0.401),
  ('Buddy Hield', 0.428),
  ('Duncan Robinson', 0.425),
  ('Joe Harris', 0.439),
  ('Seth Curry', 0.429),
  ('Luke Kennard', 0.445),
  ('Davis Bertans', 0.420),
  ('Doug McDermott', 0.418),
  ('Malik Beasley', 0.402),
  ('Gary Trent Jr.', 0.388),
  ('Desmond Bane', 0.409),
  ('Max Strus', 0.375),
  ('Grayson Allen', 0.398),
  ('Norman Powell', 0.392);

-- Create index for performance
CREATE INDEX idx_all_player_3pt_percentage ON all_player_3pt(three_point_percentage DESC);
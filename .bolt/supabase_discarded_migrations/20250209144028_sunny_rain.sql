/*
  # Update Terrence Shannon Jr. image URL

  1. Changes
    - Fix the image URL for Terrence Shannon Jr. to use the correct filename
*/

UPDATE nba_player_stats
SET image_url = 'https://kuthirbcjtofsdwsfhkj.supabase.co/storage/v1/object/public/player-images/terrence_shannon_jr.png'
WHERE player_name = 'Terrence Shannon Jr.';
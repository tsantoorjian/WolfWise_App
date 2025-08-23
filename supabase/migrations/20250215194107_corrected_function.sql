-- Corrected create_record_tracker_season function with proper syntax and data types
CREATE OR REPLACE FUNCTION create_record_tracker_season()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    player_record RECORD;
    stat_name TEXT;
    current_value NUMERIC;
    per_game_value NUMERIC;
    projection NUMERIC;
    personal_record NUMERIC;
    franchise_record NUMERIC;
    franchise_player TEXT;
    nba_record NUMERIC;
    nba_player TEXT;
    games_remaining INTEGER;
    total_team_games INTEGER;
    stat_array TEXT[] := ARRAY['PTS', 'AST', 'REB', 'STL', 'BLK', 'TOV', 'FGM', 'FGA', 'FG3M', 'FG3A', 'FTM', 'FTA', 'PF'];
    i INTEGER;
BEGIN
    -- Clear existing records with a WHERE clause (required by Supabase)
    DELETE FROM record_tracker_season WHERE name IS NOT NULL;
    
    -- Get total team games played this season
    SELECT COALESCE(COUNT(DISTINCT DATE_TRUNC('day', "GAME_DATE"::date)), 0) INTO total_team_games
    FROM twolves_player_game_logs 
    WHERE "GAME_DATE" >= '2024-10-01' AND "GAME_DATE" <= '2025-06-30';
    
    -- If no games found, default to 0
    IF total_team_games IS NULL THEN
        total_team_games := 0;
    END IF;
    
    -- Calculate games remaining (assuming 82-game season)
    games_remaining := GREATEST(0, 82 - total_team_games);
    
    -- Loop through all Timberwolves players
    FOR player_record IN 
        SELECT DISTINCT "PLAYER_NAME" 
        FROM timberwolves_player_stats_season 
        WHERE "GP" > 0 AND "PLAYER_NAME" IS NOT NULL
        ORDER BY "PLAYER_NAME"
    LOOP
        -- Loop through all stat categories using array index
        FOR i IN 1..array_length(stat_array, 1)
        LOOP
            stat_name := stat_array[i];
            
            -- Handle different data types for different stats
            CASE stat_name
                WHEN 'FG3M', 'BLK' THEN
                    -- These are text columns, convert to numeric
                    EXECUTE format('
                        SELECT COALESCE(SUM(CAST("%I" AS NUMERIC)), 0) as total, 
                               COALESCE(AVG(CAST("%I" AS NUMERIC)), 0) as per_game
                        FROM twolves_player_game_logs 
                        WHERE "PLAYER_NAME" = $1 AND "GAME_DATE" >= $2
                    ', stat_name, stat_name)
                    INTO current_value, per_game_value
                    USING player_record."PLAYER_NAME", '2024-10-01';
                ELSE
                    -- These are bigint columns
                    EXECUTE format('
                        SELECT COALESCE(SUM("%I"), 0) as total, 
                               COALESCE(AVG("%I"), 0) as per_game
                        FROM twolves_player_game_logs 
                        WHERE "PLAYER_NAME" = $1 AND "GAME_DATE" >= $2
                    ', stat_name, stat_name)
                    INTO current_value, per_game_value
                    USING player_record."PLAYER_NAME", '2024-10-01';
            END CASE;
            
            -- Ensure we have valid numbers
            current_value := COALESCE(current_value, 0);
            per_game_value := COALESCE(per_game_value, 0);
            
            -- Calculate projection based on per-game average and full season
            projection := per_game_value * 82;
            
            -- Get personal record (career high for this stat)
            CASE stat_name
                WHEN 'FG3M', 'BLK' THEN
                    EXECUTE format('
                        SELECT COALESCE(MAX(CAST("%I" AS NUMERIC)), 0) as record
                        FROM twolves_player_game_logs 
                        WHERE "PLAYER_NAME" = $1
                    ', stat_name)
                    INTO personal_record
                    USING player_record."PLAYER_NAME";
                ELSE
                    EXECUTE format('
                        SELECT COALESCE(MAX("%I"), 0) as record
                        FROM twolves_player_game_logs 
                        WHERE "PLAYER_NAME" = $1
                    ', stat_name)
                    INTO personal_record
                    USING player_record."PLAYER_NAME";
            END CASE;
            
            personal_record := COALESCE(personal_record, 0);
            
            -- Get franchise record for this stat
            CASE stat_name
                WHEN 'FG3M', 'BLK' THEN
                    EXECUTE format('
                        SELECT COALESCE(MAX(CAST("%I" AS NUMERIC)), 0) as record
                        FROM twolves_player_game_logs
                    ', stat_name)
                    INTO franchise_record;
                ELSE
                    EXECUTE format('
                        SELECT COALESCE(MAX("%I"), 0) as record
                        FROM twolves_player_game_logs
                    ', stat_name)
                    INTO franchise_record;
            END CASE;
            
            franchise_record := COALESCE(franchise_record, 0);
            
            -- Get franchise record holder name
            CASE stat_name
                WHEN 'FG3M', 'BLK' THEN
                    EXECUTE format('
                        SELECT COALESCE("PLAYER_NAME", ''Unknown'') as player_name
                        FROM twolves_player_game_logs 
                        WHERE CAST("%I" AS NUMERIC) = $1
                        LIMIT 1
                    ', stat_name)
                    INTO franchise_player
                    USING franchise_record;
                ELSE
                    EXECUTE format('
                        SELECT COALESCE("PLAYER_NAME", ''Unknown'') as player_name
                        FROM twolves_player_game_logs 
                        WHERE "%I" = $1
                        LIMIT 1
                    ', stat_name)
                    INTO franchise_player
                    USING franchise_record;
            END CASE;
            
            franchise_player := COALESCE(franchise_player, 'Unknown');
            
            -- Get NBA record for this stat (hardcoded values)
            CASE stat_name
                WHEN 'PTS' THEN nba_record := 100; nba_player := 'Wilt Chamberlain*';
                WHEN 'AST' THEN nba_record := 30; nba_player := 'Scott Skiles';
                WHEN 'REB' THEN nba_record := 55; nba_player := 'Wilt Chamberlain*';
                WHEN 'STL' THEN nba_record := 11; nba_player := 'Larry Kenon';
                WHEN 'BLK' THEN nba_record := 17; nba_player := 'Elmore Smith';
                WHEN 'TOV' THEN nba_record := 14; nba_player := 'John Drew';
                WHEN 'FGM' THEN nba_record := 36; nba_player := 'Wilt Chamberlain*';
                WHEN 'FGA' THEN nba_record := 63; nba_player := 'Wilt Chamberlain*';
                WHEN 'FG3M' THEN nba_record := 14; nba_player := 'Klay Thompson';
                WHEN 'FG3A' THEN nba_record := 24; nba_player := 'Klay Thompson';
                WHEN 'FTM' THEN nba_record := 28; nba_player := 'Wilt Chamberlain*';
                WHEN 'FTA' THEN nba_record := 39; nba_player := 'Wilt Chamberlain*';
                WHEN 'PF' THEN nba_record := 6; nba_player := 'Multiple Players';
                ELSE nba_record := 0; nba_player := 'Unknown';
            END CASE;
            
            -- Insert record for this player and stat
            INSERT INTO record_tracker_season (
                name, GP, GAMES_REMAINING, stat, current, per_game, projection,
                personal_record, franchise_record, franchise_player, nba_record, nba_player
            ) VALUES (
                player_record."PLAYER_NAME",
                total_team_games,
                games_remaining,
                LOWER(stat_name), -- Convert to lowercase for frontend compatibility
                current_value,
                per_game_value,
                projection,
                personal_record,
                franchise_record,
                franchise_player,
                nba_record,
                nba_player
            );
        END LOOP;
    END LOOP;
    
    -- Log success
    RAISE NOTICE 'Successfully populated record_tracker_season with % players', 
        (SELECT COUNT(DISTINCT name) FROM record_tracker_season);
END;
$$;

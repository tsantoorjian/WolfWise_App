-- Final working create_record_tracker_season function
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
    i INTEGER;
BEGIN
    -- Clear existing records with a WHERE clause (required by Supabase)
    DELETE FROM record_tracker_season WHERE name IS NOT NULL;
    
    -- Get total team games played this season
    SELECT COALESCE(COUNT(DISTINCT DATE_TRUNC('day', GAME_DATE::date)), 0) INTO total_team_games
    FROM twolves_player_game_logs 
    WHERE GAME_DATE >= '2024-10-01' AND GAME_DATE <= '2025-06-30';
    
    -- If no games found, default to 0
    IF total_team_games IS NULL THEN
        total_team_games := 0;
    END IF;
    
    -- Calculate games remaining (assuming 82-game season)
    games_remaining := GREATEST(0, 82 - total_team_games);
    
    -- Loop through all Timberwolves players
    FOR player_record IN 
        SELECT DISTINCT PLAYER_NAME 
        FROM timberwolves_player_stats_season 
        WHERE GP > 0 AND PLAYER_NAME IS NOT NULL
        ORDER BY PLAYER_NAME
    LOOP
        -- Process each stat category individually to avoid dynamic SQL issues
        
        -- Points
        SELECT COALESCE(SUM(PTS), 0), COALESCE(AVG(PTS), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(PTS), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(PTS), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE PTS = franchise_record LIMIT 1;
        nba_record := 100; nba_player := 'Wilt Chamberlain*';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'pts', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Assists
        SELECT COALESCE(SUM(AST), 0), COALESCE(AVG(AST), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(AST), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(AST), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE AST = franchise_record LIMIT 1;
        nba_record := 30; nba_player := 'Scott Skiles';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'ast', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Rebounds
        SELECT COALESCE(SUM(REB), 0), COALESCE(AVG(REB), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(REB), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(REB), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE REB = franchise_record LIMIT 1;
        nba_record := 55; nba_player := 'Wilt Chamberlain*';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'reb', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Steals
        SELECT COALESCE(SUM(STL), 0), COALESCE(AVG(STL), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(STL), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(STL), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE STL = franchise_record LIMIT 1;
        nba_record := 11; nba_player := 'Larry Kenon';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'stl', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Blocks (handle as text column)
        SELECT COALESCE(SUM(CAST(BLK AS NUMERIC)), 0), COALESCE(AVG(CAST(BLK AS NUMERIC)), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(CAST(BLK AS NUMERIC)), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(CAST(BLK AS NUMERIC)), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE CAST(BLK AS NUMERIC) = franchise_record LIMIT 1;
        nba_record := 17; nba_player := 'Elmore Smith';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'blk', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Turnovers
        SELECT COALESCE(SUM(TOV), 0), COALESCE(AVG(TOV), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(TOV), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(TOV), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE TOV = franchise_record LIMIT 1;
        nba_record := 14; nba_player := 'John Drew';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'tov', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Field Goals Made
        SELECT COALESCE(SUM(FGM), 0), COALESCE(AVG(FGM), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(FGM), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(FGM), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE FGM = franchise_record LIMIT 1;
        nba_record := 36; nba_player := 'Wilt Chamberlain*';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'fgm', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Field Goals Attempted
        SELECT COALESCE(SUM(FGA), 0), COALESCE(AVG(FGA), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(FGA), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(FGA), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE FGA = franchise_record LIMIT 1;
        nba_record := 63; nba_player := 'Wilt Chamberlain*';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'fga', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- 3-Point Field Goals Made (handle as text column)
        SELECT COALESCE(SUM(CAST(FG3M AS NUMERIC)), 0), COALESCE(AVG(CAST(FG3M AS NUMERIC)), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(CAST(FG3M AS NUMERIC)), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(CAST(FG3M AS NUMERIC)), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE CAST(FG3M AS NUMERIC) = franchise_record LIMIT 1;
        nba_record := 14; nba_player := 'Klay Thompson';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'fg3m', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- 3-Point Field Goals Attempted
        SELECT COALESCE(SUM(FG3A), 0), COALESCE(AVG(FG3A), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(FG3A), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(FG3A), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE FG3A = franchise_record LIMIT 1;
        nba_record := 24; nba_player := 'Klay Thompson';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'fg3a', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Free Throws Made
        SELECT COALESCE(SUM(FTM), 0), COALESCE(AVG(FTM), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(FTM), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(FTM), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE FTM = franchise_record LIMIT 1;
        nba_record := 28; nba_player := 'Wilt Chamberlain*';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'ftm', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Free Throws Attempted
        SELECT COALESCE(SUM(FTA), 0), COALESCE(AVG(FTA), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(FTA), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(FTA), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE FTA = franchise_record LIMIT 1;
        nba_record := 39; nba_player := 'Wilt Chamberlain*';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'fta', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
        -- Personal Fouls
        SELECT COALESCE(SUM(PF), 0), COALESCE(AVG(PF), 0) INTO current_value, per_game_value
        FROM twolves_player_game_logs 
        WHERE PLAYER_NAME = player_record.PLAYER_NAME AND GAME_DATE >= '2024-10-01';
        
        projection := per_game_value * 82;
        SELECT COALESCE(MAX(PF), 0) INTO personal_record FROM twolves_player_game_logs WHERE PLAYER_NAME = player_record.PLAYER_NAME;
        SELECT COALESCE(MAX(PF), 0) INTO franchise_record FROM twolves_player_game_logs;
        SELECT COALESCE(PLAYER_NAME, 'Unknown') INTO franchise_player FROM twolves_player_game_logs WHERE PF = franchise_record LIMIT 1;
        nba_record := 6; nba_player := 'Multiple Players';
        
        INSERT INTO record_tracker_season (name, GP, GAMES_REMAINING, stat, current, per_game, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player)
        VALUES (player_record.PLAYER_NAME, total_team_games, games_remaining, 'pf', current_value, per_game_value, projection, personal_record, franchise_record, franchise_player, nba_record, nba_player);
        
    END LOOP;
    
    -- Log success
    RAISE NOTICE 'Successfully populated record_tracker_season with % players', 
        (SELECT COUNT(DISTINCT name) FROM record_tracker_season);
END;
$$;

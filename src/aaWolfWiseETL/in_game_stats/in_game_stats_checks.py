# test_in_game_stats.py
import logging
import azure.functions as func  # Required for Azure Functions
import requests
import pandas as pd
import os
from supabase import create_client
from dotenv import load_dotenv
import json

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = 'https://kuthirbcjtofsdwsfhkj.supabase.co'
supabase_key = os.getenv('SUPABASE_KEY')

# Print key info for debugging (first few characters only for security)
if supabase_key:
    logger.info(f"Supabase key loaded (first 10 chars): {supabase_key[:10]}...")
else:
    logger.error("SUPABASE_KEY environment variable not found!")

# Create client with explicit headers
supabase = create_client(supabase_url, supabase_key)

def fetch_nba_data(url, headers):
    response = requests.get(url, headers=headers)
    return response.json()

def save_to_supabase(df, table_name="in_game_player_stats"):
    """Save DataFrame to Supabase using upsert to avoid duplicates."""
    if df.empty:
        logger.warning("No data to upload to Supabase.")
        return

    try:
        records = df.to_dict('records')
        
        # Debug: Print table structure
        logger.info(f"Attempting to save to table: {table_name}")
        logger.info(f"DataFrame columns: {df.columns.tolist()}")
        logger.info(f"First record sample: {records[0] if records else 'No records'}")
        
        # Try different delete approaches
        try:
            logger.info(f"Attempting to delete all records from {table_name}")
            # Try a different approach for deletion - using a raw SQL query
            # This is a safer approach that works regardless of column names
            result = supabase.table(table_name).delete().neq("Player", "NO_SUCH_PLAYER").execute()
            logger.info(f"Delete result: {result}")
        except Exception as e:
            logger.error(f"Delete failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            # Continue anyway - we'll try to upsert/insert
        
        # Try to insert/upsert
        try:
            logger.info(f"Attempting to upsert records to {table_name}")
            result = supabase.table(table_name).upsert(records).execute()
            logger.info(f"Upsert result: {result}")
        except Exception as e:
            logger.error(f"Upsert failed, trying insert: {str(e)}")
            # If upsert fails, try simple insert
            result = supabase.table(table_name).insert(records).execute()
            logger.info(f"Insert result: {result}")
        
        logger.info(f"Successfully saved in-game stats to {table_name}")
        logger.info(f"Preview:\n{df[['Player', 'PTS', 'REB', 'AST']].head()}")

    except Exception as e:
        logger.error(f"Error saving in-game stats to {table_name}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

def save_game_info_to_supabase(game_info, table_name="in_game_info"):
    """Save game information to Supabase."""
    if not game_info:
        logger.warning("No game info to upload to Supabase.")
        return

    try:
        # Debug: Print table structure and data
        logger.info(f"Attempting to save to table: {table_name}")
        logger.info(f"Game info keys: {game_info.keys()}")
        logger.info(f"Game info sample: {str(game_info)[:200]}...")
        
        # Try different delete approaches
        try:
            logger.info(f"Attempting to delete all records from {table_name}")
            result = supabase.table(table_name).delete().neq("game_id", "NO_SUCH_GAME").execute()
            logger.info(f"Delete result: {result}")
        except Exception as e:
            logger.error(f"Delete failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            # Continue anyway - we'll try to insert
        
        # Try to insert
        try:
            logger.info(f"Attempting to insert game info to {table_name}")
            result = supabase.table(table_name).insert(game_info).execute()
            logger.info(f"Insert result: {result}")
        except Exception as e:
            logger.error(f"Insert failed, trying upsert: {str(e)}")
            # If insert fails, try upsert
            result = supabase.table(table_name).upsert(game_info).execute()
            logger.info(f"Upsert result: {result}")

        logger.info(f"Successfully saved game info to {table_name}")

    except Exception as e:
        logger.error(f"Error saving game info to {table_name}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

def fetch_and_save_play_by_play(game_id, table_name="in_game_play_by_play"):
    """Fetch play-by-play data and save to Supabase."""
    try:
        # Fetch play-by-play data using NBA API
        url = f"https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_{game_id}.json"
        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
        
        logger.info(f"Fetching play-by-play data from: {url}")
        data = fetch_nba_data(url, headers)
        
        # Debug: Print API response structure in detail
        logger.info(f"Play-by-play API response keys: {data.keys() if isinstance(data, dict) else 'Not a dictionary'}")
        if 'game' in data and isinstance(data['game'], dict):
            logger.info(f"Game keys: {data['game'].keys()}")
            if 'actions' in data['game']:
                logger.info(f"Found {len(data['game']['actions'])} play actions")
                plays_data = data['game']['actions']
            else:
                logger.warning("No 'actions' key in game data")
                plays_data = []
        elif 'plays' in data:
            logger.info(f"Found {len(data['plays'])} plays")
            plays_data = data['plays']
        else:
            logger.warning("No play-by-play data available for this game.")
            return
        
        # Process play-by-play data
        plays = []
        for play in plays_data:
            # Calculate time in seconds for sorting/filtering
            period = play.get('period', 1)
            clock_parts = play.get('clock', '12:00').split(':')
            if len(clock_parts) == 2:
                minutes, seconds = int(clock_parts[0]), float(clock_parts[1])
                time_seconds = (4 - period) * 12 * 60 + minutes * 60 + seconds
                if period > 4:  # Overtime
                    time_seconds = -(period - 4) * 5 * 60 + minutes * 60 + seconds
            else:
                time_seconds = 0
                
            play_data = {
                'game_id': game_id,
                'event_num': play.get('actionNumber', 0),
                'clock': play.get('clock', ''),
                'period': period,
                'event_type': play.get('actionType', ''),
                'description': play.get('description', ''),
                'home_score': play.get('scoreHome', 0),
                'away_score': play.get('scoreAway', 0),
                'team_tricode': play.get('teamTricode', ''),
                'player_name': play.get('playerNameI', ''),
                'is_scoring_play': play.get('isScoreChange', False),
                'score_margin': play.get('scoreMargin', 0),
                'time_seconds': time_seconds
            }
            plays.append(play_data)
        
        if plays:
            # Debug: Print play data structure
            logger.info(f"First play event sample: {str(plays[0])[:200]}...")
            
            # Try different delete approaches
            try:
                logger.info(f"Attempting to delete all records from {table_name}")
                result = supabase.table(table_name).delete().neq("game_id", "NO_SUCH_GAME").execute()
                logger.info(f"Delete result: {result}")
            except Exception as e:
                logger.error(f"Delete failed: {str(e)}")
                logger.error(f"Error type: {type(e).__name__}")
                # Continue anyway - we'll try to insert
            
            try:
                logger.info(f"Attempting to insert play-by-play data to {table_name}")
                result = supabase.table(table_name).insert(plays).execute()
                logger.info(f"Insert result: {result}")
            except Exception as e:
                logger.error(f"Insert failed: {str(e)}")
                logger.error(f"Error type: {type(e).__name__}")
                
            logger.info(f"Successfully saved {len(plays)} play-by-play events to {table_name}")
        else:
            logger.warning("No play events found to save")
        
    except Exception as e:
        logger.error(f"Error fetching or saving play-by-play data: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

def get_most_recent_game_id():
    """Fetch the most recent game for MIN (Timberwolves)."""
    from nba_api.stats.endpoints import leaguegamefinder
    
    gamefinder = leaguegamefinder.LeagueGameFinder(season_nullable='2024-25',
                                                  league_id_nullable='00',
                                                  season_type_nullable='Regular Season')
    games = gamefinder.get_data_frames()[0]
    games = games[games['TEAM_ABBREVIATION'] == 'MIN']
    
    if games.empty:
        logger.error("No recent games found for Timberwolves.")
        return None

    # Sort by game date to get the most recent
    games = games.sort_values('GAME_DATE', ascending=False)
    most_recent_game_id = games['GAME_ID'].iloc[0]
    logger.info(f"Most recent game ID: {most_recent_game_id}")
    return most_recent_game_id

def execute_sql(sql, params=None):
    """Execute raw SQL query to bypass RLS policies."""
    try:
        logger.info(f"Executing SQL: {sql}")
        result = supabase.rpc('execute_sql', {'query': sql, 'params': params or []}).execute()
        logger.info(f"SQL result: {result}")
        return result
    except Exception as e:
        logger.error(f"SQL execution error: {str(e)}")
        return None

def test_supabase_connection():
    """Test if we can connect to Supabase and have proper permissions."""
    try:
        # Try a simple query that should always work
        result = supabase.from_('in_game_player_stats').select('*', count='exact').limit(1).execute()
        logger.info(f"Supabase connection test: SUCCESS. Got {result.count} records.")
        return True
    except Exception as e:
        logger.error(f"Supabase connection test: FAILED. Error: {str(e)}")
        return False

def process_in_game_stats():
    """Main function to process in-game stats."""
    logger.info("Starting process: Fetching in-game stats...")

    try:
        test_supabase_connection()

        game_id = get_most_recent_game_id()
        if not game_id:
            logger.warning("No recent game found. Exiting...")
            return

        url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        }

        # Fetch game data
        data = fetch_nba_data(url, headers)
        
        # Extract game information with safer access
        game_info = {
            'game_id': game_id,
            'game_status': data.get("game", {}).get("gameStatusText", 
                          str(data.get("game", {}).get("gameStatus", "Unknown"))),
            'game_clock': data.get("game", {}).get("gameClock", ""),
            'period': data.get("game", {}).get("period", 0),
            'home_team': data.get("game", {}).get("homeTeam", {}).get("teamTricode", ""),
            'away_team': data.get("game", {}).get("awayTeam", {}).get("teamTricode", ""),
            'home_score': data.get("game", {}).get("homeTeam", {}).get("score", 0),
            'away_score': data.get("game", {}).get("awayTeam", {}).get("score", 0),
            'game_date': data.get("game", {}).get("gameTimeUTC", ""),
            'arena': data.get("game", {}).get("arena", {}).get("arenaName", ""),
            'city': data.get("game", {}).get("arena", {}).get("arenaCity", ""),
            'is_halftime': data.get("game", {}).get("period", 0) == 2 and data.get("game", {}).get("gameClock", "") == "",
            'is_end_of_period': data.get("game", {}).get("isEndOfPeriod", False)
        }

        # Save game info to Supabase
        save_game_info_to_supabase(game_info)

        # Fetch and save play-by-play data
        fetch_and_save_play_by_play(game_id)

        # Determine if Timberwolves are playing
        home_team = data.get("game", {}).get("homeTeam", {})
        away_team = data.get("game", {}).get("awayTeam", {})

        if home_team.get("teamTricode") == "MIN":
            wolves_team = home_team
            opponent_team = away_team
            logger.info("Timberwolves are the home team.")
        elif away_team.get("teamTricode") == "MIN":
            wolves_team = away_team
            opponent_team = home_team
            logger.info("Timberwolves are the away team.")
        else:
            logger.warning("Minnesota Timberwolves not found in this game.")
            return

        # Extract player stats
        players_data = []
        for player in wolves_team.get("players", []):
            stats = player.get("statistics", {})
            players_data.append({
                'Player': f"{player.get('firstName', '')} {player.get('familyName', '')}",
                'PTS': stats.get('points', 0),
                'REB': stats.get('reboundsTotal', 0),
                'AST': stats.get('assists', 0),
                'STL': stats.get('steals', 0),
                'TOV': stats.get('turnovers', 0),
                'BLK': stats.get('blocks', 0),
                'FGs': f"{stats.get('fieldGoalsMade', 0)}-{stats.get('fieldGoalsAttempted', 0)}",
                'threePt': f"{stats.get('threePointersMade', 0)}-{stats.get('threePointersAttempted', 0)}",
                'plusMinusPoints': stats.get('plusMinusPoints', 0),
                'minutes': stats.get('minutesCalculated', '0:00'),
                'fouls': stats.get('foulsPersonal', 0),
                'FTs': f"{stats.get('freeThrowsMade', 0)}-{stats.get('freeThrowsAttempted', 0)}"
            })

        df = pd.DataFrame(players_data)

        # Save stats to Supabase
        save_to_supabase(df)

        logger.info("Process completed successfully.")

    except Exception as e:
        logger.error(f"Error running in-game stats: {str(e)}")
        import traceback
        traceback.print_exc()

def main(mytimer: func.TimerRequest) -> None:
    """Azure Function Entry Point."""
    logger.info("Azure Function triggered: Fetching in-game stats...")

    if mytimer.past_due:
        logger.warning("The timer is running late!")

    process_in_game_stats()

# For local testing
if __name__ == "__main__":
    process_in_game_stats()
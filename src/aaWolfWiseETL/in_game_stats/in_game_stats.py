import logging
import azure.functions as func  # Required for Azure Functions
import requests
import pandas as pd
import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = 'https://kuthirbcjtofsdwsfhkj.supabase.co'
supabase_key = os.getenv('SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

        # Delete existing records before inserting new ones
        supabase.table(table_name).delete().neq("Player", "NO_SUCH_PLAYER").execute()
        
        # Upsert instead of insert to prevent duplicate key errors
        supabase.table(table_name).upsert(records, on_conflict=["Player"]).execute()

        logger.info(f"Successfully saved in-game stats to {table_name}")
        logger.info(f"Preview:\n{df[['Player', 'PTS', 'REB', 'AST']].head()}")

    except Exception as e:
        logger.error(f"Error saving in-game stats to {table_name}: {str(e)}")
        import traceback
        traceback.print_exc()

def save_game_info_to_supabase(game_info, table_name="in_game_info"):
    """Save game information to Supabase."""
    if not game_info:
        logger.warning("No game info to upload to Supabase.")
        return

    try:
        # Delete existing game info before inserting new one
        supabase.table(table_name).delete().execute()
        
        # Insert new game info
        supabase.table(table_name).insert(game_info).execute()

        logger.info(f"Successfully saved game info to {table_name}")

    except Exception as e:
        logger.error(f"Error saving game info to {table_name}: {str(e)}")
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
        
        data = fetch_nba_data(url, headers)
        
        if 'plays' not in data or not data['plays']:
            logger.warning("No play-by-play data available for this game.")
            return
        
        # Process play-by-play data
        plays = []
        for play in data['plays']:
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
        
        # Clear existing play-by-play data for this game
        supabase.table(table_name).delete().execute()
        
        # Insert new play-by-play data
        if plays:
            supabase.table(table_name).insert(plays).execute()
            logger.info(f"Successfully saved {len(plays)} play-by-play events to {table_name}")
        
    except Exception as e:
        logger.error(f"Error fetching or saving play-by-play data: {str(e)}")
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

    return games['GAME_ID'].iloc[0]

def main(mytimer: func.TimerRequest) -> None:
    """Azure Function Entry Point."""
    logger.info("Azure Function triggered: Fetching in-game stats...")

    if mytimer.past_due:
        logger.warning("The timer is running late!")

    try:
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

        # Extract game information
        game_info = {
            'game_id': game_id,
            'game_status': data["meta"]["statusText"],
            'game_clock': data["game"].get("gameClock", ""),
            'period': data["game"].get("period", 0),
            'home_team': data["game"]["homeTeam"]["teamTricode"],
            'away_team': data["game"]["awayTeam"]["teamTricode"],
            'home_score': data["game"]["homeTeam"]["score"],
            'away_score': data["game"]["awayTeam"]["score"],
            'game_date': data["game"]["gameTimeUTC"],
            'arena': data["game"]["arena"]["arenaName"],
            'city': data["game"]["arena"]["arenaCity"],
            'is_halftime': data["game"].get("period", 0) == 2 and data["game"].get("gameClock", "") == "",
            'is_end_of_period': data["game"].get("isEndOfPeriod", False)
        }

        # Save game info to Supabase
        save_game_info_to_supabase(game_info)

        # Fetch and save play-by-play data
        fetch_and_save_play_by_play(game_id)

        # Determine if Timberwolves are playing
        home_team = data["game"]["homeTeam"]
        away_team = data["game"]["awayTeam"]

        if home_team["teamTricode"] == "MIN":
            wolves_team = home_team
            opponent_team = away_team
            logger.info("Timberwolves are the home team.")
        elif away_team["teamTricode"] == "MIN":
            wolves_team = away_team
            opponent_team = home_team
            logger.info("Timberwolves are the away team.")
        else:
            logger.warning("Minnesota Timberwolves not found in this game.")
            return

        # Extract player stats
        players_data = []
        for player in wolves_team["players"]:
            stats = player["statistics"]
            players_data.append({
                'Player': f"{player['firstName']} {player['familyName']}",
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

        logger.info("Azure Function completed successfully.")

    except Exception as e:
        logger.error(f"Error running in-game stats: {str(e)}")
        import traceback
        traceback.print_exc()

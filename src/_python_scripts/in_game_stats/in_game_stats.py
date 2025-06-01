# test_in_game_stats.py
import logging
import azure.functions as func  # Required for Azure Functions
import requests
import pandas as pd
import os
import json
from datetime import datetime
import pytz
from nba_api.stats.endpoints import leaguegamefinder
import csv
from dotenv import load_dotenv
from src._python_scripts.utils import (
    get_supabase_client,
    load_to_supabase as utils_load_to_supabase,
    fetch_nba_data,
    execute_sql,
    test_supabase_connection as utils_test_supabase_connection
)

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = get_supabase_client()

def save_to_supabase(df, table_name="in_game_player_stats"):
    if df.empty:
        logger.warning("No data to upload to Supabase.")
        return

    try:
        # First clear existing data
        supabase.table(table_name).delete().neq("Player", "NO_SUCH_PLAYER").execute()
        
        # Then load the new data
        utils_load_to_supabase(df, table_name)
        logger.info(f"Successfully saved player stats to {table_name}")
    except Exception as e:
        logger.error(f"Error saving player stats: {str(e)}")
        import traceback
        traceback.print_exc()

def save_game_info_to_supabase(game_info, table_name="in_game_info"):
    if not game_info:
        logger.warning("No game info to upload to Supabase.")
        return

    try:
        logger.info(f"Saving game info to {table_name}")
        supabase.table(table_name).delete().neq("game_id", "NO_SUCH_GAME").execute()
        supabase.table(table_name).insert(game_info).execute()
        logger.info(f"Successfully saved game info to {table_name}")
    except Exception as e:
        logger.error(f"Error saving game info: {str(e)}")
        import traceback
        traceback.print_exc()

def fetch_and_save_play_by_play(game_id, table_name="in_game_play_by_play"):
    try:
        url = f"https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_{game_id}.json"
        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
        
        logger.info(f"Fetching play-by-play for game {game_id}")
        data = fetch_nba_data(url, headers)

        plays_data = data.get('game', {}).get('actions', [])
        if not plays_data:
            logger.warning("No play-by-play data found.")
            return

        plays = []
        for play in plays_data:
            period = play.get('period', 1)
            clock = play.get('clock', '12:00')
            minutes, seconds = map(int, clock.split(':')) if ':' in clock else (0, 0)
            time_seconds = (4 - period) * 12 * 60 + minutes * 60 + seconds if period <= 4 else -(period - 4) * 5 * 60 + minutes * 60 + seconds

            plays.append({
                'game_id': game_id,
                'event_num': play.get('actionNumber', 0),
                'clock': clock,
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
            })

        if plays:
            logger.info(f"Saving {len(plays)} play-by-play events to {table_name}")
            supabase.table(table_name).delete().neq("game_id", "NO_SUCH_GAME").execute()
            
            # Convert to DataFrame and use utility function
            plays_df = pd.DataFrame(plays)
            utils_load_to_supabase(plays_df, table_name)
            
            logger.info(f"Successfully saved play-by-play to {table_name}")
        else:
            logger.warning("No play-by-play events to save.")

    except Exception as e:
        logger.error(f"Error fetching or saving play-by-play: {str(e)}")
        import traceback
        traceback.print_exc()

def fetch_and_save_lineups(game_id, table_name="in_game_lineups"):
    """Track and save current lineups throughout the game. Debug info is written to a CSV file."""
    debug_csv_path = f"lineup_debug_output_{game_id}.csv"
    try:
        # 1. Get boxscore for starters
        boxscore_url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
        boxscore = fetch_nba_data(boxscore_url, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"})
        home_team = boxscore['game']['homeTeam']
        away_team = boxscore['game']['awayTeam']

        # Write debug info to CSV
        with open(debug_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["Home team players:"])
            for p in home_team['players']:
                writer.writerow([json.dumps(p)])
            writer.writerow(["Away team players:"])
            for p in away_team['players']:
                writer.writerow([json.dumps(p)])

        # Get starters robustly (ensure only 5, fallback to first 5 if needed)
        home_lineup = [p for p in home_team['players'] if p.get('starter') is True]
        if len(home_lineup) != 5:
            logger.warning(f"Home starters not found or not 5, using first 5 players.")
            home_lineup = home_team['players'][:5]
        else:
            home_lineup = home_lineup[:5]
        away_lineup = [p for p in away_team['players'] if p.get('starter') is True]
        if len(away_lineup) != 5:
            logger.warning(f"Away starters not found or not 5, using first 5 players.")
            away_lineup = away_team['players'][:5]
        else:
            away_lineup = away_lineup[:5]

        current_lineup = {
            home_team['teamTricode']: set(str(p['personId']) for p in home_lineup),
            away_team['teamTricode']: set(str(p['personId']) for p in away_lineup)
        }
        player_id_to_name = {str(p['personId']): f"{p['firstName']} {p['familyName']}" for p in home_team['players'] + away_team['players']}

        # Track the last 5 'in' events for each team
        recent_in_players = {
            home_team['teamTricode']: [str(p['personId']) for p in home_lineup],
            away_team['teamTricode']: [str(p['personId']) for p in away_lineup]
        }

        # 2. Process play-by-play for substitutions
        pbp_url = f"https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_{game_id}.json"
        pbp = fetch_nba_data(pbp_url, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"})
        plays = pbp.get('game', {}).get('actions', [])
        lineup_snapshots = []

        with open(debug_csv_path, 'a', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            for play in plays:
                period = play.get('period', 1)
                clock = play.get('clock', '')
                event_num = play.get('actionNumber', 0)

                # Save current lineup snapshot for both teams at this play
                for team in [home_team['teamTricode'], away_team['teamTricode']]:
                    lineup_snapshots.append({
                        'game_id': game_id,
                        'team_tricode': team,
                        'period': period,
                        'clock': clock,
                        'event_num': event_num,
                        'player_ids': ','.join(sorted(current_lineup[team])),
                        'player_names': ','.join([player_id_to_name[pid] for pid in current_lineup[team] if pid and pid in player_id_to_name])
                    })

                # Handle substitutions
                if play.get('actionType') == 'substitution':
                    team = play.get('teamTricode')
                    person_id = str(play.get('personId'))
                    sub_type = play.get('subType')
                    if team in current_lineup and person_id and person_id != 'None':
                        if sub_type == 'out':
                            current_lineup[team].discard(person_id)
                        elif sub_type == 'in':
                            current_lineup[team].add(person_id)
                            recent_in_players[team].append(person_id)
                            # Keep only the last 5
                            if len(recent_in_players[team]) > 5:
                                recent_in_players[team] = recent_in_players[team][-5:]
                        # After every substitution, if lineup != 5, fix it
                        if len(current_lineup[team]) != 5:
                            # Use the last 5 'in' players
                            current_lineup[team] = set(recent_in_players[team][-5:])
                    else:
                        logger.warning(f"Invalid substitution event: {play}")

                # At the start of a period, reset lineup to last 5 'in' players if needed
                if play.get('actionType') == 'substitution' and 'startperiod' in play.get('qualifiers', []):
                    team = play.get('teamTricode')
                    if team in current_lineup:
                        current_lineup[team] = set(recent_in_players[team][-5:])

        # 3. Save to Supabase
        if lineup_snapshots:
            logger.info(f"Saving {len(lineup_snapshots)} lineup snapshots to {table_name}")
            supabase.table(table_name).delete().eq('game_id', game_id).execute()  # Clear previous
            
            # Convert to DataFrame and use utility function
            lineups_df = pd.DataFrame(lineup_snapshots)
            utils_load_to_supabase(lineups_df, table_name)
            
            logger.info(f"Saved {len(lineup_snapshots)} lineup snapshots to {table_name}")

        # 4. Write summary of final lineups to debug CSV
        with open(debug_csv_path, 'a', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["Final lineup snapshots (last for each team):"])
            for team in [home_team['teamTricode'], away_team['teamTricode']]:
                last_snapshot = next((snap for snap in reversed(lineup_snapshots) if snap['team_tricode'] == team), None)
                if last_snapshot:
                    writer.writerow([team, last_snapshot['player_names']])

        # Log all substitution events
        with open(f"substitution_events_{game_id}.csv", 'w', newline='', encoding='utf-8') as sub_csv:
            sub_writer = csv.writer(sub_csv)
            sub_writer.writerow(['event_num', 'period', 'clock', 'teamTricode', 'substitutionIn', 'substitutionOut', 'raw_event'])
            for play in plays:
                if play.get('actionType') == 'substitution':
                    sub_writer.writerow([
                        play.get('actionNumber'),
                        play.get('period'),
                        play.get('clock'),
                        play.get('teamTricode'),
                        play.get('substitutionIn'),
                        play.get('substitutionOut'),
                        json.dumps(play)
                    ])

    except Exception as e:
        logger.error(f"Error fetching/saving lineups: {str(e)}")
        import traceback
        traceback.print_exc()

def get_today_game_id():
    """Check today's live scoreboard and get Timberwolves game ID if they are playing today."""
    eastern = pytz.timezone('US/Eastern')
    today = datetime.now(eastern).strftime('%Y-%m-%d')

    url = "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json"
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    logger.info(f"Fetching NBA live scoreboard for {today}")
    scoreboard_data = fetch_nba_data(url, headers)

    if not scoreboard_data or 'scoreboard' not in scoreboard_data:
        logger.error("Failed to retrieve NBA live scoreboard.")
        return None

    games_today = scoreboard_data['scoreboard'].get('games', [])

    if not games_today:
        logger.info("No NBA games today.")
        return None

    logger.info(f"Found {len(games_today)} games today. Checking for Timberwolves...")

    for game in games_today:
        home_team = game.get('homeTeam', {}).get('teamTricode', '')
        away_team = game.get('awayTeam', {}).get('teamTricode', '')
        game_id = game.get('gameId', None)

        if 'MIN' in (home_team, away_team):
            logger.info(f"Found Timberwolves game! Game ID: {game_id}")
            return game_id

    logger.info("Timberwolves are not playing today.")
    return None

def get_most_recent_game_id_any_type():
    """Fetch the most recent Timberwolves game (regular season or playoffs)."""
    gamefinder = leaguegamefinder.LeagueGameFinder(team_id_nullable=None, season_type_nullable=None)
    games = gamefinder.get_data_frames()[0]
    games = games[games['TEAM_ABBREVIATION'] == 'MIN']
    if games.empty:
        logger.error("No recent games found for Timberwolves.")
        return None
    return games.iloc[0]['GAME_ID']

def test_supabase_connection():
    """Test if we can connect to Supabase."""
    return utils_test_supabase_connection()

def process_in_game_stats():
    logger.info("Starting process: Fetching in-game stats...")

    try:
        test_supabase_connection()

        game_id = get_today_game_id()
        if not game_id:
            logger.warning("No Timberwolves game today. Using most recent game instead...")
            game_id = get_most_recent_game_id_any_type()
            if not game_id:
                logger.error("No recent Timberwolves games found. Exiting...")
                return

        url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
        logger.info(f"Fetching boxscore from URL: {url}")
        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        }

        data = fetch_nba_data(url, headers)

        game_info = {
            'game_id': game_id,
            'game_status': data.get("game", {}).get("gameStatusText", str(data.get("game", {}).get("gameStatus", "Unknown"))),
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

        save_game_info_to_supabase(game_info)
        fetch_and_save_play_by_play(game_id)
        fetch_and_save_lineups(game_id)

        home_team = data.get("game", {}).get("homeTeam", {})
        away_team = data.get("game", {}).get("awayTeam", {})

        if home_team.get("teamTricode") == "MIN":
            wolves_team = home_team
            logger.info("Timberwolves are the home team.")
        elif away_team.get("teamTricode") == "MIN":
            wolves_team = away_team
            logger.info("Timberwolves are the away team.")
        else:
            logger.warning("Minnesota Timberwolves not found in this game.")
            return

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

from nba_api.stats.endpoints import playergamelog, commonteamroster
from nba_api.stats.static import teams
import pandas as pd
from datetime import datetime
import logging
import time
from requests.exceptions import ReadTimeout, ConnectionError
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up Supabase client
supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Timberwolves team ID
logger.info("Fetching Timberwolves team ID...")
timberwolves = teams.find_teams_by_full_name('Minnesota Timberwolves')[0]
team_id = timberwolves['id']
logger.info(f"Found Timberwolves ID: {team_id}")

# Get current season in YYYY-YY format and convert to NBA format (e.g., 22023)
current_season = '2024-25'
nba_season_id = int('2' + current_season.split('-')[0])  # Convert '2024-25' to '22024'

# Get Timberwolves roster with retry logic
max_retries = 3
retry_delay = 5  # seconds

def get_data_with_retry(func, *args, **kwargs):
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1} of {max_retries}")
            return func(*args, **kwargs)
        except (ReadTimeout, ConnectionError) as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed after {max_retries} attempts: {str(e)}")
                raise
            logger.warning(f"Attempt {attempt + 1} failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)

logger.info("Fetching Timberwolves roster...")
roster = get_data_with_retry(commonteamroster.CommonTeamRoster, team_id=team_id, season=current_season)
wolves_players = roster.get_data_frames()[0]
logger.info(f"Found {len(wolves_players)} players on roster")

# Initialize empty list to store all game logs
all_game_logs = []

# Get game logs for each player
for _, player in wolves_players.iterrows():
    player_id = player['PLAYER_ID']
    player_name = player['PLAYER']
    
    logger.info(f"Fetching game logs for {player_name} (ID: {player_id})...")
    try:
        # Get player's game log with retry logic
        game_log = get_data_with_retry(
            playergamelog.PlayerGameLog,
            player_id=player_id,
            season=current_season
        )
        
        # Convert to dataframe
        df = game_log.get_data_frames()[0]
        logger.info(f"Successfully retrieved {len(df)} games for {player_name}")
        
        # Add player name column and ensure Player_ID is present
        df['PLAYER_NAME'] = player_name
        df['Player_ID'] = player_id
        
        # Append to list
        all_game_logs.append(df)
        
        # Add delay between requests to avoid rate limiting
        time.sleep(1)
        
    except Exception as e:
        logger.error(f"Error fetching data for {player_name}: {str(e)}")
        continue

# Combine all game logs
if all_game_logs:
    combined_logs = pd.concat(all_game_logs, ignore_index=True)
    
    # Sort by date
    combined_logs['GAME_DATE'] = pd.to_datetime(combined_logs['GAME_DATE'])
    combined_logs = combined_logs.sort_values('GAME_DATE')
    
    # Add SEASON_ID
    combined_logs['SEASON_ID'] = nba_season_id
    
    # Convert data types to match Supabase schema
    combined_logs['FG3M'] = combined_logs['FG3M'].astype(str)
    combined_logs['FG3_PCT'] = combined_logs['FG3_PCT'].astype(str)
    combined_logs['BLK'] = combined_logs['BLK'].astype(str)
    combined_logs['GAME_DATE'] = combined_logs['GAME_DATE'].dt.strftime('%Y-%m-%d')
    
    # Convert DataFrame to list of dictionaries for Supabase
    records = combined_logs.to_dict('records')
    
    try:
        # First, delete existing records for the current season to avoid duplicates
        logger.info(f"Deleting existing records for season {nba_season_id}...")
        supabase.table('twolves_player_game_logs').delete().eq('SEASON_ID', nba_season_id).execute()
        
        # Insert new records
        logger.info("Uploading new game logs to Supabase...")
        result = supabase.table('twolves_player_game_logs').insert(records).execute()
        logger.info(f"Successfully uploaded {len(records)} game logs to Supabase")
        
    except Exception as e:
        logger.error(f"Error uploading to Supabase: {str(e)}")
else:
    logger.warning("No game logs found")
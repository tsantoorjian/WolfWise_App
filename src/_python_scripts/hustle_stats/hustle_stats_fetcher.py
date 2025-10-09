#!/usr/bin/env python3
"""
Hustle Stats Fetcher for WolfWise
Fetches hustle stats for Timberwolves players from NBA API and loads into Supabase
"""

import os
import sys
import logging
import random
import time
from datetime import datetime
from typing import Dict, List, Optional
from http.client import RemoteDisconnected
from requests.exceptions import RequestException

# Add the parent directory to the path to import supabase and utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from supabase import create_client, Client
    from nba_api.stats.endpoints import leaguehustlestatsplayer
    from utils.nba_api_utils import api_call_with_retry
except ImportError:
    print("Installing required packages...")
    os.system("pip install supabase nba-api")
    from supabase import create_client, Client
    from nba_api.stats.endpoints import leaguehustlestatsplayer
    from utils.nba_api_utils import api_call_with_retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Timberwolves Team ID
TIMBERWOLVES_TEAM_ID = 1610612750

class HustleStatsFetcher:
    def __init__(self):
        """Initialize the fetcher with Supabase connection"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            print("Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
            sys.exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
    def fetch_hustle_stats(self, season: str = "2024-25", season_type: str = "Regular Season") -> List[Dict]:
        """
        Fetch hustle stats for all players from NBA API using nba_api package
        
        Args:
            season: NBA season (e.g., "2024-25")
            season_type: Season type ("Regular Season", "Playoffs", etc.)
            
        Returns:
            List of hustle stats dictionaries
        """
        logger.info(f"Fetching hustle stats for {season} {season_type}...")
        
        try:
            # Use the nba_api package with retry logic
            hustle_stats_df = api_call_with_retry(
                lambda: leaguehustlestatsplayer.LeagueHustleStatsPlayer(
                    per_mode_time='PerGame',
                    season=season,
                    season_type_all_star=season_type,
                    team_id_nullable=TIMBERWOLVES_TEAM_ID
                ).get_data_frames()[0]
            )
            
            logger.info(f"Found {len(hustle_stats_df)} hustle stats records")
            
            # Convert DataFrame to list of dictionaries
            hustle_stats = hustle_stats_df.to_dict('records')
            
            return hustle_stats
            
        except Exception as e:
            logger.error(f"Error fetching hustle stats: {e}")
            return []
    
    def fetch_hustle_stats_totals(self, season: str = "2024-25", season_type: str = "Regular Season") -> List[Dict]:
        """
        Fetch hustle stats totals for all players from NBA API using nba_api package
        
        Args:
            season: NBA season (e.g., "2024-25")
            season_type: Season type ("Regular Season", "Playoffs", etc.)
            
        Returns:
            List of hustle stats dictionaries
        """
        logger.info(f"Fetching hustle stats totals for {season} {season_type}...")
        
        try:
            # Use the nba_api package with retry logic
            hustle_stats_df = api_call_with_retry(
                lambda: leaguehustlestatsplayer.LeagueHustleStatsPlayer(
                    per_mode_time='Totals',
                    season=season,
                    season_type_all_star=season_type,
                    team_id_nullable=TIMBERWOLVES_TEAM_ID
                ).get_data_frames()[0]
            )
            
            logger.info(f"Found {len(hustle_stats_df)} hustle stats totals records")
            
            # Convert DataFrame to list of dictionaries
            hustle_stats = hustle_stats_df.to_dict('records')
            
            return hustle_stats
            
        except Exception as e:
            logger.error(f"Error fetching hustle stats totals: {e}")
            return []
    
    def transform_hustle_data(self, raw_data: List[Dict], per_mode: str) -> List[Dict]:
        """
        Transform raw NBA API data to match our database schema
        
        Args:
            raw_data: Raw data from NBA API
            per_mode: "PerGame" or "Totals"
            
        Returns:
            Transformed data ready for database insertion
        """
        transformed_data = []
        
        for player in raw_data:
            # Handle missing or null values
            def safe_get(key: str, default=None):
                value = player.get(key)
                return value if value is not None else default
            
            # Helper function to convert to int if possible, otherwise return the value
            def safe_int(value, default=0):
                if value is None:
                    return default
                try:
                    return int(float(value)) if value != '' else default
                except (ValueError, TypeError):
                    return default
            
            # Helper function to convert to float if possible, otherwise return the value
            def safe_float(value, default=0.0):
                if value is None:
                    return default
                try:
                    return float(value) if value != '' else default
                except (ValueError, TypeError):
                    return default
            
            # Transform the data to match our schema
            transformed_player = {
                'player_id': safe_int(safe_get('PLAYER_ID')),
                'player_name': safe_get('PLAYER_NAME', ''),
                'team_id': safe_int(safe_get('TEAM_ID')),
                'team_abbreviation': safe_get('TEAM_ABBREVIATION', ''),
                'age': safe_int(safe_get('AGE')),
                'games_played': safe_int(safe_get('G')),
                'minutes_played': safe_float(safe_get('MIN')),
                'contested_shots': safe_float(safe_get('CONTESTED_SHOTS')),
                'contested_shots_2pt': safe_float(safe_get('CONTESTED_SHOTS_2PT')),
                'contested_shots_3pt': safe_float(safe_get('CONTESTED_SHOTS_3PT')),
                'deflections': safe_float(safe_get('DEFLECTIONS')),
                'charges_drawn': safe_float(safe_get('CHARGES_DRAWN')),
                'screen_assists': safe_float(safe_get('SCREEN_ASSISTS')),
                'screen_ast_pts': safe_float(safe_get('SCREEN_AST_PTS')),
                'off_loose_balls_recovered': safe_float(safe_get('OFF_LOOSE_BALLS_RECOVERED')),
                'def_loose_balls_recovered': safe_float(safe_get('DEF_LOOSE_BALLS_RECOVERED')),
                'loose_balls_recovered': safe_float(safe_get('LOOSE_BALLS_RECOVERED')),
                'pct_loose_balls_recovered_off': safe_float(safe_get('PCT_LOOSE_BALLS_RECOVERED_OFF')),
                'pct_loose_balls_recovered_def': safe_float(safe_get('PCT_LOOSE_BALLS_RECOVERED_DEF')),
                'off_boxouts': safe_float(safe_get('OFF_BOXOUTS')),
                'def_boxouts': safe_float(safe_get('DEF_BOXOUTS')),
                'box_out_player_team_rebs': safe_float(safe_get('BOX_OUT_PLAYER_TEAM_REBS')),
                'box_out_player_rebs': safe_float(safe_get('BOX_OUT_PLAYER_REBS')),
                'box_outs': safe_float(safe_get('BOX_OUTS')),
                'pct_box_outs_off': safe_float(safe_get('PCT_BOX_OUTS_OFF')),
                'pct_box_outs_def': safe_float(safe_get('PCT_BOX_OUTS_DEF')),
                'pct_box_outs_team_reb': safe_float(safe_get('PCT_BOX_OUTS_TEAM_REB')),
                'pct_box_outs_reb': safe_float(safe_get('PCT_BOX_OUTS_REB')),
                'season': '2024-25',  # Current season
                'season_type': 'Regular Season',
                'per_mode': per_mode,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            transformed_data.append(transformed_player)
        
        return transformed_data
    
    def load_to_supabase(self, data: List[Dict]) -> bool:
        """
        Load hustle stats data into Supabase
        
        Args:
            data: List of hustle stats dictionaries
            
        Returns:
            True if successful, False otherwise
        """
        if not data:
            print("No data to load")
            return False
        
        try:
            # Delete existing data for the same season/type/per_mode
            season = data[0]['season']
            season_type = data[0]['season_type']
            per_mode = data[0]['per_mode']
            
            print(f"Deleting existing hustle stats for {season} {season_type} {per_mode}...")
            delete_result = self.supabase.table('hustle_stats').delete().eq('season', season).eq('season_type', season_type).eq('per_mode', per_mode).execute()
            
            # Insert new data
            print(f"Inserting {len(data)} hustle stats records...")
            insert_result = self.supabase.table('hustle_stats').insert(data).execute()
            
            if insert_result.data:
                print(f"Successfully loaded {len(insert_result.data)} hustle stats records")
                return True
            else:
                print("Failed to load hustle stats data")
                return False
                
        except Exception as e:
            print(f"Error loading data to Supabase: {e}")
            return False
    
    def run(self, season: str = "2024-25", season_type: str = "Regular Season"):
        """
        Main method to fetch and load hustle stats
        
        Args:
            season: NBA season
            season_type: Season type
        """
        print("Starting Hustle Stats Fetcher...")
        print(f"Season: {season}")
        print(f"Season Type: {season_type}")
        print("-" * 50)
        
        # Fetch PerGame stats
        per_game_data = self.fetch_hustle_stats(season, season_type)
        if per_game_data:
            transformed_per_game = self.transform_hustle_data(per_game_data, "PerGame")
            self.load_to_supabase(transformed_per_game)
        
        # Add a small delay between requests
        time.sleep(2)
        
        # Fetch Totals stats
        totals_data = self.fetch_hustle_stats_totals(season, season_type)
        if totals_data:
            transformed_totals = self.transform_hustle_data(totals_data, "Totals")
            self.load_to_supabase(transformed_totals)
        
        print("-" * 50)
        print("Hustle Stats Fetcher completed!")

def main():
    """Main function"""
    # Set up environment variables (you may need to adjust these)
    if not os.getenv('SUPABASE_URL'):
        print("Please set SUPABASE_URL environment variable")
        sys.exit(1)
    
    if not os.getenv('SUPABASE_ANON_KEY'):
        print("Please set SUPABASE_ANON_KEY environment variable")
        sys.exit(1)
    
    # Create fetcher and run
    fetcher = HustleStatsFetcher()
    fetcher.run()

if __name__ == "__main__":
    main()

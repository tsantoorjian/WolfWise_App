from nba_api.stats.endpoints import leaguedashplayerstats
import pandas as pd
import os
from typing import List, Dict
import time
import random
import logging
from dotenv import load_dotenv
from src._python_scripts.utils import (
    api_call_with_retry, 
    get_player_stats as utils_get_player_stats,
    load_to_supabase as utils_load_to_supabase
)

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def get_player_stats() -> pd.DataFrame:
    """Fetch player stats from NBA API"""
    logger.info("Initiating NBA stats retrieval...")
    
    # Get basic player stats (per game)
    logger.info("Fetching per game stats from NBA API...")
    basic_stats_per_game = api_call_with_retry(
        lambda: leaguedashplayerstats.LeagueDashPlayerStats(
            per_mode_detailed='PerGame',
            measure_type_detailed_defense='Base',
            season='2024-25'
        ).get_data_frames()[0]
    )
    
    # Get basic player stats (totals for minutes)
    logger.info("Fetching total minutes from NBA API...")
    basic_stats_totals = api_call_with_retry(
        lambda: leaguedashplayerstats.LeagueDashPlayerStats(
            per_mode_detailed='Totals',
            measure_type_detailed_defense='Base',
            season='2024-25'
        ).get_data_frames()[0]
    )
    
    # Convert minutes to integers
    basic_stats_totals['MIN'] = basic_stats_totals['MIN'].round().astype(int)
    
    # Get advanced stats for EFG%
    logger.info("Fetching advanced stats from NBA API...")
    advanced_stats = api_call_with_retry(
        lambda: leaguedashplayerstats.LeagueDashPlayerStats(
            per_mode_detailed='PerGame',
            measure_type_detailed_defense='Advanced',
            season='2024-25'
        ).get_data_frames()[0]
    )
    
    logger.info(f"Successfully retrieved data for {len(basic_stats_per_game)} players")

    # Select and rename relevant columns
    stats_mapping = {
        'FG3_PCT': '3pt percentage',
        'FG_PCT': 'Fg %', 
        'STL': 'Steals per game',
        'AST': 'Assists per game',
        'TOV': 'Turnovers per game',
        'BLK': 'Blocks per game',
        'PTS': 'Points Per Game'
    }

    # Create list to store transformed data
    transformed_data = []
    total_stats = len(stats_mapping) + 1  # +1 for EFG%

    # Transform basic stats
    for idx, (original_col, new_name) in enumerate(stats_mapping.items(), 1):
        logger.info(f"Processing stat {idx}/{total_stats}: {new_name} (from {original_col})")
        
        # Merge per game stats with total minutes
        stat_data = basic_stats_per_game[['PLAYER_ID', 'PLAYER_NAME', 'TEAM_ABBREVIATION', original_col]].merge(
            basic_stats_totals[['PLAYER_ID', 'MIN']],
            on='PLAYER_ID',
            how='left'
        )
        
        stat_records = stat_data.rename(columns={
            'PLAYER_ID': 'player_id',
            'PLAYER_NAME': 'player_name',
            'TEAM_ABBREVIATION': 'team_abbreviation',
            'MIN': 'minutes_played',
            original_col: 'value'
        })
        stat_records['stat'] = new_name
        transformed_data.extend(stat_records.to_dict('records'))
        
        # Log some sample values for verification
        sample_players = stat_data.nlargest(3, original_col)
        logger.info(f"Top 3 players for {new_name}:")
        for _, player in sample_players.iterrows():
            logger.info(f"  {player['PLAYER_NAME']}: {player[original_col]:.3f} (Total MIN: {player['MIN']})")
        
        # Add small delay between processing different stats
        if idx < total_stats:
            delay = random.uniform(0.5, 1)
            logger.info(f"Waiting {delay:.1f} seconds before processing next stat...")
            time.sleep(delay)

    # Add EFG% from advanced stats
    logger.info(f"Processing stat {total_stats}/{total_stats}: EFG %")
    
    # Merge with total minutes
    efg_data = advanced_stats[['PLAYER_ID', 'PLAYER_NAME', 'TEAM_ABBREVIATION', 'EFG_PCT']].merge(
        basic_stats_totals[['PLAYER_ID', 'MIN']],
        on='PLAYER_ID',
        how='left'
    )
    
    efg_records = efg_data.rename(columns={
        'PLAYER_ID': 'player_id',
        'PLAYER_NAME': 'player_name',
        'TEAM_ABBREVIATION': 'team_abbreviation',
        'MIN': 'minutes_played',
        'EFG_PCT': 'value'
    })
    efg_records['stat'] = 'EFG %'
    transformed_data.extend(efg_records.to_dict('records'))
    
    # Log EFG% sample values
    sample_efg = efg_data.nlargest(3, 'EFG_PCT')
    logger.info(f"Top 3 players for EFG %:")
    for _, player in sample_efg.iterrows():
        logger.info(f"  {player['PLAYER_NAME']}: {player['EFG_PCT']:.3f} (Total MIN: {player['MIN']})")

    logger.info("Data transformation completed")
    return pd.DataFrame(transformed_data)

def load_to_supabase(df: pd.DataFrame) -> None:
    """Load data to Supabase"""
    logger.info("Loading data to Supabase...")
    utils_load_to_supabase(df, 'distribution_stats', on_conflict='player_id,stat')

def main():
    logger.info("Starting stat distribution data collection")
    try:
        # Get player stats
        df = get_player_stats()
        
        # Load to Supabase
        load_to_supabase(df)
        
        # Print summary
        logger.info("\nData collection summary:")
        for stat in df['stat'].unique():
            stat_count = len(df[df['stat'] == stat])
            logger.info(f"  {stat}: {stat_count} records")
        
        logger.info("Script completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
        raise

if __name__ == "__main__":
    main()

#!/usr/bin/env python
import datetime
import pandas as pd
import time
import re
from nba_api.stats.endpoints import leaguedashlineups
from supabase import create_client
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables and initialize Supabase client
load_dotenv()
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase environment variables")

supabase = create_client(supabase_url, supabase_key)

def get_current_season():
    """
    Returns the NBA season string (e.g., "2024-25") based on the current date.
    NBA seasons typically start in October.
    """
    now = datetime.datetime.now()
    if now.month >= 10:
        season_start = now.year
        season_end = now.year + 1
    else:
        season_start = now.year - 1
        season_end = now.year
    return f"{season_start}-{str(season_end)[-2:]}"

def fetch_advanced_lineup_data_paginated(lineup_size, season_str):
    all_data = []
    teams = [1610612750]  # Timberwolves team ID

    for team_id in teams:
        logger.info(f"Fetching {lineup_size}-man advanced lineup data for team {team_id}")
        lineup = leaguedashlineups.LeagueDashLineups(
            group_quantity=lineup_size,
            season=season_str,
            season_type_all_star='Regular Season',
            measure_type_detailed_defense='Advanced',
            team_id_nullable=team_id
        )

        df = lineup.get_data_frames()[0]
        if not df.empty:
            df['LINEUP_SIZE'] = lineup_size
            df['season'] = season_str
            all_data.append(df)

        time.sleep(1)  # Avoid rate-limiting

    return pd.concat(all_data, ignore_index=True) if all_data else None

def split_players(group_name):
    """
    Splits a string containing player names using " - " as the delimiter.
    This ensures that names like "Nickeil Alexander-Walker" remain intact.
    """
    return re.split(r'\s+-\s+', group_name)

def main():
    season_str = get_current_season()
    lineup_sizes = [2, 3, 5]
    all_lineups = []

    # Fetch advanced data for each lineup size
    for size in lineup_sizes:
        try:
            df = fetch_advanced_lineup_data_paginated(size, season_str)
            if df is None:
                continue

            logger.info(f"Fetched {size}-man advanced lineup data")
            all_lineups.append(df)
            time.sleep(1)  # Pause briefly between requests
        except Exception as e:
            logger.error(f"Error fetching {size}-man advanced lineup data: {e}")

    # Process and upload all advanced lineup data
    if all_lineups:
        combined_df = pd.concat(all_lineups, ignore_index=True)

        # Check for the group_name column (if it's uppercase, rename it for consistency)
        if 'group_name' not in combined_df.columns and 'GROUP_NAME' in combined_df.columns:
            combined_df.rename(columns={'GROUP_NAME': 'group_name'}, inplace=True)

        if 'group_name' in combined_df.columns:
            # Create a temporary column with the split list of player names
            combined_df['players_list'] = combined_df['group_name'].apply(split_players)

            # Create player1 to player5 columns
            for i in range(5):
                combined_df[f'player{i + 1}'] = combined_df['players_list'].apply(
                    lambda players: players[i] if len(players) > i else None
                )
            combined_df.drop(columns=['players_list'], inplace=True)

            # Convert all column names to lowercase
            combined_df.columns = combined_df.columns.str.lower()

            # Drop columns that don't exist in the Supabase table
            columns_to_keep = [
                'group_id', 'group_name', 'team_id', 'team_abbreviation', 'gp', 'w', 'l', 'w_pct',
                'min', 'e_off_rating', 'off_rating', 'e_def_rating', 'def_rating', 'e_net_rating',
                'net_rating', 'ast_pct', 'ast_to', 'ast_ratio', 'oreb_pct', 'dreb_pct', 'reb_pct',
                'tm_tov_pct', 'efg_pct', 'ts_pct', 'e_pace', 'pace', 'pace_per40', 'poss', 'pie',
                'gp_rank', 'w_rank', 'l_rank', 'w_pct_rank', 'min_rank', 'off_rating_rank',
                'def_rating_rank', 'net_rating_rank', 'ast_pct_rank', 'ast_to_rank', 'ast_ratio_rank',
                'oreb_pct_rank', 'dreb_pct_rank', 'reb_pct_rank', 'tm_tov_pct_rank', 'efg_pct_rank',
                'ts_pct_rank', 'pace_rank', 'pie_rank', 'lineup_size', 'player1', 'player2', 'player3',
                'player4', 'player5', 'season'
            ]
            combined_df = combined_df[columns_to_keep]

            # Convert float columns to integers where needed
            integer_columns = [
                'team_id', 'gp', 'w', 'l', 'min', 'poss', 'gp_rank', 'w_rank', 'l_rank',
                'w_pct_rank', 'min_rank', 'off_rating_rank', 'def_rating_rank', 'net_rating_rank',
                'ast_pct_rank', 'ast_to_rank', 'ast_ratio_rank', 'oreb_pct_rank', 'dreb_pct_rank',
                'reb_pct_rank', 'tm_tov_pct_rank', 'efg_pct_rank', 'ts_pct_rank', 'pace_rank',
                'pie_rank', 'lineup_size'
            ]
            for col in integer_columns:
                if col in combined_df.columns:
                    combined_df[col] = combined_df[col].astype(float).astype(int)
        else:
            logger.warning("Column 'group_name' not found in the combined dataframe. Skipping player splitting.")

        try:
            # Convert DataFrame to records for Supabase
            records = combined_df.to_dict('records')

            # Delete existing records for the current season
            logger.info(f"Deleting existing records for season {season_str}...")
            supabase.table('lineups_advanced').delete().eq('season', season_str).execute()

            # Insert new records
            logger.info("Uploading advanced lineup data to Supabase...")
            result = supabase.table('lineups_advanced').insert(records).execute()
            logger.info(f"Successfully uploaded {len(records)} advanced lineup records to Supabase")

        except Exception as e:
            logger.error(f"Error uploading to Supabase: {e}")
    else:
        logger.warning("No advanced lineup data found to process")

if __name__ == '__main__':
    main() 
#!/usr/bin/env python
import datetime
import pandas as pd
import time
import re
import os
import logging
from dotenv import load_dotenv
from src._python_scripts.utils import (
    get_supabase_client,
    load_to_supabase,
    get_current_season,
    get_lineup_stats,
    api_call_with_retry
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables and initialize Supabase client
load_dotenv()
supabase = get_supabase_client()

def fetch_advanced_lineup_data_paginated(lineup_size, season_str):
    """Fetch advanced lineup data for the specified lineup size."""
    team_id = 1610612750  # Timberwolves team ID
    logger.info(f"Fetching {lineup_size}-man advanced lineup data for team {team_id}")
    
    # Use the utility function to get lineup stats
    df = get_lineup_stats(
        lineup_size=lineup_size,
        season=season_str,
        team_id=team_id,
        measure_type='Advanced'
    )
    
    if df is not None and not df.empty:
        # Lineup size already added by get_lineup_stats
        return df
    
    return None

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

        # --- Ensure all group_ids exist in lineups before uploading to lineups_advanced ---
        # 1. Fetch all group_ids for the current season from lineups
        existing_group_ids = set(
            r['group_id'] for r in supabase.table('lineups').select('group_id').eq('season', season_str).execute().data
        )
        # 2. Find which group_ids in combined_df are missing from lineups
        advanced_group_ids = set(combined_df['group_id'].unique())
        missing_group_ids = advanced_group_ids - existing_group_ids
        if missing_group_ids:
            logger.info(f"Inserting {len(missing_group_ids)} missing group_ids into lineups...")
            # 3. Insert minimal records for missing group_ids
            # Get columns for lineups table
            lineups_columns = [
                'group_id', 'group_name', 'team_id', 'team_abbreviation', 'gp', 'w', 'l', 'w_pct',
                'min', 'fgm', 'fga', 'fg_pct', 'fg3m', 'fg3a', 'fg3_pct', 'ftm', 'fta', 'ft_pct',
                'oreb', 'dreb', 'reb', 'ast', 'tov', 'stl', 'blk', 'blka', 'pf', 'pfd', 'pts',
                'plus_minus', 'gp_rank', 'w_rank', 'l_rank', 'w_pct_rank', 'min_rank', 'fgm_rank',
                'fga_rank', 'fg_pct_rank', 'fg3m_rank', 'fg3a_rank', 'fg3_pct_rank', 'ftm_rank',
                'fta_rank', 'ft_pct_rank', 'oreb_rank', 'dreb_rank', 'reb_rank', 'ast_rank',
                'tov_rank', 'stl_rank', 'blk_rank', 'blka_rank', 'pf_rank', 'pfd_rank', 'pts_rank',
                'plus_minus_rank', 'lineup_size', 'player1', 'player2', 'player3', 'player4', 'player5', 'season'
            ]
            # Only keep columns that exist in combined_df
            available_cols = [col for col in lineups_columns if col in combined_df.columns]
            # Build records for missing group_ids
            missing_records = combined_df[combined_df['group_id'].isin(missing_group_ids)][available_cols].to_dict('records')
            # Insert into lineups
            if missing_records:
                supabase.table('lineups').insert(missing_records).execute()
        # --- End ensure group_ids in lineups ---

        try:
            # Delete existing records for the current season
            logger.info(f"Deleting existing records for season {season_str}...")
            supabase.table('lineups_advanced').delete().eq('season', season_str).execute()

            # Insert new records using utility function
            logger.info("Uploading advanced lineup data to Supabase...")
            load_to_supabase(combined_df, 'lineups_advanced')
            logger.info(f"Successfully uploaded {len(combined_df)} advanced lineup records to Supabase")

        except Exception as e:
            logger.error(f"Error uploading to Supabase: {e}")
    else:
        logger.warning("No advanced lineup data found to process")

if __name__ == '__main__':
    main() 
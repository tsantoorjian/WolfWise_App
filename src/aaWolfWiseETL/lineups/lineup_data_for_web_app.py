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


def fetch_lineup_data_paginated(lineup_size, season_str):
    all_data = []
    teams = [1610612750]  # You should include all 30 teams

    for team_id in teams:
        print(f"Fetching {lineup_size}-man lineup data for team {team_id}")
        lineup = leaguedashlineups.LeagueDashLineups(
            group_quantity=lineup_size,
            season=season_str,
            season_type_all_star='Regular Season',
            #measure_type_detailed_defense='Advanced',
            team_id_nullable=team_id
        )

        df = lineup.get_data_frames()[0]
        if not df.empty:
            df['LINEUP_SIZE'] = lineup_size  # Add the column here
            all_data.append(df)

        time.sleep(1)  # Avoid rate-limiting

    return pd.concat(all_data, ignore_index=True) if all_data else None



def split_players(group_name):
    """
    Splits a string containing player names using " - " as the delimiter.
    This ensures that names like "Nickeil Alexander-Walker" remain intact.

    :param group_name: str, the original string from the group_name column.
    :return: list of player names.
    """
    return re.split(r'\s+-\s+', group_name)


def main():
    season_str = get_current_season()
    lineup_sizes = [2, 3, 5]
    all_lineups = []

    # Fetch data for each lineup size
    for size in lineup_sizes:
        try:
            df = fetch_lineup_data_paginated(size, season_str)
            if df is None:
                continue

            logger.info(f"Fetched {size}-man lineup data")
            all_lineups.append(df)
            time.sleep(1)  # Pause briefly between requests
        except Exception as e:
            logger.error(f"Error fetching {size}-man lineup data: {e}")

    # Process and upload all lineup data
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

            # Add season column
            combined_df['season'] = season_str

            # Convert all column names to lowercase
            combined_df.columns = combined_df.columns.str.lower()

            # Drop columns that don't exist in the Supabase table
            columns_to_keep = [
                'group_id', 'group_name', 'team_id', 'team_abbreviation', 'gp', 'w', 'l', 'w_pct',
                'min', 'fgm', 'fga', 'fg_pct', 'fg3m', 'fg3a', 'fg3_pct', 'ftm', 'fta', 'ft_pct',
                'oreb', 'dreb', 'reb', 'ast', 'tov', 'stl', 'blk', 'blka', 'pf', 'pfd', 'pts',
                'plus_minus', 'gp_rank', 'w_rank', 'l_rank', 'w_pct_rank', 'min_rank', 'fgm_rank',
                'fga_rank', 'fg_pct_rank', 'fg3m_rank', 'fg3a_rank', 'fg3_pct_rank', 'ftm_rank',
                'fta_rank', 'ft_pct_rank', 'oreb_rank', 'dreb_rank', 'reb_rank', 'ast_rank',
                'tov_rank', 'stl_rank', 'blk_rank', 'blka_rank', 'pf_rank', 'pfd_rank', 'pts_rank',
                'plus_minus_rank', 'lineup_size', 'player1', 'player2', 'player3', 'player4', 'player5',
                'season'
            ]
            combined_df = combined_df[columns_to_keep]

            # Convert float columns to integers where needed
            integer_columns = [
                'team_id', 'gp', 'w', 'l', 'fgm', 'fga', 'fg3m', 'fg3a', 'ftm', 'fta',
                'oreb', 'dreb', 'reb', 'ast', 'tov', 'stl', 'blk', 'blka', 'pf', 'pfd', 'pts',
                'plus_minus', 'gp_rank', 'w_rank', 'l_rank', 'w_pct_rank', 'min_rank', 'fgm_rank',
                'fga_rank', 'fg_pct_rank', 'fg3m_rank', 'fg3a_rank', 'fg3_pct_rank', 'ftm_rank',
                'fta_rank', 'ft_pct_rank', 'oreb_rank', 'dreb_rank', 'reb_rank', 'ast_rank',
                'tov_rank', 'stl_rank', 'blk_rank', 'blka_rank', 'pf_rank', 'pfd_rank', 'pts_rank',
                'plus_minus_rank', 'lineup_size'
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
            supabase.table('lineups').delete().eq('season', season_str).execute()

            # Insert new records
            logger.info("Uploading lineup data to Supabase...")
            result = supabase.table('lineups').insert(records).execute()
            logger.info(f"Successfully uploaded {len(records)} lineup records to Supabase")

        except Exception as e:
            logger.error(f"Error uploading to Supabase: {e}")
    else:
        logger.warning("No lineup data found to process")


if __name__ == '__main__':
    main()

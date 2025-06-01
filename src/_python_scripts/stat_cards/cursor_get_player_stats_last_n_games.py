from nba_api.stats.endpoints import leaguedashplayerstats, teamgamelogs
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from src._python_scripts.utils import get_supabase_client, load_to_supabase

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = get_supabase_client()

def get_timberwolves_stats(last_n_games=0):
    """
    Get stats for Timberwolves players
    last_n_games: 0 for full season, or specify number of recent games
    """
    stats = leaguedashplayerstats.LeagueDashPlayerStats(
        team_id_nullable=1610612750,  # Timberwolves team ID
        last_n_games=last_n_games,
        season='2024-25',
        season_type_all_star='Regular Season',
        per_mode_detailed='PerGame'
    )

    df = stats.get_data_frames()[0]

    columns = ['PLAYER_ID', 'PLAYER_NAME', 'GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK',
               'FG_PCT', 'FG3_PCT', 'FT_PCT', 'PLUS_MINUS']

    df = df[columns].sort_values('MIN', ascending=False)

    # Add GAMES_REMAINING only for full season stats
    if last_n_games == 0:
        # Get team game logs to count total team games played
        team_games = teamgamelogs.TeamGameLogs(
            team_id_nullable=1610612750,  # Timberwolves team ID
            season_nullable='2024-25',
            season_type_nullable='Regular Season'
        ).get_data_frames()[0]
        
        games_played = len(team_games)
        df['GAMES_REMAINING'] = 82 - games_played

    # Format percentages as strings with % symbol
    for col in ['FG_PCT', 'FG3_PCT', 'FT_PCT']:
        df[col] = df[col].apply(lambda x: f"{x:.1%}" if pd.notnull(x) else "N/A")

    # Add timestamp
    df['TIMESTAMP'] = datetime.now().isoformat()
    df['TIMEFRAME'] = f"Last {last_n_games} games" if last_n_games > 0 else "Full Season"

    # Ensure PLAYER_ID is treated as string to prevent scientific notation in CSV
    df['PLAYER_ID'] = df['PLAYER_ID'].astype(str)

    return df

def save_to_supabase():
    timeframes = [
        (0, "season", "timberwolves_player_stats_season"),
        (5, "last_5", "timberwolves_player_stats_last_5"),
        (10, "last_10", "timberwolves_player_stats_last_10")
    ]

    for games, timeframe, table_name in timeframes:
        try:
            # Get stats
            stats_df = get_timberwolves_stats(games)
            
            # Convert PLAYER_ID to integer (bigint in Supabase)
            stats_df['PLAYER_ID'] = stats_df['PLAYER_ID'].astype(int)
            
            # Delete existing records with a WHERE clause that matches all records
            supabase.table(table_name).delete().neq('PLAYER_ID', 0).execute()
            
            # Use utility to insert new records
            load_to_supabase(stats_df, table_name)
            print(f"Successfully saved stats to {table_name}")
            
            # Print preview of the data
            print(f"\nPreview of {timeframe} data:")
            print(stats_df[['PLAYER_ID', 'PLAYER_NAME', 'PTS', 'REB', 'AST']].head())
            print("\n")

        except Exception as e:
            print(f"Error saving {timeframe} stats to {table_name}: {str(e)}")

if __name__ == "__main__":
    save_to_supabase()
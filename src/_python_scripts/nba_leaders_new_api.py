from nba_api.stats.endpoints import leaguedashplayerstats
import pandas as pd
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from src._python_scripts.utils.supabase_utils import load_to_supabase, execute_sql

def rank_players(df, columns):
    for col in columns:
        if col in df.columns:
            df[f"{col}_RANK"] = df[col].rank(method='min', ascending=False)
    return df

def get_sql_type(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return 'bigint'
    elif pd.api.types.is_float_dtype(dtype):
        return 'numeric'
    elif pd.api.types.is_bool_dtype(dtype):
        return 'boolean'
    else:
        return 'text'

def create_table_sql(table_name, df):
    cols = []
    for col in df.columns:
        sql_type = get_sql_type(df[col].dtype)
        # Use quoted identifiers for column names
        cols.append(f'"{col}" {sql_type}')
    cols_sql = ', '.join(cols)
    return f'DROP TABLE IF EXISTS {table_name}; CREATE TABLE {table_name} ({cols_sql});'

def main():
    # Rank columns for different measure types
    rank_columns_advanced = [
        "GP", "W", "L", "W_PCT", "MIN", "E_OFF_RATING", "OFF_RATING", "E_DEF_RATING",
        "DEF_RATING", "E_NET_RATING", "NET_RATING", "AST_PCT", "AST_TO", "AST_RATIO",
        "OREB_PCT", "DREB_PCT", "REB_PCT", "TM_TOV_PCT", "E_TOV_PCT", "EFG_PCT",
        "TS_PCT", "USG_PCT", "E_USG_PCT", "E_PACE", "PACE", "PIE"
    ]
    rank_columns_base = [
        "FGM", "FGA", "FG_PCT", "FG3M", "FG3A", "FG3_PCT", "FTM", "FTA", "FT_PCT",
        "OREB", "DREB", "REB", "AST", "TOV", "STL", "BLK", "BLKA", "PF", "PFD",
        "PTS", "PLUS_MINUS", "NBA_FANTASY_PTS", "DD2", "TD3"
    ]
    configs = [
        ("last_5_base", "Base", rank_columns_base, 5),
        ("last_10_base", "Base", rank_columns_base, 10),
        ("full_season_base", "Base", rank_columns_base, None),
        ("last_5_advanced", "Advanced", rank_columns_advanced, 5),
        ("last_10_advanced", "Advanced", rank_columns_advanced, 10),
        ("full_season_advanced", "Advanced", rank_columns_advanced, None),
    ]
    for table_name, measure_type, rank_cols, last_n in configs:
        print(f"Processing {table_name}")
        stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season='2024-25',
            measure_type_detailed_defense=measure_type,
            per_mode_detailed='Totals',
            season_type_all_star='Regular Season',
            last_n_games=last_n if last_n is not None else 0
        )
        df = stats.get_data_frames()[0]
        df = rank_players(df, rank_cols)
        # Drop and recreate table
        ddl = create_table_sql(table_name, df)
        print(f"Creating table {table_name} in Supabase...")
        execute_sql(ddl)
        print(f"Uploading data to {table_name}...")
        load_to_supabase(df, table_name)
        print(f"Done: {table_name}")
    print("All tables created and data loaded to Supabase.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Script to fetch Anthony Edwards' career stats and bio data from NBA API
and load it into Supabase for the AgeTracker component.
"""

import json
from datetime import datetime, date
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats
import time
import random

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_player_info(player_id: int):
    """Fetch player bio information using nba_api package"""
    try:
        # Add a small delay to avoid rate limiting
        time.sleep(random.uniform(1, 2))
        
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        return player_info.get_data_frames()
    except Exception as e:
        print(f"Error fetching player info: {e}")
        return None

def fetch_player_career_stats(player_id: int):
    """Fetch player career stats using nba_api package"""
    try:
        # Add a small delay to avoid rate limiting
        time.sleep(random.uniform(1, 2))
        
        career_stats = playercareerstats.PlayerCareerStats(player_id=player_id)
        return career_stats.get_data_frames()
    except Exception as e:
        print(f"Error fetching career stats: {e}")
        return None

def calculate_age_and_games_remaining(birthdate_str: str):
    """Calculate current age and games remaining until 25th birthday"""
    # Parse birthdate - handle both date and datetime formats
    if 'T' in birthdate_str:
        birthdate = datetime.strptime(birthdate_str.split('T')[0], '%Y-%m-%d').date()
    else:
        birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
    
    today = date.today()
    
    # Calculate current age
    age = today.year - birthdate.year
    if (today.month, today.day) < (birthdate.month, birthdate.day):
        age -= 1
    
    # Calculate days until 25th birthday
    next_birthday = date(birthdate.year + 25, birthdate.month, birthdate.day)
    if today > next_birthday:
        # Already past 25th birthday
        days_until_25 = 0
    else:
        days_until_25 = (next_birthday - today).days
    
    # Calculate games remaining more accurately
    # Anthony Edwards turns 25 on August 5, 2026
    # He has the rest of 2024-25 season + full 2025-26 season
    # Assuming roughly 82 games per season and we're about 1/4 through 2024-25
    if days_until_25 > 365:  # More than a year left
        games_remaining = 82 + 62  # Full next season + remaining current season (144 total)
    else:
        # For less than a year, calculate more precisely
        # If he has more than 6 months left, give him most of a season
        if days_until_25 > 180:
            games_remaining = 82  # Full season
        else:
            games_remaining = max(0, int(days_until_25 / 365 * 82))
    
    
    return age, games_remaining, birthdate_str.split('T')[0] if 'T' in birthdate_str else birthdate_str

def create_player_career_data_table(supabase: Client):
    """Create the player_career_data table if it doesn't exist"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS player_career_data (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        birthdate DATE NOT NULL,
        current_age INTEGER NOT NULL,
        games_remaining_until_25 INTEGER NOT NULL,
        career_points INTEGER NOT NULL,
        career_games_played INTEGER NOT NULL,
        points_per_game NUMERIC NOT NULL,
        career_assists INTEGER NOT NULL,
        career_rebounds INTEGER NOT NULL,
        career_steals INTEGER NOT NULL,
        career_blocks INTEGER NOT NULL,
        career_3pt_made INTEGER NOT NULL,
        career_fg_made INTEGER NOT NULL,
        career_ft_made INTEGER NOT NULL,
        career_minutes INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    try:
        supabase.rpc('exec_sql', {'sql': create_table_sql})
        print("✅ player_career_data table created successfully")
    except Exception as e:
        print(f"❌ Error creating table: {e}")

def main():
    """Main function to fetch and load Anthony Edwards data"""
    # Anthony Edwards' player ID
    anthony_edwards_id = 1630162
    
    print("🏀 Fetching Anthony Edwards data...")
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    
    # Create table if it doesn't exist
    create_player_career_data_table(supabase)
    
    # Fetch player info
    print("📋 Fetching player bio information...")
    player_info_dfs = fetch_player_info(anthony_edwards_id)
    
    if not player_info_dfs or len(player_info_dfs) == 0:
        print("❌ Failed to fetch player info")
        return
    
    # Extract bio data from the first dataframe (CommonPlayerInfo)
    common_player_info_df = player_info_dfs[0]
    if common_player_info_df.empty:
        print("❌ No player info data found")
        return
    
    # Get the first row of data
    player_info_row = common_player_info_df.iloc[0]
    birthdate_str = player_info_row['BIRTHDATE']
    
    # Calculate age and games remaining
    current_age, games_remaining, birthdate = calculate_age_and_games_remaining(birthdate_str)
    
    print(f"📅 Birthdate: {birthdate}")
    print(f"🎂 Current Age: {current_age}")
    print(f"🎮 Games remaining until 25: {games_remaining}")
    
    # Fetch career stats
    print("📊 Fetching career statistics...")
    career_stats_dfs = fetch_player_career_stats(anthony_edwards_id)
    
    if not career_stats_dfs or len(career_stats_dfs) == 0:
        print("❌ Failed to fetch career stats")
        return
    
    # Extract regular season career totals (index 1 is CareerTotalsRegularSeason)
    career_totals_df = career_stats_dfs[1]
    if career_totals_df.empty:
        print("❌ No career stats data found")
        return
    
    # Get the first row of career totals
    career_row = career_totals_df.iloc[0]
    
    # Get most recent season stats (index 0 is SeasonTotalsRegularSeason)
    season_totals_df = career_stats_dfs[0]
    if not season_totals_df.empty:
        # Get the most recent season (last row)
        most_recent_season = season_totals_df.iloc[-1]
        season_games = int(most_recent_season['GP'])
        
        # Calculate all per-game stats from most recent season
        season_points = int(most_recent_season['PTS'])
        season_assists = int(most_recent_season['AST'])
        season_rebounds = int(most_recent_season['REB'])
        season_steals = int(most_recent_season['STL'])
        season_blocks = int(most_recent_season['BLK'])
        season_3pt_made = int(most_recent_season['FG3M'])
        season_fg_made = int(most_recent_season['FGM'])
        season_ft_made = int(most_recent_season['FTM'])
        season_minutes = int(most_recent_season['MIN'])
        
        # Calculate per-game averages
        points_per_game = season_points / season_games if season_games > 0 else 0
        assists_per_game = season_assists / season_games if season_games > 0 else 0
        rebounds_per_game = season_rebounds / season_games if season_games > 0 else 0
        steals_per_game = season_steals / season_games if season_games > 0 else 0
        blocks_per_game = season_blocks / season_games if season_games > 0 else 0
        fg3m_per_game = season_3pt_made / season_games if season_games > 0 else 0
        fgm_per_game = season_fg_made / season_games if season_games > 0 else 0
        ftm_per_game = season_ft_made / season_games if season_games > 0 else 0
        minutes_per_game = season_minutes / season_games if season_games > 0 else 0
        
        print(f"🏀 Most Recent Season Stats (2024-25):")
        print(f"   Games: {season_games}")
        print(f"   Points: {season_points:,} ({points_per_game:.2f} PPG)")
        print(f"   Assists: {season_assists:,} ({assists_per_game:.2f} APG)")
        print(f"   Rebounds: {season_rebounds:,} ({rebounds_per_game:.2f} RPG)")
        print(f"   Steals: {season_steals:,} ({steals_per_game:.2f} SPG)")
        print(f"   Blocks: {season_blocks:,} ({blocks_per_game:.2f} BPG)")
        print(f"   3-Pointers: {season_3pt_made:,} ({fg3m_per_game:.2f} 3PG)")
        print(f"   Field Goals: {season_fg_made:,} ({fgm_per_game:.2f} FGM/G)")
        print(f"   Free Throws: {season_ft_made:,} ({ftm_per_game:.2f} FTM/G)")
        print(f"   Minutes: {season_minutes:,} ({minutes_per_game:.2f} MPG)")
    else:
        # Fallback to career average if season data not available
        career_points = int(career_row['PTS'])
        career_games = int(career_row['GP'])
        points_per_game = career_points / career_games if career_games > 0 else 0
        assists_per_game = int(career_row['AST']) / career_games if career_games > 0 else 0
        rebounds_per_game = int(career_row['REB']) / career_games if career_games > 0 else 0
        steals_per_game = int(career_row['STL']) / career_games if career_games > 0 else 0
        blocks_per_game = int(career_row['BLK']) / career_games if career_games > 0 else 0
        fg3m_per_game = int(career_row['FG3M']) / career_games if career_games > 0 else 0
        fgm_per_game = int(career_row['FGM']) / career_games if career_games > 0 else 0
        ftm_per_game = int(career_row['FTM']) / career_games if career_games > 0 else 0
        minutes_per_game = int(career_row['MIN']) / career_games if career_games > 0 else 0
        print(f"⚠️ Using career averages as fallback")
    
    # Still get career totals for other stats
    career_points = int(career_row['PTS'])
    career_games = int(career_row['GP'])
    
    print(f"🏀 Career Points: {career_points:,}")
    print(f"🎮 Career Games: {career_games}")
    print(f"📈 Points per Game: {points_per_game:.2f}")
    
    # Prepare data for insertion
    player_data = {
        'player_id': anthony_edwards_id,
        'player_name': 'Anthony Edwards',
        'birthdate': birthdate,
        'current_age': current_age,
        'games_remaining_until_25': games_remaining,
        'career_points': career_points,
        'career_games_played': career_games,
        'points_per_game': points_per_game,
        'assists_per_game': assists_per_game,
        'rebounds_per_game': rebounds_per_game,
        'steals_per_game': steals_per_game,
        'blocks_per_game': blocks_per_game,
        'fg3m_per_game': fg3m_per_game,
        'fgm_per_game': fgm_per_game,
        'ftm_per_game': ftm_per_game,
        'minutes_per_game': minutes_per_game,
        'career_assists': int(career_row['AST']),
        'career_rebounds': int(career_row['REB']),
        'career_steals': int(career_row['STL']),
        'career_blocks': int(career_row['BLK']),
        'career_3pt_made': int(career_row['FG3M']),
        'career_fg_made': int(career_row['FGM']),
        'career_ft_made': int(career_row['FTM']),
        'career_minutes': int(career_row['MIN'])
    }
    
    # Insert or update data in Supabase
    try:
        # Check if player already exists
        existing = supabase.table('player_career_data').select('*').eq('player_id', anthony_edwards_id).execute()
        
        if existing.data:
            # Update existing record
            result = supabase.table('player_career_data').update(player_data).eq('player_id', anthony_edwards_id).execute()
            print("✅ Updated Anthony Edwards data in Supabase")
        else:
            # Insert new record
            result = supabase.table('player_career_data').insert(player_data).execute()
            print("✅ Inserted Anthony Edwards data into Supabase")
        
        print(f"📊 Data: {json.dumps(player_data, indent=2, default=str)}")
        
    except Exception as e:
        print(f"❌ Error inserting data: {e}")

if __name__ == "__main__":
    main()

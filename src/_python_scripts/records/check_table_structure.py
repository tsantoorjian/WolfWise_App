#!/usr/bin/env python3
"""
Script to check the actual table structure and column names
"""

import sys
import os

# Add the parent directory to the path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import get_supabase_client

def check_table_structure():
    """Check the structure of relevant tables"""
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        print("✅ Successfully connected to Supabase")
        
        # Check twolves_player_game_logs table
        print("\n🔍 Checking twolves_player_game_logs table structure...")
        try:
            # Get a sample record to see column names
            result = supabase.table('twolves_player_game_logs').select('*').limit(1).execute()
            if result.data:
                sample = result.data[0]
                print("📋 Sample record columns:")
                for key in sample.keys():
                    print(f"  - {key}")
                
                # Check specific columns we need
                required_columns = ['GAME_DATE', 'PLAYER_NAME', 'PTS', 'AST', 'REB', 'STL', 'BLK', 'TOV', 'FGM', 'FGA', 'FG3M', 'FG3A', 'FTM', 'FTA', 'PF']
                missing_columns = []
                for col in required_columns:
                    if col not in sample.keys():
                        missing_columns.append(col)
                
                if missing_columns:
                    print(f"\n❌ Missing required columns: {missing_columns}")
                else:
                    print(f"\n✅ All required columns found!")
                    
            else:
                print("⚠️  No data found in twolves_player_game_logs table")
                
        except Exception as e:
            print(f"❌ Error checking twolves_player_game_logs: {e}")
        
        # Check timberwolves_player_stats_season table
        print("\n🔍 Checking timberwolves_player_stats_season table structure...")
        try:
            result = supabase.table('timberwolves_player_stats_season').select('*').limit(1).execute()
            if result.data:
                sample = result.data[0]
                print("📋 Sample record columns:")
                for key in sample.keys():
                    print(f"  - {key}")
                
                # Check specific columns we need
                required_columns = ['PLAYER_NAME', 'GP']
                missing_columns = []
                for col in required_columns:
                    if col not in sample.keys():
                        missing_columns.append(col)
                
                if missing_columns:
                    print(f"\n❌ Missing required columns: {missing_columns}")
                else:
                    print(f"\n✅ All required columns found!")
                    
            else:
                print("⚠️  No data found in timberwolves_player_stats_season table")
                
        except Exception as e:
            print(f"❌ Error checking timberwolves_player_stats_season: {e}")
        
        # Check record_tracker_season table
        print("\n🔍 Checking record_tracker_season table structure...")
        try:
            result = supabase.table('record_tracker_season').select('*').limit(1).execute()
            if result.data:
                sample = result.data[0]
                print("📋 Sample record columns:")
                for key in sample.keys():
                    print(f"  - {key}")
            else:
                print("⚠️  No data found in record_tracker_season table")
                
        except Exception as e:
            print(f"❌ Error checking record_tracker_season: {e}")
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    check_table_structure()

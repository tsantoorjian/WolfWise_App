#!/usr/bin/env python3
"""
Test script to verify the create_record_tracker_season function works
"""

import sys
import os

# Add the parent directory to the path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import get_supabase_client

def test_function():
    """Test the create_record_tracker_season function"""
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        print("✅ Successfully connected to Supabase")
        
        # Check if the function exists
        print("\n🔍 Checking if function exists...")
        try:
            # Try to call the function
            result = supabase.rpc('create_record_tracker_season').execute()
            print("✅ Function executed successfully!")
            
            # Check the results
            verify = supabase.table('record_tracker_season').select('*').execute()
            records = verify.data
            
            if records:
                print(f"✅ Function populated {len(records)} records")
                print(f"📊 Players found: {len(set(r['name'] for r in records))}")
                print(f"📈 Stats per player: {len(set(r['stat'] for r in records))}")
                
                # Show sample data
                print("\n📋 Sample records:")
                for i, record in enumerate(records[:3]):
                    print(f"  {i+1}. {record['name']} - {record['stat']}: {record['current']} (Projected: {record['projection']:.1f})")
            else:
                print("⚠️  Function ran but no records were created")
                
        except Exception as e:
            print(f"❌ Function execution failed: {e}")
            
            # Provide specific help based on error
            if 'column "game_date" does not exist' in str(e):
                print("\n🔧 Column name issue detected!")
                print("   The function is looking for lowercase column names, but your table uses uppercase.")
                print("   Run the SQL from: supabase/migrations/20250215194106_fixed_column_names.sql")
                print("   This fixes the column name casing issue.")
            elif 'DELETE requires a WHERE clause' in str(e):
                print("\n🔧 DELETE clause issue detected!")
                print("   Supabase requires DELETE operations to have WHERE clauses.")
                print("   Run the SQL from: supabase/migrations/20250215194105_simplified_record_tracker_function.sql")
            elif 'record "stat_record" is not assigned yet' in str(e):
                print("\n🔧 PL/pgSQL syntax issue detected!")
                print("   The FOREACH loop syntax is incorrect for this PostgreSQL version.")
                print("   Run the SQL from: supabase/migrations/20250215194107_corrected_function.sql")
                print("   This fixes the loop syntax and data type issues.")
            elif 'zero-length delimited identifier' in str(e):
                print("\n🔧 Quoted identifier issue detected!")
                print("   The function has problems with quoted column names in dynamic SQL.")
                print("   Run the SQL from: supabase/migrations/20250215194108_final_working_function.sql")
                print("   This is a simplified version that avoids dynamic SQL issues.")
            elif 'does not exist' in str(e):
                print("\n🔧 Function does not exist!")
                print("   You need to create the function in Supabase first.")
                print("   Run the SQL from: supabase/migrations/20250215194108_final_working_function.sql")
                print("   This is the final, working version.")
            else:
                print("\n🔧 Unknown error detected!")
                print("   Run the SQL from: supabase/migrations/20250215194108_final_working_function.sql")
                print("   This is the most recent and corrected version.")
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    test_function()

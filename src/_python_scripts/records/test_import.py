#!/usr/bin/env python3
"""
Test script to verify that imports work correctly from the records directory
"""

import sys
import os

# Add the parent directory to the path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils import get_supabase_client
    print("✅ Successfully imported get_supabase_client from utils")
    
    # Test the connection
    supabase = get_supabase_client()
    print("✅ Successfully created Supabase client")
    
    # Test a simple query
    result = supabase.table('record_tracker_season').select('count').limit(1).execute()
    print("✅ Successfully connected to Supabase database")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Script location: {os.path.abspath(__file__)}")
    print(f"Python path: {sys.path}")
except Exception as e:
    print(f"❌ Other error: {e}")

print("\nImport test completed!")

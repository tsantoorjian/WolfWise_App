from dotenv import load_dotenv
from src._python_scripts.utils import get_supabase_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = get_supabase_client()

def update_record_tracker():
    """Update record_tracker_season table using stored procedure"""
    try:
        # Call the stored procedure
        result = supabase.rpc('create_record_tracker_season').execute()
        print("Successfully called create_record_tracker_season procedure")
        
        # Verify the update
        verify = supabase.table('record_tracker_season').select('*').execute()
        records = verify.data
        print(f"Updated table now has {len(records)} records")
        
        # Print a sample record for verification
        if records:
            sample = records[0]
            print("\nSample record:")
            print(f"Player: {sample['name']}")
            print(f"Games Played: {sample['GP']}")
            print(f"Games Remaining: {sample['GAMES_REMAINING']}")
            print(f"Stat: {sample['stat']}")
            print(f"Current: {sample['current']}")
            print(f"Projection: {sample['projection']}")
        else:
            print("No records found after update")

    except Exception as e:
        print(f"Error updating record_tracker_season table: {str(e)}")
        print("\nPlease ensure the create_record_tracker_season function exists in your Supabase database.")
        print("You can create it using the SQL provided in the documentation.")

if __name__ == "__main__":
    update_record_tracker() 
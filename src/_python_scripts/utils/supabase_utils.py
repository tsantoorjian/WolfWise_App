import os
import logging
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Initialize and return a Supabase client.
    
    Returns:
        Supabase client instance
    
    Raises:
        ValueError: If required environment variables are missing
        Exception: If client creation fails
    """
    # Initialize Supabase client
    supabase_url = os.environ.get('SUPABASE_URL', 'https://kuthirbcjtofsdwsfhkj.supabase.co')
    supabase_key = os.environ.get('SUPABASE_KEY') or os.environ.get('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_key:
        error_msg = "Missing required environment variable: SUPABASE_KEY or VITE_SUPABASE_ANON_KEY"
        logger.error(error_msg)
        raise ValueError(error_msg)

    try:
        client = create_client(supabase_url, supabase_key)
        return client
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {str(e)}")
        raise

def load_to_supabase(df, table_name, on_conflict=None):
    """Load DataFrame data to Supabase.
    
    Args:
        df (pd.DataFrame): The DataFrame containing data to load
        table_name (str): The name of the target Supabase table
        on_conflict (str, optional): Column names to use for conflict resolution (upsert)
    
    Returns:
        bool: True if successful, False otherwise
    """
    if df.empty:
        logger.warning(f"No data to upload to Supabase table '{table_name}'.")
        return False

    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        logger.info(f"Preparing to load {len(records)} records to Supabase table '{table_name}'")

        # Clear existing data (optional based on use case)
        # supabase.table(table_name).delete().neq("id", "NO_SUCH_ID").execute()
        
        # Insert or upsert data
        if on_conflict:
            logger.info(f"Upserting data into {table_name} table with on_conflict={on_conflict}...")
            supabase.table(table_name).upsert(records, on_conflict=on_conflict).execute()
        else:
            logger.info(f"Inserting data into {table_name} table...")
            supabase.table(table_name).insert(records).execute()
            
        logger.info(f"Data successfully loaded to {table_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error loading data to Supabase table '{table_name}': {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def execute_sql(sql_query, params=None):
    """Execute raw SQL query on Supabase.
    
    Args:
        sql_query (str): SQL query to execute
        params (dict, optional): Parameters for the query
    
    Returns:
        dict: Query results
    """
    try:
        supabase = get_supabase_client()
        result = supabase.rpc("exec_sql", {"sql": sql_query, "params": params or {}}).execute()
        return result
    except Exception as e:
        logger.error(f"Error executing SQL: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_supabase_connection():
    """Test connection to Supabase.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        supabase = get_supabase_client()
        # Perform a simple query to test connection
        result = supabase.from_('in_game_player_stats').select('*', count='exact').limit(1).execute()
        logger.info(f"Supabase connection test: SUCCESS. Got {result.count} records.")
        return True
    except Exception as e:
        logger.error(f"Supabase connection test: FAILED. Error: {str(e)}")
        return False 
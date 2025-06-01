import logging
import random
import time
from http.client import RemoteDisconnected
from requests.exceptions import RequestException
import pandas as pd
from nba_api.stats.endpoints import leaguedashplayerstats, leaguedashlineups
from nba_api.stats.endpoints import leaguegamefinder, playercareerstats
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

def api_call_with_retry(api_func, max_retries=3, delay_base=2):
    """Make NBA API call with retry logic.
    
    Args:
        api_func (callable): Function to call the NBA API
        max_retries (int): Maximum number of retry attempts
        delay_base (int): Base delay time between retries (will be randomized)
    
    Returns:
        The result of the API call
    
    Raises:
        Exception: If all retry attempts fail
    """
    for attempt in range(max_retries):
        try:
            # Add randomized delay between attempts
            if attempt > 0:
                delay = random.uniform(delay_base, delay_base * 2)
                logger.info(f"Retry attempt {attempt + 1}, waiting {delay:.1f} seconds...")
                time.sleep(delay)
            
            return api_func()
            
        except (RequestException, RemoteDisconnected) as e:
            if attempt == max_retries - 1:  # Last attempt
                logger.error(f"Final attempt failed: {str(e)}")
                raise  # Re-raise the last exception
            logger.warning(f"API call failed: {str(e)}, retrying...")
            continue

def fetch_nba_data(url, headers=None):
    """Fetch data from NBA website.
    
    Args:
        url (str): The URL to fetch data from
        headers (dict, optional): Headers to use for the request
    
    Returns:
        dict: JSON response from the API
    """
    import requests
    if not headers:
        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    
    response = requests.get(url, headers=headers)
    return response.json()

def get_current_season():
    """Get the current NBA season in the format '2023-24'.
    
    Returns:
        str: Current season string
    """
    now = datetime.now()
    current_year = now.year
    
    # NBA season typically runs from October to June
    if now.month >= 10:  # Oct-Dec
        season = f"{current_year}-{str(current_year + 1)[-2:]}"
    else:  # Jan-Jun
        season = f"{current_year - 1}-{str(current_year)[-2:]}"
    
    return season

def get_player_stats(season=None, team_id=None, per_mode='PerGame', measure_type='Base'):
    """Fetch player stats from NBA API.
    
    Args:
        season (str, optional): Season in format '2023-24'. Defaults to current season.
        team_id (int, optional): NBA team ID to filter by
        per_mode (str): Per mode setting ('PerGame', 'Totals', etc.)
        measure_type (str): Measure type ('Base', 'Advanced', etc.)
    
    Returns:
        pd.DataFrame: Player stats data
    """
    if not season:
        season = get_current_season()
    
    logger.info(f"Fetching {measure_type} player stats ({per_mode}) for season {season}")
    
    stats = api_call_with_retry(
        lambda: leaguedashplayerstats.LeagueDashPlayerStats(
            per_mode_detailed=per_mode,
            measure_type_detailed_defense=measure_type,
            season=season,
            team_id_nullable=team_id
        ).get_data_frames()[0]
    )
    
    logger.info(f"Successfully retrieved data for {len(stats)} players")
    return stats

def get_player_career_stats(player_id):
    """Get career stats for a player.
    
    Args:
        player_id (int): NBA player ID
    
    Returns:
        pd.DataFrame: Player career stats
    """
    logger.info(f"Fetching career stats for player ID {player_id}")
    
    career_stats = api_call_with_retry(
        lambda: playercareerstats.PlayerCareerStats(player_id=player_id).get_data_frames()[0]
    )
    
    return career_stats

def get_lineup_stats(lineup_size=5, season=None, team_id=None, measure_type='Base'):
    """Get lineup stats.
    
    Args:
        lineup_size (int): Size of lineups (2, 3, 4, or 5)
        season (str, optional): Season in format '2023-24'. Defaults to current season.
        team_id (int, optional): NBA team ID to filter by
        measure_type (str): Measure type ('Base', 'Advanced', 'Four Factors', etc.)
    
    Returns:
        pd.DataFrame: Lineup stats
    """
    if not season:
        season = get_current_season()
    
    logger.info(f"Fetching {lineup_size}-man {measure_type} lineup data for season {season}")
    
    lineup_data = api_call_with_retry(
        lambda: leaguedashlineups.LeagueDashLineups(
            group_quantity=lineup_size,
            season=season,
            season_type_all_star='Regular Season',
            measure_type_detailed_defense=measure_type,
            team_id_nullable=team_id
        ).get_data_frames()[0]
    )
    
    if not lineup_data.empty:
        lineup_data['LINEUP_SIZE'] = lineup_size
        lineup_data['season'] = season
    
    return lineup_data 
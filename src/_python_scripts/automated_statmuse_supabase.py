#!/usr/bin/env python3
"""
Fully Automated StatMuse to Supabase Loader

This script scrapes StatMuse data and loads it directly into Supabase using the Python client.
Completely automated - no manual steps required!
"""

import sys
import os
import time
import logging
from datetime import datetime
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables and initialize Supabase client
load_dotenv()
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    logger.error("Missing Supabase environment variables!")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

class AutomatedStatMuseSupabaseLoader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Charset': 'UTF-8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        # Define all the stat categories we want to scrape
        self.stat_categories = {
            'points': {
                'url': 'most-points-before-turning-25',
                'display_name': 'Career Points',
                'stat_column': 'PTS'
            },
            'assists': {
                'url': 'most-assists-before-turning-25',
                'display_name': 'Career Assists', 
                'stat_column': 'AST'
            },
            'rebounds': {
                'url': 'most-rebounds-before-turning-25',
                'display_name': 'Career Rebounds',
                'stat_column': 'REB'
            },
            'steals': {
                'url': 'most-steals-before-turning-25',
                'display_name': 'Career Steals',
                'stat_column': 'STL'
            },
            'blocks': {
                'url': 'most-blocks-before-turning-25',
                'display_name': 'Career Blocks',
                'stat_column': 'BLK'
            },
            '3pm': {
                'url': 'most-3-pointers-before-turning-25',
                'display_name': 'Career 3-Pointers Made',
                'stat_column': '3PM'
            },
            'fgm': {
                'url': 'most-field-goals-before-turning-25',
                'display_name': 'Career Field Goals Made',
                'stat_column': 'FGM'
            },
            'ftm': {
                'url': 'most-free-throws-before-turning-25',
                'display_name': 'Career Free Throws Made',
                'stat_column': 'FTM'
            },
            'minutes': {
                'url': 'most-minutes-before-turning-25',
                'display_name': 'Career Minutes',
                'stat_column': 'MIN'
            },
            'games': {
                'url': 'most-games-before-turning-25',
                'display_name': 'Career Games Played',
                'stat_column': 'GP'
            }
        }
    
    def clean_player_name(self, name: str) -> str:
        """Clean player name to fix encoding issues and remove duplicates"""
        if not name:
            return ""
        
        # Fix common encoding issues
        name = name.replace('Ä', 'č').replace('Ä', 'ć').replace('Ä', 'ć')
        name = name.replace('Ä', 'ć').replace('Ä', 'ć').replace('Ä', 'ć')
        name = name.replace('Ä', 'ć').replace('Ä', 'ć').replace('Ä', 'ć')
        
        # Handle duplicate names (e.g., "LeBron JamesL. James" -> "LeBron James")
        # Look for patterns where the name is repeated with initials
        import re
        
        # Pattern 1: "FullNameInitials. LastName" -> "FullName"
        # Include apostrophes for names like "O'Neal"
        pattern1 = r'^([A-Za-z\sčćšđžČĆŠĐŽ\']+?)[A-Z]\.\s[A-Za-z\sčćšđžČĆŠĐŽ\']+$'
        match1 = re.match(pattern1, name)
        if match1:
            return match1.group(1).strip()
        
        # Pattern 2: "FullNameInitials.LastName" -> "FullName" 
        # Include apostrophes for names like "O'Neal"
        pattern2 = r'^([A-Za-z\sčćšđžČĆŠĐŽ\']+?)[A-Z]\.[A-Za-z\sčćšđžČĆŠĐŽ\']+$'
        match2 = re.match(pattern2, name)
        if match2:
            return match2.group(1).strip()
        
        # Pattern 3: Look for obvious duplicates by checking if the name contains
        # a repeated pattern (e.g., "Anthony EdwardsA. Edwards")
        words = name.split()
        if len(words) >= 4:
            # Check if the first part looks like a complete name
            first_part = ' '.join(words[:2])
            second_part = ' '.join(words[2:])
            
            # If the second part looks like initials + last name, use the first part
            if len(second_part.split()) == 2 and second_part.split()[0].endswith('.'):
                return first_part
        
        # If the name is very long (likely has duplicates), try to extract the first reasonable part
        if len(name) > 25:
            words = name.split()
            if len(words) >= 2:
                # Take first two words as they're likely the full name
                return f"{words[0]} {words[1]}"
        
        return name.strip()
    
    def test_name_cleaning(self):
        """Test the name cleaning function with problematic examples"""
        test_cases = [
            "Luka DonÄiÄL. DonÄiÄ",  # Encoding issue + duplicate
            "Anthony EdwardsA. Edwards",  # Duplicate name
            "LeBron JamesL. James",  # Another duplicate
            "Nikola JokiÄN. JokiÄ",  # Encoding + duplicate
            "Giannis AntetokounmpoG. Antetokounmpo",  # Long name duplicate
            "Shaquille O'NealS. O'Neal",  # Apostrophe in name + duplicate
            "Stephen Curry",  # Normal name (should not change)
        ]
        
        print("Testing name cleaning function:")
        print("=" * 50)
        for test_name in test_cases:
            cleaned = self.clean_player_name(test_name)
            print(f"Original: {test_name}")
            print(f"Cleaned:  {cleaned}")
            print("-" * 30)
    
    def scrape_stat_category(self, stat_key: str) -> List[Dict]:
        """Scrape a specific stat category from StatMuse"""
        if stat_key not in self.stat_categories:
            logger.error(f"Unknown stat category: {stat_key}")
            return []
        
        category_info = self.stat_categories[stat_key]
        url = f"https://www.statmuse.com/nba/ask/{category_info['url']}"
        
        logger.info(f"Scraping {category_info['display_name']} from {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.encoding = 'utf-8'  # Ensure UTF-8 encoding
            
            if response.status_code == 200:
                return self.parse_statmuse_response(response.text, category_info)
            else:
                logger.error(f"Failed to fetch {url}: Status {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error scraping {stat_key}: {e}")
            return []
    
    def parse_statmuse_response(self, html_content: str, category_info: Dict) -> List[Dict]:
        """Parse StatMuse HTML response to extract player statistics"""
        try:
            # Ensure proper UTF-8 encoding
            if isinstance(html_content, bytes):
                html_content = html_content.decode('utf-8', errors='ignore')

            soup = BeautifulSoup(html_content, 'html.parser')

            # Find the main statistics table
            table = soup.find('table')
            if not table:
                logger.warning(f"No table found for {category_info['display_name']}")
                return []

            players = []
            rows = table.find_all('tr')[1:]  # Skip header row

            for i, row in enumerate(rows):  # Get all available players
                cells = row.find_all('td')
                if len(cells) < 3:
                    continue

                try:
                    # Extract player name - look for links in cells
                    player_name = ""
                    for cell in cells:
                        link = cell.find('a')
                        if link:
                            player_name = link.get_text(strip=True)
                            # Clean up duplicate names and encoding issues
                            player_name = self.clean_player_name(player_name)
                            break

                    if not player_name:
                        # If no link found, try to get text from first few cells
                        for cell in cells[:3]:
                            text = cell.get_text(strip=True)
                            if text and not text.isdigit() and len(text) > 2:
                                player_name = self.clean_player_name(text)
                                break

                    # Extract the main stat value and games played
                    stat_value = None
                    games_played = None

                    # Look for numeric values in all cells
                    numeric_values = []
                    for j, cell in enumerate(cells):
                        text = cell.get_text(strip=True)
                        # Clean and check if it's a number
                        cleaned = text.replace(',', '').replace('.', '')
                        if cleaned.isdigit() and int(cleaned) > 0:
                            numeric_values.append((int(cleaned), j))

                    # The main stat should be in the first column after the player name
                    # Player name is usually in column 2, so the main stat is in column 3 (index 3)
                    # Let's directly check Cell 3 first, as this is the most reliable approach
                    stat_value = None
                    if len(cells) > 3:
                        cell_3_text = cells[3].get_text(strip=True)
                        if cell_3_text and cell_3_text.replace(',', '').isdigit():
                            stat_value = int(cell_3_text.replace(',', ''))
                    
                    # Fallback: if Cell 3 didn't work, try the numeric_values approach
                    if stat_value is None and numeric_values:
                        # Sort by value to find the main stat
                        numeric_values.sort(key=lambda x: x[0], reverse=True)
                        
                        # Look for the first meaningful numeric value in the early columns
                        for value, position in numeric_values:
                            if position >= 3 and value > 10:  # Skip rank (0), empty (1), name (2), get first stat (3+)
                                stat_value = value
                                break

                        # Find games played - look for medium-sized numbers that aren't the main stat
                        # Games played is usually in positions 26-30 and is smaller than the main stat
                        gp_candidates = []
                        for value, position in numeric_values:
                            if (50 <= value <= 1000 and  # Reasonable GP range
                                position >= 26 and  # Usually in later columns
                                value != stat_value):  # Not the main stat we just selected
                                gp_candidates.append((value, position))

                        if gp_candidates:
                            # Sort by position (later positions first) then by value
                            gp_candidates.sort(key=lambda x: (-x[1], -x[0]))
                            games_played = gp_candidates[0][0]
                        else:
                            # Fallback to any reasonable GP value
                            for value, position in numeric_values:
                                if 50 <= value <= 1000:
                                    games_played = value
                                    break

                    if stat_value is not None and player_name:
                        players.append({
                            'player_name': player_name,
                            'stat_value': stat_value,
                            'games_played': games_played or 0,
                            'rank': i + 1
                        })
                        logger.info(f"  {i+1}. {player_name}: {stat_value:,} {category_info['stat_column']}")

                except Exception as e:
                    logger.warning(f"Error parsing row {i+1}: {e}")
                    continue

            return players

        except Exception as e:
            logger.error(f"Error parsing StatMuse response: {e}")
            return []
    
    def load_to_supabase_direct(self, data: List[Dict], stat_category: str, age_limit: int = 24):
        """Load data directly into Supabase using the Python client"""
        if not data:
            logger.warning(f"No data to load for {stat_category}")
            return False
        
        try:
            logger.info(f"Loading {len(data)} players for {stat_category} into Supabase...")
            
            # Prepare data for Supabase
            records = []
            for i, player in enumerate(data):
                player_id = (i + 1) * 1000  # Generate unique IDs
                record = {
                    'player_id': player_id,
                    'player_name': player['player_name'],
                    'stat_category': stat_category,
                    'stat_value': player['stat_value'],
                    'rank_position': player['rank'],
                    'age_at_achievement': age_limit,
                    'season_type': 'Regular Season',
                    'achievement_date': datetime.now().isoformat(),
                    'games_played': player.get('games_played', 0)
                }
                records.append(record)
            
            # Insert into Supabase
            result = supabase.table('age_based_achievements').insert(records).execute()
            
            if result.data:
                logger.info(f"✅ {stat_category}: {len(data)} players loaded successfully")
                return True
            else:
                logger.error(f"❌ Failed to load {stat_category}: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error loading {stat_category} to Supabase: {e}")
            return False
    
    def clear_existing_data(self):
        """Clear existing data from the table using SQL DELETE with WHERE clause"""
        try:
            logger.info("Clearing existing data from age_based_achievements table...")
            
            # Use SQL DELETE with WHERE clause - this is the most reliable method
            # Supabase requires a WHERE clause for DELETE statements
            sql_query = "DELETE FROM age_based_achievements WHERE id > 0;"
            result = supabase.rpc('exec_sql', {'sql': sql_query}).execute()
            
            logger.info("✅ All existing data cleared successfully using SQL")
            return True
                
        except Exception as e:
            logger.error(f"Error clearing existing data with SQL: {e}")
            # Try the simple table delete method as fallback
            try:
                logger.info("Trying simple table delete method...")
                result = supabase.table('age_based_achievements').delete().neq('id', 0).execute()
                logger.info("✅ Fallback clearing method succeeded")
                return True
            except Exception as e2:
                logger.error(f"All clearing methods failed: {e2}")
                return False
    
    def run_automated_loader(self, clear_table=True):
        """Run the complete automated loading process"""
        logger.info("🚀 Starting Fully Automated StatMuse to Supabase Loader")
        logger.info("=" * 70)
        
        # Clear existing data first (unless disabled)
        if clear_table:
            if not self.clear_existing_data():
                logger.error("Failed to clear existing data. Aborting.")
                return False
        else:
            logger.info("⚠️ Skipping table clearing - data will be appended")
        
        total_loaded = 0
        successful_categories = 0
        
        for stat_key, category_info in self.stat_categories.items():
            logger.info(f"\n📊 Processing {category_info['display_name']}...")
            
            # Scrape data
            data = self.scrape_stat_category(stat_key)
            
            if data:
                # Load to Supabase
                success = self.load_to_supabase_direct(data, category_info['display_name'])
                
                if success:
                    total_loaded += len(data)
                    successful_categories += 1
                    logger.info(f"✅ {category_info['display_name']}: {len(data)} players loaded")
                else:
                    logger.error(f"❌ Failed to load {category_info['display_name']}")
            else:
                logger.warning(f"⚠️ No data found for {category_info['display_name']}")
            
            # Be respectful to the server
            time.sleep(2)
        
        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("🎉 AUTOMATED LOADING COMPLETE!")
        logger.info("=" * 70)
        logger.info(f"✅ Successful categories: {successful_categories}/10")
        logger.info(f"📊 Total players loaded: {total_loaded}")
        logger.info(f"🎯 All data loaded directly into Supabase!")
        
        return total_loaded, successful_categories

def main():
    """Main function"""
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--test-names':
            loader = AutomatedStatMuseSupabaseLoader()
            loader.test_name_cleaning()
            return
        elif sys.argv[1] == '--no-clear':
            print("⚠️ Running with --no-clear flag - existing data will NOT be cleared")
            loader = AutomatedStatMuseSupabaseLoader()
            total_loaded, successful_categories = loader.run_automated_loader(clear_table=False)
        elif sys.argv[1] == '--help':
            print("Usage: python automated_statmuse_supabase.py [options]")
            print("Options:")
            print("  --test-names    Test the name cleaning function")
            print("  --no-clear      Skip clearing existing data (append mode)")
            print("  --help          Show this help message")
            return
        else:
            print(f"Unknown option: {sys.argv[1]}")
            print("Use --help for available options")
            return
    else:
        # Default behavior - clear table first
        loader = AutomatedStatMuseSupabaseLoader()
        total_loaded, successful_categories = loader.run_automated_loader()
    
    if successful_categories == 10:
        print("\n🎉 SUCCESS: All 10 stat categories loaded successfully!")
        print(f"📊 Total: {total_loaded} players loaded into Supabase")
        print("🔧 Data is now available in your Supabase database!")
    else:
        print(f"\n⚠️ PARTIAL SUCCESS: {successful_categories}/10 categories loaded")
        print(f"📊 Total: {total_loaded} players loaded into Supabase")

if __name__ == "__main__":
    main()

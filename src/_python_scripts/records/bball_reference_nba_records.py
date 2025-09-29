import pandas as pd
import time
import os
import random
from supabase import create_client
import uuid
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

# Environment variables
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase = create_client(supabase_url, supabase_key)

def setup_driver():
    """Setup Chrome driver with options to avoid detection"""
    chrome_options = Options()
    
    # Add options to avoid detection
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    # Run in headless mode (comment out to see browser)
    chrome_options.add_argument("--headless")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    # Execute script to remove webdriver property
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def load_urls():
    """Load URLs from the CSV file"""
    df = pd.read_csv('basketball_reference_links_selenium.csv')
    # Print debug info
    print(f"Found {len(df)} URLs in CSV file")
    
    # Don't group by Link Text as multiple entries can have same text (e.g., "Single Season")
    # Instead, return list of tuples with (Link Text, URL)
    return list(zip(df['Link Text'], df['URL']))

def get_stat_type(url):
    """Extract stat type from URL"""
    # Extract everything between 'leaders/' and before '_season', '_career', or '_active'
    stat = url.split('leaders/')[1]
    for suffix in ['_season', '_career', '_active']:
        if suffix in stat:
            stat = stat.split(suffix)[0]
            break
    return stat

def clean_value(value):
    """Clean the value string and check if it's numeric"""
    # Remove any commas and whitespace
    value = value.replace(',', '').strip()
    
    try:
        # Try to convert to float to test if numeric
        float(value)
        return True
    except ValueError:
        return False

def scrape_stat_page(url, record_type):
    """Scrape a single stat page using Selenium"""
    driver = None
    try:
        print(f"Setting up Chrome driver for {url}...")
        driver = setup_driver()
        
        print("Navigating to basketball-reference.com...")
        driver.get("https://www.basketball-reference.com/")
        
        # Wait a bit for any potential CloudFlare checks
        time.sleep(3)
        
        print(f"Navigating to {url}...")
        driver.get(url)
        
        # Wait for the page to load completely
        print("Waiting for page to load...")
        try:
            # Try to wait for a table element
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "table"))
            )
        except TimeoutException:
            print("Timeout waiting for table, trying to continue...")
        
        # Additional wait to ensure all content is loaded
        time.sleep(2)
        
        print("Page loaded successfully! Parsing data...")
        
        # Get page source and parse with BeautifulSoup
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        return parse_stat_page(soup, url, record_type)
        
    except TimeoutException:
        print(f"Timeout waiting for page to load: {url}")
        return None
    except Exception as e:
        print(f"An error occurred scraping {url}: {str(e)}")
        return None
    finally:
        if driver:
            driver.quit()

def parse_stat_page(soup, url, record_type):
    """Parse the BeautifulSoup object and extract data"""
    try:
        data = []
        stat_type = get_stat_type(url)
        
        # Try different table IDs based on the record type
        if record_type in ['Career', 'Active']:
            possible_tables = ['tot', 'nba']
            table = None
            for table_id in possible_tables:
                table = soup.find('table', {'id': table_id})
                if table:
                    break
            if not table:
                table = soup.find('table')
        else:
            table = soup.find("table", id=lambda x: x and x.startswith('stats_'))
            if not table:
                table = soup.find('table', {'class': 'stats_table'})
        
        if not table:
            print(f"No table found for {url}")
            return None

        rows = []
        if table.find('tbody'):
            rows = table.find('tbody').find_all('tr')
        else:
            rows = table.find_all('tr')
        
        if not rows:
            print(f"No rows found in table for {url}")
            return None

        last_rank = None
        
        for row in rows:
            if 'thead' in row.get('class', []) or 'thead2' in row.get('class', []):
                continue
                
            if 'thead' in row.get('class', []) or not row.find_all(['td', 'th']):
                continue

            cells = row.find_all(['td', 'th'])
            if len(cells) >= 3:
                rank_text = cells[0].text.strip().rstrip('.')
                if rank_text:
                    last_rank = rank_text
                rank = last_rank
                
                player = cells[1].text.strip()
                value = cells[2].text.strip()
                
                # Only add row if value is numeric
                if clean_value(value):
                    season = ""
                    if len(cells) > 3 and record_type == "Single Season":
                        season = cells[3].text.strip()
                    
                    data.append([rank, player, value, season, record_type, stat_type])

        if not data:
            print(f"No data extracted from table for {url}")
            return None

        columns = ["Rank", "Player", "Value", "Season", "Record Type", "Stat Type"]
        df = pd.DataFrame(data, columns=columns)
        
        # Convert Value column to numeric, removing any commas
        df['Value'] = df['Value'].str.replace(',', '').astype(float)
        
        return df
        
    except Exception as e:
        print(f"Error parsing response for {url}: {str(e)}")
        return None

def append_to_csv(df, filename):
    """Append DataFrame to CSV, create file with headers if it doesn't exist"""
    if not os.path.exists(filename):
        df.to_csv(filename, index=False, encoding='utf-8-sig')
    else:
        df.to_csv(filename, mode='a', header=False, index=False, encoding='utf-8-sig')

def save_to_supabase(df):
    """Save DataFrame to Supabase"""
    try:
        # Add UUID column
        df['id'] = [str(uuid.uuid4()) for _ in range(len(df))]
        
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        
        # Delete existing records
        supabase.table('nba_records').delete().neq('id', '0').execute()
        
        # Insert new records
        result = supabase.table('nba_records').insert(records).execute()
        
        print(f"Successfully saved {len(records)} records to nba_records table")
        
        # Print preview of the data
        print("\nPreview of inserted data:")
        print(df[['id', 'Rank', 'Player', 'Value', 'Stat Type']].head())
        print("\n")
        
    except Exception as e:
        print(f"Error saving to Supabase: {str(e)}")

def main():
    print("Starting Selenium-based scraper for NBA records...")
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key[:20] if supabase_key else 'Not set'}...")
    
    # Load URLs from CSV
    url_pairs = load_urls()
    
    # Track success and failure counts
    success_count = 0
    failure_count = 0
    
    # Create empty list to store all DataFrames
    all_data = []
    
    # Process each URL
    total_urls = len(url_pairs)
    for i, (record_type, url) in enumerate(url_pairs, 1):
        print(f"\nProcessing {i}/{total_urls}: {record_type} - {url}")
        df = scrape_stat_page(url, record_type)
        if df is not None:
            all_data.append(df)
            print(f"Successfully scraped {len(df)} records")
            success_count += 1
        else:
            print(f"Failed to scrape data from {url}")
            failure_count += 1
        
        # Add delay between requests to be respectful
        if i < total_urls:  # Don't delay after the last request
            delay = random.uniform(3, 6)  # Random delay between 3-6 seconds
            print(f"Waiting {delay:.1f} seconds before next request...")
            time.sleep(delay)
    
    # Combine all DataFrames
    if all_data:
        final_df = pd.concat(all_data, ignore_index=True)
        
        # Save to Supabase
        save_to_supabase(final_df)
        
        # Also save to CSV as backup
        final_df.to_csv('basketball_reference_records_selenium.csv', index=False)
    
    print(f"\nScraping complete:")
    print(f"Successfully scraped: {success_count} pages")
    print(f"Failed to scrape: {failure_count} pages")

if __name__ == "__main__":
    main()

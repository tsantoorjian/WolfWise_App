import pandas as pd
import uuid
import os
import time
import random
from supabase import create_client
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

def scrape_team_leaders():
    """Scrape team leaders using Selenium to bypass CloudFlare"""
    url = "https://www.basketball-reference.com/teams/MIN/leaders_season.html"
    
    driver = None
    try:
        print("Setting up Chrome driver...")
        driver = setup_driver()
        
        print("Navigating to basketball-reference.com...")
        driver.get("https://www.basketball-reference.com/")
        
        # Wait a bit for any potential CloudFlare checks
        time.sleep(3)
        
        print("Navigating to team leaders page...")
        driver.get(url)
        
        # Wait for the page to load completely
        print("Waiting for page to load...")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "data_grid_box"))
        )
        
        # Additional wait to ensure all content is loaded
        time.sleep(2)
        
        print("Page loaded successfully! Parsing data...")
        
        # Get page source and parse with BeautifulSoup
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        return parse_response(soup)
        
    except TimeoutException:
        print("Timeout waiting for page to load. The page might be protected by CloudFlare.")
        return None
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None
    finally:
        if driver:
            driver.quit()

def parse_response(soup):
    """Parse the BeautifulSoup object and extract data"""
    try:
        # Find all stat boxes
        stat_boxes = soup.find_all('div', class_='data_grid_box')
        
        if not stat_boxes:
            print("No stat boxes found. The page structure might have changed.")
            return None
        
        print(f"Found {len(stat_boxes)} stat boxes")
        
        all_data = []
        
        # Process each box
        for box in stat_boxes:
            # Get category from caption
            caption = box.find('caption')
            if not caption:
                continue
            category = caption.text.strip()
            print(f"Processing category: {category}")
            
            # Find the table
            table = box.find('table', class_='columns')
            if not table:
                continue
                
            # Extract rows
            rows = table.find_all('tr')
            for row in rows:
                # Get rank
                rank_cell = row.find('td', class_='rank')
                if not rank_cell:
                    continue
                rank = rank_cell.text.strip().rstrip('.')
                
                # Get player and year
                who_cell = row.find('td', class_='who')
                if not who_cell:
                    continue
                    
                player = who_cell.find('a').text.strip()
                year_span = who_cell.find('span', class_='desc')
                year = year_span.text.strip() if year_span else ""
                
                # Get value and convert to numeric
                value_cell = row.find('td', class_='value')
                if not value_cell:
                    continue
                value = value_cell.text.strip()
                
                # Clean and convert value to numeric
                try:
                    # Remove commas and whitespace
                    cleaned_value = value.replace(',', '').strip()
                    # Convert to float first
                    numeric_value = float(cleaned_value)
                    
                    # Convert to integer by multiplying by 100 to preserve 2 decimal places
                    integer_value = int(numeric_value * 100)
                    
                    # Convert back to float with proper decimal places
                    final_value = integer_value / 100.0
                    
                    # Ensure value is within safe range for JSON
                    if abs(final_value) > 1e9:  # Reduced maximum size
                        print(f"Skipping large value: {final_value} for {category}")
                        continue
                        
                    all_data.append([category, rank, player, year, final_value])
                except ValueError as e:
                    print(f"Skipping invalid value: {value} - Error: {str(e)}")
                    continue
        
        if not all_data:
            print("No data extracted. The page structure might have changed.")
            return None
        
        # Create DataFrame
        df = pd.DataFrame(all_data, columns=['Category', 'Rank', 'Player', 'Year', 'Value'])
        
        # Additional safety check for numeric values
        df['Value'] = pd.to_numeric(df['Value'], errors='coerce')
        df = df.dropna(subset=['Value'])  # Remove any rows where Value is NaN
        df = df[df['Value'].abs() < 1e9]  # Filter out extremely large values
        
        print(f"\nExtracted {len(df)} records")
        print("\nValue column statistics:")
        print(df['Value'].describe())
        
        # Convert Rank to integer
        df['Rank'] = pd.to_numeric(df['Rank'], downcast='integer')
        
        # Add UUIDs
        df['id'] = [str(uuid.uuid4()) for _ in range(len(df))]
        
        # Save to Supabase
        save_to_supabase(df)
        
        # Also save to CSV as backup
        df.to_csv('timberwolves_leaders_selenium.csv', index=False, encoding='utf-8-sig')
        
        return df
        
    except Exception as e:
        print(f"Error parsing response: {str(e)}")
        return None

def save_to_supabase(df):
    """Save DataFrame to Supabase"""
    try:
        # Make a copy of the DataFrame to avoid modifying the original
        df_to_save = df.copy()
        
        # Drop any rows with NA values
        df_to_save = df_to_save.dropna()
        
        # Convert Rank to integer
        df_to_save['Rank'] = pd.to_numeric(df_to_save['Rank'], errors='coerce').fillna(0).astype(int)
        
        # Convert Value column to string with appropriate decimal places
        def format_value(x):
            if pd.isna(x):  # Handle NA values
                return "0"
            if x < 1:  # For very small numbers
                return f"{x:.3f}"
            elif x < 10:  # For single digit numbers
                return f"{x:.2f}"
            else:  # For larger numbers
                return f"{int(x)}"  # No decimals for large numbers
        
        df_to_save['Value'] = df_to_save['Value'].apply(format_value)
        
        # Print some debug info
        print("\nSample of formatted values:")
        print(df_to_save[['Category', 'Value']].head(10))
        
        # Convert DataFrame to list of dictionaries
        records = df_to_save.to_dict('records')
        
        # Delete existing records
        supabase.table('timberwolves_season_leaders').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # Insert new records
        result = supabase.table('timberwolves_season_leaders').insert(records).execute()
        
        print(f"Successfully saved {len(records)} records to timberwolves_season_leaders table")
        
        # Print preview of the data
        print("\nPreview of inserted data:")
        print(df_to_save[['id', 'Category', 'Rank', 'Player', 'Value']].head())
        print("\n")
        
    except Exception as e:
        print(f"Error saving to Supabase: {str(e)}")
        if 'records' in locals():
            print("Failed records:")
            for record in records[:5]:
                print(record)

if __name__ == "__main__":
    print("Starting Selenium-based scraper for team leaders...")
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key[:20] if supabase_key else 'Not set'}...")
    
    data = scrape_team_leaders()
    if data is not None:
        print("\nFirst few rows of the data:")
        print(data.head())
    else:
        print("Failed to scrape data")
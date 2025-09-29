#!/usr/bin/env python3
"""
Advanced Basketball Reference Scraper for PER and Win Shares
======================================================

This script scrapes Player Efficiency Rating (PER) and Win Shares (WS)
data from Basketball Reference using multiple anti-bot bypassing techniques.

Features:
- Multiple scraping methods with fallbacks
- Advanced browser automation with undetected-chromedriver
- Cloudscraper integration for requests-based scraping
- Rotating user agents and headers
- Proxy support for enhanced anonymity
- Human-like delays and behavior simulation
- Robust error handling and retry logic
- Data validation and cleaning

Dependencies to install:
pip install undetected-chromedriver cloudscraper playwright fake-useragent requests-html pandas numpy beautifulsoup4 selenium

Usage:
python advanced_stats_scraper.py [year] [--headless] [--use-proxy] [--output-format csv|json|excel]

Author: Generated for WolfWise NBA Analytics
"""

import argparse
import asyncio
import json
import logging
import os
import random
import re
import sys
import time
import uuid
from typing import Dict, List, Optional, Tuple, Union
from urllib.parse import urljoin

# Core scraping libraries
import cloudscraper
import pandas as pd
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
# from requests_html import AsyncHTMLSession  # Not needed for this scraper
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# Supabase integration
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Warning: supabase-py not available, Supabase integration disabled")

# Try to import undetected-chromedriver, fallback to regular selenium
try:
    import undetected_chromedriver as uc
    UNDETECTED_CHROMEDRIVER_AVAILABLE = True
except ImportError:
    UNDETECTED_CHROMEDRIVER_AVAILABLE = False
    print("Warning: undetected-chromedriver not available, using regular Chrome driver")

# Try to import playwright
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("Warning: playwright not available, using alternative methods")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraping.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class BasketballReferenceScraper:
    """
    Advanced scraper for Basketball Reference with multiple anti-bot bypassing techniques
    """

    def __init__(self, year: int = 2025, use_proxy: bool = False, headless: bool = True, 
                 supabase_url: str = None, supabase_key: str = None, load_to_supabase: bool = True):
        self.year = year
        self.use_proxy = use_proxy
        self.headless = headless
        self.load_to_supabase = load_to_supabase
        self.base_url = "https://www.basketball-reference.com"
        self.target_url = f"{self.base_url}/leagues/NBA_{self.year}_advanced.html"

        # Initialize components
        self.ua_generator = UserAgent()
        self.session = self._create_session()
        self.scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'desktop': True
            }
        )

        # Proxy list (add your own proxies if needed)
        self.proxies = self._load_proxies() if use_proxy else None

        # Initialize Supabase client if credentials provided
        self.supabase = None
        if self.load_to_supabase and SUPABASE_AVAILABLE:
            self.supabase = self._init_supabase(supabase_url, supabase_key)

        # Statistics tracking
        self.stats = {
            'attempts': 0,
            'successes': 0,
            'failures': 0,
            'method_used': None
        }

    def _init_supabase(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize Supabase client with environment variables or provided credentials"""
        try:
            # Try to get credentials from environment variables first
            url = supabase_url or os.getenv('SUPABASE_URL')
            key = supabase_key or os.getenv('SUPABASE_ANON_KEY')
            
            if not url or not key:
                logger.warning("Supabase credentials not provided. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
                return None
                
            supabase = create_client(url, key)
            logger.info("Supabase client initialized successfully")
            return supabase
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None

    def _load_proxies(self) -> Optional[List[Dict]]:
        """Load proxy list from file or return None"""
        proxy_file = 'proxies.txt'
        if os.path.exists(proxy_file):
            with open(proxy_file, 'r') as f:
                proxies = [line.strip() for line in f if line.strip()]
                return [{'http': p, 'https': p} for p in proxies]
        return None

    def _get_random_user_agent(self) -> str:
        """Get a random user agent string"""
        return self.ua_generator.random

    def _create_session(self) -> requests.Session:
        """Create a requests session with proper headers"""
        session = requests.Session()

        headers = {
            'User-Agent': self._get_random_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }

        session.headers.update(headers)
        return session

    def _get_random_headers(self) -> Dict[str, str]:
        """Get randomized headers for requests"""
        return {
            'User-Agent': self._get_random_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    def _human_delay(self, min_delay: float = 1.0, max_delay: float = 3.0) -> None:
        """Add human-like delay between requests"""
        delay = random.uniform(min_delay, max_delay)
        logger.info(f"Waiting {delay:.1f} seconds...")
        time.sleep(delay)

    def _setup_undetected_chrome(self):
        """Setup undetected Chrome driver"""
        options = Options()

        # Anti-detection options
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-plugins')
        options.add_argument('--disable-images')  # Faster loading
        options.add_argument('--disable-javascript')  # Disable JS for initial load

        # User agent
        options.add_argument(f'--user-agent={self._get_random_user_agent()}')

        if self.headless:
            options.add_argument('--headless')

        # Additional stealth options
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        driver = uc.Chrome(options=options)

        # Remove webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        return driver

    def _setup_regular_chrome(self) -> webdriver.Chrome:
        """Setup regular Chrome driver with anti-detection measures"""
        options = Options()

        # Anti-detection options
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        # User agent
        options.add_argument(f'--user-agent={self._get_random_user_agent()}')

        if self.headless:
            options.add_argument('--headless')

        driver = webdriver.Chrome(options=options)

        # Remove webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        return driver

    def _extract_player_data(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract player data from BeautifulSoup object"""
        players_data = []

        try:
            # Find the advanced stats table
            table = soup.find('table', {'id': 'advanced'})

            if not table:
                logger.error("Could not find advanced stats table")
                return players_data

            # Get all data rows
            rows = table.find_all('tr')

            for row in rows:
                # Skip header rows
                if 'thead' in row.get('class', []):
                    continue

                cells = row.find_all(['td', 'th'])
                if len(cells) < 15:  # Need at least 15 columns for advanced stats
                    continue

                try:
                    player_data = {
                        'rank': cells[0].text.strip(),
                        'player': cells[1].text.strip(),
                        'age': cells[2].text.strip(),
                        'team': cells[3].text.strip(),
                        'position': cells[4].text.strip(),
                        'games': cells[5].text.strip(),
                        'games_started': cells[6].text.strip(),
                        'minutes_played': cells[7].text.strip(),
                        'per': cells[8].text.strip(),
                        'true_shooting': cells[9].text.strip(),
                        'three_point_rate': cells[10].text.strip(),
                        'free_throw_rate': cells[11].text.strip(),
                        'offensive_rebound_pct': cells[12].text.strip(),
                        'defensive_rebound_pct': cells[13].text.strip(),
                        'total_rebound_pct': cells[14].text.strip(),
                        'assist_pct': cells[15].text.strip(),
                        'steal_pct': cells[16].text.strip(),
                        'block_pct': cells[17].text.strip(),
                        'turnover_pct': cells[18].text.strip(),
                        'usage_pct': cells[19].text.strip(),
                        'offensive_ws': cells[20].text.strip(),
                        'defensive_ws': cells[21].text.strip(),
                        'win_shares': cells[22].text.strip(),
                        'win_shares_per_48': cells[23].text.strip(),
                        'offensive_box_pm': cells[24].text.strip(),
                        'defensive_box_pm': cells[25].text.strip(),
                        'box_pm': cells[26].text.strip(),
                        'value_over_replacement': cells[27].text.strip(),
                        'year': self.year
                    }

                    # Clean numeric values
                    for key in ['per', 'win_shares', 'offensive_ws', 'defensive_ws', 'win_shares_per_48']:
                        if player_data[key]:
                            try:
                                player_data[key] = float(player_data[key])
                            except (ValueError, TypeError):
                                player_data[key] = None

                    players_data.append(player_data)

                except Exception as e:
                    logger.warning(f"Error parsing row: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error extracting player data: {e}")

        return players_data

    def _try_requests_scraping(self) -> Optional[List[Dict]]:
        """Try scraping using requests with cloudscraper"""
        self.stats['attempts'] += 1
        logger.info("Attempting requests-based scraping...")

        try:
            headers = self._get_random_headers()
            # Disable SSL verification to handle certificate issues
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            if self.proxies:
                proxy = random.choice(self.proxies)
                response = self.scraper.get(self.target_url, headers=headers, proxies=proxy, verify=False)
            else:
                response = self.scraper.get(self.target_url, headers=headers, verify=False)

            response.raise_for_status()

            # Check if we got a valid response (not blocked)
            if 'advanced' not in response.text.lower():
                logger.warning("Requests method may have been blocked")
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            players_data = self._extract_player_data(soup)

            if players_data:
                self.stats['successes'] += 1
                self.stats['method_used'] = 'requests'
                logger.info(f"Successfully scraped {len(players_data)} players using requests")
                return players_data
            else:
                logger.warning("No player data extracted from requests response")
                return None

        except Exception as e:
            logger.error(f"Requests scraping failed: {e}")
            self.stats['failures'] += 1
            return None

    def _try_selenium_scraping(self) -> Optional[List[Dict]]:
        """Try scraping using Selenium"""
        self.stats['attempts'] += 1
        logger.info("Attempting Selenium-based scraping...")

        driver = None
        try:
            # Try undetected chrome first, fallback to regular chrome
            if UNDETECTED_CHROMEDRIVER_AVAILABLE:
                driver = self._setup_undetected_chrome()
            else:
                driver = self._setup_regular_chrome()

            # Navigate to the page
            logger.info("Navigating to Basketball Reference...")
            driver.get(self.target_url)

            # Wait for content to load with shorter timeout
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.TAG_NAME, "table"))
                )
            except TimeoutException:
                logger.warning("Timeout waiting for table, trying to continue...")

            # Additional delay to ensure full page load
            self._human_delay(2, 4)

            # Get page source and parse
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')

            players_data = self._extract_player_data(soup)

            if players_data:
                self.stats['successes'] += 1
                self.stats['method_used'] = 'selenium'
                logger.info(f"Successfully scraped {len(players_data)} players using Selenium")
                return players_data
            else:
                logger.warning("No player data extracted from Selenium response")
                return None

        except Exception as e:
            logger.error(f"Selenium scraping failed: {e}")
            self.stats['failures'] += 1
            return None
        finally:
            if driver:
                driver.quit()

    def _try_playwright_scraping(self) -> Optional[List[Dict]]:
        """Try scraping using Playwright (if available)"""
        if not PLAYWRIGHT_AVAILABLE:
            logger.info("Playwright not available, skipping...")
            return None

        self.stats['attempts'] += 1
        logger.info("Attempting Playwright-based scraping...")

        async def scrape_with_playwright():
            async with async_playwright() as p:
                # Launch browser with anti-detection measures
                browser = await p.chromium.launch(
                    headless=self.headless,
                    args=[
                        '--no-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ]
                )

                context = await browser.new_context(
                    user_agent=self._get_random_user_agent(),
                    viewport={'width': 1920, 'height': 1080}
                )

                page = await context.new_page()

                # Navigate to the page
                logger.info("Navigating to Basketball Reference with Playwright...")
                await page.goto(self.target_url, wait_until='domcontentloaded')

                # Wait for table to be present
                await page.wait_for_selector('table', timeout=30000)

                # Additional delay
                await asyncio.sleep(random.uniform(2, 4))

                # Get page content
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')

                await browser.close()

                return self._extract_player_data(soup)

        try:
            players_data = asyncio.run(scrape_with_playwright())

            if players_data:
                self.stats['successes'] += 1
                self.stats['method_used'] = 'playwright'
                logger.info(f"Successfully scraped {len(players_data)} players using Playwright")
                return players_data
            else:
                logger.warning("No player data extracted from Playwright response")
                return None

        except Exception as e:
            logger.error(f"Playwright scraping failed: {e}")
            self.stats['failures'] += 1
            return None

    def scrape_advanced_stats(self) -> Optional[pd.DataFrame]:
        """Main scraping method with multiple fallback approaches"""
        logger.info(f"Starting to scrape advanced stats for NBA {self.year}")
        logger.info(f"Target URL: {self.target_url}")

        # Add initial delay
        self._human_delay(1, 2)

        players_data = None

        # Try different methods in order of preference
        methods = [
            ('requests', self._try_requests_scraping),
            ('selenium', self._try_selenium_scraping),
            ('playwright', self._try_playwright_scraping)
        ]

        for method_name, method_func in methods:
            logger.info(f"Trying {method_name} method...")

            try:
                players_data = method_func()
                if players_data:
                    logger.info(f"Success with {method_name} method!")
                    break
                else:
                    logger.warning(f"{method_name} method returned no data, trying next method...")
                    self._human_delay(2, 4)  # Longer delay between methods

            except Exception as e:
                logger.error(f"{method_name} method failed: {e}")
                self._human_delay(2, 4)
                continue

        if not players_data:
            logger.error("All scraping methods failed")
            return None

        # Convert to DataFrame
        df = pd.DataFrame(players_data)

        # Clean and validate data
        df = self._clean_data(df)

        # Load to Supabase if configured
        if self.load_to_supabase and self.supabase:
            logger.info("Loading data to Supabase...")
            supabase_success = self._load_to_supabase(df.copy())
            if supabase_success:
                logger.info("✓ Data successfully loaded to Supabase")
            else:
                logger.error("✗ Failed to load data to Supabase")
        elif self.load_to_supabase and not self.supabase:
            logger.warning("Supabase loading requested but client not available")

        logger.info(f"Scraping completed. Total players: {len(df)}")
        logger.info(f"Success rate: {self.stats['successes']}/{self.stats['attempts']}")

        return df

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate the scraped data"""
        logger.info("Cleaning and validating data...")

        # Remove rows with missing critical data
        df = df.dropna(subset=['player', 'per', 'win_shares'], how='all')

        # Clean team names (remove extra text)
        df['team'] = df['team'].apply(lambda x: re.sub(r'\s*\([^)]*\)', '', x))

        # Convert numeric columns
        numeric_columns = ['per', 'win_shares', 'offensive_ws', 'defensive_ws',
                          'win_shares_per_48', 'age', 'games', 'games_started', 'minutes_played']

        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Sort by PER (best players first)
        df = df.sort_values('per', ascending=False).reset_index(drop=True)

        # Add rank column
        df['rank'] = range(1, len(df) + 1)

        logger.info(f"Data cleaned. Final shape: {df.shape}")
        return df

    def _load_to_supabase(self, df: pd.DataFrame) -> bool:
        """Load DataFrame directly to Supabase"""
        if not self.supabase:
            logger.warning("Supabase client not available, skipping database upload")
            return False
            
        try:
            # Add UUID for each record
            df['id'] = [str(uuid.uuid4()) for _ in range(len(df))]
            
            # Clean data - remove header rows and convert data types
            numeric_cols = ['per', 'true_shooting', 'three_point_rate', 'free_throw_rate', 
                          'offensive_rebound_pct', 'defensive_rebound_pct', 'total_rebound_pct', 
                          'assist_pct', 'steal_pct', 'block_pct', 'turnover_pct', 'usage_pct', 
                          'offensive_ws', 'defensive_ws', 'win_shares', 'win_shares_per_48', 
                          'offensive_box_pm', 'defensive_box_pm', 'box_pm', 'value_over_replacement']
            
            # Remove rows that contain header text
            for col in numeric_cols:
                if col in df.columns:
                    df = df[df[col].astype(str).str.match(r'^-?\d*\.?\d*$', na=True)]
            
            # Convert data types
            df['rank'] = df['rank'].astype('Int64')
            df['age'] = df['age'].astype('Int64')
            df['games'] = df['games'].astype('Int64')
            df['games_started'] = df['games_started'].astype('Int64')
            df['year'] = df['year'].astype('Int64')
            
            # Convert numeric columns to float, replacing non-numeric with NaN
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Replace NaN with None using numpy
            import numpy as np
            df_clean = df.replace({np.nan: None})
            records = df_clean.to_dict('records')
            
            # Delete existing records for this year to avoid duplicates
            logger.info(f"Deleting existing records for year {self.year}...")
            delete_result = self.supabase.table('nba_advanced_stats').delete().eq('year', self.year).execute()
            logger.info(f"Deleted {len(delete_result.data)} existing records for {self.year}")
            
            # Insert new records
            logger.info(f"Inserting {len(records)} records for year {self.year}...")
            result = self.supabase.table('nba_advanced_stats').insert(records).execute()
            
            logger.info(f"Successfully loaded {len(result.data)} records for {self.year}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading data to Supabase for {self.year}: {e}")
            return False

    def save_data(self, df: pd.DataFrame, output_format: str = 'csv', filename: str = None) -> str:
        """Save data to file in specified format"""
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"nba_advanced_stats_{self.year}_{timestamp}"

        if output_format.lower() == 'csv':
            filepath = f"{filename}.csv"
            df.to_csv(filepath, index=False)
        elif output_format.lower() == 'json':
            filepath = f"{filename}.json"
            df.to_json(filepath, orient='records', indent=2)
        elif output_format.lower() == 'excel':
            filepath = f"{filename}.xlsx"
            df.to_excel(filepath, index=False)
        else:
            raise ValueError(f"Unsupported format: {output_format}")

        logger.info(f"Data saved to {filepath}")
        return filepath


def main():
    """Main function to run the scraper"""
    parser = argparse.ArgumentParser(description='Scrape NBA Advanced Stats from Basketball Reference')
    parser.add_argument('year', type=int, nargs='?', default=2025,
                       help='NBA season year (default: 2025)')
    parser.add_argument('--headless', action='store_true', default=True,
                       help='Run browser in headless mode (default: True)')
    parser.add_argument('--use-proxy', action='store_true',
                       help='Use proxy servers for requests')
    parser.add_argument('--output-format', choices=['csv', 'json', 'excel'],
                       default='csv', help='Output file format (default: csv)')
    parser.add_argument('--output-filename', type=str,
                       help='Custom output filename (without extension)')
    parser.add_argument('--no-supabase', action='store_true',
                       help='Disable Supabase loading (useful for testing)')
    parser.add_argument('--supabase-url', type=str,
                       help='Supabase URL (overrides environment variable)')
    parser.add_argument('--supabase-key', type=str,
                       help='Supabase API key (overrides environment variable)')
    parser.add_argument('--no-file-output', action='store_true',
                       help='Disable file output (cloud-friendly mode)')

    args = parser.parse_args()

    # Create scraper instance
    scraper = BasketballReferenceScraper(
        year=args.year,
        use_proxy=args.use_proxy,
        headless=args.headless,
        supabase_url=args.supabase_url,
        supabase_key=args.supabase_key,
        load_to_supabase=not args.no_supabase
    )

    # Scrape data
    df = scraper.scrape_advanced_stats()

    if df is None or df.empty:
        logger.error("No data scraped. Exiting.")
        sys.exit(1)

    # Save data to file (unless disabled)
    filepath = None
    if not args.no_file_output:
        filename = args.output_filename or f"nba_advanced_stats_{args.year}"
        filepath = scraper.save_data(df, args.output_format, filename)

    # Print summary
    print("\n" + "="*50)
    print("SCRAPING SUMMARY")
    print("="*50)
    print(f"Year: {args.year}")
    print(f"Players scraped: {len(df)}")
    print(f"Method used: {scraper.stats['method_used']}")
    print(f"Success rate: {scraper.stats['successes']}/{scraper.stats['attempts']}")
    if filepath:
        print(f"Output file: {filepath}")
    if scraper.load_to_supabase and scraper.supabase:
        print("✓ Data loaded to Supabase")
    elif scraper.load_to_supabase and not scraper.supabase:
        print("✗ Supabase loading failed (check credentials)")

    # Show top 10 players by PER
    print("\nTOP 10 PLAYERS BY PER:")
    print("-" * 30)
    top_10 = df.head(10)[['rank', 'player', 'team', 'per', 'win_shares']]
    print(top_10.to_string(index=False))

    if filepath:
        print(f"\nData saved to: {filepath}")
    print("="*50)


if __name__ == "__main__":
    main()

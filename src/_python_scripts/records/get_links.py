import pandas as pd
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

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

def scrape_links():
    """Scrape links using Selenium to bypass CloudFlare"""
    # URL of the Basketball Reference Leaders page
    URL = "https://www.basketball-reference.com/leaders/"
    
    driver = None
    try:
        print("Setting up Chrome driver...")
        driver = setup_driver()
        
        print("Navigating to basketball-reference.com...")
        driver.get("https://www.basketball-reference.com/")
        
        # Wait a bit for any potential CloudFlare checks
        time.sleep(3)
        
        print(f"Navigating to {URL}...")
        driver.get(URL)
        
        # Wait for the page to load completely
        print("Waiting for page to load...")
        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "a"))
            )
        except TimeoutException:
            print("Timeout waiting for links, trying to continue...")
        
        # Additional wait to ensure all content is loaded
        time.sleep(2)
        
        print("Page loaded successfully! Parsing links...")
        
        # Get page source and parse with BeautifulSoup
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')

        # Find all links
        links = soup.find_all("a", href=True)

        # Extract link text and URLs
        data = []
        base_url = "https://www.basketball-reference.com"

        for link in links:
            text = link.text.strip()
            href = link["href"]

            # Ensure the link is valid
            if href.startswith("/leaders/"):
                full_url = base_url + href
                data.append([text, full_url])

        if not data:
            print("No links found. The page structure might have changed.")
            return None

        # Convert to DataFrame
        df = pd.DataFrame(data, columns=["Link Text", "URL"])

        # Save to CSV
        df.to_csv("basketball_reference_links_selenium.csv", index=False)

        print(f"Scraping completed. {len(df)} links saved to basketball_reference_links_selenium.csv")
        return df
        
    except TimeoutException:
        print("Timeout waiting for page to load. The page might be protected by CloudFlare.")
        return None
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    print("Starting Selenium-based link scraper...")
    data = scrape_links()
    if data is not None:
        print("\nFirst few links:")
        print(data.head())
    else:
        print("Failed to scrape links")

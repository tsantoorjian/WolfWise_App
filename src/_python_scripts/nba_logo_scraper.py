import os
import requests
import time

# Create a directory to store the logos
output_dir = "nba_logos"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print(f"Created directory: {output_dir}")

# NBA teams and their logo URLs (using PNG versions without years)
teams = {
    'atlanta_hawks': 'https://loodibee.com/wp-content/uploads/nba-atlanta-hawks-logo.png',
    'boston_celtics': 'https://loodibee.com/wp-content/uploads/nba-boston-celtics-logo.png',
    'brooklyn_nets': 'https://loodibee.com/wp-content/uploads/nba-brooklyn-nets-logo.png',
    'charlotte_hornets': 'https://loodibee.com/wp-content/uploads/nba-charlotte-hornets-logo.png',
    'chicago_bulls': 'https://loodibee.com/wp-content/uploads/nba-chicago-bulls-logo.png',
    'cleveland_cavaliers': 'https://loodibee.com/wp-content/uploads/nba-cleveland-cavaliers-logo.png',
    'dallas_mavericks': 'https://loodibee.com/wp-content/uploads/nba-dallas-mavericks-logo.png',
    'denver_nuggets': 'https://loodibee.com/wp-content/uploads/nba-denver-nuggets-logo.png',
    'detroit_pistons': 'https://loodibee.com/wp-content/uploads/nba-detroit-pistons-logo.png',
    'golden_state_warriors': 'https://loodibee.com/wp-content/uploads/nba-golden-state-warriors-logo.png',
    'houston_rockets': 'https://loodibee.com/wp-content/uploads/nba-houston-rockets-logo.png',
    'indiana_pacers': 'https://loodibee.com/wp-content/uploads/nba-indiana-pacers-logo.png',
    'los_angeles_clippers': 'https://loodibee.com/wp-content/uploads/nba-la-clippers-logo.png',
    'los_angeles_lakers': 'https://loodibee.com/wp-content/uploads/nba-los-angeles-lakers-logo.png',
    'memphis_grizzlies': 'https://loodibee.com/wp-content/uploads/nba-memphis-grizzlies-logo.png',
    'miami_heat': 'https://loodibee.com/wp-content/uploads/nba-miami-heat-logo.png',
    'milwaukee_bucks': 'https://loodibee.com/wp-content/uploads/nba-milwaukee-bucks-logo.png',
    'minnesota_timberwolves': 'https://loodibee.com/wp-content/uploads/nba-minnesota-timberwolves-logo.png',
    'new_orleans_pelicans': 'https://loodibee.com/wp-content/uploads/nba-new-orleans-pelicans-logo.png',
    'new_york_knicks': 'https://loodibee.com/wp-content/uploads/nba-new-york-knicks-logo.png',
    'oklahoma_city_thunder': 'https://loodibee.com/wp-content/uploads/nba-oklahoma-city-thunder-logo.png',
    'orlando_magic': 'https://loodibee.com/wp-content/uploads/nba-orlando-magic-logo.png',
    'philadelphia_76ers': 'https://loodibee.com/wp-content/uploads/nba-philadelphia-76ers-logo.png',
    'phoenix_suns': 'https://loodibee.com/wp-content/uploads/nba-phoenix-suns-logo.png',
    'portland_trail_blazers': 'https://loodibee.com/wp-content/uploads/nba-portland-trail-blazers-logo.png',
    'sacramento_kings': 'https://loodibee.com/wp-content/uploads/nba-sacramento-kings-logo.png',
    'san_antonio_spurs': 'https://loodibee.com/wp-content/uploads/nba-san-antonio-spurs-logo.png',
    'toronto_raptors': 'https://loodibee.com/wp-content/uploads/nba-toronto-raptors-logo.png',
    'utah_jazz': 'https://loodibee.com/wp-content/uploads/nba-utah-jazz-logo.png',
    'washington_wizards': 'https://loodibee.com/wp-content/uploads/nba-washington-wizards-logo.png'
}

# Set up headers to mimic a browser request
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "image/webp,*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://loodibee.com/"
}

try:
    print(f"Found {len(teams)} NBA teams.")
    
    # Download each team's logo
    for team_name, logo_url in teams.items():
        try:
            # Create filename
            filename = f"{team_name}.png"
            file_path = os.path.join(output_dir, filename)
            
            # Download the image
            print(f"Downloading {filename}...")
            response = requests.get(logo_url, headers=headers)
            response.raise_for_status()
            
            # Save the image directly
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            print(f"Successfully downloaded {filename}")
            
            # Sleep to avoid overloading the server
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error processing {team_name}: {e}")
    
    print(f"\nDownload complete! Logos saved to {output_dir}/")
    
except Exception as e:
    print(f"An error occurred: {e}") 
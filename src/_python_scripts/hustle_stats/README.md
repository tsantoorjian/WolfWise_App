# Hustle Stats Fetcher

This script fetches hustle stats for Timberwolves players from the NBA API and loads them into Supabase.

## What are Hustle Stats?

Hustle stats are advanced metrics that measure the "gritty" aspects of basketball that don't show up in traditional box scores:

- **Contested Shots**: Shots where the player was the closest defender
- **Deflections**: Touches that redirect opponent passes
- **Charges Drawn**: Offensive fouls drawn by the player
- **Screen Assists**: Screens that lead to teammate scores
- **Loose Balls Recovered**: 50/50 balls recovered by the player
- **Box Outs**: Boxing out opponents for rebounds

## Usage

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export SUPABASE_URL=your_supabase_url
export SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the script:
```bash
python hustle_stats_fetcher.py
```

## Features

- Fetches both Per Game and Totals data
- Uses the reliable `nba_api` Python package
- Includes retry logic for API calls
- Properly handles data type conversion
- Loads data into Supabase with proper schema

## Data Schema

The script creates a `hustle_stats` table in Supabase with the following key fields:
- Player information (ID, name, team)
- Hustle metrics (contested shots, deflections, etc.)
- Season and mode information
- Timestamps for tracking

## Integration

The fetched data is displayed in the WolfWise React app via the `HustleStats` component, which provides:
- Toggle between Per Game and Totals views
- Color-coded performance indicators
- Responsive design for all screen sizes
- Educational explanations of each stat

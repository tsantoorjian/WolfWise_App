# WolfWise ETL Scripts

This directory contains Python scripts used for data extraction, transformation, and loading for the WolfWise project.

## Build Configuration

These Python scripts are excluded from the Netlify build process using configuration in the root `netlify.toml` file. This prevents build failures related to Python dependencies while allowing the scripts to be version-controlled in the same repository.

## Python Dependencies

The Python dependencies for these scripts are listed in the `requirements.txt` file in this directory. The file has been moved here from the root directory to prevent Netlify from automatically trying to install these dependencies during the build process.

To install the dependencies locally, run:

```bash
pip install -r src/aaWolfWiseETL/requirements.txt
```

## Usage

These scripts are intended to be run locally or in a separate environment from the web application deployment.

## Contents

- `stat_cards/`: Scripts for generating player stat cards
- `lineups/`: Scripts for processing lineup data
- `records/`: Record-related data processing
- `player_game_logs/`: Scripts for processing player game logs
- `distributions/`: Distribution-related data processing
- `goat_comparison/`: GOAT comparison analysis
- `in_game_stats/`: In-game statistics processing
- `players_on_league_leaders_dash/`: League leaders dashboard data
- `nba_logo_scraper.py`: Script for scraping NBA team logos 
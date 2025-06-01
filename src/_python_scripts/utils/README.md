# WolfWise Python Utilities

This package contains common utility functions for interacting with NBA data and Supabase, designed for use across all WolfWise Python scripts.

## Features

- Supabase client initialization and data operations
- NBA API data fetching with retry logic
- Common data processing patterns

## Usage

### Importing the utilities

```python
# Import all utilities
from src._python_scripts.utils import *

# Or import specific modules
from src._python_scripts.utils.supabase_utils import load_to_supabase
from src._python_scripts.utils.nba_api_utils import get_player_stats
```

### Examples

#### Supabase Operations

```python
# Get a Supabase client
from src._python_scripts.utils import get_supabase_client

supabase = get_supabase_client()
result = supabase.from_('your_table').select('*').execute()
```

```python
# Load data to Supabase
import pandas as pd
from src._python_scripts.utils import load_to_supabase

# Create your DataFrame
df = pd.DataFrame(...)

# Load to Supabase with conflict handling
load_to_supabase(df, 'table_name', on_conflict='id_column')
```

#### NBA API Operations

```python
# Get player stats with built-in retry logic
from src._python_scripts.utils import get_player_stats

# Get current season stats
player_stats = get_player_stats()

# Get stats for a specific team
wolves_stats = get_player_stats(team_id=1610612750)  # Timberwolves ID

# Get advanced stats
advanced_stats = get_player_stats(measure_type='Advanced')
```

```python
# Get lineup data
from src._python_scripts.utils import get_lineup_stats

# Get 5-man lineup data
five_man = get_lineup_stats(lineup_size=5)

# Get 2-man lineup data with advanced metrics
two_man = get_lineup_stats(lineup_size=2, measure_type='Advanced')
```

## Configuration

These utilities expect the following environment variables:

- `SUPABASE_URL` or defaults to the hardcoded Supabase URL
- `SUPABASE_KEY` or `VITE_SUPABASE_ANON_KEY` for authentication

Use a `.env` file or set these variables in your environment before running scripts. 
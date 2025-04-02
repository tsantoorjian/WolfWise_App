# WolfWise v3

WolfWise is a modern web application built with React, TypeScript, and Vite that provides live game statistics and analysis. This is version 3 of the application, featuring enhanced visualizations and real-time data updates.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/tsantoorjian/WolfWisev3)

## Features

- Real-time game statistics visualization
- Interactive charts using ECharts and Chart.js
- Modern, responsive UI
- TypeScript for enhanced type safety
- Supabase integration for data management
- React Query for efficient data fetching and caching

## Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Data Visualization**: ECharts & Chart.js
- **Data Management**: Supabase
- **State Management**: React Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tsantoorjian/WolfWisev3.git
   cd WolfWisev3
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and not licensed for public use.

## Contact

Tony Santoorjian - [GitHub](https://github.com/tsantoorjian)

## Pages and Features

### Live Game Stats
- Real-time game statistics and updates
- Live tracking of player performance during games
- Dynamic updates for ongoing matches

### Player Stats
- Comprehensive player statistics and analytics
- Individual player performance metrics
- Last 5 and last 10 game performance tracking
- Interactive player selection with profile images
- Detailed statistical breakdowns

### Lineups
- Analysis of different lineup combinations
- Toggle between top and bottom performing lineups
- View 2-man, 3-man, and 5-man lineup configurations
- Performance metrics for each lineup combination
- Interactive lineup selection and filtering

### League Leaders
- Track team and league-wide statistical leaders
- Compare player performances across different categories
- Real-time updates of league standings and statistics

### Record Tracker
- Track progress towards NBA milestones
- Monitor player achievements and records
- Visual progress indicators and projections
- Track multiple statistical categories:
  - Points, Assists, Rebounds
  - Steals, Blocks, Turnovers
  - Field Goals, Three-Pointers, Free Throws

### Statistical Distributions
- Visual representation of statistical distributions
- Compare player performances across different metrics
- Interactive charts and data visualization
- Customizable statistical views and filters
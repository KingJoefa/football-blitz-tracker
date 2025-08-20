# Football Blitz Tracker 🏈

A comprehensive web application for tracking and analyzing NFL blitz pressures and defensive patterns. Built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

### Core Functionality
- **Blitz Recording**: Log detailed blitz information including type, formation, personnel, and results
- **Team Management**: Track all 32 NFL teams with their colors, conferences, and divisions
- **Game Tracking**: Monitor games, scores, and blitz statistics per game
- **Pattern Recognition**: Identify similar blitz scenarios across different games and teams
- **Advanced Analytics**: Visualize blitz trends, success rates, and team performance

### Blitz Classification System
The application includes a comprehensive categorization of blitz types:

- **Zone Blitzes**: Fire zone, cover 0, cover 1, cover 2
- **Man Blitzes**: Cover 0, cover 1, cover 2 with man coverage
- **Stunt Blitzes**: Twist, loop, cross patterns
- **Edge Blitzes**: Outside linebacker, corner, safety edge pressure
- **A-Gap Blitzes**: Middle linebacker, nose tackle interior pressure
- **Delayed Blitzes**: Secondary pressure with delayed timing

### Data Fields Tracked
Each blitz record includes:
- Game context (teams, quarter, time, down & distance)
- Field position and formation
- Personnel grouping (3-4, 4-3, Nickel, Dime)
- Blitzers involved (positions/jersey numbers)
- Results (sack, pressure, hurry, hit, etc.)
- Yards gained and additional notes

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd football-blitz-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main navigation and layout
├── data/               # Static data and mock data
│   ├── blitzTypes.ts   # Blitz type definitions
│   └── teams.ts        # NFL team information
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview and quick actions
│   ├── BlitzTracker.tsx # Record and view blitzes
│   ├── Analytics.tsx   # Charts and statistics
│   ├── Teams.tsx       # Team information and stats
│   └── Games.tsx       # Game schedules and results
├── types/              # TypeScript type definitions
│   └── index.ts        # Main type interfaces
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind
```

## 🎨 UI Components

### Design System
- **Colors**: NFL team colors and professional palette
- **Typography**: Inter for body text, Bebas Neue for headings
- **Components**: Consistent card layouts, buttons, and form elements
- **Responsive**: Mobile-first design with responsive breakpoints

### Key Components
- **Navigation**: Sidebar navigation with mobile support
- **Cards**: Consistent content containers with hover effects
- **Forms**: Comprehensive blitz recording forms with validation
- **Charts**: Interactive charts using Recharts library
- **Filters**: Advanced search and filtering capabilities

## 📊 Data Models

### Core Interfaces

```typescript
interface BlitzRecord {
  id: string
  gameId: string
  defensiveTeamId: string
  offensiveTeamId: string
  blitzTypeId: string
  quarter: 1 | 2 | 3 | 4
  timeRemaining: string
  down: 1 | 2 | 3 | 4
  distance: number
  fieldPosition: number
  formation: string
  personnel: string
  blitzers: string[]
  result: 'sack' | 'pressure' | 'hurry' | 'hit' | 'incomplete' | 'complete' | 'touchdown' | 'interception' | 'penalty'
  yardsGained?: number
  notes?: string
  timestamp: string
}
```

## 🔍 Search and Analytics

### Pattern Recognition
The application helps identify:
- Similar blitz scenarios across different games
- Team tendencies and preferences
- Situational effectiveness (down & distance, field position)
- Success rates by blitz type and formation

### Analytics Features
- **Blitz Type Distribution**: Visual breakdown of blitz types used
- **Team Performance**: Success rates and blitz frequency by team
- **Weekly Trends**: Track changes over time
- **Situational Analysis**: Down & distance effectiveness
- **Result Distribution**: Success rates by outcome type

## 🎯 Use Cases

### For Coaches and Analysts
- Track defensive tendencies of opponents
- Analyze blitz effectiveness in different situations
- Identify successful blitz patterns for game planning
- Monitor team blitz performance over time

### For Fans and Enthusiasts
- Learn about different blitz types and strategies
- Follow team defensive performance
- Understand situational football
- Track exciting defensive plays

### For Researchers
- Study defensive strategy evolution
- Analyze blitz effectiveness across different eras
- Research situational decision making
- Track coaching trends and innovations

## 🚧 Future Enhancements

### Planned Features
- **Video Integration**: Link blitz records to game film
- **Player Tracking**: Individual player blitz statistics
- **Advanced Analytics**: Machine learning pattern recognition
- **Mobile App**: Native mobile application
- **API Integration**: Real-time game data feeds
- **Export Functionality**: Data export for analysis tools

### Technical Improvements
- **Database Integration**: Replace mock data with real database
- **Authentication**: User accounts and team access
- **Real-time Updates**: Live game tracking
- **Performance Optimization**: Lazy loading and caching
- **Testing**: Comprehensive test coverage

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NFL teams and organizations
- Football strategy resources and communities
- Open source contributors and libraries
- Football analysts and coaches

---

**Built with ❤️ for football fans, coaches, and analysts**

*Track the blitz, understand the game*

# 3x3 Basketball Tournament Management System

A comprehensive web application for organizing and managing 3x3 basketball tournaments. Built with Next.js 15, TypeScript, and MySQL, this platform streamlines tournament creation, team registration, bracket generation, and match scheduling.

## 🏀 Features

### Tournament Management
- **Create Tournaments**: Organize tournaments with customizable settings
  - Single elimination and round robin formats
  - Age group categorization (U12, U14, U16, Adult)
  - Public or private tournaments with join codes
  - Custom registration periods and tournament dates
  - Location-based organization
  
- **Automated Scheduling**: Intelligent match scheduling system
  - Multi-court support with configurable court numbers
  - Time-based scheduling with daily start/end times
  - Automatic conflict prevention (team availability tracking)
  - Break time management between matches
  - Tournament duration estimation

- **Bracket Generation**: Advanced bracket systems
  - Single elimination with bye handling for non-power-of-2 team counts
  - Round robin with circle method for fair scheduling
  - Visual bracket display with real-time updates
  - Parent-child match relationships for progression tracking

### Team Management
- **Team Creation**: Easy team registration and management
  - Age group validation based on member birthdays
  - Unique join codes for team invitations
  - Captain and player role assignment
  - Team member limit enforcement (max 5 members)

- **Team Operations**:
  - Join teams via join codes
  - Promote members to captain
  - Remove team members
  - Leave teams
  - View team tournament history

### User Features
- **Authentication**: Secure user management
  - JWT-based session handling
  - Bcrypt password hashing
  - Email validation
  - Role-based access (player, organizer)

- **Profile Management**:
  - Update personal information
  - Change password
  - View tournament and team history
  - Age verification for tournament eligibility

### Match Management
- **Live Score Entry**: Real-time match result tracking
  - Score validation and winner determination
  - Forfeit handling
  - Automatic bracket progression
  - Team statistics updates (wins, losses, points)

- **Tournament Standings**:
  - Real-time leaderboard
  - Tiebreaker logic (head-to-head, point differential)
  - Win percentage calculations
  - Final position rankings

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **DaisyUI**: Component library with theming
- **React Hook Form**: Form validation
- **Zod**: Schema validation
- **Lucide React**: Icon library

### Backend
- **Next.js Server Actions**: Serverless API functions
- **MySQL**: Relational database
- **MySQL2**: Database driver with connection pooling
- **Jose**: JWT encryption/decryption
- **Bcrypt**: Password hashing

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── profile/                  # User profile page
│   ├── teams/                    # Team management pages
│   │   ├── create/
│   │   ├── join/
│   │   └── my-teams/
│   └── tournaments/              # Tournament pages
│       ├── create/
│       ├── join/
│       └── page.tsx              # Tournament listing
│
├── components/                   # React components
│   ├── auth/                     # Auth forms
│   ├── common/                   # Reusable components
│   ├── landing/                  # Landing page
│   ├── layout/                   # Layout components
│   ├── profile/                  # Profile components
│   ├── teams/                    # Team components
│   └── tournaments/              # Tournament components
│
└── lib/                          # Core business logic
    ├── constants/                # Application constants
    └── db/                       # Database layer
        ├── auth/                 # Authentication logic
        ├── brackets/             # Bracket generation algorithms
        ├── progression/          # Match progression logic
        ├── scheduling/           # Time scheduling engine
        ├── teams/                # Team operations
        ├── tournaments/          # Tournament operations
        ├── users/                # User management
        └── utils/                # Helper functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/FiestaBoy/3x3.git
cd 3x3
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB=3x3
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
```

4. **Set up the database**

Run the SQL schema to create necessary tables (schema available in database documentation).

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

The application uses a relational MySQL database with the following main tables:

- **users**: User accounts and authentication
- **teams**: Team information and join codes
- **team_member**: Team membership and roles
- **tournaments**: Tournament configurations
- **team_tournament**: Tournament registrations and statistics
- **tournament_games**: Match scheduling and results

See database documentation for detailed schema information.

## 🎨 Features in Detail

### Tournament Formats

#### Single Elimination
- Binary tree structure with parent-child relationships
- Automatic bye assignment for non-power-of-2 team counts
- Winner advances, loser is eliminated
- Optimal seeding (1 vs lowest, 2 vs 2nd lowest, etc.)

#### Round Robin
- Every team plays every other team once
- Circle method for balanced scheduling
- Tiebreaker system: wins → head-to-head → point differential → points scored

### Scheduling Algorithm

The time scheduler uses a greedy algorithm with the following features:
- **Time Complexity**: O(m × c × d) where m=matches, c=courts, d=days
- **Court Assignment**: Assigns matches to earliest available court
- **Conflict Prevention**: Tracks team availability to prevent overlapping matches
- **Break Management**: Ensures break time between matches
- **Multi-day Support**: Distributes matches across tournament duration

### Security Features
- JWT-based session management
- Password hashing with bcrypt (10 salt rounds)
- Protected routes with middleware
- Role-based access control
- SQL injection prevention with parameterized queries

## 🎯 Usage Guide

### Creating a Tournament
1. Navigate to "Create Tournament"
2. Fill in tournament details (name, dates, location)
3. Select format (Single Elimination or Round Robin)
4. Set age group and team limit
5. Choose public or private (generates join code if private)
6. Submit to create

### Scheduling Matches
1. Open your hosted tournament
2. Click "Schedule Matches"
3. Configure:
   - Number of courts
   - Daily start/end times
   - Break duration between matches
4. Generate schedule (automatic validation and estimation)

### Entering Match Results
1. Navigate to hosted tournament
2. Go to "Match Management" tab
3. Select a pending match
4. Enter scores for both teams
5. Submit (winner automatically advances in bracket)

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Code Style
- TypeScript strict mode enabled
- Prettier for code formatting
- ESLint for code quality
- DaisyUI themes: Corporate (light) and Business (dark)

## 📝 API Structure

The application uses Next.js Server Actions for API endpoints:

- All database operations are in `src/lib/db/`
- Server actions are marked with `"use server"`
- Type-safe with TypeScript interfaces
- Validation with Zod schemas

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- **FiestaBoy** - Initial work

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This is a tournament management system specifically designed for 3x3 basketball tournaments. The algorithms and scheduling logic are optimized for this format.
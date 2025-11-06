# LabPulse - Operations Intelligence Dashboard

A comprehensive operations intelligence dashboard for dental laboratory management, providing real-time insights into performance, cost trends, staffing efficiency, and operational anomalies across multiple laboratory locations.

## Features

### Executive Command Center
- **Real-time Overview**: View all lab locations at a glance with color-coded status indicators
- **KPI Summary Cards**: Total labs, employees, revenue, and alert counts
- **Interactive Lab Grid**: Quick access to each lab's current performance metrics

### Laboratory Analytics
- **Performance Tracking**: Monitor denture units, patient volume, and revenue trends
- **Expense Management**: Track lab expenses, supplies, personnel costs as % of revenue
- **Anomaly Detection**: Automatic flagging of issues like high expenses, overtime, or revenue decline
- **Historical Analysis**: 12-month trend charts for revenue, production, and expenses
- **Visual Insights**: Interactive charts including line graphs, bar charts, and pie charts

### Data Management
- **Lab Management**: Add, edit, and manage laboratory locations
- **Employee Roster**: Track staff by position, hire date, and tenure
- **Monthly Metrics**: Enter and track financial and operational data month-by-month
- **Flexible Updates**: Data can be updated at any time

### Smart Alerting
- **Three-Level System**: Green (on track), Yellow (attention needed), Red (critical)
- **Automatic Thresholds**:
  - Lab expenses >13% of revenue
  - Personnel expenses >7% of revenue
  - Backlog or overtime status
  - Staffing inefficiencies
  - Revenue decline trends

## Technology Stack

### Backend
- **Node.js** with **Express** - Fast, scalable REST API
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database operations with SQLite (upgradeable to PostgreSQL)
- **JWT Authentication** - Secure user authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type safety throughout
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful data visualizations
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Router** - Client-side routing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- SQLite for prototype (easily upgradeable to PostgreSQL for production)

## Prerequisites

- **Node.js** 20+ (Download from [nodejs.org](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server and client dependencies
npm install --workspace=server
npm install --workspace=client
```

### 2. Set Up Environment Variables

```bash
# Copy example environment file
cp server/.env.example server/.env

# Edit server/.env if needed (defaults are fine for development)
```

### 3. Initialize Database

```bash
# Generate Prisma Client
cd server
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
```

### 4. Start Development Servers

```bash
# From the root directory, start both servers concurrently
npm run dev

# Or start them separately:
# Terminal 1 - Backend (runs on http://localhost:3001)
npm run dev:server

# Terminal 2 - Frontend (runs on http://localhost:3000)
npm run dev:client
```

### 5. Access the Application

Open your browser and navigate to **http://localhost:3000**

**Demo Login Credentials:**
- Email: `demo@labpulse.com`
- Password: `demo123`

## Database Management

### View/Edit Database (Prisma Studio)

```bash
cd server
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can view and edit data directly.

### Reset Database

```bash
cd server
npx prisma migrate reset
npx prisma db seed
```

### Backup Database

```bash
# SQLite database file location:
cp server/prisma/dev.db server/prisma/backup-$(date +%Y%m%d).db
```

## Project Structure

```
LabPulse/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components (Dashboard, Lab Detail, etc.)
│   │   ├── services/          # API service layer
│   │   ├── stores/            # Zustand state management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions (formatters, etc.)
│   │   ├── App.tsx            # Main app component with routing
│   │   ├── main.tsx           # Application entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets
│   ├── index.html             # HTML entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
│
├── server/                    # Backend Node.js/Express API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.ts        # Authentication routes
│   │   │   ├── labs.ts        # Lab management routes
│   │   │   ├── employees.ts   # Employee management routes
│   │   │   ├── metrics.ts     # Monthly metrics routes
│   │   │   └── dashboard.ts   # Dashboard analytics routes
│   │   ├── middleware/        # Express middleware
│   │   │   └── auth.ts        # JWT authentication middleware
│   │   ├── utils/             # Utility functions
│   │   │   ├── jwt.ts         # JWT token generation/verification
│   │   │   └── calculations.ts # KPI calculations & anomaly detection
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Sample data seeding script
│   │   └── dev.db             # SQLite database (created after migration)
│   ├── package.json           # Backend dependencies
│   └── tsconfig.json          # TypeScript configuration
│
├── package.json               # Root package.json (workspace config)
├── docker-compose.yml         # Docker Compose configuration
└── README.md                  # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Labs
- `GET /api/labs` - Get all labs for authenticated user
- `GET /api/labs/:id` - Get single lab with details
- `POST /api/labs` - Create new lab
- `PUT /api/labs/:id` - Update lab
- `DELETE /api/labs/:id` - Delete lab

### Employees
- `GET /api/employees/lab/:labId` - Get all employees for a lab
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Metrics
- `GET /api/metrics/lab/:labId` - Get all metrics for a lab
- `POST /api/metrics` - Create or update monthly metric
- `DELETE /api/metrics/:id` - Delete metric

### Dashboard
- `GET /api/dashboard/overview` - Get executive dashboard overview
- `GET /api/dashboard/lab/:labId` - Get detailed lab analytics

## Data Model

### Lab/Office
- Identification (ID, city, state, practice model)
- Contact information (address, phone)
- Management (managing dentist, DFO, lab manager)
- Staffing (total staff, breakdown by role)
- Status (backlog, overtime, labor model, standardization)

### Employee
- Name, position, hire date
- Contact information (optional)
- Linked to lab

### Monthly Metrics
- Period (month, year)
- Performance (denture units, patient volume, revenue)
- Expenses (lab, supplies, personnel, overtime, bonuses)
- Status indicators (backlog, overtime)

## Key Performance Indicators (KPIs)

### Tracked Metrics
- **Revenue**: Monthly practice revenue
- **Production**: Denture units produced, patient volume
- **Expenses**: Total lab expenses, supplies, personnel costs
- **Ratios**: All expenses calculated as % of revenue

### Goal Thresholds
- **Total Lab Expenses**: < 13% of practice revenue
- **Personnel Expenses**: < 7% of practice revenue
- **Labor Model**: 0 = properly staffed, >0 = overstaffed, <0 = understaffed

### Anomaly Detection
The system automatically detects and flags:
- Expenses exceeding goal thresholds
- Persistent backlog or overtime
- Staffing inefficiencies
- Revenue decline (>10% vs. previous period)
- Statistical outliers (>2 standard deviations from network mean)

## Production Deployment

### Option 1: Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access at http://localhost:3000

### Option 2: Manual Build

```bash
# Build backend
cd server
npm run build

# Build frontend
cd ../client
npm run build

# Deploy dist folders to your hosting service
```

### Environment Variables for Production

Update `server/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/labpulse"
NODE_ENV=production
JWT_SECRET="your-secure-random-secret"
CORS_ORIGIN="https://your-domain.com"
```

### Upgrading to PostgreSQL

1. Update `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update DATABASE_URL in `.env`

3. Run migrations:
```bash
npx prisma migrate dev
npx prisma db seed
```

## User Guide

### Adding Your First Lab

1. Log in to the application
2. Navigate to "Labs Management"
3. Click "Add Lab"
4. Fill in the required information:
   - Office ID, City, State
   - Practice model (PO or PLLC)
   - Contact information
   - Managing dentist and DFO
   - Lab manager details
5. Click "Create Lab"

### Adding Employees

1. Go to "Labs Management"
2. Find your lab and click "Add Employee"
3. Enter employee details:
   - Name, position, hire date
   - Optional: email and phone
4. Staff counts will update automatically

### Entering Monthly Data

1. Go to "Labs Management"
2. Find your lab and click "Add Monthly Data"
3. Select month and year
4. Enter performance metrics:
   - Denture units, patient volume, revenue
5. Enter expense data:
   - Lab expenses, supplies, personnel costs
6. Check status indicators if applicable
7. Click "Save Monthly Data"

### Viewing Analytics

1. From the Dashboard, click on any lab card
2. View comprehensive analytics:
   - Current month KPIs
   - 12-month trend charts
   - Expense breakdown
   - Employee roster
3. Pay attention to alert indicators and flagged issues

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are in use:

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change ports in:
# - client/vite.config.ts (port 3000)
# - server/.env (PORT=3001)
```

### Database Errors

```bash
# Reset and regenerate database
cd server
rm -rf prisma/migrations
rm prisma/dev.db
npx prisma migrate dev --name init
npx prisma db seed
```

### Cannot Find Module Errors

```bash
# Reinstall all dependencies
rm -rf node_modules client/node_modules server/node_modules
npm install
```

## Future Enhancements

### Planned Features
- CSV/Excel import for bulk data entry
- Email notifications for critical alerts
- Predictive analytics using historical trends
- Multi-location comparison reports
- Export to PDF/Excel functionality
- Role-based access control (lab managers vs. executives)
- Mobile app for on-the-go monitoring
- Integration with accounting systems
- Advanced forecasting and budget planning

## Support

For issues, questions, or feature requests, please contact the development team or create an issue in the project repository.

## License

MIT License - See LICENSE file for details

---

**LabPulse** - Keep a pulse on your lab operations
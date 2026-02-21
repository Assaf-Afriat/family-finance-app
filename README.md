# Family Finance Manager

A modern, local-first desktop application for personal and family finance management. Track expenses, manage budgets, and visualize your financial health - all with your data stored securely on your own computer.

![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?logo=sqlite)

## Features

### Multi-User Support
- **Profile Selection** - Switch between family members on launch
- **Personal & Joint Tracking** - Tag transactions and accounts as personal or shared
- **Individual Dashboards** - Each user sees their own financial overview
- **Edit & Delete Profiles** - Manage family member profiles in settings

### Dashboard
- **KPI Cards** - Net worth, monthly income, expenses, and remaining budget at a glance
- **Income vs Expenses Chart** - 6-month trend visualization
- **Expenses by Category** - Donut chart breakdown of spending
- **Budget Health** - Progress bars showing budget utilization
- **Recent Transactions** - Quick view of latest activity

### Transaction Management
- **Full Transaction History** - View all income and expenses
- **Smart Filters** - Filter by type, category, ownership, and search
- **Add & Edit Transactions** - Full CRUD support with category, amount, and date
- **Delete with Confirmation** - Remove transactions safely
- **Toast Notifications** - Instant feedback on all actions

### Account Management
- **Multiple Account Types** - Checking, Savings, Credit Cards, Cash, Investment
- **Add & Edit Accounts** - Full account management
- **Balance Tracking** - Automatic balance updates with transactions
- **Joint Accounts** - Mark accounts as shared between family members
- **Net Worth Calculation** - Assets minus liabilities

### Budget Tracking
- **Category Budgets** - Set monthly spending limits per category
- **Visual Progress** - Color-coded progress bars (green/amber/red)
- **Status Indicators** - "On Track", "Near Limit", "Over Budget" badges
- **Monthly Reset** - Budgets automatically reset each month

### Dark Mode & Themes
- **Light / Dark / System** - Choose your preferred theme
- **Persistent Preference** - Theme saved across sessions
- **System Theme Detection** - Automatically match OS preference

### Multi-Language Support (i18n)
- **English** - Full English interface
- **עברית (Hebrew)** - Complete Hebrew translation with RTL support
- **Persistent Language** - Preference saved across sessions
- **Easy Switching** - Change language anytime from settings

### Data Management
- **CSV Export** - Export all transactions to CSV
- **Local Storage** - All data stays on your computer
- **No Cloud Required** - Complete privacy

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Electron 29 |
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Charts** | Recharts |
| **Database** | SQLite (local) + Prisma ORM |
| **State** | Zustand |
| **i18n** | react-i18next |
| **Currency** | ILS (₪) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Assaf-Afriat/family-finance-app.git
cd family-finance-app

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Create database and seed with sample data
npm run db:push
npm run db:seed
```

### Running the App

```bash
# Development (browser only)
npm run dev

# Development with Electron (desktop app)
npm run electron:dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser, or wait for the Electron window to open.

### Database Commands

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset database and re-seed
```

## Project Structure

```
family-finance-app/
├── electron/              # Electron main process
│   ├── main.ts           # App entry, IPC handlers
│   ├── preload.ts        # Context bridge API
│   └── database.ts       # Prisma database operations
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Sample data seeder
├── src/
│   ├── components/
│   │   ├── layout/       # Sidebar, Header, MainLayout
│   │   ├── dashboard/    # KPI cards, charts, widgets
│   │   ├── transactions/ # Add/Edit transaction modals
│   │   ├── accounts/     # Add/Edit account modals
│   │   ├── shared/       # Theme toggle, Language selector
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Route pages
│   ├── stores/           # Zustand state stores
│   ├── locales/          # Translation files (en.json, he.json)
│   ├── lib/              # Utilities (currency, i18n, etc.)
│   └── types/            # TypeScript interfaces
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Screenshots

### Dashboard
View your financial health at a glance with KPIs, charts, and recent activity.

### Transactions
Full transaction history with search, filters, and edit functionality.

### Accounts
Manage bank accounts, credit cards, and cash with balance tracking.

### Budgets
Set and track monthly spending limits by category.

### Settings
Manage profiles, themes, language, and export data.

## Privacy & Security

- **100% Local** - All data stored on your computer
- **No Cloud** - No data leaves your machine
- **SQLite Database** - Simple, portable database file
- **Context Isolation** - Secure Electron architecture

## Roadmap

- [x] Dark mode toggle
- [x] Edit transactions & accounts
- [x] Toast notifications
- [x] Hebrew language support (RTL)
- [x] CSV data export
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Multiple currencies
- [ ] Reports page with detailed analytics
- [ ] PDF export
- [ ] Data backup/restore
- [ ] Production build & installer

## License

MIT License - feel free to use and modify for personal use.

## Author

Built with ❤️ for family finance management.

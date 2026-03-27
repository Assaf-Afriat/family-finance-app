# Family Finance Manager

Local-first desktop finance management for a family household. The app runs in Electron, stores data in SQLite via Prisma, and keeps all data on the local machine.

## Current Status

- Core desktop MVP is working.
- TypeScript passes.
- Database bootstrap works with `db:push` and `db:seed`.
- Production packaging works and produces a portable Windows executable.
- Active profile scoping is enforced as `personal + joint`.

## Implemented Features

- Profile selection and profile management
- Dashboard with KPIs, monthly trends, category breakdown, budget health, and recent transactions
- Transaction CRUD with filters, undo-delete toast, and category-aware forms
- Account CRUD plus account-to-account transfers
- Monthly budgets with create, edit, delete, and progress tracking
- Recurring transactions with pause/resume and manual processing
- Bills tracking with upcoming, overdue, and mark-paid flows
- Reports page with charts and PDF export
- Category management for custom income and expense categories
- CSV import and export
- Database backup and restore
- Theme switching, keyboard shortcuts, English/Hebrew i18n, and RTL support

## Tech Stack

- Electron 29
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- Zustand
- Prisma + SQLite
- Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

### Run

```bash
npm run electron:dev
```

Browser-only mode is for renderer development only:

```bash
npm run dev
```

## Database

- Dev database: `prisma/family-finance.db`
- Packaged database: copied to Electron `userData` on first launch

Useful commands:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run db:reset
npm run db:studio
```

## Build

```bash
npm run build
```

Build output:

- Renderer bundle: `dist/`
- Electron bundle: `dist-electron/`
- Portable Windows executable: `release-build/Family Finance 1.0.0.exe`

## Notes

- Currency is currently ILS-only.
- Browser mode still uses fallback/mock behavior and is not a supported release target.
- Packaging currently works without `asar`; that is functional but not ideal for long-term hardening.

## Remaining Work

- Add tests
- Add app icon and release polish
- Reduce large renderer bundle size
- Address remaining transitive production advisories reported by `npm audit --omit=dev`

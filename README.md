# Process Management System

An offline desktop application for managing plant and quarry operations — equipment, vehicles, daily production, expenses, and profit distribution.

## Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Database  | SQLite (better-sqlite3)        |
| API       | Express.js                     |
| Frontend  | React, Tailwind CSS            |
| Runtime   | Node.js                        |
| Desktop   | Electron                       |

## Features

| Module | Description |
|--------|-------------|
| **Master Data** | Register equipment (generators, excavators, loaders, dumpers), employees, and expense categories. All downstream reports auto-update when masters change. |
| **Daily Entries** | Tabbed forms for generators, excavators, loaders, dumpers, blasting material, langar, plant expenses, misc expenses, and salaries. |
| **Production** | Daily gravel-to-aggregate tracking with clay/dust deduction. Monthly allowance, sales, and stock valuation management. Edit and delete past entries. |
| **Monthly Summary** | Dynamic expense table with columns generated from registered equipment. Misc expenses tracked separately and excluded from totals. |
| **Yearly Summary** | Annual expense breakdown by month with quarterly analysis. Categories driven entirely by master data. |
| **Profit Sharing** | Partner profit distribution based on revenue (sales + stock value) minus total operational expenses. |
| **Transactions** | Unified view of all entries across the system with filtering, editing, and deletion. |

## Quick Start

### Prerequisites

- Node.js v18+
- npm

### Install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Electron (desktop wrapper)
cd ../electron && npm install
```

### Initialize Database

```bash
cd backend
npm run db:init
```

### Run (Development)

```bash
cd electron
npm start
```

### Build Installer

```bash
cd electron
npm run dist
```

The packaged application will appear in `electron/dist/`.

## Project Structure

```
├── backend/               Express.js API + SQLite database
│   ├── sqlite/            Repositories, controllers, routes, seeds
│   ├── config/            Environment configuration
│   ├── middlewares/        Error handling, validation
│   └── scripts/           Database initialization utilities
├── frontend/              React + Tailwind CSS
│   └── src/
│       ├── pages/         DailyEntries, Production, MonthlySummary, YearlySummary, Transactions
│       ├── components/    Reusable UI (Toast, Input, Select, Button, etc.)
│       ├── context/       DataContext — global state management
│       └── services/      API service layer
├── electron/              Electron desktop shell
│   ├── main.js            Main process — starts backend, creates window
│   └── preload.js         Context isolation bridge
├── README.md
└── USER_MANUAL.md
```

## Documentation

- [User Manual](USER_MANUAL_V2.md) — complete guide to every module and workflow


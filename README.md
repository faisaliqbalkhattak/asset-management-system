# Asset Management System

Offline desktop software for plant and quarry operations: equipment, vehicles, daily production, expenses, and partner profit sharing.

## Stack

| Layer | Technology |
|---|---|
| Database | SQLite via `sql.js` |
| API | Express.js |
| Frontend | React, React Router, Tailwind CSS, Axios |
| Desktop | Electron |
| Runtime | Node.js 18+ |

## What The App Does

The app is split into three parts:

1. `backend/` hosts the API on port `3001`, initializes the database, and serves the React build when present.
2. `frontend/` contains the React UI with the visible routes and all data-entry/reporting screens.
3. `electron/` starts the backend, opens the desktop window, and packages the app into a Windows installer.

## Main Screens

| Screen | Purpose |
|---|---|
| Dashboard | Overview of current operational data |
| Daily Entries | Generator, excavator, loader, dumper, blasting, plant mess, plant expense, misc expense, and salary entries |
| Masters | Equipment, employees, and expense category management |
| Transactions | Unified view of recorded entries with filtering and editing |
| Production | Daily gravel-to-aggregate tracking and monthly production summaries |
| Monthly Summary | Month-wise expense and operational summary tables |
| Profit Sharing | Partner ledger and profit distribution workflows |
| Yearly Summary | Annual summary and analysis views |

## Data Flow

- Frontend API calls go to `/api` through `frontend/src/services/api.js`.
- The global data store lives in `frontend/src/context/DataContext.js`.
- Backend routes are organized under `backend/sqlite/routes/` and backed by repositories in `backend/sqlite/repositories/`.
- Electron loads `http://localhost:3001` and starts the backend process automatically.

## Setup

### Prerequisites

- Node.js v18 or later
- npm

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../electron
npm install
```

### Initialize The Database

```bash
cd backend
npm run db:init
```

### Run The Desktop App In Development

```bash
cd electron
npm start
```

### Build The Windows Installer

```bash
cd electron
npm run dist
```

The packaged installer is generated in `electron/dist/`.

## Useful Scripts

### Root

- `npm start` - launches Electron
- `npm run build` - creates the packaged desktop build

### Backend

- `npm start` - starts the Express API
- `npm run dev` - starts the API with nodemon
- `npm run db:init` - creates or initializes the database
- `npm run db:seed` - seeds sample data
- `npm run db:inspect` - inspects database contents

### Frontend

- `npm start` - starts the React dev server
- `npm run build` - creates the production frontend bundle
- `npm test` - runs the React test runner

### Electron

- `npm start` - runs the desktop shell
- `npm run dist` - builds the installer

## Project Structure

```
├── backend/
│   ├── app.js
│   ├── config/
│   ├── middlewares/
│   ├── scripts/
│   └── sqlite/
├── electron/
│   ├── main.js
│   └── preload.js
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── images/
├── README.md
└── USER_MANUAL_V2.md
```

## Documentation

- [User Manual](USER_MANUAL_V2.md) - complete guide to the workflows and screens


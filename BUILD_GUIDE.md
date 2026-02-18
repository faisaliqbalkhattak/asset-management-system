# How to Build the Application (EXE)

I have configured the project to be packaged as a standalone Windows executable.

## Prerequisites
1.  Ensure you have Node.js installed on your machine.
2.  Open a terminal in `c:\Users\HP\Documents\process-management-system\development`.

## Build Steps
Run the following commands in the root directory:

```powershell
# 1. Install dependencies for the build tools
npm install

# 2. Build the application (Frontend + Backend + Electron)
# This will take a few minutes as it builds the React app and downloads Electron binaries.
npm run dist
```

## Output
*   After the command finishes, check the **`dist`** folder.
*   You will find an installer file (e.g., `Process Management System Setup 1.0.0.exe`).
*   Send this file to your client.

## Data Safety Features
*   **Database Location:** The database is now stored in `%APPDATA%\ProcessManagementSystemData` instead of the installation folder.
*   **Safety:** Even if the user uninstalls the app or deletes the EXE, the data remains safe in their AppData folder.
*   **Updates:** Installing a new version will NOT overwrite their data.

## Troubleshooting
If the build fails on `better-sqlite3`, it is likely because `electron-builder` is trying to rebuild native modules. 
To fix this, run:
```powershell
npm run rebuild-backend
```
(I have added this script just in case).

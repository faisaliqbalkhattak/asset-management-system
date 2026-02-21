const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: "Asset Management System",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In production (bundled), the backend serves the React frontend on port 3001
  // Load the ROOT URL (/) which serves index.html — NOT /api (that returns JSON)
  const startUrl = 'http://localhost:3001';

  const loadApp = () => {
    mainWindow.loadURL(startUrl).catch((err) => {
      console.log('Waiting for backend server...');
      setTimeout(loadApp, 1000);
    });
  };

  loadApp();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  // Locate app.js - try multiple paths for different environments
  const resourcesPath = process.resourcesPath || path.join(__dirname, '..');
  
  const pathsToTry = [
    // electron-builder extraResources: resources/backend/app.js
    path.join(resourcesPath, 'backend', 'app.js'),
    // Dev: electron/../backend/app.js
    path.join(__dirname, '..', 'backend', 'app.js'),
  ];
  
  let backendPath;
  for (const p of pathsToTry) {
    console.log(`  Checking backend at: ${p} -> ${fs.existsSync(p) ? 'FOUND' : 'not found'}`);
    if (fs.existsSync(p)) {
      backendPath = p;
      break;
    }
  }
  
  if (!backendPath) {
    console.error('Could not find backend app.js in any expected location!');
    return;
  }
  
  console.log(`Starting backend from: ${backendPath}`);

  // Locate frontend build folder to pass to backend
  const frontendPaths = [
    // electron-builder extraResources: resources/frontend-build/
    path.join(resourcesPath, 'frontend-build'),
    // Dev: electron/../frontend/build
    path.join(__dirname, '..', 'frontend', 'build'),
  ];
  let frontendBuildPath = '';
  for (const p of frontendPaths) {
    if (fs.existsSync(p)) {
      frontendBuildPath = p;
      break;
    }
  }
  console.log(`Frontend build path: ${frontendBuildPath || 'NOT FOUND (API only)'}`);

  serverProcess = fork(backendPath, [], {
    env: { 
      ...process.env, 
      PORT: 3001,
      NODE_ENV: 'production',
      FRONTEND_BUILD_PATH: frontendBuildPath,
    },
    silent: false // Let backend output to console
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

let isQuitting = false;

app.on('before-quit', (e) => {
  // If we haven't started shutting down the backend, do it now
  if (serverProcess && !isQuitting) {
    e.preventDefault(); // Cancel the quit
    isQuitting = true;
    
    console.log('Sending shutdown signal to backend...');
    
    // Send graceful shutdown message
    try {
        if (serverProcess.connected) {
            serverProcess.send('shutdown');
        } else {
            // If IPC channel closed, send signal
            serverProcess.kill('SIGTERM');
        }
    } catch (err) {
        console.error('Error communicating with backend:', err);
        serverProcess.kill('SIGTERM');
    }

    // Force quit after 5 seconds if backend hangs
    const forceQuitTimeout = setTimeout(() => {
        console.log('Backend shutdown timed out, forcing quit...');
        if (serverProcess) serverProcess.kill('SIGKILL');
        app.quit(); // Resume quit
    }, 5000);

    serverProcess.on('exit', (code, signal) => {
        console.log(`Backend exited with code ${code} and signal ${signal}`);
        clearTimeout(forceQuitTimeout);
        app.quit(); // Resume quit
    });
  }
});

app.on('quit', () => {
  // Last resort cleanup
  if (serverProcess) {
    try {
        serverProcess.kill('SIGKILL');
    } catch(e) {}
  }
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

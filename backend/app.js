/**
 * Process Management System - Main Application
 * =============================================
 * Express server with SQLite database
 * 
 * Features:
 * ---------
 * - RESTful API endpoints
 * - JWT authentication
 * - SQLite database (WAL mode)
 * - Error handling middleware
 * - Request logging
 * 
 * Environment:
 * ------------
 * - PORT: Server port (default 3001)
 * - NODE_ENV: development | test | production
 * - DB_PATH: SQLite database file path
 * - JWT_SECRET: Secret key for JWT signing
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load environment configuration
const { PORT, NODE_ENV } = require('./config/env');

// Initialize database
const { initializeDatabase, closeDatabase, createTables } = require('./sqlite/db');

// Import middleware
const { errorHandler } = require('./middlewares');

// Import routes
const routes = require('./sqlite/routes');

const fs = require('fs');

// =====================================================
// EXPRESS APP SETUP
// =====================================================

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for local static file serving issues (React inline scripts)
}));

// Enable CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (only in development)
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

async function startServer() {
    // Initialize database first
    await initializeDatabase();

    // Ensure all tables exist (creates any missing ones)
    try {
        createTables();
    } catch(err) {
        console.error("Error creating tables:", err);
    }

    // =====================================================
    // API ROUTES
    // =====================================================

    // Mount all routes under /api
    app.use('/api', routes());

    // Serve static frontend files in production/electron
    // Robust path resolution for various environments (Local, Electron, Pkg)
    const pathsToCheck = [
        // Electron main.js passes the resolved frontend build path
        process.env.FRONTEND_BUILD_PATH,
        // Electron unpacked structure: backend and frontend are siblings under resources/app/
        path.join(__dirname, '..', 'frontend', 'build'),
        // Alternative: backend/../frontend/build (same as above, explicit)
        path.join(__dirname, '../frontend/build'),
        // Pkg / Current working directory
        path.join(process.cwd(), 'frontend', 'build'),
        path.join(process.cwd(), 'build'),
        // Standard deployment (backend/public)
        path.join(__dirname, '..', 'public'),
    ].filter(Boolean);

    let staticPath = null;
    
    console.log('Searching for frontend build folder...');
    for (const p of pathsToCheck) {
        const exists = fs.existsSync(p);
        console.log(`  ${exists ? '✓' : '✗'} ${p}`);
        if (exists && !staticPath) {
            staticPath = p;
        }
    }
    
    // First try standard 'public' folder (deployment), then 'frontend/build' (dev/monorepo)
    if (staticPath) {
        console.log(`Serving static files from ${staticPath}`);
        app.use(express.static(staticPath));
        app.get('*', (req, res) => {
             if (!req.path.startsWith('/api')) {
                res.sendFile(path.join(staticPath, 'index.html'));
            }
        });
    } else {
        console.warn('Frontend build folder not found. Serving API only.');
        // Root route if no frontend found
        app.get('/', (req, res) => {

            res.json({
                success: true,
                message: 'Process Management System API',
                version: '1.0.0',
                environment: NODE_ENV,
                documentation: '/api/health'
            });
        });
    }

    // 404 handler
    app.use((req, res, next) => {
        if (!res.headersSent) {
            res.status(404).json({
                success: false,
                error: `Route not found: ${req.method} ${req.originalUrl}`
            });
        }
    });

    // Error handler (must be last)
    app.use(errorHandler);

    // =====================================================
    // SERVER STARTUP
    // =====================================================
    const server = app.listen(PORT, () => {
        console.log(`✓ Server running in ${NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully (SIGINT)...');
        server.close(() => {
            closeDatabase();
            console.log('Server and database connection closed.');
            process.exit(0);
        });
    });

    // Handle SIGTERM (sent by Electron or system)
    process.on('SIGTERM', () => {
        console.log('\nShutting down gracefully (SIGTERM)...');
        server.close(() => {
            closeDatabase();
            console.log('Server and database connection closed.');
            process.exit(0);
        });
    });

    // Handle IPC message from Electron
    process.on('message', (msg) => {
        if (msg === 'shutdown') {
            console.log('\nReceived shutdown signal from Electron...');
            server.close(() => {
                closeDatabase();
                console.log('Server and database connection closed.');
                process.exit(0);
            });
        }
    });
}


startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

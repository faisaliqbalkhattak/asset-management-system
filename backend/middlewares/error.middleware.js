/**
 * Global Error Handler Middleware
 * ================================
 * Catches all errors and returns consistent JSON responses
 * 
 * Features:
 * ---------
 * - Handles SQLite specific errors (UNIQUE constraint, etc.)
 * - Handles validation errors
 * - Logs errors for debugging
 * - Hides stack traces in production
 * 
 * Usage:
 *   app.use(errorMiddleware); // Must be last middleware
 */

const { NODE_ENV } = require('../config/env');
const ErrorResponse = require('./ErrorResponse');

/**
 * Error handler middleware
 * 
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorMiddleware = (err, req, res, next) => {
    // Create a copy and preserve message
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode;

    // Log error for developer (with color coding)
    if (NODE_ENV === 'development') {
        console.error('\x1b[31m%s\x1b[0m', `[ERROR] ${err.name}: ${err.message}`);
        console.error('\x1b[33m%s\x1b[0m', `[STACK] ${err.stack}`);
    } else {
        console.error(`[ERROR] ${err.name}: ${err.message}`);
    }

    // =====================================================
    // SQLite Specific Errors
    // =====================================================

    // UNIQUE constraint violation
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
        const field = err.message.split(':').pop().trim();
        const message = `Duplicate value: ${field} already exists`;
        error = new ErrorResponse(message, 409);
    }

    // Foreign key constraint violation
    if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
        const message = 'Related resource not found. Check referenced IDs.';
        error = new ErrorResponse(message, 400);
    }

    // NOT NULL constraint violation
    if (err.message && err.message.includes('NOT NULL constraint failed')) {
        const field = err.message.split(':').pop().trim();
        const message = `Required field missing: ${field}`;
        error = new ErrorResponse(message, 400);
    }

    // CHECK constraint violation
    if (err.message && err.message.includes('CHECK constraint failed')) {
        const message = 'Validation failed. Check field values are within allowed range.';
        error = new ErrorResponse(message, 400);
    }

    // =====================================================
    // Validation Errors (custom)
    // =====================================================

    if (err.name === 'ValidationError') {
        const message = err.message;
        error = new ErrorResponse(message, 400);
    }

    // =====================================================
    // JWT Errors
    // =====================================================

    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please log in again.';
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired. Please log in again.';
        error = new ErrorResponse(message, 401);
    }

    // =====================================================
    // Final Response
    // =====================================================

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        // Include stack trace only in development
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorMiddleware;

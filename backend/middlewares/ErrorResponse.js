/**
 * Custom Error Response Class
 * ===========================
 * Extends the native Error class to include HTTP status codes
 * 
 * Usage:
 *   throw new ErrorResponse('Resource not found', 404);
 * 
 * @class ErrorResponse
 * @extends Error
 * 
 * Properties:
 * -----------
 * @property {string} message     - Error message to display
 * @property {number} statusCode  - HTTP status code (400, 401, 404, 500, etc.)
 * @property {boolean} isOperational - Distinguishes operational vs programming errors
 */

class ErrorResponse extends Error {
    /**
     * Creates an instance of ErrorResponse.
     * 
     * @param {string} message - The error message
     * @param {number} statusCode - HTTP status code
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Mark as operational error (expected)
        
        // Capture stack trace, excluding constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ErrorResponse;

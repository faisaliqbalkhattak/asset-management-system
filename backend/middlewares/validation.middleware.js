/**
 * Validation Middleware
 * =====================
 * Validates request body, query, and params
 * 
 * Features:
 * ---------
 * - Validates required fields
 * - Validates data types
 * - Validates enum values
 * - Validates date formats
 * 
 * Usage:
 *   router.post('/', validate(vehicleSchema), controller);
 */

const ErrorResponse = require('./ErrorResponse');

/**
 * Creates a validation middleware from a schema
 * 
 * @param {Object} schema - Validation schema
 * @param {string} source - 'body', 'query', or 'params' (default: 'body')
 * @returns {Function} - Express middleware function
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = req[source];
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            // Required check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            // Skip further validation if value is not provided and not required
            if (value === undefined || value === null) continue;

            // Type check
            if (rules.type) {
                const actualType = typeof value;
                if (rules.type === 'number' && actualType !== 'number') {
                    errors.push(`${field} must be a number`);
                }
                if (rules.type === 'string' && actualType !== 'string') {
                    errors.push(`${field} must be a string`);
                }
                if (rules.type === 'boolean' && actualType !== 'boolean') {
                    errors.push(`${field} must be a boolean`);
                }
                if (rules.type === 'array' && !Array.isArray(value)) {
                    errors.push(`${field} must be an array`);
                }
            }

            // Enum check
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }

            // Min/Max for numbers
            if (typeof value === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`${field} must be at least ${rules.min}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`${field} must be at most ${rules.max}`);
                }
            }

            // Min/Max length for strings
            if (typeof value === 'string') {
                if (rules.minLength !== undefined && value.length < rules.minLength) {
                    errors.push(`${field} must be at least ${rules.minLength} characters`);
                }
                if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                    errors.push(`${field} must be at most ${rules.maxLength} characters`);
                }
            }

            // Date format check (YYYY-MM-DD)
            if (rules.dateFormat && typeof value === 'string') {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) {
                    errors.push(`${field} must be in YYYY-MM-DD format`);
                }
            }

            // Email format check
            if (rules.email && typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push(`${field} must be a valid email address`);
                }
            }

            // Custom validation function
            if (rules.custom && typeof rules.custom === 'function') {
                const customError = rules.custom(value, data);
                if (customError) {
                    errors.push(customError);
                }
            }
        }

        if (errors.length > 0) {
            return next(new ErrorResponse(errors.join('; '), 400));
        }

        next();
    };
};

/**
 * Pagination middleware
 * Parses and validates pagination query parameters
 */
const paginate = (req, res, next) => {
    const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/env');
    
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || DEFAULT_PAGE_SIZE;

    // Ensure positive values
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    const offset = (page - 1) * limit;

    req.pagination = { page, limit, offset };
    next();
};

/**
 * Date range middleware
 * Parses and validates startDate and endDate query parameters
 */
const dateRange = (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && endDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        if (!dateRegex.test(startDate)) {
            return next(new ErrorResponse('startDate must be in YYYY-MM-DD format', 400));
        }
        if (!dateRegex.test(endDate)) {
            return next(new ErrorResponse('endDate must be in YYYY-MM-DD format', 400));
        }
        if (startDate > endDate) {
            return next(new ErrorResponse('startDate cannot be after endDate', 400));
        }
        
        req.dateRange = { startDate, endDate };
    }
    
    next();
};

module.exports = { validate, paginate, dateRange };

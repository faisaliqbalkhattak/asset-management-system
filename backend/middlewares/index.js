/**
 * Middleware Index
 * =================
 * Exports all middleware modules
 */

const ErrorResponse = require('./ErrorResponse');
const asyncHandler = require('./async.middleware');
const errorHandler = require('./error.middleware');
const { validate, paginate, dateRange } = require('./validation.middleware');

module.exports = {
    // Error classes
    ErrorResponse,
    
    // Error handling
    asyncHandler,
    errorHandler,
    
    // Validation
    validate,
    paginate,
    dateRange
};

/**
 * Async Handler Middleware
 * ========================
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error middleware
 * 
 * Features:
 * ---------
 * - Eliminates need for try-catch in every controller
 * - Automatically forwards errors to error middleware
 * 
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => {
 *       const data = await someAsyncOperation();
 *       res.json(data);
 *   }));
 * 
 * Or in controllers:
 *   exports.getItems = asyncHandler(async (req, res, next) => {
 *       // No try-catch needed
 *   });
 */

/**
 * Async handler wrapper
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

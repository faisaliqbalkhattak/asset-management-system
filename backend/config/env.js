/**
 * Environment Configuration
 * =========================
 */

module.exports = {
    // Server
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Pagination defaults
    DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
    MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100
};

// =====================================================
// SHARED MODULES INDEX
// Central export for constants and utilities
// =====================================================

const constants = require('./constants');
const utilities = require('./utilities');

module.exports = {
    ...constants,
    ...utilities
};

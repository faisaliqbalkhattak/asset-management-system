// =====================================================
// SHARED UTILITY FUNCTIONS FOR SQLITE DATABASE
// Reusable helpers across all models
// =====================================================

const { DAYS_OF_WEEK, MONTHS, MONTHS_SHORT, DEFAULTS } = require('./constants');

// =====================================================
// NUMBER UTILITIES
// =====================================================

/**
 * Round a number to 2 decimal places
 * @param {number} num 
 * @returns {number}
 */
function round2(num) {
    if (typeof num !== 'number' || isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
}

/**
 * Round a number to specified decimal places
 * @param {number} num 
 * @param {number} decimals 
 * @returns {number}
 */
function roundTo(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

/**
 * Ensure a value is a valid non-negative number
 * @param {any} value 
 * @param {number} defaultVal 
 * @returns {number}
 */
function ensureNumber(value, defaultVal = 0) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return defaultVal;
    return num;
}

// =====================================================
// DATE UTILITIES
// =====================================================

/**
 * Get day name from date string (YYYY-MM-DD)
 * @param {string} dateStr 
 * @returns {string}
 */
function getDayName(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    return DAYS_OF_WEEK[dayIndex] || '';
}

/**
 * Get month name from date or month index
 * @param {Date|number} dateOrIndex 
 * @returns {string}
 */
function getMonthName(dateOrIndex) {
    if (typeof dateOrIndex === 'number') {
        return MONTHS[dateOrIndex] || '';
    }
    if (dateOrIndex instanceof Date) {
        return MONTHS[dateOrIndex.getMonth()] || '';
    }
    return '';
}

/**
 * Get short month name
 * @param {Date|number} dateOrIndex 
 * @returns {string}
 */
function getMonthShort(dateOrIndex) {
    if (typeof dateOrIndex === 'number') {
        return MONTHS_SHORT[dateOrIndex] || '';
    }
    if (dateOrIndex instanceof Date) {
        return MONTHS_SHORT[dateOrIndex.getMonth()] || '';
    }
    return '';
}

/**
 * Parse month year string like "Nov-24" to { month, year }
 * @param {string} monthYearStr 
 * @returns {{ month: string, year: number } | null}
 */
function parseMonthYear(monthYearStr) {
    if (!monthYearStr) return null;
    const parts = monthYearStr.split('-');
    if (parts.length !== 2) return null;
    
    const monthShort = parts[0].trim();
    const yearShort = parseInt(parts[1], 10);
    
    const monthIndex = MONTHS_SHORT.findIndex(m => 
        m.toLowerCase() === monthShort.toLowerCase()
    );
    
    if (monthIndex === -1) return null;
    
    const year = yearShort < 100 ? 2000 + yearShort : yearShort;
    return { month: MONTHS[monthIndex], year };
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date|string} date 
 * @returns {string}
 */
function formatDateISO(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

/**
 * Get days in a month
 * @param {number} month - 0-based month index
 * @param {number} year 
 * @returns {number}
 */
function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get first and last day of month as ISO strings
 * @param {string} monthName 
 * @param {number} year 
 * @returns {{ start: string, end: string }}
 */
function getMonthDateRange(monthName, year) {
    const monthIndex = MONTHS.findIndex(m => 
        m.toLowerCase() === monthName.toLowerCase()
    );
    if (monthIndex === -1) return null;
    
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    
    return {
        start: formatDateISO(start),
        end: formatDateISO(end)
    };
}

// =====================================================
// CALCULATION UTILITIES
// =====================================================

/**
 * Calculate misc expense total from array
 * @param {Array} miscExpenses 
 * @returns {number}
 */
function calculateMiscTotal(miscExpenses) {
    if (!Array.isArray(miscExpenses)) return 0;
    return round2(miscExpenses.reduce((sum, exp) => sum + (exp.expense_amount || 0), 0));
}

/**
 * Calculate fuel amount
 * @param {number} liters 
 * @param {number} rate 
 * @returns {number}
 */
function calculateFuelAmount(liters, rate) {
    return round2(ensureNumber(liters) * ensureNumber(rate));
}

/**
 * Calculate trip amount
 * @param {number} trips 
 * @param {number} capacity 
 * @param {number} rate 
 * @returns {number}
 */
function calculateTripAmount(trips, capacity, rate) {
    return round2(ensureNumber(trips) * ensureNumber(capacity) * ensureNumber(rate));
}

/**
 * Calculate production quantities
 * @param {number} gravelCft 
 * @param {number} wastePercentage 
 * @param {number} marginPercentage 
 * @returns {object}
 */
function calculateProduction(gravelCft, wastePercentage = DEFAULTS.WASTE_PERCENTAGE, marginPercentage = DEFAULTS.MARGIN_PERCENTAGE) {
    const gravel = ensureNumber(gravelCft);
    const waste = round2(gravel * (wastePercentage / 100));
    const produced = round2(gravel - waste);
    const margin = round2(produced * (marginPercentage / 100));
    const netAggregate = round2(produced - margin);
    
    return {
        waste_cft: waste,
        produced_cft: produced,
        margin_cft: margin,
        net_aggregate_cft: netAggregate
    };
}

/**
 * Calculate profit sharing
 * @param {number} totalIncome 
 * @param {number} expenses 
 * @param {Array} partners - [{ name, sharePercentage }]
 * @returns {object}
 */
function calculateProfitSharing(totalIncome, expenses, partners = []) {
    const profit = round2(ensureNumber(totalIncome) - ensureNumber(expenses));
    const isProfit = profit >= 0;
    
    const partnerShares = partners.map(p => ({
        partner_name: p.name,
        share_percentage: p.sharePercentage || 50,
        share_amount: round2(Math.abs(profit) * ((p.sharePercentage || 50) / 100))
    }));
    
    return {
        profit: round2(profit),
        is_profit: isProfit ? 1 : 0,
        partner_shares: partnerShares,
        total_shares: round2(partnerShares.reduce((sum, p) => sum + p.share_amount, 0))
    };
}

// =====================================================
// PARSING UTILITIES
// =====================================================

/**
 * Parse diesel description like "50 ltr Diesel @167.5 = 8375"
 * @param {string} description 
 * @returns {{ liters: number, rate: number, amount: number } | null}
 */
function parseDieselDescription(description) {
    if (!description) return null;
    
    const ltrMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:ltr|liters?)/i);
    const rateMatch = description.match(/@\s*(\d+(?:\.\d+)?)/);
    const amountMatch = description.match(/=\s*(\d+(?:\.\d+)?)/);
    
    if (!ltrMatch) return null;
    
    const liters = parseFloat(ltrMatch[1]);
    const rate = rateMatch ? parseFloat(rateMatch[1]) : null;
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    
    return { liters, rate, amount };
}

/**
 * Parse currency amount string (handles commas, rupee symbol)
 * @param {string} amountStr 
 * @returns {number}
 */
function parseCurrency(amountStr) {
    if (typeof amountStr === 'number') return amountStr;
    if (!amountStr) return 0;
    
    const cleaned = String(amountStr)
        .replace(/[₹,\s]/g, '')
        .replace(/Rs\.?/gi, '');
    
    return parseFloat(cleaned) || 0;
}

// =====================================================
// STRING UTILITIES
// =====================================================

/**
 * Generate a unique code
 * @param {string} prefix 
 * @returns {string}
 */
function generateCode(prefix = '') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
}

/**
 * Sanitize string for database
 * @param {string} str 
 * @returns {string}
 */
function sanitizeString(str) {
    if (!str) return '';
    return String(str).trim();
}

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validate required fields
 * @param {object} data 
 * @param {Array} requiredFields 
 * @returns {{ valid: boolean, missing: Array }}
 */
function validateRequired(data, requiredFields) {
    const missing = [];
    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            missing.push(field);
        }
    }
    return { valid: missing.length === 0, missing };
}

/**
 * Validate enum value
 * @param {any} value 
 * @param {Array} allowedValues 
 * @returns {boolean}
 */
function isValidEnum(value, allowedValues) {
    return allowedValues.includes(value);
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    // Numbers
    round2,
    roundTo,
    ensureNumber,
    
    // Dates
    getDayName,
    getMonthName,
    getMonthShort,
    parseMonthYear,
    formatDateISO,
    getDaysInMonth,
    getMonthDateRange,
    
    // Calculations
    calculateMiscTotal,
    calculateFuelAmount,
    calculateTripAmount,
    calculateProduction,
    calculateProfitSharing,
    
    // Parsing
    parseDieselDescription,
    parseCurrency,
    
    // Strings
    generateCode,
    sanitizeString,
    
    // Validation
    validateRequired,
    isValidEnum
};

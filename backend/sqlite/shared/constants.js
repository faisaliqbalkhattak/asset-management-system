// =====================================================
// SHARED CONSTANTS FOR SQLITE DATABASE
// Single source of truth - all modules reuse these
// =====================================================

// =====================================================
// DATE/TIME CONSTANTS
// =====================================================

const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// =====================================================
// TYPE ENUMS
// =====================================================

const EQUIPMENT_TYPES = ['GENERATOR', 'EXCAVATOR', 'LOADER', 'DUMPER'];

const LOADER_TYPES = ['WHEEL_LOADER', 'BACKHOE', 'SKID_STEER', 'OTHER'];

const VEHICLE_TYPES = ['DUMPER', 'TRUCK', 'PICKUP', 'TANKER', 'OTHER'];

const MATERIAL_TYPES = [
    'EXPLOSIVE', 'DETONATOR', 'FUSE', 'FUEL', 
    'LUBRICANT', 'SPARE_PART', 'CONSUMABLE', 'OTHER'
];

const EXPENSE_TYPES = [
    'DIESEL', 'REPAIR', 'SPARE_PART', 'TOLL', 
    'LABOR', 'FOOD', 'MISC', 'OTHER'
];

const EXPENSE_CATEGORIES = [
    'LANGAR', 'PLANT_EXP', 'GENERATOR', 'EXCAVATOR', 
    'LOADER', 'DUMPER', 'BLASTING', 'HR', 'MISC'
];

const RATE_TYPES = ['PER_DAY', 'PER_HOUR', 'PER_MONTH', 'PER_TRIP'];

const PAYMENT_STATUS = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'];

const PROFIT_STATUS = ['DRAFT', 'CALCULATED', 'DISTRIBUTED', 'SETTLED', 'DISPUTED'];

const PARENT_TYPES = ['EQUIPMENT', 'LOADER', 'VEHICLE'];

// =====================================================
// KNOWN VEHICLES (for validation)
// Capacities based on actual data files
// =====================================================

const KNOWN_VEHICLES = [
    { number: 'TKR-219', capacity: 838, type: 'DUMPER' },
    { number: 'TAC-388', capacity: 937, type: 'DUMPER' },
    { number: 'TAB-959', capacity: 937, type: 'DUMPER' },
    { number: 'TAJ-656', capacity: 950, type: 'DUMPER' },
    { number: 'TAE-601', capacity: 181, type: 'DUMPER' }
];

// =====================================================
// AGGREGATE SIZES
// =====================================================

const AGGREGATE_SIZES = ['10mm', '13mm', '16mm', '20mm', '38mm', '50mm'];

const DEFAULT_SIZE_PERCENTAGES = {
    mm10: 10,
    mm13: 10,
    mm16: 35,
    mm20: 15,
    mm38: 10,
    mm50: 20
};

// =====================================================
// LIMITS AND VALIDATION
// =====================================================

const LIMITS = {
    MIN_YEAR: 2023,
    MAX_YEAR: 2099,
    MAX_HOURS_PER_DAY: 24,
    MAX_TRIPS_PER_DAY: 50,
    MIN_QUANTITY: 0,
    MIN_AMOUNT: 0
};

// =====================================================
// DEFAULT VALUES
// =====================================================

const DEFAULTS = {
    RATE_PER_CUBIC_FEET: 1.9,
    DEFUNCT_COST_PER_HOUR: 739.25,
    WASTE_PERCENTAGE: 33.33,
    MARGIN_PERCENTAGE: 15,
    COST_PER_CFT_ESTIMATED: 23,
    PARTNER_SHARE_PERCENTAGE: 50
};

// =====================================================
// PARTNER DEFAULTS
// =====================================================

const DEFAULT_PARTNERS = [
    { name: 'Afsar Khan', sharePercentage: 50 },
    { name: 'Ahmed Khan', sharePercentage: 50 }
];

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    // Date/Time
    DAYS_OF_WEEK,
    MONTHS,
    MONTHS_SHORT,
    
    // Types
    EQUIPMENT_TYPES,
    LOADER_TYPES,
    VEHICLE_TYPES,
    MATERIAL_TYPES,
    EXPENSE_TYPES,
    EXPENSE_CATEGORIES,
    RATE_TYPES,
    PAYMENT_STATUS,
    PROFIT_STATUS,
    PARENT_TYPES,
    
    // Known data
    KNOWN_VEHICLES,
    AGGREGATE_SIZES,
    DEFAULT_SIZE_PERCENTAGES,
    DEFAULT_PARTNERS,
    
    // Limits and Defaults
    LIMITS,
    DEFAULTS
};

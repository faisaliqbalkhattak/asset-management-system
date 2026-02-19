/**
 * Production Controller
 * =====================
 * Handles daily production and aggregate classification
 * 
 * Endpoints:
 * ----------
 * GET    /api/production                   - Get all production records
 * GET    /api/production/:id               - Get single production record
 * GET    /api/production/date/:date        - Get production by date
 * POST   /api/production                   - Create production record
 * PUT    /api/production/:id               - Update production record
 * DELETE /api/production/:id               - Delete production record
 * 
 * Classification:
 * GET    /api/production/classification         - Get all classifications
 * GET    /api/production/classification/default - Get default classification
 * POST   /api/production/classification         - Create classification
 */

const DailyProductionRepository = require('../repositories/DailyProductionRepository');
const AggregateClassificationRepository = require('../repositories/AggregateClassificationRepository');
const MonthlyProductionSummaryRepo = require('../repositories/MonthlyProductionSummaryRepository');
const MonthlyProductionSummaryRepository = new MonthlyProductionSummaryRepo();
const { getDayName, round2 } = require('../shared/utilities');

// =====================================================
// DAILY PRODUCTION - Direct functions (not middleware)
// Called from production.js routes
// =====================================================

/**
 * Get all production records
 */
function getAllProduction() {
    return DailyProductionRepository.findRecent(100);
}

/**
 * Get production by ID
 */
function getProductionById(id) {
    return DailyProductionRepository.findById(id);
}

/**
 * Get production records for a month
 */
function getProductionByMonth(month, year) {
    return DailyProductionRepository.getByMonth(year, month);
}

/**
 * Get monthly totals from daily production
 */
function getMonthlyTotal(month, year) {
    return DailyProductionRepository.getMonthlyTotals(year, month);
}

/**
 * Get yearly totals
 */
function getYearlyTotals(year) {
    return DailyProductionRepository.getYearlyTotals(year);
}

/**
 * Add daily production entry
 */
function addDailyProduction(data) {
    const { production_date, gravel_cft } = data;

    if (!production_date) {
        throw new Error('Please provide production_date');
    }

    // Check if record already exists for this date
    const existing = DailyProductionRepository.findByDate(production_date);
    if (existing) {
        throw new Error(`Production record already exists for ${production_date}`);
    }

    // Set day name
    const day_name = getDayName(production_date);

    // Calculate derived values
    const clayDustPercent = parseFloat(data.clay_dust_percent) || 33.33;
    const allowancePercent = parseFloat(data.allowance_percent) || 0;
    const gravelCft = parseFloat(gravel_cft) || 0;

    const clay_dust_cft = round2(gravelCft * clayDustPercent / 100);
    const aggregate_produced = round2(gravelCft - clay_dust_cft);
    const allowance_cft = round2(aggregate_produced * allowancePercent / 100);
    const net_aggregate_cft = round2(aggregate_produced - allowance_cft);

    return DailyProductionRepository.create({
        production_date,
        day_name,
        gravel_cft: gravelCft,
        clay_dust_percent: clayDustPercent,
        clay_dust_cft,
        aggregate_produced,
        allowance_percent: allowancePercent,
        allowance_cft,
        net_aggregate_cft,
        notes: data.notes || ''
    });
}

/**
 * Update production record
 */
function updateProduction(id, data) {
    let production = DailyProductionRepository.findById(id);
    if (!production) return null;

    const gravel_cft = data.gravel_cft !== undefined ? parseFloat(data.gravel_cft) : production.gravel_cft;
    const clay_dust_percent = data.clay_dust_percent !== undefined ? parseFloat(data.clay_dust_percent) : production.clay_dust_percent;
    const allowance_percent = data.allowance_percent !== undefined ? parseFloat(data.allowance_percent) : production.allowance_percent;

    const clay_dust_cft = round2(gravel_cft * clay_dust_percent / 100);
    const aggregate_produced = round2(gravel_cft - clay_dust_cft);
    const allowance_cft = round2(aggregate_produced * allowance_percent / 100);
    const net_aggregate_cft = round2(aggregate_produced - allowance_cft);

    return DailyProductionRepository.updateById(id, {
        ...data,
        gravel_cft,
        clay_dust_percent,
        clay_dust_cft,
        aggregate_produced,
        allowance_percent,
        allowance_cft,
        net_aggregate_cft
    });
}

/**
 * Delete production record
 */
function deleteProduction(id) {
    const production = DailyProductionRepository.findById(id);
    if (!production) return false;
    return DailyProductionRepository.delete(id);
}

// =====================================================
// MONTHLY PRODUCTION SUMMARY
// =====================================================

/**
 * Get all monthly summaries
 */
function getAllMonthlySummaries() {
    return MonthlyProductionSummaryRepository.getAll({ orderBy: 'summary_year DESC, summary_month DESC' });
}

/**
 * Get summaries by year
 */
function getByYear(year) {
    return MonthlyProductionSummaryRepository.getByYear(year);
}

/**
 * Get summary by month
 */
function getByMonth(month, year) {
    return MonthlyProductionSummaryRepository.getByMonth(month, year);
}

/**
 * Upsert monthly summary
 */
function upsert(month, year, data) {
    return MonthlyProductionSummaryRepository.upsert(month, year, data);
}

/**
 * Get monthly summary from daily production data
 */
function getMonthlySummary(year, month) {
    return DailyProductionRepository.getMonthlySummary(parseInt(year), month);
}

// =====================================================
// AGGREGATE CLASSIFICATION
// =====================================================

function getAllClassifications() {
    return AggregateClassificationRepository.findAll();
}

function getDefaultClassification() {
    return AggregateClassificationRepository.findDefault();
}

function createClassification(data) {
    return AggregateClassificationRepository.create(data);
}

function setDefaultClassification(id) {
    AggregateClassificationRepository.setDefault(id);
    return AggregateClassificationRepository.findById(id);
}

module.exports = {
    getAllProduction,
    getProductionById,
    getProductionByMonth,
    getMonthlyTotal,
    getYearlyTotals,
    addDailyProduction,
    updateProduction,
    deleteProduction,
    getAllMonthlySummaries,
    getByYear,
    getByMonth,
    upsert,
    getMonthlySummary,
    getAllClassifications,
    getDefaultClassification,
    createClassification,
    setDefaultClassification
};

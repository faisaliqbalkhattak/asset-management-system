// =====================================================
// DAILY PRODUCTION REPOSITORY
// =====================================================
// Daily production tracking:
// - Gravel Input (CFT)
// - Clay & Dust Deduction (%)
// - Allowance & Margin (%)
// - Net Aggregate = Gravel - Dust - Allowance
// =====================================================

const BaseRepository = require('./BaseRepository');

class DailyProductionRepository extends BaseRepository {
    constructor() {
        super('daily_production');
    }

    /**
     * Find by date
     */
    findByDate(date) {
        return this.findOne({ production_date: date });
    }

    /**
     * Find by date range
     */
    findByDateRange(startDate, endDate) {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE production_date BETWEEN ? AND ?
            ORDER BY production_date DESC
        `;
        const { all } = require('../db');
        return all(sql, [startDate, endDate]);
    }

    /**
     * Find recent records
     */
    findRecent(limit = 20) {
        return this.findAll({}, { orderBy: 'production_date DESC', limit });
    }

    /**
     * Get monthly summary
     */
    getMonthlySummary(year, month) {
        const monthStr = String(month).padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-31`;
        
        const sql = `
            SELECT 
                COUNT(*) as total_entries,
                COALESCE(SUM(gravel_cft), 0) as total_gravel_cft,
                COALESCE(SUM(clay_dust_cft), 0) as total_clay_dust_cft,
                COALESCE(SUM(net_aggregate_cft), 0) as total_net_aggregate_cft
            FROM ${this.tableName}
            WHERE production_date BETWEEN ? AND ?
        `;
        const { get } = require('../db');
        return get(sql, [startDate, endDate]);
    }

    /**
     * Get production by month
     */
    getByMonth(year, month) {
        const monthStr = String(month).padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-31`;

        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE production_date BETWEEN ? AND ?
            ORDER BY production_date ASC
        `;
        const { all } = require('../db');
        return all(sql, [startDate, endDate]);
    }

    /**
     * Get monthly totals
     */
    getMonthlyTotals(year, month) {
        return this.getMonthlySummary(year, month);
    }

    /**
     * Get yearly totals by month
     */
    getYearlyTotals(year) {
        const sql = `
            SELECT 
                CAST(strftime('%m', production_date) AS INTEGER) as month,
                COUNT(*) as total_entries,
                COALESCE(SUM(gravel_cft), 0) as total_gravel_cft,
                COALESCE(SUM(net_aggregate_cft), 0) as total_net_aggregate_cft
            FROM ${this.tableName}
            WHERE strftime('%Y', production_date) = ?
            GROUP BY strftime('%m', production_date)
            ORDER BY month
        `;
        const { all } = require('../db');
        return all(sql, [String(year)]);
    }
}

// Export singleton instance
module.exports = new DailyProductionRepository();

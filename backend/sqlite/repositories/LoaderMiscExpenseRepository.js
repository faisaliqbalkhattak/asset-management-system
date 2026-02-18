// =====================================================
// LOADER MISC EXPENSE REPOSITORY
// =====================================================
// Misc expenses per loader (966-F or 950-E) - tracked separately
// Summed per loader per month for views
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class LoaderMiscExpenseRepository extends BaseRepository {
    constructor() {
        super('loader_misc_expense');
    }

    /**
     * Create a new misc expense for a loader
     */
    create(data) {
        return super.create(data);
    }

    /**
     * Get misc expenses by loader name
     */
    getByLoader(loaderName, startDate = null, endDate = null) {
        let sql = `SELECT * FROM ${this.tableName} WHERE loader_type = ?`;
        const params = [loaderName];
        
        if (startDate && endDate) {
            sql += ` AND date >= ? AND date <= ?`;
            params.push(startDate, endDate);
        }
        
        sql += ` ORDER BY date DESC`;
        return all(sql, params);
    }

    /**
     * Get misc expenses by date range
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE date >= ? AND date <= ?
            ORDER BY date DESC, loader_type
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Get monthly misc total for a specific loader
     */
    getMonthlyTotalByLoader(loaderName, month, year) {
        const sql = `
            SELECT 
                loader_type,
                COALESCE(SUM(amount), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE loader_type = ?
            AND strftime('%m', date) = ? 
            AND strftime('%Y', date) = ?
            GROUP BY loader_type
        `;
        return get(sql, [loaderName, String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get monthly misc totals for all loaders
     */
    getMonthlyTotalAllLoaders(month, year) {
        const sql = `
            SELECT 
                loader_type,
                COALESCE(SUM(amount), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%m', date) = ? 
            AND strftime('%Y', date) = ?
            GROUP BY loader_type
        `;
        return all(sql, [String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get all monthly misc totals by loader for a year
     */
    getYearlyTotalsByLoader(year) {
        const sql = `
            SELECT 
                loader_type,
                strftime('%m', date) as month,
                COALESCE(SUM(amount), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%Y', date) = ?
            GROUP BY loader_type, strftime('%m', date)
            ORDER BY loader_type, month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = LoaderMiscExpenseRepository;

// =====================================================
// MISC EXPENSE GENERAL REPOSITORY
// =====================================================
// Separate table for miscellaneous expenses
// Includes rent of plant, doctor fees, etc.
// Has its own entry point and separate column in views
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class MiscExpenseGeneralRepository extends BaseRepository {
    constructor() {
        super('misc_expense_general');
    }

    /**
     * Get day name from date
     */
    getDayName(dateStr) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    }

    /**
     * Create a new misc expense entry
     */
    create(data) {
        return super.create({
            ...data,
            day_name: this.getDayName(data.expense_date)
        });
    }

    /**
     * Update an existing entry
     */
    update(id, data) {
        const updateData = { ...data };
        if (data.expense_date) {
            updateData.day_name = this.getDayName(data.expense_date);
        }
        return super.update(id, updateData);
    }

    /**
     * Get entries by date range
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE expense_date >= ? AND expense_date <= ?
            ORDER BY expense_date DESC, id DESC
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Get entries by month and year
     */
    getByMonth(month, year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        return this.getByDateRange(startDate, endDate);
    }

    /**
     * Get monthly total
     */
    getMonthlyTotal(month, year) {
        const sql = `
            SELECT 
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%m', expense_date) = ? 
            AND strftime('%Y', expense_date) = ?
        `;
        return get(sql, [String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get all monthly totals for a year
     */
    getYearlyTotals(year) {
        const sql = `
            SELECT 
                strftime('%m', expense_date) as month,
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%Y', expense_date) = ?
            GROUP BY strftime('%m', expense_date)
            ORDER BY month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = MiscExpenseGeneralRepository;

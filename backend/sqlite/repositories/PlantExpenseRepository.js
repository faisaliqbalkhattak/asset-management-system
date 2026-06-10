// =====================================================
// PLANT EXPENSE REPOSITORY
// =====================================================
// Track plant-related expenses by description and amount
// Same structure as plant mess
// Sum by month for summary
// =====================================================

const BaseRepository = require('./BaseRepository');
const ExpenseCategoryRepository = require('./ExpenseCategoryRepository');
const { get, all } = require('../db');

class PlantExpenseRepository extends BaseRepository {
    constructor() {
        super('plant_expense');
    }

    resolveCategoryId(data) {
        if (data.category_id) return data.category_id;

        const candidateName = data.category_name || data.category;
        if (!candidateName) return null;

        const category = ExpenseCategoryRepository.findByNameAndType(String(candidateName).trim(), 'PLANT_EXPENSE');
        return category ? category.id : null;
    }

    withCategoryFields(data) {
        const categoryId = this.resolveCategoryId(data);
        const category = categoryId ? ExpenseCategoryRepository.findById(categoryId) : null;

        return {
            ...data,
            category_id: categoryId,
            category: category ? category.category_name : (data.category || data.category_name || ''),
        };
    }

    /**
     * Get day name from date
     */
    getDayName(dateStr) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    }

    /**
     * Create a new plant expense entry
     */
    create(data) {
        return super.create(this.withCategoryFields({
            ...data,
            day_name: this.getDayName(data.expense_date)
        }));
    }

    /**
     * Update an existing entry
     */
    update(id, data) {
        const updateData = this.withCategoryFields(data);
        if (data.expense_date) {
            updateData.day_name = this.getDayName(data.expense_date);
        }
        return super.update(id, updateData);
    }

    findById(id) {
        return get(
            `SELECT pe.*, ec.category_name AS category_name, ec.category_code AS category_code
             FROM ${this.tableName} pe
             LEFT JOIN expense_categories ec ON pe.category_id = ec.id
             WHERE pe.id = ?`,
            [id]
        );
    }

    findAll() {
        return all(
            `SELECT pe.*, ec.category_name AS category_name, ec.category_code AS category_code
             FROM ${this.tableName} pe
             LEFT JOIN expense_categories ec ON pe.category_id = ec.id
             ORDER BY pe.expense_date DESC, pe.id DESC`,
            []
        );
    }

    /**
     * Get entries by date range
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT pe.*, ec.category_name AS category_name, ec.category_code AS category_code
            FROM ${this.tableName} pe
            LEFT JOIN expense_categories ec ON pe.category_id = ec.id
            WHERE pe.expense_date >= ? AND pe.expense_date <= ?
            ORDER BY pe.expense_date DESC, pe.id DESC
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

module.exports = PlantExpenseRepository;

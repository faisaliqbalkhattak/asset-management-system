// =====================================================
// GENERAL EXPENSE REPOSITORY
// =====================================================
// Handles all database operations for general expenses
// =====================================================

const BaseRepository = require('./BaseRepository');
const { getDatabase, run, get, all } = require('../db');

class GeneralExpenseRepository extends BaseRepository {
    constructor() {
        super('general_expense');
    }

    /**
     * Find expense by ID
     */
    findById(id) {
        return get(
            `SELECT ge.*, ec.category_name, ec.category_code 
             FROM ${this.tableName} ge
             LEFT JOIN expense_category ec ON ge.category_id = ec.id
             WHERE ge.id = ?`,
            [id]
        );
    }

    /**
     * Find all expenses
     */
    findAll() {
        return all(
            `SELECT ge.*, ec.category_name, ec.category_code 
             FROM ${this.tableName} ge
             LEFT JOIN expense_category ec ON ge.category_id = ec.id
             ORDER BY ge.expense_date DESC`,
            []
        );
    }

    /**
     * Find expenses by category
     */
    findByCategory(categoryId) {
        return all(
            `SELECT ge.*, ec.category_name, ec.category_code 
             FROM ${this.tableName} ge
             LEFT JOIN expense_category ec ON ge.category_id = ec.id
             WHERE ge.category_id = ?
             ORDER BY ge.expense_date DESC`,
            [categoryId]
        );
    }

    /**
     * Find expenses by date range
     */
    findByDateRange(startDate, endDate) {
        return all(
            `SELECT ge.*, ec.category_name, ec.category_code 
             FROM ${this.tableName} ge
             LEFT JOIN expense_category ec ON ge.category_id = ec.id
             WHERE ge.expense_date >= ? AND ge.expense_date <= ?
             ORDER BY ge.expense_date DESC`,
            [startDate, endDate]
        );
    }

    /**
     * Find expenses by date
     */
    findByDate(date) {
        return all(
            `SELECT ge.*, ec.category_name, ec.category_code 
             FROM ${this.tableName} ge
             LEFT JOIN expense_category ec ON ge.category_id = ec.id
             WHERE ge.expense_date = ?
             ORDER BY ec.category_name`,
            [date]
        );
    }

    /**
     * Create expense
     */
    create(data) {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => data[col]);
        
        run(
            `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        );
        
        const db = getDatabase();
        const lastId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
        return this.findById(lastId);
    }

    /**
     * Update expense
     */
    update(id, data) {
        const sets = Object.keys(data).map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(data), id];
        
        run(
            `UPDATE ${this.tableName} SET ${sets}, updated_at = datetime('now') WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }

    /**
     * Delete expense
     */
    delete(id) {
        run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    }

    /**
     * Get monthly summary
     */
    getMonthlySummary(year, month) {
        const monthNum = typeof month === 'string' 
            ? new Date(`${month} 1, 2000`).getMonth() + 1 
            : month;
        const monthStr = String(monthNum).padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-31`;
        
        const byCategory = all(
            `SELECT ec.category_name, ec.category_code, 
                    SUM(ge.amount) as total_amount,
                    COUNT(*) as expense_count
             FROM ${this.tableName} ge
             JOIN expense_category ec ON ge.category_id = ec.id
             WHERE ge.expense_date >= ? AND ge.expense_date <= ?
             GROUP BY ge.category_id
             ORDER BY total_amount DESC`,
            [startDate, endDate]
        );

        const totals = get(
            `SELECT SUM(amount) as grand_total, COUNT(*) as total_count
             FROM ${this.tableName}
             WHERE expense_date >= ? AND expense_date <= ?`,
            [startDate, endDate]
        );

        return {
            byCategory,
            ...totals
        };
    }
}

module.exports = new GeneralExpenseRepository();

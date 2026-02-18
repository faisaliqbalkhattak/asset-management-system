// =====================================================
// DUMPER MISC EXPENSE REPOSITORY
// =====================================================
// Misc expenses per dumper - tracked separately from trip amount
// Summed per dumper per month for views
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class DumperMiscExpenseRepository extends BaseRepository {
    constructor() {
        super('dumper_misc_expense');
    }

    /**
     * Resolve dumper_name to dumper_id before insert
     */
    resolveEquipmentId(data) {
        const cleaned = { ...data };
        if (data.dumper_name) {
            const equip = get(
                `SELECT id FROM equipment WHERE equipment_name = ? AND equipment_type = 'DUMPER'`,
                [data.dumper_name]
            );
            if (equip) {
                cleaned.dumper_id = equip.id;
            }
            delete cleaned.dumper_name;
        }
        return cleaned;
    }

    /**
     * Create a new misc expense for a dumper
     */
    create(data) {
        const resolved = this.resolveEquipmentId(data);
        return super.create(resolved);
    }

    /**
     * Get all misc expenses with dumper name (JOIN)
     */
    findAllWithName() {
        const sql = `
            SELECT dm.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} dm
            LEFT JOIN equipment e ON dm.dumper_id = e.id
            ORDER BY dm.expense_date DESC, e.equipment_name
        `;
        return all(sql);
    }

    /**
     * Get misc expenses by dumper_id
     */
    getByVehicle(dumperId, startDate = null, endDate = null) {
        let sql = `
            SELECT dm.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} dm
            LEFT JOIN equipment e ON dm.dumper_id = e.id
            WHERE dm.dumper_id = ?`;
        const params = [dumperId];
        
        if (startDate && endDate) {
            sql += ` AND dm.expense_date >= ? AND dm.expense_date <= ?`;
            params.push(startDate, endDate);
        }
        
        sql += ` ORDER BY dm.expense_date DESC`;
        return all(sql, params);
    }

    /**
     * Get misc expenses by date range
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT dm.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} dm
            LEFT JOIN equipment e ON dm.dumper_id = e.id
            WHERE dm.expense_date >= ? AND dm.expense_date <= ?
            ORDER BY dm.expense_date DESC, e.equipment_name
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Get monthly misc total for a specific vehicle
     */
    getMonthlyTotalByVehicle(dumperId, month, year) {
        const sql = `
            SELECT 
                dm.dumper_id,
                e.equipment_name as dumper_name,
                COALESCE(SUM(dm.amount), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName} dm
            LEFT JOIN equipment e ON dm.dumper_id = e.id
            WHERE dm.dumper_id = ?
            AND strftime('%m', dm.expense_date) = ? 
            AND strftime('%Y', dm.expense_date) = ?
            GROUP BY dm.dumper_id
        `;
        return get(sql, [dumperId, String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get monthly misc totals for all vehicles
     */
    getMonthlyTotalAllVehicles(month, year) {
        const sql = `
            SELECT 
                dm.dumper_id,
                e.equipment_name as dumper_name,
                COALESCE(SUM(dm.amount), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName} dm
            LEFT JOIN equipment e ON dm.dumper_id = e.id
            WHERE strftime('%m', dm.expense_date) = ? 
            AND strftime('%Y', dm.expense_date) = ?
            GROUP BY dm.dumper_id
        `;
        return all(sql, [String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get all monthly misc totals by vehicle for a year
     */
    getYearlyTotalsByVehicle(year) {
        const sql = `
            SELECT 
                dm.dumper_id,
                e.equipment_name as dumper_name,
                strftime('%m', dm.expense_date) as month,
                COALESCE(SUM(dm.amount), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName} dm
            LEFT JOIN equipment e ON dm.dumper_id = e.id
            WHERE strftime('%Y', dm.expense_date) = ?
            GROUP BY dm.dumper_id, strftime('%m', dm.expense_date)
            ORDER BY e.equipment_name, month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = DumperMiscExpenseRepository;

// =====================================================
// EQUIPMENT OPERATION REPOSITORY
// =====================================================
// Handles all database operations for equipment operations
// =====================================================

const BaseRepository = require('./BaseRepository');
const { getDatabase, run, get, all } = require('../db');

class EquipmentOperationRepository extends BaseRepository {
    constructor() {
        super('equipment_operation');
    }

    /**
     * Find operation by ID
     */
    findById(id) {
        return get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    }

    /**
     * Find operations by equipment ID
     */
    findByEquipment(equipmentId) {
        return all(
            `SELECT * FROM ${this.tableName} WHERE equipment_id = ? ORDER BY operation_date DESC`,
            [equipmentId]
        );
    }

    /**
     * Find operations by equipment and date range
     */
    findByEquipmentAndDateRange(equipmentId, startDate, endDate) {
        return all(
            `SELECT * FROM ${this.tableName} 
             WHERE equipment_id = ? AND operation_date >= ? AND operation_date <= ?
             ORDER BY operation_date DESC`,
            [equipmentId, startDate, endDate]
        );
    }

    /**
     * Find operation by equipment and specific date
     */
    findByEquipmentAndDate(equipmentId, date) {
        return get(
            `SELECT * FROM ${this.tableName} WHERE equipment_id = ? AND operation_date = ?`,
            [equipmentId, date]
        );
    }

    /**
     * Find operations by date
     */
    findByDate(date) {
        return all(
            `SELECT eo.*, e.equipment_name, e.equipment_type 
             FROM ${this.tableName} eo
             JOIN equipment e ON eo.equipment_id = e.id
             WHERE eo.operation_date = ?
             ORDER BY e.equipment_type, e.equipment_name`,
            [date]
        );
    }

    /**
     * Create operation with calculated totals
     */
    create(data) {
        const processed = this.calculateTotals(data);
        const columns = Object.keys(processed);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => processed[col]);
        
        run(
            `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        );
        
        const db = getDatabase();
        const lastId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
        return this.findById(lastId);
    }

    /**
     * Update operation
     */
    update(id, data) {
        const processed = this.calculateTotals(data);
        const sets = Object.keys(processed).map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(processed), id];
        
        run(
            `UPDATE ${this.tableName} SET ${sets}, updated_at = datetime('now') WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }

    /**
     * Delete operation
     */
    delete(id) {
        run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    }

    /**
     * Calculate totals for operation
     */
    calculateTotals(data) {
        const operatingHours = parseFloat(data.operating_hours) || 0;
        const fuelConsumed = parseFloat(data.fuel_consumed_liters) || 0;
        const fuelRate = parseFloat(data.fuel_rate_per_liter) || 0;
        const ratePerUnit = parseFloat(data.rate_per_unit) || 0;
        const miscExpense = parseFloat(data.misc_expense_amount) || 0;
        
        const fuelAmount = fuelConsumed * fuelRate;
        const rateAmount = operatingHours * ratePerUnit;
        const totalAmount = fuelAmount + rateAmount + miscExpense;
        
        return {
            ...data,
            fuel_amount: Math.round(fuelAmount * 100) / 100,
            rate_amount: Math.round(rateAmount * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100
        };
    }

    /**
     * Get monthly summary for equipment
     */
    getMonthlySummary(equipmentId, year, month) {
        const monthNum = typeof month === 'string' 
            ? new Date(`${month} 1, 2000`).getMonth() + 1 
            : month;
        const monthStr = String(monthNum).padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-31`;
        
        const summary = get(
            `SELECT 
                COUNT(*) as total_operations,
                SUM(operating_hours) as total_hours,
                SUM(fuel_consumed_liters) as total_fuel,
                SUM(fuel_amount) as total_fuel_amount,
                SUM(rate_amount) as total_rate_amount,
                SUM(misc_expense_amount) as total_misc,
                SUM(total_amount) as grand_total
             FROM ${this.tableName}
             WHERE equipment_id = ? AND operation_date >= ? AND operation_date <= ?`,
            [equipmentId, startDate, endDate]
        );

        const operations = this.findByEquipmentAndDateRange(equipmentId, startDate, endDate);
        
        return {
            ...summary,
            operations
        };
    }

    /**
     * Add misc expense to operation
     */
    addMiscExpense(operationId, expense) {
        // Insert into misc_expense table
        run(
            `INSERT INTO misc_expense (parent_type, parent_id, expense_description, expense_amount, expense_type, diesel_liters, diesel_rate)
             VALUES ('EQUIPMENT', ?, ?, ?, ?, ?, ?)`,
            [operationId, expense.description, expense.amount, expense.type, expense.diesel_liters, expense.diesel_rate]
        );

        // Update operation's misc_expense_amount
        const operation = this.findById(operationId);
        const currentMisc = parseFloat(operation.misc_expense_amount) || 0;
        const newMisc = currentMisc + (parseFloat(expense.amount) || 0);
        
        return this.update(operationId, { misc_expense_amount: newMisc });
    }

    /**
     * Get misc expenses for operation
     */
    getMiscExpenses(operationId) {
        return all(
            `SELECT * FROM misc_expense WHERE parent_type = 'EQUIPMENT' AND parent_id = ?`,
            [operationId]
        );
    }
}

module.exports = new EquipmentOperationRepository();

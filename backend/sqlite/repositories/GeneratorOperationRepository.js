// =====================================================
// GENERATOR OPERATION REPOSITORY
// =====================================================
// Handles all database operations for generator
// Total = fuel_amount + rent_per_day
// Links to equipment table via equipment_id (FK)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class GeneratorOperationRepository extends BaseRepository {
    constructor() {
        super('generator_operation');
    }

    /**
     * Get day name from date
     */
    getDayName(dateStr) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    }

    /**
     * Resolve equipment_name to equipment_id
     */
    resolveEquipmentId(data) {
        const cleaned = { ...data };
        if (data.equipment_name) {
            const equip = get(
                `SELECT id FROM equipment WHERE equipment_name = ? AND equipment_type = 'GENERATOR'`,
                [data.equipment_name]
            );
            if (equip) {
                cleaned.equipment_id = equip.id;
            }
            delete cleaned.equipment_name;
        }
        return cleaned;
    }

    /**
     * Calculate totals before save
     */
    calculateTotals(data) {
        const fuelConsumed = parseFloat(data.fuel_consumed) || 0;
        const fuelRate = parseFloat(data.fuel_rate) || 0;
        const fuelAmount = fuelConsumed * fuelRate;
        const rentPerDay = parseFloat(data.rent_per_day) || 0;
        const totalAmount = fuelAmount + rentPerDay;

        return {
            ...data,
            fuel_amount: Math.round(fuelAmount * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100
        };
    }

    /**
     * Create a new generator operation
     */
    create(data) {
        const resolved = this.resolveEquipmentId(data);
        const processedData = this.calculateTotals({
            ...resolved,
            day_name: this.getDayName(resolved.operation_date)
        });
        return super.create(processedData);
    }

    /**
     * Update an existing generator operation
     */
    update(id, data) {
        const resolved = this.resolveEquipmentId(data);
        const processedData = this.calculateTotals(resolved);
        if (resolved.operation_date) {
            processedData.day_name = this.getDayName(resolved.operation_date);
        }
        return super.update(id, processedData);
    }

    /**
     * Get operations by date range (with equipment name join)
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT g.*, e.equipment_name 
            FROM ${this.tableName} g
            LEFT JOIN equipment e ON g.equipment_id = e.id
            WHERE g.operation_date >= ? AND g.operation_date <= ?
            ORDER BY g.operation_date DESC
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Find by ID with equipment name
     */
    findByIdWithName(id) {
        const sql = `
            SELECT g.*, e.equipment_name 
            FROM ${this.tableName} g
            LEFT JOIN equipment e ON g.equipment_id = e.id
            WHERE g.id = ?
        `;
        return get(sql, [id]);
    }

    /**
     * Get all with equipment name
     */
    findAllWithName(options = {}) {
        let sql = `
            SELECT g.*, e.equipment_name 
            FROM ${this.tableName} g
            LEFT JOIN equipment e ON g.equipment_id = e.id
        `;
        if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
        if (options.limit) sql += ` LIMIT ${options.limit}`;
        return all(sql);
    }

    /**
     * Get operations by month and year
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
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(SUM(fuel_amount), 0) as fuel_total,
                COALESCE(SUM(rent_per_day), 0) as rent_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%m', operation_date) = ? 
            AND strftime('%Y', operation_date) = ?
        `;
        return get(sql, [String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get all monthly totals for a year
     */
    getYearlyTotals(year) {
        const sql = `
            SELECT 
                strftime('%m', operation_date) as month,
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(SUM(fuel_amount), 0) as fuel_total,
                COALESCE(SUM(rent_per_day), 0) as rent_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%Y', operation_date) = ?
            GROUP BY strftime('%m', operation_date)
            ORDER BY month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = GeneratorOperationRepository;

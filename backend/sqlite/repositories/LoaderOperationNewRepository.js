// =====================================================
// LOADER OPERATION REPOSITORY (NEW)
// =====================================================
// Handles loaders operations
// Total = rent_per_day + fuel_amount - defunct_cost (misc tracked separately)
// Links to equipment table via equipment_id (FK)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class LoaderOperationNewRepository extends BaseRepository {
    constructor() {
        super('loader_operation');
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
                `SELECT id FROM equipment WHERE equipment_name = ? AND equipment_type = 'LOADER'`,
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
     * fuel_amount = fuel_consumed * fuel_rate
     * defunct_cost = defunct_hours * defunct_cost_per_hour
     * total = rent_per_day + fuel_amount - defunct_cost (misc tracked separately, NOT added to total)
     */
    calculateTotals(data) {
        const rentPerDay = parseFloat(data.rent_per_day) || 0;
        const fuelConsumed = parseFloat(data.fuel_consumed) || 0;
        const fuelRate = parseFloat(data.fuel_rate) || 0;
        const defunctHours = parseFloat(data.defunct_hours) || 0;
        const defunctCostPerHour = parseFloat(data.defunct_cost_per_hour) || 0;

        const fuelAmount = fuelConsumed * fuelRate;
        const defunctCost = defunctHours * defunctCostPerHour;
        const totalAmount = rentPerDay + fuelAmount - defunctCost;

        return {
            ...data,
            fuel_amount: Math.round(fuelAmount * 100) / 100,
            defunct_cost: Math.round(defunctCost * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100
        };
    }

    /**
     * Create a new loader operation
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
     * Update an existing loader operation
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
            SELECT lo.*, e.equipment_name 
            FROM ${this.tableName} lo
            LEFT JOIN equipment e ON lo.equipment_id = e.id
            WHERE lo.operation_date >= ? AND lo.operation_date <= ?
            ORDER BY lo.operation_date DESC
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Find by ID with equipment name
     */
    findByIdWithName(id) {
        const sql = `
            SELECT lo.*, e.equipment_name 
            FROM ${this.tableName} lo
            LEFT JOIN equipment e ON lo.equipment_id = e.id
            WHERE lo.id = ?
        `;
        return get(sql, [id]);
    }

    /**
     * Get all with equipment name
     */
    findAllWithName(options = {}) {
        let sql = `
            SELECT lo.*, e.equipment_name 
            FROM ${this.tableName} lo
            LEFT JOIN equipment e ON lo.equipment_id = e.id
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
                COALESCE(SUM(defunct_cost), 0) as defunct_total,
                COALESCE(SUM(misc_expense), 0) as misc_total,
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
                COALESCE(SUM(defunct_cost), 0) as defunct_total,
                COALESCE(SUM(misc_expense), 0) as misc_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%Y', operation_date) = ?
            GROUP BY strftime('%m', operation_date)
            ORDER BY month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = LoaderOperationNewRepository;

// =====================================================
// EXCAVATOR OPERATION REPOSITORY
// =====================================================
// Handles all database operations for excavator EX-400
// Total = fuel_amount + rent_amount (misc tracked separately)
// Links to equipment table via equipment_id (FK)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class ExcavatorOperationRepository extends BaseRepository {
    constructor() {
        super('excavator_operation');
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
                `SELECT id FROM equipment WHERE equipment_name = ? AND equipment_type = 'EXCAVATOR'`,
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
     * rent_amount = hours_operated * rate_per_hour
     * fuel_amount = fuel_consumed * fuel_rate
     * total = rent_amount + fuel_amount (misc is tracked separately, NOT added to total)
     */
    calculateTotals(data) {
        const hoursOperated = parseFloat(data.hours_operated) || 0;
        const ratePerHour = parseFloat(data.rate_per_hour) || 0;
        const fuelConsumed = parseFloat(data.fuel_consumed) || 0;
        const fuelRate = parseFloat(data.fuel_rate) || 0;

        const rentAmount = hoursOperated * ratePerHour;
        const fuelAmount = fuelConsumed * fuelRate;
        const totalAmount = rentAmount + fuelAmount;

        return {
            ...data,
            rent_amount: Math.round(rentAmount * 100) / 100,
            fuel_amount: Math.round(fuelAmount * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100
        };
    }

    /**
     * Create a new excavator operation
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
     * Update an existing excavator operation
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
            SELECT ex.*, e.equipment_name 
            FROM ${this.tableName} ex
            LEFT JOIN equipment e ON ex.equipment_id = e.id
            WHERE ex.operation_date >= ? AND ex.operation_date <= ?
            ORDER BY ex.operation_date DESC
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Find by ID with equipment name
     */
    findByIdWithName(id) {
        const sql = `
            SELECT ex.*, e.equipment_name 
            FROM ${this.tableName} ex
            LEFT JOIN equipment e ON ex.equipment_id = e.id
            WHERE ex.id = ?
        `;
        return get(sql, [id]);
    }

    /**
     * Get all with equipment name
     */
    findAllWithName(options = {}) {
        let sql = `
            SELECT ex.*, e.equipment_name 
            FROM ${this.tableName} ex
            LEFT JOIN equipment e ON ex.equipment_id = e.id
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
     * Get monthly total with separate misc total
     */
    getMonthlyTotal(month, year) {
        const sql = `
            SELECT 
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(SUM(misc_expense), 0) as misc_total,
                COALESCE(SUM(fuel_amount), 0) as fuel_total,
                COALESCE(SUM(rent_amount), 0) as rent_total,
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
                COALESCE(SUM(misc_expense), 0) as misc_total,
                COALESCE(SUM(fuel_amount), 0) as fuel_total,
                COALESCE(SUM(rent_amount), 0) as rent_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%Y', operation_date) = ?
            GROUP BY strftime('%m', operation_date)
            ORDER BY month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = ExcavatorOperationRepository;

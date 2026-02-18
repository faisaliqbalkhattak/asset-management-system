// =====================================================
// DUMPER OPERATION REPOSITORY
// =====================================================
// Daily dumper trips - one row per vehicle per day
// Total = trip_amount + misc_expense
// Links to equipment table via equipment_id (FK)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class DumperOperationRepository extends BaseRepository {
    constructor() {
        super('dumper_operation');
    }

    /**
     * Get day name from date
     */
    getDayName(dateStr) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    }

    /**
     * Resolve dumper_name to equipment_id
     */
    resolveEquipmentId(data) {
        const cleaned = { ...data };
        if (data.dumper_name) {
            const equip = get(
                `SELECT id FROM equipment WHERE equipment_name = ? AND equipment_type = 'DUMPER'`,
                [data.dumper_name]
            );
            if (equip) {
                cleaned.equipment_id = equip.id;
            }
            delete cleaned.dumper_name;
        }
        return cleaned;
    }

    /**
     * Calculate totals before save
     * total_trips = gravel_trips + clay_trips
     * total_cft = total_trips * cft_per_trip
     * trip_amount = total_cft * rate_per_cft
     * total_amount = trip_amount + misc_expense
     */
    calculateTotals(data) {
        const gravelTrips = parseInt(data.gravel_trips) || 0;
        const clayTrips = parseInt(data.clay_trips) || 0;
        const cftPerTrip = parseFloat(data.cft_per_trip) || 838;
        const ratePerCft = parseFloat(data.rate_per_cft) || 1.9;
        const miscExpense = parseFloat(data.misc_expense) || 0;

        const totalTrips = gravelTrips + clayTrips;
        const totalCft = totalTrips * cftPerTrip;
        const tripAmount = totalCft * ratePerCft;
        const totalAmount = tripAmount + miscExpense;

        return {
            ...data,
            cft_per_trip: cftPerTrip,
            total_trips: totalTrips,
            total_cft: Math.round(totalCft * 100) / 100,
            trip_amount: Math.round(tripAmount * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100
        };
    }

    /**
     * Create a new dumper operation
     */
    create(data) {
        const resolved = this.resolveEquipmentId(data);
        const processedData = this.calculateTotals({
            ...resolved,
            day_name: this.getDayName(resolved.trip_date)
        });
        return super.create(processedData);
    }

    /**
     * Update an existing dumper operation
     */
    update(id, data) {
        const resolved = this.resolveEquipmentId(data);
        const processedData = this.calculateTotals(resolved);
        if (resolved.trip_date) {
            processedData.day_name = this.getDayName(resolved.trip_date);
        }
        return super.update(id, processedData);
    }

    /**
     * Get operations by date range (with equipment name join)
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT d.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE d.trip_date >= ? AND d.trip_date <= ?
            ORDER BY d.trip_date DESC, e.equipment_name
        `;
        return all(sql, [startDate, endDate]);
    }

    /**
     * Find by ID with equipment name
     */
    findByIdWithName(id) {
        const sql = `
            SELECT d.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE d.id = ?
        `;
        return get(sql, [id]);
    }

    /**
     * Get all with equipment name
     */
    findAllWithName(options = {}) {
        let sql = `
            SELECT d.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
        `;
        if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
        if (options.limit) sql += ` LIMIT ${options.limit}`;
        return all(sql);
    }

    /**
     * Get operations by equipment_id and date range
     */
    getByEquipmentId(equipmentId, startDate = null, endDate = null) {
        let sql = `
            SELECT d.*, e.equipment_name as dumper_name 
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE d.equipment_id = ?`;
        const params = [equipmentId];
        
        if (startDate && endDate) {
            sql += ` AND d.trip_date >= ? AND d.trip_date <= ?`;
            params.push(startDate, endDate);
        }
        
        sql += ` ORDER BY d.trip_date DESC`;
        return all(sql, params);
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
     * Get monthly total for a specific equipment
     */
    getMonthlyTotalByEquipment(equipmentId, month, year) {
        const sql = `
            SELECT 
                d.equipment_id,
                e.equipment_name as dumper_name,
                COALESCE(SUM(d.trip_amount), 0) as total,
                COALESCE(SUM(d.total_trips), 0) as total_trips,
                COALESCE(SUM(d.total_cft), 0) as total_cft,
                COALESCE(SUM(d.misc_expense), 0) as misc_total,
                COALESCE(SUM(d.total_amount), 0) as grand_total,
                COUNT(*) as entry_count
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE d.equipment_id = ?
            AND strftime('%m', d.trip_date) = ? 
            AND strftime('%Y', d.trip_date) = ?
            GROUP BY d.equipment_id
        `;
        return get(sql, [equipmentId, String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get monthly totals for all vehicles
     */
    getMonthlyTotalAllVehicles(month, year) {
        const sql = `
            SELECT 
                d.equipment_id,
                e.equipment_name as dumper_name,
                COALESCE(SUM(d.trip_amount), 0) as total,
                COALESCE(SUM(d.total_trips), 0) as total_trips,
                COALESCE(SUM(d.total_cft), 0) as total_cft,
                COALESCE(SUM(d.misc_expense), 0) as misc_total,
                COALESCE(SUM(d.total_amount), 0) as grand_total,
                COUNT(*) as entry_count
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE strftime('%m', d.trip_date) = ? 
            AND strftime('%Y', d.trip_date) = ?
            GROUP BY d.equipment_id
        `;
        return all(sql, [String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get all monthly totals by vehicle for a year
     */
    getYearlyTotalsByVehicle(year) {
        const sql = `
            SELECT 
                d.equipment_id,
                e.equipment_name as dumper_name,
                strftime('%m', d.trip_date) as month,
                COALESCE(SUM(d.trip_amount), 0) as total,
                COALESCE(SUM(d.total_trips), 0) as total_trips,
                COALESCE(SUM(d.total_amount), 0) as grand_total,
                COUNT(*) as entry_count
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE strftime('%Y', d.trip_date) = ?
            GROUP BY d.equipment_id, strftime('%m', d.trip_date)
            ORDER BY e.equipment_name, month
        `;
        return all(sql, [String(year)]);
    }

    /**
     * Get distinct dumpers (equipment)
     */
    getDistinctVehicles() {
        const sql = `
            SELECT DISTINCT d.equipment_id, e.equipment_name as dumper_name 
            FROM ${this.tableName} d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            ORDER BY e.equipment_name
        `;
        return all(sql);
    }
}

module.exports = DumperOperationRepository;

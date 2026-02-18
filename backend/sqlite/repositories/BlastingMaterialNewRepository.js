// =====================================================
// BLASTING MATERIAL REPOSITORY
// =====================================================
// One item per row with description, quantity, rate, amount
// Transport charges included
// Sum by month for summary
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class BlastingMaterialRepository extends BaseRepository {
    constructor() {
        super('blasting_material');
    }

    /**
     * Get day name from date
     */
    getDayName(dateStr) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    }

    /**
     * Calculate totals before save
     * amount = quantity * rate
     * total_amount = amount + transport_charges
     */
    calculateTotals(data) {
        const quantity = parseFloat(data.quantity) || 0;
        const rate = parseFloat(data.rate) || 0;
        const transportCharges = parseFloat(data.transport_charges) || 0;

        const amount = quantity * rate;
        const totalAmount = amount + transportCharges;

        return {
            ...data,
            amount: Math.round(amount * 100) / 100,
            total_amount: Math.round(totalAmount * 100) / 100
        };
    }

    /**
     * Create a new blasting material entry
     */
    create(data) {
        const processedData = this.calculateTotals({
            ...data,
            day_name: this.getDayName(data.purchase_date)
        });
        return super.create(processedData);
    }

    /**
     * Update an existing entry
     */
    update(id, data) {
        const processedData = this.calculateTotals(data);
        if (data.purchase_date) {
            processedData.day_name = this.getDayName(data.purchase_date);
        }
        return super.update(id, processedData);
    }

    /**
     * Get entries by date range
     */
    getByDateRange(startDate, endDate) {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE purchase_date >= ? AND purchase_date <= ?
            ORDER BY purchase_date DESC, id DESC
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
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(SUM(amount), 0) as material_total,
                COALESCE(SUM(transport_charges), 0) as transport_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%m', purchase_date) = ? 
            AND strftime('%Y', purchase_date) = ?
        `;
        return get(sql, [String(month).padStart(2, '0'), String(year)]);
    }

    /**
     * Get all monthly totals for a year
     */
    getYearlyTotals(year) {
        const sql = `
            SELECT 
                strftime('%m', purchase_date) as month,
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(SUM(transport_charges), 0) as transport_total,
                COUNT(*) as entry_count
            FROM ${this.tableName}
            WHERE strftime('%Y', purchase_date) = ?
            GROUP BY strftime('%m', purchase_date)
            ORDER BY month
        `;
        return all(sql, [String(year)]);
    }
}

module.exports = BlastingMaterialRepository;

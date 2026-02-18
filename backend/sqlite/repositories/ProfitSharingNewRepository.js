// =====================================================
// PROFIT SHARING REPOSITORY (NEW)
// =====================================================
// Monthly profit calculation:
// - Income from production (sold at site + stock value)
// - Expenses from summary (grand total)
// - Profit = Income - Expenses
// - Split between partners (50/50 default)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class ProfitSharingNewRepository extends BaseRepository {
    constructor() {
        super('profit_sharing');
    }

    /**
     * Calculate profit sharing
     */
    calculateProfitSharing(data) {
        const soldAmount = parseFloat(data.actual_amount) || 0;
        const stockCft = parseFloat(data.stock_at_site_cft) || 0;
        const estimatedRate = parseFloat(data.estimated_rate) || 23;
        
        // Estimated amount = Stock × Estimated Rate
        const estimatedAmount = stockCft * estimatedRate;
        
        // Total Income = Sold Amount + Estimated Amount
        const totalIncome = soldAmount + estimatedAmount;
        
        // Expenses from summary
        const actualExpenses = parseFloat(data.actual_expenses) || 0;
        
        // Profit = Income - Expenses
        const profit = totalIncome - actualExpenses;
        
        // Partner shares
        const partner1Percentage = parseFloat(data.partner1_share_percentage) || 50;
        const partner2Percentage = parseFloat(data.partner2_share_percentage) || 50;
        
        const partner1Share = (profit * partner1Percentage) / 100;
        const partner2Share = (profit * partner2Percentage) / 100;
        
        // Each partner's share is split equally between two sub-partners
        const partner1Sub1Amount = partner1Share / 2;
        const partner2Sub1Amount = partner2Share / 2;

        return {
            ...data,
            estimated_amount: Math.round(estimatedAmount * 100) / 100,
            total_income: Math.round(totalIncome * 100) / 100,
            profit: Math.round(profit * 100) / 100,
            partner1_share_amount: Math.round(partner1Share * 100) / 100,
            partner1_sub1_amount: Math.round(partner1Sub1Amount * 100) / 100,
            partner2_share_amount: Math.round(partner2Share * 100) / 100,
            partner2_sub1_amount: Math.round(partner2Sub1Amount * 100) / 100
        };
    }

    /**
     * Create a new profit sharing entry
     */
    create(data) {
        const processedData = this.calculateProfitSharing(data);
        return super.create(processedData);
    }

    /**
     * Update an existing profit sharing entry
     */
    update(id, data) {
        const processedData = this.calculateProfitSharing(data);
        return super.update(id, processedData);
    }

    /**
     * Get profit sharing by month and year
     */
    getByMonth(month, year) {
        const sql = `SELECT * FROM ${this.tableName} WHERE period_month = ? AND period_year = ?`;
        return get(sql, [month, year]);
    }

    /**
     * Get all profit sharing for a year
     */
    getByYear(year) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE period_year = ?
            ORDER BY 
                CASE period_month
                    WHEN 'January' THEN 1
                    WHEN 'February' THEN 2
                    WHEN 'March' THEN 3
                    WHEN 'April' THEN 4
                    WHEN 'May' THEN 5
                    WHEN 'June' THEN 6
                    WHEN 'July' THEN 7
                    WHEN 'August' THEN 8
                    WHEN 'September' THEN 9
                    WHEN 'October' THEN 10
                    WHEN 'November' THEN 11
                    WHEN 'December' THEN 12
                END
        `;
        return all(sql, [year]);
    }

    /**
     * Upsert profit sharing (create or update)
     */
    upsert(month, year, data) {
        const existing = this.getByMonth(month, year);
        if (existing) {
            return this.update(existing.id, { ...data, period_month: month, period_year: year });
        } else {
            return this.create({ ...data, period_month: month, period_year: year });
        }
    }
}

module.exports = ProfitSharingNewRepository;

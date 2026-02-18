// =====================================================
// MONTHLY PRODUCTION SUMMARY REPOSITORY
// =====================================================
// Monthly summary with sales and cost calculations:
// - Total Net Aggregate (from daily production)
// - Sold at Site (CFT & Amount) - entered
// - Per CFT Cost = Sold Amount / Sold CFT
// - Stock at Site = Net Aggregate - Sold at Site
// - Approx Per CFT Cost (default 23) - entered
// - Cost of Stocked Material = Stock × Approx Cost
// - Total Cost = Actual Cost + Stocked Cost
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class MonthlyProductionSummaryRepository extends BaseRepository {
    constructor() {
        super('monthly_production_summary');
    }

    /**
     * Calculate summary values
     */
    calculateSummary(data) {
        // Map frontend keys to DB columns if necessary
        const netAggregate = parseFloat(data.total_net_aggregate_cft || data.net_aggregate_cft) || 0;
        const soldCft = parseFloat(data.sold_at_site_cft || data.sold_cft) || 0;
        const soldAmount = parseFloat(data.sold_at_site_amount || data.sold_amount) || 0;
        const approxCost = parseFloat(data.approx_per_cft_cost || data.approx_cost) || 23;

        // Per CFT cost = Sold Amount / Sold CFT
        const perCftCost = soldCft > 0 ? soldAmount / soldCft : 0;
        
        // Stock at Site = Net Aggregate - Sold
        const stockCft = netAggregate - soldCft;
        
        // Cost of stocked material = Stock × Approx Cost
        const stockedCost = stockCft * approxCost;
        
        // Total Cost = Actual (sold amount) + Stocked Cost
        const totalCost = soldAmount + stockedCost;

        // Return object with ONLY DB columns to prevent "no column named" errors
        const result = {
            total_net_aggregate_cft: netAggregate,
            sold_at_site_cft: soldCft,
            sold_at_site_amount: soldAmount,
            approx_per_cft_cost: approxCost,
            
            per_cft_cost: Math.round(perCftCost * 100) / 100,
            stock_at_site_cft: Math.round(stockCft * 100) / 100,
            cost_of_stocked_material: Math.round(stockedCost * 100) / 100,
            total_cost: Math.round(totalCost * 100) / 100
        };

        // Preserve key identifiers if they exist in the input
        if (data.summary_month) result.summary_month = data.summary_month;
        if (data.summary_year) result.summary_year = data.summary_year;

        return result;
    }

    /**
     * Create a new monthly summary
     */
    create(data) {
        const processedData = this.calculateSummary(data);
        return super.create(processedData);
    }

    /**
     * Update an existing summary
     */
    update(id, data) {
        const processedData = this.calculateSummary(data);
        return super.update(id, processedData);
    }

    /**
     * Get summary by month and year
     */
    getByMonth(month, year) {
        const sql = `SELECT * FROM ${this.tableName} WHERE summary_month = ? AND summary_year = ?`;
        return get(sql, [month, year]);
    }

    /**
     * Get all summaries for a year
     */
    getByYear(year) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE summary_year = ?
            ORDER BY 
                CASE summary_month
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
     * Upsert summary (create or update)
     */
    upsert(month, year, data) {
        const existing = this.getByMonth(month, year);
        if (existing) {
            return this.update(existing.id, { ...data, summary_month: month, summary_year: year });
        } else {
            return this.create({ ...data, summary_month: month, summary_year: year });
        }
    }
}

module.exports = MonthlyProductionSummaryRepository;

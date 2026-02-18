// =====================================================
// MONTHLY EXPENSE SUMMARY REPOSITORY
// =====================================================
// Aggregates all expense tables by month
// Only total amounts are added to grand total (misc is for reference)
// =====================================================

const BaseRepository = require('./BaseRepository');

class MonthlyExpenseSummaryRepository extends BaseRepository {
    constructor() {
        super('monthly_expense_summary');
    }

    /**
     * Calculate grand total (only totals, not misc)
     */
    calculateGrandTotal(data) {
        const generatorTotal = parseFloat(data.generator_total) || 0;
        const excavatorTotal = parseFloat(data.excavator_total) || 0;
        // excavator_misc_total is for reference only, not added to grand total
        const loadersTotal = parseFloat(data.loaders_total) || 0;
        
        // Dumper totals (only trip amounts, misc is for reference)
        const dumperTkr219Total = parseFloat(data.dumper_tkr219_total) || 0;
        const dumperTac388Total = parseFloat(data.dumper_tac388_total) || 0;
        const dumperTab959Total = parseFloat(data.dumper_tab959_total) || 0;
        const dumperTaj656Total = parseFloat(data.dumper_taj656_total) || 0;
        const dumperTae601Total = parseFloat(data.dumper_tae601_total) || 0;
        
        const blastingTotal = parseFloat(data.blasting_material_total) || 0;
        const langarTotal = parseFloat(data.langar_total) || 0;
        const plantExpTotal = parseFloat(data.plant_expense_total) || 0;
        const humanResTotal = parseFloat(data.human_resource_total) || 0;
        const miscExpTotal = parseFloat(data.misc_expense_total) || 0;

        const grandTotal = generatorTotal + excavatorTotal + loadersTotal +
            dumperTkr219Total + dumperTac388Total + dumperTab959Total + 
            dumperTaj656Total + dumperTae601Total +
            blastingTotal + langarTotal + plantExpTotal + humanResTotal + miscExpTotal;

        return {
            ...data,
            grand_total: Math.round(grandTotal * 100) / 100
        };
    }

    /**
     * Create a new monthly summary
     */
    create(data) {
        const processedData = this.calculateGrandTotal(data);
        return super.create(processedData);
    }

    /**
     * Update an existing summary
     */
    update(id, data) {
        const processedData = this.calculateGrandTotal(data);
        return super.update(id, processedData);
    }

    /**
     * Get summary by month and year
     */
    getByMonth(month, year) {
        const sql = `SELECT * FROM ${this.tableName} WHERE summary_month = ? AND summary_year = ?`;
        return this.db.prepare(sql).get(month, year);
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
        return this.db.prepare(sql).all(year);
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

module.exports = MonthlyExpenseSummaryRepository;

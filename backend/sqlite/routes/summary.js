// =====================================================
// SUMMARY ROUTES
// =====================================================
// API routes for monthly expense summary and profit sharing
// =====================================================

const express = require('express');
const router = express.Router();
const { MonthlyExpenseSummaryRepository, ProfitSharingNewRepository } = require('../repositories');

const expenseRepo = new MonthlyExpenseSummaryRepository();
const profitRepo = new ProfitSharingNewRepository();

// =====================================================
// MONTHLY EXPENSE SUMMARY
// =====================================================

// GET all expense summaries
router.get('/expenses', (req, res, next) => {
    try {
        const summaries = expenseRepo.findAll();
        res.json({ success: true, data: summaries });
    } catch (error) {
        next(error);
    }
});

// GET expense summaries by year
router.get('/expenses/year/:year', (req, res, next) => {
    try {
        const summaries = expenseRepo.getByYear(parseInt(req.params.year));
        res.json({ success: true, data: summaries });
    } catch (error) {
        next(error);
    }
});

// GET expense summary by month/year
router.get('/expenses/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const summary = expenseRepo.getByMonth(month, parseInt(year));
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});

// POST/PUT upsert expense summary
router.post('/expenses', (req, res, next) => {
    try {
        const { summary_month, summary_year, ...data } = req.body;
        const summary = expenseRepo.upsert(summary_month, summary_year, data);
        res.status(201).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});

// PUT update expense summary
router.put('/expenses/:id', (req, res, next) => {
    try {
        const summary = expenseRepo.update(req.params.id, req.body);
        if (!summary) {
            return res.status(404).json({ success: false, error: 'Summary not found' });
        }
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// PROFIT SHARING
// =====================================================

// GET all profit sharing
router.get('/profit', (req, res, next) => {
    try {
        const profitSharing = profitRepo.findAll();
        res.json({ success: true, data: profitSharing });
    } catch (error) {
        next(error);
    }
});

// GET profit sharing by year
router.get('/profit/year/:year', (req, res, next) => {
    try {
        const profitSharing = profitRepo.getByYear(parseInt(req.params.year));
        res.json({ success: true, data: profitSharing });
    } catch (error) {
        next(error);
    }
});

// GET profit sharing by month/year
router.get('/profit/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const profitSharing = profitRepo.getByMonth(month, parseInt(year));
        res.json({ success: true, data: profitSharing });
    } catch (error) {
        next(error);
    }
});

// POST/PUT upsert profit sharing
router.post('/profit', (req, res, next) => {
    try {
        const body = req.body;
        // Support both frontend field names (month/year) and legacy (period_month/period_year)
        const month = body.month || body.period_month;
        const year = parseInt(body.year || body.period_year);

        // Map frontend field names to database column names
        const data = {
            actual_amount: parseFloat(body.sold_amount || body.actual_amount) || 0,
            stock_at_site_cft: parseFloat(body.stock_cft || body.stock_at_site_cft) || 0,
            estimated_rate: parseFloat(body.cost_per_cft || body.estimated_rate) || 0,
            actual_expenses: parseFloat(body.total_expenses || body.actual_expenses) || 0,
            partner1_share_percentage: parseFloat(body.partner_a_share || body.partner1_share_percentage) || 50,
            partner2_share_percentage: parseFloat(body.partner_b_share || body.partner2_share_percentage) || 50,
        };

        const profitSharing = profitRepo.upsert(month, year, data);
        res.status(201).json({ success: true, data: profitSharing });
    } catch (error) {
        next(error);
    }
});

// PUT update profit sharing
router.put('/profit/:id', (req, res, next) => {
    try {
        const profitSharing = profitRepo.update(req.params.id, req.body);
        if (!profitSharing) {
            return res.status(404).json({ success: false, error: 'Profit sharing not found' });
        }
        res.json({ success: true, data: profitSharing });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

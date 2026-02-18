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
        const { period_month, period_year, ...data } = req.body;
        const profitSharing = profitRepo.upsert(period_month, period_year, data);
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

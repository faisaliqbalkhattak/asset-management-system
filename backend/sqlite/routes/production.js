// =====================================================
// PRODUCTION ROUTES
// =====================================================
// API routes for daily production and monthly summary
// =====================================================

const express = require('express');
const router = express.Router();
const { productionController: ProductionController } = require('../controllers');

// =====================================================
// DAILY PRODUCTION
// =====================================================

// GET all daily production
router.get('/daily', (req, res, next) => {
    try {
        const production = ProductionController.getAllProduction();
        res.json({ success: true, data: production });
    } catch (error) {
        next(error);
    }
});

// GET daily production by ID
router.get('/daily/:id', (req, res, next) => {
    try {
        const production = ProductionController.getProductionById(req.params.id);
        if (!production) {
            return res.status(404).json({ success: false, error: 'Production not found' });
        }
        res.json({ success: true, data: production });
    } catch (error) {
        next(error);
    }
});

// GET daily production by month
router.get('/daily/month/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const production = ProductionController.getProductionByMonth(parseInt(month), parseInt(year));
        res.json({ success: true, data: production });
    } catch (error) {
        next(error);
    }
});

// GET monthly totals from daily production
router.get('/daily/total/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const total = ProductionController.getMonthlyTotal(parseInt(month), parseInt(year));
        res.json({ success: true, data: total });
    } catch (error) {
        next(error);
    }
});

// GET yearly totals
router.get('/daily/yearly/:year', (req, res, next) => {
    try {
        const totals = ProductionController.getYearlyTotals(parseInt(req.params.year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// POST create daily production
router.post('/daily', (req, res, next) => {
    try {
        const production = ProductionController.addDailyProduction(req.body);
        res.status(201).json({ success: true, data: production });
    } catch (error) {
        next(error);
    }
});

// PUT update daily production
router.put('/daily/:id', (req, res, next) => {
    try {
        const production = ProductionController.updateProduction(req.params.id, req.body);
        if (!production) {
            return res.status(404).json({ success: false, error: 'Production not found' });
        }
        res.json({ success: true, data: production });
    } catch (error) {
        next(error);
    }
});

// DELETE daily production
router.delete('/daily/:id', (req, res, next) => {
    try {
        const deleted = ProductionController.deleteProduction(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Production not found' });
        }
        res.json({ success: true, message: 'Production deleted' });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// MONTHLY PRODUCTION SUMMARY
// =====================================================

// GET all monthly summaries
router.get('/monthly', (req, res, next) => {
    try {
        const summaries = ProductionController.getAllMonthlySummaries();
        res.json({ success: true, data: summaries });
    } catch (error) {
        next(error);
    }
});

// GET monthly summary by year
router.get('/monthly/year/:year', (req, res, next) => {
    try {
        const summaries = ProductionController.getByYear(parseInt(req.params.year));
        res.json({ success: true, data: summaries });
    } catch (error) {
        next(error);
    }
});

// GET monthly summary by month/year
router.get('/monthly/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const summary = ProductionController.getByMonth(month, parseInt(year));
        if (!summary) {
            return res.json({ success: true, data: null });
        }
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});

// POST/PUT upsert monthly summary
router.post('/monthly', (req, res, next) => {
    try {
        let { summary_month, summary_year, month, year, ...data } = req.body;
        
        // Handle month/year from either set of keys
        let targetMonth = summary_month || month;
        const targetYear = summary_year || year;

        // Convert numeric month (01, 02) to full name if needed
        // Assuming DB stores full names based on repository code
        if (targetMonth && /^\d+$/.test(targetMonth)) {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthIndex = parseInt(targetMonth) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                targetMonth = months[monthIndex];
            }
        }

        if (!targetMonth || !targetYear) {
            return res.status(400).json({ success: false, error: 'Month and Year are required' });
        }

        const summary = ProductionController.upsert(targetMonth, targetYear, data);
        res.status(201).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});

// PUT update monthly summary
router.put('/monthly/:id', (req, res, next) => {
    try {
        const summary = ProductionController.updateProduction(req.params.id, req.body);
        if (!summary) {
            return res.status(404).json({ success: false, error: 'Summary not found' });
        }
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

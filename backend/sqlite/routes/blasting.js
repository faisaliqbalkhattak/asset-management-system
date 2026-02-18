// =====================================================
// BLASTING MATERIAL ROUTES
// =====================================================
// API routes for blasting material purchases
// =====================================================

const express = require('express');
const router = express.Router();
const { BlastingMaterialNewRepository } = require('../repositories');

const repo = new BlastingMaterialNewRepository();

// GET all entries
router.get('/', (req, res, next) => {
    try {
        const entries = repo.findAll();
        res.json({ success: true, data: entries });
    } catch (error) {
        next(error);
    }
});

// GET entry by ID
router.get('/:id', (req, res, next) => {
    try {
        const entry = repo.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, error: 'Entry not found' });
        }
        res.json({ success: true, data: entry });
    } catch (error) {
        next(error);
    }
});

// GET entries by month
router.get('/month/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const entries = repo.getByMonth(parseInt(month), parseInt(year));
        res.json({ success: true, data: entries });
    } catch (error) {
        next(error);
    }
});

// GET monthly total
router.get('/total/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const total = repo.getMonthlyTotal(parseInt(month), parseInt(year));
        res.json({ success: true, data: total });
    } catch (error) {
        next(error);
    }
});

// GET yearly totals
router.get('/yearly/:year', (req, res, next) => {
    try {
        const totals = repo.getYearlyTotals(parseInt(req.params.year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// POST create new entry
router.post('/', (req, res, next) => {
    try {
        const entry = repo.create(req.body);
        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        next(error);
    }
});

// PUT update entry
router.put('/:id', (req, res, next) => {
    try {
        const entry = repo.update(req.params.id, req.body);
        if (!entry) {
            return res.status(404).json({ success: false, error: 'Entry not found' });
        }
        res.json({ success: true, data: entry });
    } catch (error) {
        next(error);
    }
});

// DELETE entry
router.delete('/:id', (req, res, next) => {
    try {
        const deleted = repo.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Entry not found' });
        }
        res.json({ success: true, message: 'Entry deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

// =====================================================
// LOADER ROUTES
// =====================================================
// API routes for loader operations (both 966-F & 950-E in one row)
// Plus separate misc expenses per loader
// =====================================================

const express = require('express');
const router = express.Router();
const { LoaderOperationNewRepository, LoaderMiscExpenseRepository } = require('../repositories');

const repo = new LoaderOperationNewRepository();
const miscRepo = new LoaderMiscExpenseRepository();

// =====================================================
// LOADER OPERATIONS
// =====================================================

// GET all operations
router.get('/', (req, res, next) => {
    try {
        const operations = repo.findAllWithName();
        res.json({ success: true, data: operations });
    } catch (error) {
        next(error);
    }
});

// GET operation by ID
router.get('/:id', (req, res, next) => {
    try {
        const operation = repo.findByIdWithName(req.params.id);
        if (!operation) {
            return res.status(404).json({ success: false, error: 'Operation not found' });
        }
        res.json({ success: true, data: operation });
    } catch (error) {
        next(error);
    }
});

// GET operations by month
router.get('/month/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const operations = repo.getByMonth(parseInt(month), parseInt(year));
        res.json({ success: true, data: operations });
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

// POST create new operation
router.post('/', (req, res, next) => {
    try {
        // Validation - operation_date is required
        if (!req.body.operation_date) {
            return res.status(400).json({ 
                success: false, 
                error: 'operation_date is required' 
            });
        }
        
        // Validation - equipment_name is required
        if (!req.body.equipment_name) {
            return res.status(400).json({ 
                success: false, 
                error: 'equipment_name is required. Select a loader.' 
            });
        }
        
        const operation = repo.create(req.body);
        res.status(201).json({ success: true, data: operation });
    } catch (error) {
        next(error);
    }
});

// PUT update operation
router.put('/:id', (req, res, next) => {
    try {
        // Validation - operation_date is required for updates too
        if (req.body.operation_date === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'operation_date cannot be empty' 
            });
        }
        
        const operation = repo.update(req.params.id, req.body);
        if (!operation) {
            return res.status(404).json({ success: false, error: 'Operation not found' });
        }
        res.json({ success: true, data: operation });
    } catch (error) {
        next(error);
    }
});

// DELETE operation
router.delete('/:id', (req, res, next) => {
    try {
        const deleted = repo.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Operation not found' });
        }
        res.json({ success: true, message: 'Operation deleted' });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// LOADER MISC EXPENSES
// =====================================================

// GET all misc expenses
router.get('/misc/all', (req, res, next) => {
    try {
        const expenses = miscRepo.findAll();
        res.json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
});

// GET misc expenses by loader
router.get('/misc/loader/:loaderName', (req, res, next) => {
    try {
        const expenses = miscRepo.getByLoader(req.params.loaderName);
        res.json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
});

// GET monthly misc totals for all loaders
router.get('/misc/total/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const totals = miscRepo.getMonthlyTotalAllLoaders(parseInt(month), parseInt(year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// GET yearly misc totals by loader
router.get('/misc/yearly/:year', (req, res, next) => {
    try {
        const totals = miscRepo.getYearlyTotalsByLoader(parseInt(req.params.year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// GET misc expense by ID
router.get('/misc/:id', (req, res, next) => {
    try {
        const expense = miscRepo.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
});

// POST create new misc expense
router.post('/misc', (req, res, next) => {
    try {
        const expense = miscRepo.create(req.body);
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
});

// PUT update misc expense
router.put('/misc/:id', (req, res, next) => {
    try {
        const expense = miscRepo.update(req.params.id, req.body);
        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
});

// DELETE misc expense
router.delete('/misc/:id', (req, res, next) => {
    try {
        const deleted = miscRepo.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

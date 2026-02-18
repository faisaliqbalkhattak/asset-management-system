// =====================================================
// EXCAVATOR ROUTES
// =====================================================
// API routes for excavator operations
// =====================================================

const express = require('express');
const router = express.Router();
const { ExcavatorOperationRepository } = require('../repositories');

const repo = new ExcavatorOperationRepository();

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

// GET monthly total (includes misc_total for reference)
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
                error: 'equipment_name is required. Select an excavator.' 
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

module.exports = router;

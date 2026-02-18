// =====================================================
// DUMPER ROUTES
// =====================================================
// API routes for dumper operations and misc expenses
// Each dumper tracked separately
// =====================================================

const express = require('express');
const router = express.Router();
const { DumperOperationRepository, DumperMiscExpenseRepository } = require('../repositories');

const opRepo = new DumperOperationRepository();
const miscRepo = new DumperMiscExpenseRepository();

// =====================================================
// DUMPER OPERATIONS
// =====================================================

// GET all operations
router.get('/operations', (req, res, next) => {
    try {
        const operations = opRepo.findAllWithName();
        res.json({ success: true, data: operations });
    } catch (error) {
        next(error);
    }
});

// GET operations by vehicle (by equipment_id)
router.get('/operations/vehicle/:vehicleId', (req, res, next) => {
    try {
        const operations = opRepo.getByEquipmentId(req.params.vehicleId);
        res.json({ success: true, data: operations });
    } catch (error) {
        next(error);
    }
});

// GET operation by ID
router.get('/operations/:id', (req, res, next) => {
    try {
        const operation = opRepo.findByIdWithName(req.params.id);
        if (!operation) {
            return res.status(404).json({ success: false, error: 'Operation not found' });
        }
        res.json({ success: true, data: operation });
    } catch (error) {
        next(error);
    }
});

// GET operations by month
router.get('/operations/month/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const operations = opRepo.getByMonth(parseInt(month), parseInt(year));
        res.json({ success: true, data: operations });
    } catch (error) {
        next(error);
    }
});

// GET monthly totals for all vehicles
router.get('/operations/total/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const totals = opRepo.getMonthlyTotalAllVehicles(parseInt(month), parseInt(year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// GET yearly totals by vehicle
router.get('/operations/yearly/:year', (req, res, next) => {
    try {
        const totals = opRepo.getYearlyTotalsByVehicle(parseInt(req.params.year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// GET distinct vehicles
router.get('/vehicles', (req, res, next) => {
    try {
        const vehicles = opRepo.getDistinctVehicles();
        res.json({ success: true, data: vehicles });
    } catch (error) {
        next(error);
    }
});

// POST create new operation
router.post('/operations', (req, res, next) => {
    try {
        // Validation - trip_date is required
        if (!req.body.trip_date) {
            return res.status(400).json({ 
                success: false, 
                error: 'trip_date is required' 
            });
        }
        
        // Validation - dumper_name is required
        if (!req.body.dumper_name) {
            return res.status(400).json({ 
                success: false, 
                error: 'dumper_name is required. Select a dumper.' 
            });
        }
        
        const operation = opRepo.create(req.body);
        res.status(201).json({ success: true, data: operation });
    } catch (error) {
        next(error);
    }
});

// PUT update operation
router.put('/operations/:id', (req, res, next) => {
    try {
        // Validation - trip_date is required for updates too
        if (req.body.trip_date === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'trip_date cannot be empty' 
            });
        }
        
        const operation = opRepo.update(req.params.id, req.body);
        if (!operation) {
            return res.status(404).json({ success: false, error: 'Operation not found' });
        }
        res.json({ success: true, data: operation });
    } catch (error) {
        next(error);
    }
});

// DELETE operation
router.delete('/operations/:id', (req, res, next) => {
    try {
        const deleted = opRepo.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Operation not found' });
        }
        res.json({ success: true, message: 'Operation deleted' });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// DUMPER MISC EXPENSES
// =====================================================

// GET all misc expenses
router.get('/misc', (req, res, next) => {
    try {
        const expenses = miscRepo.findAllWithName();
        res.json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
});

// GET misc expenses by vehicle
router.get('/misc/vehicle/:vehicleNumber', (req, res, next) => {
    try {
        const expenses = miscRepo.getByVehicle(req.params.vehicleNumber);
        res.json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
});

// GET monthly misc totals for all vehicles
router.get('/misc/total/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const totals = miscRepo.getMonthlyTotalAllVehicles(parseInt(month), parseInt(year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// GET yearly misc totals by vehicle
router.get('/misc/yearly/:year', (req, res, next) => {
    try {
        const totals = miscRepo.getYearlyTotalsByVehicle(parseInt(req.params.year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// POST create new misc expense
router.post('/misc', (req, res, next) => {
    try {
        // Validation - expense_date is required
        if (!req.body.expense_date) {
            return res.status(400).json({ 
                success: false, 
                error: 'expense_date is required' 
            });
        }
        
        // Validation - dumper_name is required
        if (!req.body.dumper_name) {
            return res.status(400).json({ 
                success: false, 
                error: 'dumper_name is required. Select a dumper.' 
            });
        }
        
        const expense = miscRepo.create(req.body);
        res.status(201).json({ success: true, data: expense });
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

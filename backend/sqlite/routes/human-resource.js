// =====================================================
// HUMAN RESOURCE ROUTES
// =====================================================
// API routes for employees and salaries
// =====================================================

const express = require('express');
const router = express.Router();
const { HumanResourceRepository, HumanResourceSalaryRepository } = require('../repositories');

const employeeRepo = new HumanResourceRepository();
const salaryRepo = new HumanResourceSalaryRepository();

// =====================================================
// EMPLOYEES
// =====================================================

// GET all employees
router.get('/', (req, res, next) => {
    try {
        const employees = employeeRepo.findAll();
        res.json({ success: true, data: employees });
    } catch (error) {
        next(error);
    }
});

// GET active employees
router.get('/active', (req, res, next) => {
    try {
        const employees = employeeRepo.getActive();
        res.json({ success: true, data: employees });
    } catch (error) {
        next(error);
    }
});

// GET employee by ID
router.get('/:id', (req, res, next) => {
    try {
        const employee = employeeRepo.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        res.json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
});

// POST create new employee
router.post('/', (req, res, next) => {
    try {
        const employee = employeeRepo.create(req.body);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
});

// PUT update employee
router.put('/:id', (req, res, next) => {
    try {
        const employee = employeeRepo.updateById(req.params.id, req.body);
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        res.json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
});

// DELETE employee
router.delete('/:id', (req, res, next) => {
    try {
        const deleted = employeeRepo.deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// SALARIES
// =====================================================

// GET all salaries
router.get('/salaries/all', (req, res, next) => {
    try {
        const salaries = salaryRepo.findAllWithName();
        res.json({ success: true, data: salaries });
    } catch (error) {
        next(error);
    }
});

// GET salaries by employee
router.get('/:employeeId/salaries', (req, res, next) => {
    try {
        const salaries = salaryRepo.getByEmployee(req.params.employeeId);
        res.json({ success: true, data: salaries });
    } catch (error) {
        next(error);
    }
});

// GET salaries by month
router.get('/salaries/month/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const salaryMonth = `${year}-${String(month).padStart(2, '0')}`;
        const salaries = salaryRepo.getByMonth(salaryMonth);
        res.json({ success: true, data: salaries });
    } catch (error) {
        next(error);
    }
});

// GET monthly total
router.get('/salaries/total/:year/:month', (req, res, next) => {
    try {
        const { year, month } = req.params;
        const salaryMonth = `${year}-${String(month).padStart(2, '0')}`;
        const total = salaryRepo.getMonthlyTotal(salaryMonth);
        res.json({ success: true, data: total });
    } catch (error) {
        next(error);
    }
});

// GET yearly totals
router.get('/salaries/yearly/:year', (req, res, next) => {
    try {
        const totals = salaryRepo.getYearlyTotals(parseInt(req.params.year));
        res.json({ success: true, data: totals });
    } catch (error) {
        next(error);
    }
});

// POST create new salary
router.post('/salaries', (req, res, next) => {
    try {
        const salary = salaryRepo.create(req.body);
        res.status(201).json({ success: true, data: salary });
    } catch (error) {
        next(error);
    }
});

// PUT update salary
router.put('/salaries/:id', (req, res, next) => {
    try {
        const salary = salaryRepo.update(req.params.id, req.body);
        if (!salary) {
            return res.status(404).json({ success: false, error: 'Salary not found' });
        }
        res.json({ success: true, data: salary });
    } catch (error) {
        next(error);
    }
});

// DELETE salary
router.delete('/salaries/:id', (req, res, next) => {
    try {
        const deleted = salaryRepo.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Salary not found' });
        }
        res.json({ success: true, message: 'Salary deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

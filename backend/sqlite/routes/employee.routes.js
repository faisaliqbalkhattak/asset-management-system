/**
 * Employee Routes
 * ===============
 * Employee master and salary endpoints
 * 
 * Base: /api/employees
 */

const express = require('express');
const router = express.Router();
const {
    // Employees
    getAll,
    getOne,
    create,
    update,
    remove,
    // Salaries
    getSalaries,
    createSalary,
    updateSalary,
    deleteSalary,
    getSalariesByPeriod,
    markSalaryPaid
} = require('../controllers/employee.controller');

// Salary routes (before :id to avoid conflicts)
router.get('/salaries/:year/:month', getSalariesByPeriod);
router.put('/salaries/:salaryId', updateSalary);
router.put('/salaries/:salaryId/pay', markSalaryPaid);
router.delete('/salaries/:salaryId', deleteSalary);

// Employee master routes
router.route('/')
    .get(getAll)
    .post(create);

router.route('/:id')
    .get(getOne)
    .put(update)
    .delete(remove);

// Employee salaries routes
router.route('/:id/salaries')
    .get(getSalaries)
    .post(createSalary);

module.exports = router;

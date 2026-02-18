/**
 * Employee Controller
 * ===================
 * Handles employee master data and salary records
 * 
 * Endpoints:
 * ----------
 * Employees:
 * GET    /api/employees           - Get all employees
 * GET    /api/employees/:id       - Get single employee
 * POST   /api/employees           - Create employee
 * PUT    /api/employees/:id       - Update employee
 * DELETE /api/employees/:id       - Delete employee
 * 
 * Salaries:
 * GET    /api/employees/:id/salaries         - Get salaries for employee
 * POST   /api/employees/:id/salaries         - Create salary record
 * PUT    /api/employees/salaries/:salaryId   - Update salary record
 * DELETE /api/employees/salaries/:salaryId   - Delete salary record
 */

const { asyncHandler, ErrorResponse } = require('../../middlewares');
const HumanResourceRepository = require('../repositories/HumanResourceRepository');
const HumanResourceSalaryRepository = require('../repositories/HumanResourceSalaryRepository');

const employeeRepo = new HumanResourceRepository();
const salaryRepo = new HumanResourceSalaryRepository();

// =====================================================
// EMPLOYEE MASTER
// =====================================================

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private
 */
const getAll = asyncHandler(async (req, res, next) => {
    const { active, department } = req.query;
    
    let employees;
    if (active === 'true') {
        employees = employeeRepo.getActive();
    } else if (department) {
        employees = employeeRepo.findAll({ department, is_active: 1 });
    } else {
        employees = employeeRepo.findAll();
    }

    res.status(200).json({
        success: true,
        count: employees.length,
        data: employees
    });
});

/**
 * @desc    Get single employee
 * @route   GET /api/employees/:id
 * @access  Private
 */
const getOne = asyncHandler(async (req, res, next) => {
    const employee = employeeRepo.findById(req.params.id);

    if (!employee) {
        return next(new ErrorResponse(`Employee not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: employee
    });
});

/**
 * @desc    Create employee
 * @route   POST /api/employees
 * @access  Private/Admin
 */
const create = asyncHandler(async (req, res, next) => {
    const { name, employee_name } = req.body;

    const nameToUse = employee_name || name;

    if (!nameToUse) {
        return next(new ErrorResponse('Please provide employee name', 400));
    }

    const employee = employeeRepo.create(req.body);

    res.status(201).json({
        success: true,
        data: employee
    });
});

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private/Admin
 */
const update = asyncHandler(async (req, res, next) => {
    let employee = employeeRepo.findById(req.params.id);

    if (!employee) {
        return next(new ErrorResponse(`Employee not found with id ${req.params.id}`, 404));
    }

    employee = employeeRepo.updateById(req.params.id, req.body);

    res.status(200).json({
        success: true,
        data: employee
    });
});

/**
 * @desc    Delete employee (soft delete)
 * @route   DELETE /api/employees/:id
 * @access  Private/Admin
 */
const remove = asyncHandler(async (req, res, next) => {
    const employee = employeeRepo.findById(req.params.id);

    if (!employee) {
        return next(new ErrorResponse(`Employee not found with id ${req.params.id}`, 404));
    }

    // Soft delete
    employeeRepo.updateById(req.params.id, { is_active: 0 });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// =====================================================
// EMPLOYEE SALARIES
// =====================================================

/**
 * @desc    Get salaries for employee
 * @route   GET /api/employees/:id/salaries
 * @access  Private
 */
const getSalaries = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.params;
    const salaries = salaryRepo.findAll({ employee_id });

    res.status(200).json({
        success: true,
        count: salaries.length,
        data: salaries
    });
});

/**
 * @desc    Create salary record
 * @route   POST /api/employees/:employee_id/salaries
 * @access  Private/Admin
 */
const createSalary = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.params;
    const salaryData = { ...req.body, employee_id };

    const salary = salaryRepo.create(salaryData);

    res.status(201).json({
        success: true,
        data: salary
    });
});

/**
 * @desc    Update salary record
 * @route   PUT /api/employees/salaries/:salaryId
 * @access  Private/Admin
 */
const updateSalary = asyncHandler(async (req, res, next) => {
    const { salaryId } = req.params;
    let salary = salaryRepo.findById(salaryId);

    if (!salary) {
        return next(new ErrorResponse(`Salary record not found with id ${salaryId}`, 404));
    }

    salary = salaryRepo.updateById(salaryId, req.body);

    res.status(200).json({
        success: true,
        data: salary
    });
});

/**
 * @desc    Delete salary record
 * @route   DELETE /api/employees/salaries/:salaryId
 * @access  Private/Admin
 */
const deleteSalary = asyncHandler(async (req, res, next) => {
    const { salaryId } = req.params;
    const deleted = salaryRepo.delete(salaryId);

    if (!deleted) {
        return next(new ErrorResponse(`Salary record not found with id ${salaryId}`, 404));
    }

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Get all salaries for a period
 * @route   GET /api/employees/salaries/:year/:month
 * @access  Private
 */
const getSalariesByPeriod = asyncHandler(async (req, res, next) => {
    const { year, month } = req.params;
    
    // Construct query for period
    const salaries = salaryRepo.findAll({ 
        salary_month: `${year}-${month.toString().padStart(2, '0')}` 
    });

    // Calculate totals
    const totals = (salaries || []).reduce((acc, s) => {
        acc.total_salary += s.base_salary || 0;
        acc.total_deductions += s.deductions || 0;
        acc.total_allowances += s.overtime || 0; // mapped overtime as allowance equivalent for summary
        acc.total_paid += s.net_salary || 0;
        return acc;
    }, {
        total_salary: 0,
        total_deductions: 0,
        total_allowances: 0,
        total_paid: 0
    });

    res.status(200).json({
        success: true,
        count: salaries.length,
        data: {
            period: { month, year: parseInt(year) },
            totals,
            salaries
        }
    });
});

/**
 * @desc    Mark salary as paid
 * @route   PUT /api/employees/salaries/:salaryId/pay
 * @access  Private
 */
const markSalaryPaid = asyncHandler(async (req, res, next) => {
    let salary = salaryRepo.findById(req.params.salaryId);

    if (!salary) {
        return next(new ErrorResponse(`Salary record not found with id ${req.params.salaryId}`, 404));
    }

    const now = new Date().toISOString().split('T')[0];
    
    // Using updateById
    salary = salaryRepo.updateById(req.params.salaryId, {
        payment_status: 'PAID',
        payment_date: req.body.payment_date || now
    });

    res.status(200).json({
        success: true,
        data: salary
    });
});

module.exports = {
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
};

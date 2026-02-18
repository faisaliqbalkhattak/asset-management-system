/**
 * Expense Controller
 * ==================
 * Handles expense categories and general expenses
 * 
 * Endpoints:
 * ----------
 * Categories:
 * GET    /api/expenses/categories         - Get all categories
 * POST   /api/expenses/categories         - Create category
 * PUT    /api/expenses/categories/:id     - Update category
 * DELETE /api/expenses/categories/:id     - Delete category
 * 
 * Expenses:
 * GET    /api/expenses                    - Get all expenses
 * GET    /api/expenses/:id                - Get single expense
 * POST   /api/expenses                    - Create expense
 * PUT    /api/expenses/:id                - Update expense
 * DELETE /api/expenses/:id                - Delete expense
 */

const { asyncHandler, ErrorResponse } = require('../../middlewares');
const ExpenseCategoryRepository = require('../repositories/ExpenseCategoryRepository');
const GeneralExpenseRepository = require('../repositories/GeneralExpenseRepository');
const { getDayName } = require('../shared/utilities');

// =====================================================
// EXPENSE CATEGORIES
// =====================================================

/**
 * @desc    Get all expense categories
 * @route   GET /api/expenses/categories
 * @access  Private
 */
const getAllCategories = asyncHandler(async (req, res, next) => {
    const { active } = req.query;
    
    let categories;
    if (active === 'true') {
        categories = ExpenseCategoryRepository.findActive();
    } else {
        categories = ExpenseCategoryRepository.findAll();
    }

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

/**
 * @desc    Get single category
 * @route   GET /api/expenses/categories/:id
 * @access  Private
 */
const getCategory = asyncHandler(async (req, res, next) => {
    const category = ExpenseCategoryRepository.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`Category not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: category
    });
});

/**
 * @desc    Create expense category
 * @route   POST /api/expenses/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res, next) => {
    // Accept both name (frontend) and category_name (API)
    const categoryName = req.body.category_name || req.body.name;
    let categoryCode = req.body.category_code;

    if (!categoryName) {
        return next(new ErrorResponse('Please provide category name', 400));
    }

    // Auto-generate category_code if not provided
    if (!categoryCode) {
        categoryCode = categoryName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);
    }

    // Check if code exists
    const existing = ExpenseCategoryRepository.findByCode(categoryCode);
    if (existing) {
        return next(new ErrorResponse(`Category with code ${categoryCode} already exists`, 400));
    }

    const category = ExpenseCategoryRepository.create({
        category_code: categoryCode,
        category_name: categoryName
    });

    res.status(201).json({
        success: true,
        data: category
    });
});

/**
 * @desc    Update expense category
 * @route   PUT /api/expenses/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res, next) => {
    let category = ExpenseCategoryRepository.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`Category not found with id ${req.params.id}`, 404));
    }

    category = ExpenseCategoryRepository.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        data: category
    });
});

/**
 * @desc    Delete expense category
 * @route   DELETE /api/expenses/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res, next) => {
    const category = ExpenseCategoryRepository.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`Category not found with id ${req.params.id}`, 404));
    }

    // Soft delete
    ExpenseCategoryRepository.update(req.params.id, { is_active: 0 });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// =====================================================
// GENERAL EXPENSES
// =====================================================

/**
 * @desc    Get all expenses
 * @route   GET /api/expenses
 * @access  Private
 */
const getAll = asyncHandler(async (req, res, next) => {
    const { startDate, endDate, category_id } = req.query;
    
    let expenses;
    if (startDate && endDate) {
        expenses = GeneralExpenseRepository.findByDateRange(startDate, endDate);
    } else if (category_id) {
        expenses = GeneralExpenseRepository.findByCategory(category_id);
    } else {
        expenses = GeneralExpenseRepository.findAll();
    }

    res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
    });
});

/**
 * @desc    Get single expense
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getOne = asyncHandler(async (req, res, next) => {
    const expense = GeneralExpenseRepository.findById(req.params.id);

    if (!expense) {
        return next(new ErrorResponse(`Expense not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: expense
    });
});

/**
 * @desc    Create expense
 * @route   POST /api/expenses
 * @access  Private
 */
const create = asyncHandler(async (req, res, next) => {
    const { category_id, expense_date, amount } = req.body;

    // Validation
    if (!category_id || !expense_date) {
        return next(new ErrorResponse('Please provide category_id and expense_date', 400));
    }

    // Check category exists
    const category = ExpenseCategoryRepository.findById(category_id);
    if (!category) {
        return next(new ErrorResponse(`Category not found with id ${category_id}`, 404));
    }

    // Set day name
    const day_name = getDayName(expense_date);

    const expense = GeneralExpenseRepository.create({
        ...req.body,
        day_name
    });

    res.status(201).json({
        success: true,
        data: expense
    });
});

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const update = asyncHandler(async (req, res, next) => {
    let expense = GeneralExpenseRepository.findById(req.params.id);

    if (!expense) {
        return next(new ErrorResponse(`Expense not found with id ${req.params.id}`, 404));
    }

    // Update day_name if date changed
    if (req.body.expense_date) {
        req.body.day_name = getDayName(req.body.expense_date);
    }

    expense = GeneralExpenseRepository.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        data: expense
    });
});

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private/Admin
 */
const remove = asyncHandler(async (req, res, next) => {
    const expense = GeneralExpenseRepository.findById(req.params.id);

    if (!expense) {
        return next(new ErrorResponse(`Expense not found with id ${req.params.id}`, 404));
    }

    GeneralExpenseRepository.delete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Get expenses by date
 * @route   GET /api/expenses/date/:date
 * @access  Private
 */
const getByDate = asyncHandler(async (req, res, next) => {
    const expenses = GeneralExpenseRepository.findByDate(req.params.date);

    res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
    });
});

/**
 * @desc    Get monthly expense summary
 * @route   GET /api/expenses/summary/:year/:month
 * @access  Private
 */
const getMonthlySummary = asyncHandler(async (req, res, next) => {
    const { year, month } = req.params;
    
    const summary = GeneralExpenseRepository.getMonthlySummary(parseInt(year), month);

    res.status(200).json({
        success: true,
        data: summary
    });
});

module.exports = {
    // Categories
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    // Expenses
    getAll,
    getOne,
    create,
    update,
    remove,
    getByDate,
    getMonthlySummary
};

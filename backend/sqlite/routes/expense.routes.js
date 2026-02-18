/**
 * Expense Routes
 * ==============
 * Expense categories and general expenses endpoints
 * 
 * Base: /api/expenses
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/expense.controller');

// Category routes
router.route('/categories')
    .get(getAllCategories)
    .post(createCategory);

router.route('/categories/:id')
    .get(getCategory)
    .put(updateCategory)
    .delete(deleteCategory);

// Summary and date routes
router.get('/summary/:year/:month', getMonthlySummary);
router.get('/date/:date', getByDate);

// Expense CRUD routes
router.route('/')
    .get(getAll)
    .post(create);

router.route('/:id')
    .get(getOne)
    .put(update)
    .delete(remove);

module.exports = router;

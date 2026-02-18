/**
 * Equipment Routes
 * ================
 * Equipment master and operations endpoints
 * 
 * Base: /api/equipment
 */

const express = require('express');
const router = express.Router();
const {
    getAll,
    getOne,
    create,
    update,
    remove,
    getOperations,
    createOperation,
    getOperationsByDate,
    updateOperation,
    deleteOperation,
    getMonthlySummary
} = require('../controllers/equipment.controller');

// Import misc expense handlers
const {
    addMiscExpense,
    getMiscExpenses
} = require('../controllers/equipment.controller');

// Operations routes (must be before :id routes to avoid conflicts)
router.get('/operations/date/:date', getOperationsByDate);
router.put('/operations/:operationId', updateOperation);
router.delete('/operations/:operationId', deleteOperation);

// Misc expense routes for operations
router.route('/operations/:operationId/misc')
    .get(getMiscExpenses)
    .post(addMiscExpense);

// Equipment master routes
router.route('/')
    .get(getAll)
    .post(create);

router.route('/:id')
    .get(getOne)
    .put(update)
    .delete(remove);

// Equipment operations routes
router.route('/:id/operations')
    .get(getOperations)
    .post(createOperation);

// Summary route
router.get('/:id/summary/:year/:month', getMonthlySummary);

module.exports = router;

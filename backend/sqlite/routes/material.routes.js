/**
 * Material Routes
 * ===============
 * Material master and purchase endpoints
 * 
 * Base: /api/materials
 */

const express = require('express');
const router = express.Router();
const {
    getAll,
    getOne,
    create,
    update,
    remove,
    getPurchases,
    createPurchase,
    getPurchasesByDate,
    updatePurchase,
    deletePurchase,
    getMonthlySummary,
    getBlastingSummary,
    getAllPurchases
} = require('../controllers/material.controller');

// Purchase routes (must be before :id routes to avoid conflicts)
router.get('/purchases', getAllPurchases);
router.get('/purchases/date/:date', getPurchasesByDate);
router.put('/purchases/:purchaseId', updatePurchase);
router.delete('/purchases/:purchaseId', deletePurchase);

// Summary routes
router.get('/summary/:year/:month', getMonthlySummary);
router.get('/blasting/summary/:year/:month', getBlastingSummary);

// Material master routes
router.route('/')
    .get(getAll)
    .post(create);

router.route('/:id')
    .get(getOne)
    .put(update)
    .delete(remove);

// Material purchase routes
router.route('/:id/purchases')
    .get(getPurchases)
    .post(createPurchase);

module.exports = router;

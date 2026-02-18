/**
 * Vehicle Routes
 * ==============
 * Vehicle master and trips endpoints
 * 
 * Base: /api/vehicles
 */

const express = require('express');
const router = express.Router();
const {
    getAll,
    getOne,
    create,
    update,
    remove,
    getTrips,
    createTrip,
    getTripsByDate,
    updateTrip,
    deleteTrip,
    getMonthlySummary,
    getDailyTotals,
    addMiscExpense,
    getMiscExpenses
} = require('../controllers/vehicle.controller');

// Trip routes (must be before :id routes to avoid conflicts)
router.get('/trips/date/:date', getTripsByDate);
router.get('/totals/date/:date', getDailyTotals);
router.put('/trips/:tripId', updateTrip);
router.delete('/trips/:tripId', deleteTrip);

// Misc expense routes for trips
router.route('/trips/:tripId/misc')
    .get(getMiscExpenses)
    .post(addMiscExpense);

// Vehicle master routes
router.route('/')
    .get(getAll)
    .post(create);

router.route('/:id')
    .get(getOne)
    .put(update)
    .delete(remove);

// Vehicle trips routes
router.route('/:id/trips')
    .get(getTrips)
    .post(createTrip);

// Summary route
router.get('/:id/summary/:year/:month', getMonthlySummary);

module.exports = router;

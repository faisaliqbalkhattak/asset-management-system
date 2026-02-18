const express = require('express');

// Import individual route handlers
const employeeRoutes = require('./employee.routes');
const equipmentRoutes = require('./equipment.routes');
const expenseRoutes = require('./expense.routes');
const materialRoutes = require('./material.routes');
const vehicleRoutes = require('./vehicle.routes');
const dumperRoutes = require('./dumpers');
const loaderRoutes = require('./loaders');
const excavatorRoutes = require('./excavator');
const generatorRoutes = require('./generator');
const plantExpenseRoutes = require('./plant-expense');
const langarRoutes = require('./langar');
const miscExpenseRoutes = require('./misc-expense');
const blastingRoutes = require('./blasting');
const humanResourceRoutes = require('./human-resource');
const productionRoutes = require('./production');
const summaryRoutes = require('./summary');

/**
 * Initializes and returns the main API router.
 * This function is called after the database is initialized.
 */
function initRouter() {
    const router = express.Router();

    // Health check endpoint
    router.get('/health', (req, res) => {
        res.status(200).json({
            status: 'UP',
            timestamp: new Date().toISOString()
        });
    });

    // Mount all routes
    router.use('/employees', employeeRoutes);
    router.use('/equipment', equipmentRoutes);
    router.use('/expenses', expenseRoutes);
    router.use('/materials', materialRoutes);
    router.use('/vehicles', vehicleRoutes);
    router.use('/dumpers', dumperRoutes);
    router.use('/loaders', loaderRoutes);
    router.use('/excavator', excavatorRoutes);
    router.use('/generator', generatorRoutes);
    router.use('/plant-expense', plantExpenseRoutes);
    router.use('/langar', langarRoutes);
    router.use('/misc-expense', miscExpenseRoutes);
    router.use('/blasting', blastingRoutes);
    router.use('/human-resource', humanResourceRoutes);
    router.use('/production', productionRoutes);
    router.use('/summary', summaryRoutes);

    return router;
}

module.exports = initRouter;

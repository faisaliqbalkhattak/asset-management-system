/**
 * Controllers Index
 * =================
 * Exports all controllers
 */

const equipmentController = require('./equipment.controller');
const vehicleController = require('./vehicle.controller');
const materialController = require('./material.controller');
const productionController = require('./production.controller');
const expenseController = require('./expense.controller');
const employeeController = require('./employee.controller');

module.exports = {
    equipmentController,
    vehicleController,
    materialController,
    productionController,
    expenseController,
    employeeController
};

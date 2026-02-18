/**
 * Equipment Controller
 * ====================
 * Handles equipment master data and operations
 * 
 * Endpoints:
 * ----------
 * GET    /api/equipment           - Get all equipment
 * GET    /api/equipment/:id       - Get single equipment
 * POST   /api/equipment           - Create equipment
 * PUT    /api/equipment/:id       - Update equipment
 * DELETE /api/equipment/:id       - Delete equipment
 * 
 * Operations:
 * GET    /api/equipment/:id/operations         - Get operations for equipment
 * POST   /api/equipment/:id/operations         - Create operation
 * GET    /api/equipment/operations/date/:date  - Get all operations by date
 */

const { asyncHandler, ErrorResponse } = require('../../middlewares');
const EquipmentRepository = require('../repositories/EquipmentRepository');
const EquipmentOperationRepository = require('../repositories/EquipmentOperationRepository');

// =====================================================
// EQUIPMENT MASTER
// =====================================================

/**
 * @desc    Get all equipment
 * @route   GET /api/equipment
 * @access  Private
 */
const getAll = asyncHandler(async (req, res, next) => {
    const { active } = req.query;
    
    let equipment;
    if (active === 'true') {
        equipment = EquipmentRepository.findActive();
    } else {
        equipment = EquipmentRepository.findAll();
    }

    res.status(200).json({
        success: true,
        count: equipment.length,
        data: equipment
    });
});

/**
 * @desc    Get single equipment
 * @route   GET /api/equipment/:id
 * @access  Private
 */
const getOne = asyncHandler(async (req, res, next) => {
    const equipment = EquipmentRepository.findById(req.params.id);

    if (!equipment) {
        return next(new ErrorResponse(`Equipment not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: equipment
    });
});

/**
 * @desc    Create equipment
 * @route   POST /api/equipment
 * @access  Private/Admin
 */
const create = asyncHandler(async (req, res, next) => {
    const { equipment_code, equipment_name, equipment_type, rate_type, default_rate } = req.body;

    // Validation
    if (!equipment_code || !equipment_name || !equipment_type || !rate_type) {
        return next(new ErrorResponse('Please provide equipment_code, equipment_name, equipment_type, and rate_type', 400));
    }

    // Check if code exists
    const existing = EquipmentRepository.findByCode(equipment_code);
    if (existing) {
        return next(new ErrorResponse(`Equipment with code ${equipment_code} already exists`, 400));
    }

    const equipment = EquipmentRepository.create({
        equipment_code,
        equipment_name,
        equipment_type,
        rate_type,
        default_rate: default_rate || 0
    });

    res.status(201).json({
        success: true,
        data: equipment
    });
});

/**
 * @desc    Update equipment
 * @route   PUT /api/equipment/:id
 * @access  Private/Admin
 */
const update = asyncHandler(async (req, res, next) => {
    let equipment = EquipmentRepository.findById(req.params.id);

    if (!equipment) {
        return next(new ErrorResponse(`Equipment not found with id ${req.params.id}`, 404));
    }

    equipment = EquipmentRepository.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        data: equipment
    });
});

/**
 * @desc    Delete equipment
 * @route   DELETE /api/equipment/:id
 * @access  Private/Admin
 */
const remove = asyncHandler(async (req, res, next) => {
    const equipment = EquipmentRepository.findById(req.params.id);

    if (!equipment) {
        return next(new ErrorResponse(`Equipment not found with id ${req.params.id}`, 404));
    }

    // Soft delete - just deactivate
    EquipmentRepository.update(req.params.id, { is_active: 0 });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// =====================================================
// EQUIPMENT OPERATIONS
// =====================================================

/**
 * @desc    Get operations for equipment
 * @route   GET /api/equipment/:id/operations
 * @access  Private
 */
const getOperations = asyncHandler(async (req, res, next) => {
    const equipment = EquipmentRepository.findById(req.params.id);

    if (!equipment) {
        return next(new ErrorResponse(`Equipment not found with id ${req.params.id}`, 404));
    }

    const { startDate, endDate } = req.query;
    let operations;

    if (startDate && endDate) {
        operations = EquipmentOperationRepository.findByEquipmentAndDateRange(
            req.params.id,
            startDate,
            endDate
        );
    } else {
        operations = EquipmentOperationRepository.findByEquipment(req.params.id);
    }

    res.status(200).json({
        success: true,
        count: operations.length,
        data: operations
    });
});

/**
 * @desc    Create operation for equipment
 * @route   POST /api/equipment/:id/operations
 * @access  Private
 */
const createOperation = asyncHandler(async (req, res, next) => {
    const equipment = EquipmentRepository.findById(req.params.id);

    if (!equipment) {
        return next(new ErrorResponse(`Equipment not found with id ${req.params.id}`, 404));
    }

    const { operation_date } = req.body;

    if (!operation_date) {
        return next(new ErrorResponse('Please provide operation_date', 400));
    }

    // Check if operation already exists for this date
    const existing = EquipmentOperationRepository.findByEquipmentAndDate(
        req.params.id,
        operation_date
    );

    if (existing) {
        return next(new ErrorResponse(`Operation already exists for ${operation_date}`, 400));
    }

    const operation = EquipmentOperationRepository.create({
        equipment_id: parseInt(req.params.id),
        ...req.body
    });

    res.status(201).json({
        success: true,
        data: operation
    });
});

/**
 * @desc    Get all operations by date
 * @route   GET /api/equipment/operations/date/:date
 * @access  Private
 */
const getOperationsByDate = asyncHandler(async (req, res, next) => {
    const operations = EquipmentOperationRepository.findByDate(req.params.date);

    res.status(200).json({
        success: true,
        count: operations.length,
        data: operations
    });
});

/**
 * @desc    Update operation
 * @route   PUT /api/equipment/operations/:operationId
 * @access  Private
 */
const updateOperation = asyncHandler(async (req, res, next) => {
    let operation = EquipmentOperationRepository.findById(req.params.operationId);

    if (!operation) {
        return next(new ErrorResponse(`Operation not found with id ${req.params.operationId}`, 404));
    }

    operation = EquipmentOperationRepository.update(req.params.operationId, req.body);

    res.status(200).json({
        success: true,
        data: operation
    });
});

/**
 * @desc    Delete operation
 * @route   DELETE /api/equipment/operations/:operationId
 * @access  Private/Admin
 */
const deleteOperation = asyncHandler(async (req, res, next) => {
    const operation = EquipmentOperationRepository.findById(req.params.operationId);

    if (!operation) {
        return next(new ErrorResponse(`Operation not found with id ${req.params.operationId}`, 404));
    }

    EquipmentOperationRepository.delete(req.params.operationId);

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Get monthly summary for equipment
 * @route   GET /api/equipment/:id/summary/:year/:month
 * @access  Private
 */
const getMonthlySummary = asyncHandler(async (req, res, next) => {
    const { id, year, month } = req.params;
    
    const equipment = EquipmentRepository.findById(id);
    if (!equipment) {
        return next(new ErrorResponse(`Equipment not found with id ${id}`, 404));
    }

    const summary = EquipmentOperationRepository.getMonthlySummary(id, parseInt(year), month);

    res.status(200).json({
        success: true,
        data: {
            equipment,
            summary
        }
    });
});

// =====================================================
// MISC EXPENSE OPERATIONS
// =====================================================

/**
 * @desc    Add misc expense to operation
 * @route   POST /api/equipment/operations/:operationId/misc
 * @access  Private
 */
const addMiscExpense = asyncHandler(async (req, res, next) => {
    const operation = EquipmentOperationRepository.findById(req.params.operationId);

    if (!operation) {
        return next(new ErrorResponse(`Operation not found with id ${req.params.operationId}`, 404));
    }

    const { description, amount, type, diesel_liters, diesel_rate } = req.body;

    if (!description || amount === undefined) {
        return next(new ErrorResponse('Please provide description and amount', 400));
    }

    const updatedOperation = EquipmentOperationRepository.addMiscExpense(req.params.operationId, {
        description,
        amount: parseFloat(amount) || 0,
        type: type || 'OTHER',
        diesel_liters: diesel_liters ? parseFloat(diesel_liters) : null,
        diesel_rate: diesel_rate ? parseFloat(diesel_rate) : null
    });

    res.status(201).json({
        success: true,
        data: updatedOperation
    });
});

/**
 * @desc    Get misc expenses for operation
 * @route   GET /api/equipment/operations/:operationId/misc
 * @access  Private
 */
const getMiscExpenses = asyncHandler(async (req, res, next) => {
    const operation = EquipmentOperationRepository.findById(req.params.operationId);

    if (!operation) {
        return next(new ErrorResponse(`Operation not found with id ${req.params.operationId}`, 404));
    }

    const miscExpenses = EquipmentOperationRepository.getMiscExpenses(req.params.operationId);

    res.status(200).json({
        success: true,
        count: miscExpenses.length,
        data: miscExpenses
    });
});

module.exports = {
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
    getMonthlySummary,
    addMiscExpense,
    getMiscExpenses
};

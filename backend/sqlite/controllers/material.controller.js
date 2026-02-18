/**
 * Material Controller
 * ===================
 * Handles material master data and purchase records
 * 
 * Endpoints:
 * ----------
 * GET    /api/materials               - Get all materials
 * GET    /api/materials/:id           - Get single material
 * POST   /api/materials               - Create material
 * PUT    /api/materials/:id           - Update material
 * DELETE /api/materials/:id           - Delete material
 * 
 * Purchases:
 * GET    /api/materials/:id/purchases         - Get purchases for material
 * POST   /api/materials/:id/purchases         - Create purchase
 * GET    /api/materials/purchases/date/:date  - Get all purchases by date
 */

const { asyncHandler, ErrorResponse } = require('../../middlewares');
const MaterialRepository = require('../repositories/MaterialRepository');
const BlastingMaterialNewRepository = require('../repositories/BlastingMaterialNewRepository');
const { getDayName, round2 } = require('../shared/utilities');

// =====================================================
// MATERIAL MASTER
// =====================================================

/**
 * @desc    Get all materials
 * @route   GET /api/materials
 * @access  Private
 */
const getAll = asyncHandler(async (req, res, next) => {
    const { active, type } = req.query;
    
    let materials;
    if (active === 'true') {
        materials = MaterialRepository.findActive();
    } else if (type) {
        materials = MaterialRepository.findByType(type);
    } else {
        materials = MaterialRepository.findAll();
    }

    res.status(200).json({
        success: true,
        count: materials.length,
        data: materials
    });
});

/**
 * @desc    Get single material
 * @route   GET /api/materials/:id
 * @access  Private
 */
const getOne = asyncHandler(async (req, res, next) => {
    const material = MaterialRepository.findById(req.params.id);

    if (!material) {
        return next(new ErrorResponse(`Material not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: material
    });
});

/**
 * @desc    Create material
 * @route   POST /api/materials
 * @access  Private/Admin
 */
const create = asyncHandler(async (req, res, next) => {
    const { material_code, material_name } = req.body;

    // Validation
    if (!material_code || !material_name) {
        return next(new ErrorResponse('Please provide material_code and material_name', 400));
    }

    // Check if code exists
    const existing = MaterialRepository.findByCode(material_code);
    if (existing) {
        return next(new ErrorResponse(`Material with code ${material_code} already exists`, 400));
    }

    const material = MaterialRepository.create(req.body);

    res.status(201).json({
        success: true,
        data: material
    });
});

/**
 * @desc    Update material
 * @route   PUT /api/materials/:id
 * @access  Private/Admin
 */
const update = asyncHandler(async (req, res, next) => {
    let material = MaterialRepository.findById(req.params.id);

    if (!material) {
        return next(new ErrorResponse(`Material not found with id ${req.params.id}`, 404));
    }

    material = MaterialRepository.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        data: material
    });
});

/**
 * @desc    Delete material (soft delete)
 * @route   DELETE /api/materials/:id
 * @access  Private/Admin
 */
const remove = asyncHandler(async (req, res, next) => {
    const material = MaterialRepository.findById(req.params.id);

    if (!material) {
        return next(new ErrorResponse(`Material not found with id ${req.params.id}`, 404));
    }

    // Soft delete
    MaterialRepository.update(req.params.id, { is_active: 0 });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// =====================================================
// MATERIAL PURCHASES
// =====================================================

/**
 * @desc    Get purchases for material
 * @route   GET /api/materials/:id/purchases
 * @access  Private
 */
const getPurchases = asyncHandler(async (req, res, next) => {
    const { material_id } = req.params;
    const purchases = BlastingMaterialNewRepository.findByMaterial(material_id);

    res.status(200).json({
        success: true,
        count: purchases.length,
        data: purchases
    });
});

/**
 * @desc    Get all purchases by date
 * @route   GET /api/materials/purchases/date/:date
 * @access  Private
 */
const getPurchasesByDate = asyncHandler(async (req, res, next) => {
    const { date } = req.params;
    const purchases = BlastingMaterialNewRepository.findByDate(date);

    res.status(200).json({
        success: true,
        count: purchases.length,
        data: purchases
    });
});

/**
 * @desc    Create purchase record
 * @route   POST /api/materials/:material_id/purchases
 * @access  Private
 */
const createPurchase = asyncHandler(async (req, res, next) => {
    const { material_id } = req.params;
    const purchaseData = { ...req.body, material_id };

    // Add day_name
    if (purchaseData.purchase_date) {
        purchaseData.day_name = getDayName(purchaseData.purchase_date);
    }

    // Calculate total if not provided
    if (purchaseData.quantity && purchaseData.rate) {
        purchaseData.total = round2(purchaseData.quantity * purchaseData.rate);
    }

    const purchase = BlastingMaterialNewRepository.create(purchaseData);

    res.status(201).json({
        success: true,
        data: purchase
    });
});

/**
 * @desc    Update purchase
 * @route   PUT /api/materials/purchases/:purchaseId
 * @access  Private
 */
const updatePurchase = asyncHandler(async (req, res, next) => {
    let purchase = BlastingMaterialNewRepository.findById(req.params.purchaseId);

    if (!purchase) {
        return next(new ErrorResponse(`Purchase not found with id ${req.params.purchaseId}`, 404));
    }

    // Recalculate amounts if relevant fields change
    const updateData = { ...req.body };
    const quantity = updateData.quantity !== undefined ? parseFloat(updateData.quantity) : purchase.quantity;
    const rate = updateData.rate !== undefined ? parseFloat(updateData.rate) : purchase.rate;
    const transport = updateData.transport_charges !== undefined ? parseFloat(updateData.transport_charges) : purchase.transport_charges;
    
    updateData.purchase_amount = round2(quantity * rate);
    updateData.total_amount = round2(updateData.purchase_amount + transport);

    purchase = BlastingMaterialNewRepository.updateById(req.params.purchaseId, updateData);

    res.status(200).json({
        success: true,
        data: purchase
    });
});

/**
 * @desc    Delete purchase
 * @route   DELETE /api/materials/purchases/:purchaseId
 * @access  Private/Admin
 */
const deletePurchase = asyncHandler(async (req, res, next) => {
    const purchase = BlastingMaterialNewRepository.findById(req.params.purchaseId);

    if (!purchase) {
        return next(new ErrorResponse(`Purchase not found with id ${req.params.purchaseId}`, 404));
    }

    BlastingMaterialNewRepository.delete(req.params.purchaseId);

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Get monthly summary for materials
 * @route   GET /api/materials/summary/:year/:month
 * @access  Private
 */
const getMonthlySummary = asyncHandler(async (req, res, next) => {
    const { year, month } = req.params;
    
    // Calculate date range for month
    const monthNum = new Date(`${month} 1, ${year}`).getMonth() + 1;
    const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    const summary = BlastingMaterialNewRepository.getMaterialSummary(startDate, endDate);

    res.status(200).json({
        success: true,
        data: summary
    });
});

/**
 * @desc    Get blasting material summary
 * @route   GET /api/materials/blasting/summary/:year/:month
 * @access  Private
 */
const getBlastingSummary = asyncHandler(async (req, res, next) => {
    const { year, month } = req.params;
    
    // Calculate date range for month
    const monthNum = new Date(`${month} 1, ${year}`).getMonth() + 1;
    const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    const summary = BlastingMaterialNewRepository.getBlastingMaterialSummary(startDate, endDate);

    res.status(200).json({
        success: true,
        data: summary
    });
});

/**
 * @desc    Get all purchases
 * @route   GET /api/materials/purchases
 * @access  Private
 */
const getAllPurchases = asyncHandler(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    let purchases;
    if (startDate && endDate) {
        purchases = BlastingMaterialNewRepository.getPurchasesByDateRange(startDate, endDate);
    } else {
        purchases = BlastingMaterialNewRepository.findAll();
    }

    res.status(200).json({
        success: true,
        count: purchases.length,
        data: purchases
    });
});

module.exports = {
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
};

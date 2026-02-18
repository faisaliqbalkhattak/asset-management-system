/**
 * Vehicle Controller
 * ==================
 * Handles vehicle master data and trip records
 * 
 * Endpoints:
 * ----------
 * GET    /api/vehicles           - Get all vehicles
 * GET    /api/vehicles/:id       - Get single vehicle
 * POST   /api/vehicles           - Create vehicle
 * PUT    /api/vehicles/:id       - Update vehicle
 * DELETE /api/vehicles/:id       - Delete vehicle
 * 
 * Trips:
 * GET    /api/vehicles/:id/trips         - Get trips for vehicle
 * POST   /api/vehicles/:id/trips         - Create trip
 * GET    /api/vehicles/trips/date/:date  - Get all trips by date
 */

const { asyncHandler, ErrorResponse } = require('../../middlewares');
const VehicleRepository = require('../repositories/VehicleRepository');
const VehicleTripRepository = require('../repositories/VehicleTripRepository');

// =====================================================
// VEHICLE MASTER
// =====================================================

/**
 * @desc    Get all vehicles
 * @route   GET /api/vehicles
 * @access  Private
 */
const getAll = asyncHandler(async (req, res, next) => {
    const { active, type } = req.query;
    
    let vehicles;
    if (active === 'true') {
        vehicles = VehicleRepository.findActive();
    } else if (type) {
        vehicles = VehicleRepository.findByType(type);
    } else {
        vehicles = VehicleRepository.findAll();
    }

    res.status(200).json({
        success: true,
        count: vehicles.length,
        data: vehicles
    });
});

/**
 * @desc    Get single vehicle
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
const getOne = asyncHandler(async (req, res, next) => {
    const vehicle = VehicleRepository.findById(req.params.id);

    if (!vehicle) {
        return next(new ErrorResponse(`Vehicle not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: vehicle
    });
});

/**
 * @desc    Create vehicle
 * @route   POST /api/vehicles
 * @access  Private/Admin
 */
const create = asyncHandler(async (req, res, next) => {
    const { vehicle_number, capacity_cubic_feet } = req.body;

    // Validation
    if (!vehicle_number || !capacity_cubic_feet) {
        return next(new ErrorResponse('Please provide vehicle_number and capacity_cubic_feet', 400));
    }

    // Check if vehicle number exists
    const existing = VehicleRepository.findByNumber(vehicle_number);
    if (existing) {
        return next(new ErrorResponse(`Vehicle with number ${vehicle_number} already exists`, 400));
    }

    const vehicle = VehicleRepository.create(req.body);

    res.status(201).json({
        success: true,
        data: vehicle
    });
});

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private/Admin
 */
const update = asyncHandler(async (req, res, next) => {
    let vehicle = VehicleRepository.findById(req.params.id);

    if (!vehicle) {
        return next(new ErrorResponse(`Vehicle not found with id ${req.params.id}`, 404));
    }

    vehicle = VehicleRepository.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        data: vehicle
    });
});

/**
 * @desc    Delete vehicle (soft delete)
 * @route   DELETE /api/vehicles/:id
 * @access  Private/Admin
 */
const remove = asyncHandler(async (req, res, next) => {
    const vehicle = VehicleRepository.findById(req.params.id);

    if (!vehicle) {
        return next(new ErrorResponse(`Vehicle not found with id ${req.params.id}`, 404));
    }

    // Soft delete
    VehicleRepository.update(req.params.id, { is_active: 0 });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// =====================================================
// VEHICLE TRIPS
// =====================================================

/**
 * @desc    Get trips for vehicle
 * @route   GET /api/vehicles/:id/trips
 * @access  Private
 */
const getTrips = asyncHandler(async (req, res, next) => {
    const vehicle = VehicleRepository.findById(req.params.id);

    if (!vehicle) {
        return next(new ErrorResponse(`Vehicle not found with id ${req.params.id}`, 404));
    }

    const { startDate, endDate } = req.query;
    let trips;

    if (startDate && endDate) {
        trips = VehicleTripRepository.findByVehicleAndDateRange(
            req.params.id,
            startDate,
            endDate
        );
    } else {
        trips = VehicleTripRepository.findByVehicle(req.params.id);
    }

    res.status(200).json({
        success: true,
        count: trips.length,
        data: trips
    });
});

/**
 * @desc    Create trip for vehicle
 * @route   POST /api/vehicles/:id/trips
 * @access  Private
 */
const createTrip = asyncHandler(async (req, res, next) => {
    const vehicle = VehicleRepository.findById(req.params.id);

    if (!vehicle) {
        return next(new ErrorResponse(`Vehicle not found with id ${req.params.id}`, 404));
    }

    const { trip_date } = req.body;

    if (!trip_date) {
        return next(new ErrorResponse('Please provide trip_date', 400));
    }

    // Check if trip already exists for this date
    const existing = VehicleTripRepository.findByVehicleAndDate(
        req.params.id,
        trip_date
    );

    if (existing) {
        return next(new ErrorResponse(`Trip already exists for ${trip_date}`, 400));
    }

    // Use vehicle defaults if not provided
    const tripData = {
        vehicle_id: parseInt(req.params.id),
        unit_cubic_feet: req.body.unit_cubic_feet || vehicle.capacity_cubic_feet,
        rate_per_cubic_feet: req.body.rate_per_cubic_feet || vehicle.default_rate,
        ...req.body
    };

    const trip = VehicleTripRepository.create(tripData);

    res.status(201).json({
        success: true,
        data: trip
    });
});

/**
 * @desc    Get all trips by date
 * @route   GET /api/vehicles/trips/date/:date
 * @access  Private
 */
const getTripsByDate = asyncHandler(async (req, res, next) => {
    const trips = VehicleTripRepository.findByDate(req.params.date);

    res.status(200).json({
        success: true,
        count: trips.length,
        data: trips
    });
});

/**
 * @desc    Update trip
 * @route   PUT /api/vehicles/trips/:tripId
 * @access  Private
 */
const updateTrip = asyncHandler(async (req, res, next) => {
    let trip = VehicleTripRepository.findById(req.params.tripId);

    if (!trip) {
        return next(new ErrorResponse(`Trip not found with id ${req.params.tripId}`, 404));
    }

    trip = VehicleTripRepository.update(req.params.tripId, req.body);

    res.status(200).json({
        success: true,
        data: trip
    });
});

/**
 * @desc    Delete trip
 * @route   DELETE /api/vehicles/trips/:tripId
 * @access  Private/Admin
 */
const deleteTrip = asyncHandler(async (req, res, next) => {
    const trip = VehicleTripRepository.findById(req.params.tripId);

    if (!trip) {
        return next(new ErrorResponse(`Trip not found with id ${req.params.tripId}`, 404));
    }

    VehicleTripRepository.delete(req.params.tripId);

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Get monthly summary for vehicle
 * @route   GET /api/vehicles/:id/summary/:year/:month
 * @access  Private
 */
const getMonthlySummary = asyncHandler(async (req, res, next) => {
    const { id, year, month } = req.params;
    
    const vehicle = VehicleRepository.findById(id);
    if (!vehicle) {
        return next(new ErrorResponse(`Vehicle not found with id ${id}`, 404));
    }

    const summary = VehicleTripRepository.getMonthlySummary(id, parseInt(year), month);

    res.status(200).json({
        success: true,
        data: {
            vehicle,
            summary
        }
    });
});

/**
 * @desc    Get daily totals for all vehicles
 * @route   GET /api/vehicles/totals/date/:date
 * @access  Private
 */
const getDailyTotals = asyncHandler(async (req, res, next) => {
    const trips = VehicleTripRepository.findByDate(req.params.date);
    
    const totals = trips.reduce((acc, trip) => {
        acc.total_gravel_trips += trip.gravel_trips || 0;
        acc.total_clay_trips += trip.clay_trips || 0;
        acc.total_trips += trip.total_trips || 0;
        acc.total_qty_cubic_feet += trip.total_qty_cubic_feet || 0;
        acc.total_amount += trip.total_amount || 0;
        return acc;
    }, {
        total_gravel_trips: 0,
        total_clay_trips: 0,
        total_trips: 0,
        total_qty_cubic_feet: 0,
        total_amount: 0
    });

    res.status(200).json({
        success: true,
        data: {
            date: req.params.date,
            vehicle_count: trips.length,
            ...totals,
            trips
        }
    });
});

// =====================================================
// MISC EXPENSE OPERATIONS
// =====================================================

/**
 * @desc    Add misc expense to trip
 * @route   POST /api/vehicles/trips/:tripId/misc
 * @access  Private
 */
const addMiscExpense = asyncHandler(async (req, res, next) => {
    const trip = VehicleTripRepository.findById(req.params.tripId);

    if (!trip) {
        return next(new ErrorResponse(`Trip not found with id ${req.params.tripId}`, 404));
    }

    const { description, amount, type, diesel_liters, diesel_rate } = req.body;

    if (!description || amount === undefined) {
        return next(new ErrorResponse('Please provide description and amount', 400));
    }

    const updatedTrip = VehicleTripRepository.addMiscExpense(req.params.tripId, {
        description,
        amount: parseFloat(amount) || 0,
        type: type || 'OTHER',
        diesel_liters: diesel_liters ? parseFloat(diesel_liters) : null,
        diesel_rate: diesel_rate ? parseFloat(diesel_rate) : null
    });

    res.status(201).json({
        success: true,
        data: updatedTrip
    });
});

/**
 * @desc    Get misc expenses for trip
 * @route   GET /api/vehicles/trips/:tripId/misc
 * @access  Private
 */
const getMiscExpenses = asyncHandler(async (req, res, next) => {
    const trip = VehicleTripRepository.findById(req.params.tripId);

    if (!trip) {
        return next(new ErrorResponse(`Trip not found with id ${req.params.tripId}`, 404));
    }

    const miscExpenses = VehicleTripRepository.getMiscExpenses(req.params.tripId);

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
    getTrips,
    createTrip,
    getTripsByDate,
    updateTrip,
    deleteTrip,
    getMonthlySummary,
    getDailyTotals,
    addMiscExpense,
    getMiscExpenses
};

// =====================================================
// VEHICLE REPOSITORY
// CRUD operations for vehicles (Dumpers)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { VEHICLE_TYPES, KNOWN_VEHICLES, DEFAULTS } = require('../shared/constants');
const { isValidEnum, validateRequired } = require('../shared/utilities');

class VehicleRepository extends BaseRepository {
    constructor() {
        super('vehicles');
    }

    // =====================================================
    // VALIDATION
    // =====================================================

    validate(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate) {
            const { valid, missing } = validateRequired(data, ['vehicle_number', 'capacity_cubic_feet']);
            if (!valid) {
                errors.push(`Missing required fields: ${missing.join(', ')}`);
            }
        }
        
        if (data.vehicle_type && !isValidEnum(data.vehicle_type, VEHICLE_TYPES)) {
            errors.push(`Invalid vehicle_type. Must be one of: ${VEHICLE_TYPES.join(', ')}`);
        }
        
        if (data.capacity_cubic_feet !== undefined && data.capacity_cubic_feet <= 0) {
            errors.push('capacity_cubic_feet must be greater than 0');
        }
        
        if (data.default_rate !== undefined && data.default_rate < 0) {
            errors.push('default_rate cannot be negative');
        }
        
        return { valid: errors.length === 0, errors };
    }

    // =====================================================
    // CUSTOM METHODS
    // =====================================================

    /**
     * Find vehicle by number
     */
    findByNumber(vehicleNumber) {
        return this.findOne({ vehicle_number: vehicleNumber });
    }

    /**
     * Find all vehicles by type
     */
    findByType(type) {
        return this.findActive({ vehicle_type: type });
    }

    /**
     * Get all dumpers
     */
    getDumpers() {
        return this.findByType('DUMPER');
    }

    /**
     * Seed known vehicles
     */
    seedKnownVehicles() {
        const inserted = [];
        for (const v of KNOWN_VEHICLES) {
            const existing = this.findByNumber(v.number);
            if (!existing) {
                const vehicle = this.insert({
                    vehicle_number: v.number,
                    vehicle_type: v.type,
                    capacity_cubic_feet: v.capacity,
                    default_rate: DEFAULTS.RATE_PER_CUBIC_FEET,
                    is_active: 1
                });
                inserted.push(vehicle);
            }
        }
        return inserted;
    }

    /**
     * Create with validation
     */
    create(data) {
        const validation = this.validate(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Set default rate if not provided
        if (!data.default_rate) {
            data.default_rate = DEFAULTS.RATE_PER_CUBIC_FEET;
        }
        
        return this.insert(data);
    }

    /**
     * Update with validation
     */
    update(id, data) {
        const validation = this.validate(data, true);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        return this.updateById(id, data);
    }
}

module.exports = new VehicleRepository();

// =====================================================
// EQUIPMENT REPOSITORY
// CRUD operations for equipment (Generator, Excavator)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { EQUIPMENT_TYPES, RATE_TYPES } = require('../shared/constants');
const { isValidEnum, validateRequired } = require('../shared/utilities');

class EquipmentRepository extends BaseRepository {
    constructor() {
        super('equipment');
    }

    // =====================================================
    // VALIDATION
    // =====================================================

    validate(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate) {
            const { valid, missing } = validateRequired(data, ['equipment_code', 'equipment_name', 'equipment_type', 'rate_type']);
            if (!valid) {
                errors.push(`Missing required fields: ${missing.join(', ')}`);
            }
        }
        
        if (data.equipment_type && !isValidEnum(data.equipment_type, EQUIPMENT_TYPES)) {
            errors.push(`Invalid equipment_type. Must be one of: ${EQUIPMENT_TYPES.join(', ')}`);
        }
        
        if (data.rate_type && !isValidEnum(data.rate_type, RATE_TYPES)) {
            errors.push(`Invalid rate_type. Must be one of: ${RATE_TYPES.join(', ')}`);
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
     * Find equipment by code
     */
    findByCode(code) {
        return this.findOne({ equipment_code: code });
    }

    /**
     * Find all equipment by type
     */
    findByType(type) {
        return this.findActive({ equipment_type: type });
    }

    /**
     * Get all generators
     */
    getGenerators() {
        return this.findByType('GENERATOR');
    }

    /**
     * Get all excavators
     */
    getExcavators() {
        return this.findByType('EXCAVATOR');
    }

    /**
     * Create with validation
     */
    create(data) {
        const validation = this.validate(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
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

module.exports = new EquipmentRepository();

// =====================================================
// AGGREGATE CLASSIFICATION REPOSITORY
// Size percentage breakdowns for aggregate
// =====================================================

const BaseRepository = require('./BaseRepository');
const { DEFAULT_SIZE_PERCENTAGES } = require('../shared/constants');
const { round2, validateRequired } = require('../shared/utilities');

class AggregateClassificationRepository extends BaseRepository {
    constructor() {
        super('aggregate_classification');
    }

    validate(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate) {
            const { valid, missing } = validateRequired(data, ['classification_name']);
            if (!valid) {
                errors.push(`Missing required fields: ${missing.join(', ')}`);
            }
        }
        
        // Validate percentages sum to 100 if all provided
        const sizes = ['mm10', 'mm13', 'mm16', 'mm20', 'mm38', 'mm50'];
        let hasAllSizes = true;
        let total = 0;
        
        for (const size of sizes) {
            const key = `${size}_percentage`;
            if (data[key] !== undefined) {
                if (data[key] < 0 || data[key] > 100) {
                    errors.push(`${key} must be between 0 and 100`);
                }
                total += data[key];
            } else {
                hasAllSizes = false;
            }
        }
        
        if (hasAllSizes && Math.abs(total - 100) > 0.01) {
            errors.push(`Size percentages must sum to 100. Current total: ${total}`);
        }
        
        return { valid: errors.length === 0, errors };
    }

    findByName(name) {
        return this.findOne({ classification_name: name });
    }

    /**
     * Get default classification
     */
    getDefault() {
        return this.findOne({ is_default: 1 });
    }

    /**
     * Get currently active classification
     */
    getActive() {
        const today = new Date().toISOString().split('T')[0];
        const result = this.rawOne(`
            SELECT * FROM aggregate_classification 
            WHERE is_active = 1 
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
            ORDER BY effective_from DESC
            LIMIT 1
        `, [today, today]);
        
        return result || this.getDefault();
    }

    /**
     * Set as default
     */
    setAsDefault(id) {
        // Clear other defaults
        this.updateMany({ is_default: 1 }, { is_default: 0 });
        return this.updateById(id, { is_default: 1 });
    }

    /**
     * Calculate aggregate breakdown from total production
     */
    calculateBreakdown(totalCft, classificationId = null) {
        let classification;
        
        if (classificationId) {
            classification = this.findById(classificationId);
        } else {
            classification = this.getActive();
        }
        
        if (!classification) {
            // Use default percentages
            classification = {
                mm10_percentage: DEFAULT_SIZE_PERCENTAGES.mm10,
                mm13_percentage: DEFAULT_SIZE_PERCENTAGES.mm13,
                mm16_percentage: DEFAULT_SIZE_PERCENTAGES.mm16,
                mm20_percentage: DEFAULT_SIZE_PERCENTAGES.mm20,
                mm38_percentage: DEFAULT_SIZE_PERCENTAGES.mm38,
                mm50_percentage: DEFAULT_SIZE_PERCENTAGES.mm50
            };
        }
        
        return {
            mm10_cft: round2(totalCft * (classification.mm10_percentage / 100)),
            mm13_cft: round2(totalCft * (classification.mm13_percentage / 100)),
            mm16_cft: round2(totalCft * (classification.mm16_percentage / 100)),
            mm20_cft: round2(totalCft * (classification.mm20_percentage / 100)),
            mm38_cft: round2(totalCft * (classification.mm38_percentage / 100)),
            mm50_cft: round2(totalCft * (classification.mm50_percentage / 100)),
            total_cft: totalCft,
            classification_name: classification.classification_name || 'Default'
        };
    }

    /**
     * Seed default classification
     */
    seedDefault() {
        const existing = this.getDefault();
        if (existing) return existing;
        
        return this.insert({
            classification_name: 'Standard Mix',
            description: 'Default aggregate size classification',
            mm10_percentage: DEFAULT_SIZE_PERCENTAGES.mm10,
            mm13_percentage: DEFAULT_SIZE_PERCENTAGES.mm13,
            mm16_percentage: DEFAULT_SIZE_PERCENTAGES.mm16,
            mm20_percentage: DEFAULT_SIZE_PERCENTAGES.mm20,
            mm38_percentage: DEFAULT_SIZE_PERCENTAGES.mm38,
            mm50_percentage: DEFAULT_SIZE_PERCENTAGES.mm50,
            total_percentage: 100,
            is_default: 1,
            is_active: 1
        });
    }

    /**
     * Create with auto-total calculation
     */
    create(data) {
        const validation = this.validate(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Calculate total percentage
        data.total_percentage = round2(
            (data.mm10_percentage || 0) +
            (data.mm13_percentage || 0) +
            (data.mm16_percentage || 0) +
            (data.mm20_percentage || 0) +
            (data.mm38_percentage || 0) +
            (data.mm50_percentage || 0)
        );
        
        return this.insert(data);
    }

    update(id, data) {
        const validation = this.validate(data, true);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Recalculate total if any size changed
        const existing = this.findById(id);
        if (existing) {
            data.total_percentage = round2(
                (data.mm10_percentage !== undefined ? data.mm10_percentage : existing.mm10_percentage) +
                (data.mm13_percentage !== undefined ? data.mm13_percentage : existing.mm13_percentage) +
                (data.mm16_percentage !== undefined ? data.mm16_percentage : existing.mm16_percentage) +
                (data.mm20_percentage !== undefined ? data.mm20_percentage : existing.mm20_percentage) +
                (data.mm38_percentage !== undefined ? data.mm38_percentage : existing.mm38_percentage) +
                (data.mm50_percentage !== undefined ? data.mm50_percentage : existing.mm50_percentage)
            );
        }
        
        return this.updateById(id, data);
    }
}

module.exports = new AggregateClassificationRepository();

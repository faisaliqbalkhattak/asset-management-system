// =====================================================
// EXPENSE CATEGORY REPOSITORY
// Expense categories (Langar, Plant Exp, etc.)
// =====================================================

const BaseRepository = require('./BaseRepository');
const { EXPENSE_CATEGORIES } = require('../shared/constants');
const { validateRequired } = require('../shared/utilities');

class ExpenseCategoryRepository extends BaseRepository {
    constructor() {
        super('expense_categories');
    }

    validate(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate) {
            const { valid, missing } = validateRequired(data, ['category_code', 'category_name']);
            if (!valid) {
                errors.push(`Missing required fields: ${missing.join(', ')}`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }

    findByCode(code) {
        return this.findOne({ category_code: code });
    }

    /**
     * Seed default categories
     */
    seedDefaults() {
        const defaults = [
            { category_code: 'LANGAR', category_name: 'Langar' },
            { category_code: 'PLANT_EXP', category_name: 'Plant Expenses' },
            { category_code: 'MISC', category_name: 'Miscellaneous Expenses' },
            { category_code: 'GENERATOR', category_name: 'Generator' },
            { category_code: 'EXCAVATOR', category_name: 'Excavator' },
            { category_code: 'LOADER', category_name: 'Loader' },
            { category_code: 'DUMPER', category_name: 'Dumper' },
            { category_code: 'BLASTING', category_name: 'Blasting Material' },
            { category_code: 'HR', category_name: 'Human Resource' }
        ];
        
        const inserted = [];
        for (const cat of defaults) {
            const existing = this.findByCode(cat.category_code);
            if (!existing) {
                inserted.push(this.insert(cat));
            }
        }
        return inserted;
    }

    create(data) {
        const validation = this.validate(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        return this.insert(data);
    }

    update(id, data) {
        const validation = this.validate(data, true);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        return this.updateById(id, data);
    }
}

module.exports = new ExpenseCategoryRepository();

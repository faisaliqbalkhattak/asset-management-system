// =====================================================
// EXPENSE CATEGORY REPOSITORY
// Expense categories (Langar, Plant Exp, etc.)
// Also stores sub-categories for dropdown items per tab
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
     * Find categories by type (MAIN, BLASTING_ITEM, PLANT_EXPENSE, MISC_EXPENSE)
     */
    findByType(type) {
        return this.db.prepare(
            `SELECT * FROM ${this.tableName} WHERE category_type = ? AND is_active = 1 ORDER BY category_name`
        ).all(type);
    }

    /**
     * Seed default categories and sub-categories
     */
    seedDefaults() {
        // Main expense categories
        const defaults = [
            { category_code: 'LANGAR', category_name: 'Langar', category_type: 'MAIN' },
            { category_code: 'PLANT_EXP', category_name: 'Plant Expenses', category_type: 'MAIN' },
            { category_code: 'MISC', category_name: 'Miscellaneous Expenses', category_type: 'MAIN' },
            { category_code: 'GENERATOR', category_name: 'Generator', category_type: 'MAIN' },
            { category_code: 'EXCAVATOR', category_name: 'Excavator', category_type: 'MAIN' },
            { category_code: 'LOADER', category_name: 'Loader', category_type: 'MAIN' },
            { category_code: 'DUMPER', category_name: 'Dumper', category_type: 'MAIN' },
            { category_code: 'BLASTING', category_name: 'Blasting Material', category_type: 'MAIN' },
            { category_code: 'HR', category_name: 'Human Resource', category_type: 'MAIN' },
            // Blasting material items (dropdown options for Blasting Material tab)
            { category_code: 'BLAST_GELATIN', category_name: 'Gelatin', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_DETONATOR', category_name: 'Detonator', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_FUSE_WIRE', category_name: 'Fuse Wire', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_SAFETY_FUSE', category_name: 'Safety Fuse', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_POWDER', category_name: 'Blasting Powder', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_OTHER', category_name: 'Other', category_type: 'BLASTING_ITEM' },
            // Plant expense categories (dropdown options for Plant Expense tab)
            { category_code: 'PLANT_MAINTENANCE', category_name: 'Maintenance', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_REPAIR', category_name: 'Repair', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_SPARE_PARTS', category_name: 'Spare Parts', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_ELECTRICAL', category_name: 'Electrical', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_OTHER', category_name: 'Other', category_type: 'PLANT_EXPENSE' },
            // Misc expense categories (dropdown options for Misc Expense tab)
            { category_code: 'MISC_GENERAL', category_name: 'General', category_type: 'MISC_EXPENSE' },
            { category_code: 'MISC_TRANSPORT', category_name: 'Transport', category_type: 'MISC_EXPENSE' },
            { category_code: 'MISC_OFFICE', category_name: 'Office', category_type: 'MISC_EXPENSE' },
            { category_code: 'MISC_UTILITY', category_name: 'Utility', category_type: 'MISC_EXPENSE' },
            { category_code: 'MISC_OTHER', category_name: 'Other', category_type: 'MISC_EXPENSE' },
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

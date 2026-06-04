// =====================================================
// EXPENSE CATEGORY REPOSITORY
// Expense categories (Plant Mess, Plant Exp, etc.)
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

    findByNameAndType(name, type) {
        return this.rawOne(
            `SELECT * FROM ${this.tableName} WHERE LOWER(category_name) = LOWER(?) AND category_type = ? LIMIT 1`,
            [name, type]
        );
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
        // Default expense categories for blasting and plant expenses
        const defaults = [
            // Blasting material items (dropdown options for Blasting Material tab)
            { category_code: 'BLAST_FUEL', category_name: 'Fuel Consumed Blasting', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_WIRE', category_name: 'Blasting Wire', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_DETONATOR', category_name: 'Detonator', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_JAGGERY', category_name: 'Jaggery', category_type: 'BLASTING_ITEM' },
            { category_code: 'BLAST_AMMONIUM_NITRATE', category_name: 'AN (Ammonium nitrate)', category_type: 'BLASTING_ITEM' },
            // Plant expense categories (dropdown options for Plant Expense tab)
            { category_code: 'PLANT_MESS', category_name: 'Plant Mess', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_EXP', category_name: 'Plant Expenses', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_MISC', category_name: 'Miscellaneous Expenses', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_UTILITIES', category_name: 'Utilities', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_TRANSPORT', category_name: 'Transport Charges', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_REPAIR_MAINT', category_name: 'Repairs & Maintenance', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_ELECTRICITY', category_name: 'Electricity Bill', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_TIP_LAB', category_name: 'Tip to lab', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_ACCESSORIES', category_name: 'Plant accessories', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_RENT', category_name: 'Rent of plant.', category_type: 'PLANT_EXPENSE' },
            { category_code: 'PLANT_STAFF_OVERTIME', category_name: 'Staff overtime', category_type: 'PLANT_EXPENSE' },
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

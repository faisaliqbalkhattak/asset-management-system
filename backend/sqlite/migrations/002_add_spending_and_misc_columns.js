// =====================================================
// MIGRATION: Add spending/misc columns to all tables
// =====================================================
// Adds spending_amount, misc_expense, misc_description,
// total_amount, category_id, and fuel_amount columns
// to tables where they were missing.
// =====================================================

module.exports = {
    version: '002_add_spending_and_misc_columns',
    name: 'Add spending_amount, misc_expense, misc_description, total_amount, category_id columns',
    up: (db) => {
        const migrations = [
            // human_resource_salary
            `ALTER TABLE human_resource_salary ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE human_resource_salary ADD COLUMN misc_description TEXT`,
            `ALTER TABLE human_resource_salary ADD COLUMN spending_amount REAL DEFAULT 0`,
            `ALTER TABLE human_resource_salary ADD COLUMN total_amount REAL DEFAULT 0`,
            `ALTER TABLE human_resource_salary ADD COLUMN category_id INTEGER`,

            // blasting_material
            `ALTER TABLE blasting_material ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE blasting_material ADD COLUMN misc_description TEXT`,
            `ALTER TABLE blasting_material ADD COLUMN spending_amount REAL DEFAULT 0`,

            // plant_mess_expense
            `ALTER TABLE plant_mess_expense ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE plant_mess_expense ADD COLUMN misc_description TEXT`,
            `ALTER TABLE plant_mess_expense ADD COLUMN spending_amount REAL DEFAULT 0`,
            `ALTER TABLE plant_mess_expense ADD COLUMN total_amount REAL DEFAULT 0`,
            `ALTER TABLE plant_mess_expense ADD COLUMN category_id INTEGER`,

            // plant_expense
            `ALTER TABLE plant_expense ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE plant_expense ADD COLUMN misc_description TEXT`,
            `ALTER TABLE plant_expense ADD COLUMN spending_amount REAL DEFAULT 0`,
            `ALTER TABLE plant_expense ADD COLUMN total_amount REAL DEFAULT 0`,

            // dumper_operation
            `ALTER TABLE dumper_operation ADD COLUMN fuel_amount REAL DEFAULT 0`,
            `ALTER TABLE dumper_operation ADD COLUMN spending_amount REAL DEFAULT 0`,

            // excavator_operation
            `ALTER TABLE excavator_operation ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE excavator_operation ADD COLUMN misc_description TEXT`,
            `ALTER TABLE excavator_operation ADD COLUMN spending_amount REAL DEFAULT 0`,

            // loader_operation
            `ALTER TABLE loader_operation ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE loader_operation ADD COLUMN misc_description TEXT`,
            `ALTER TABLE loader_operation ADD COLUMN spending_amount REAL DEFAULT 0`,

            // generator_operation
            `ALTER TABLE generator_operation ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE generator_operation ADD COLUMN misc_description TEXT`,
            `ALTER TABLE generator_operation ADD COLUMN spending_amount REAL DEFAULT 0`,

            // misc_expense_general
            `ALTER TABLE misc_expense_general ADD COLUMN category_id INTEGER`,
            `ALTER TABLE misc_expense_general ADD COLUMN misc_expense REAL DEFAULT 0`,
            `ALTER TABLE misc_expense_general ADD COLUMN misc_description TEXT`,
            `ALTER TABLE misc_expense_general ADD COLUMN spending_amount REAL DEFAULT 0`,
            `ALTER TABLE misc_expense_general ADD COLUMN total_amount REAL DEFAULT 0`,
        ];

        migrations.forEach(sql => {
            try {
                db.run(sql);
            } catch (e) {
                // Column already exists - ignore
            }
        });
    }
};

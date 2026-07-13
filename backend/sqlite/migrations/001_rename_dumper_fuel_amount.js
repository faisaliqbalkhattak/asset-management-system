// =====================================================
// MIGRATION: Rename dumper_operation.misc_expense to fuel_amount
// =====================================================
// The dumper_operation table previously stored fuel amount in the
// misc_expense column. This migration renames it to fuel_amount to
// better reflect its purpose. Existing data is preserved.
// =====================================================

module.exports = {
    version: '001_rename_dumper_fuel_amount',
    name: 'Rename dumper_operation.misc_expense to fuel_amount',
    up: (db) => {
        // Check current columns
        const tableInfo = db.exec("PRAGMA table_info(dumper_operation)");
        const rows = (tableInfo && tableInfo[0] && tableInfo[0].values) || [];
        
        const hasMiscExpense = rows.some(row => row[1] === 'misc_expense');
        const hasFuelAmount = rows.some(row => row[1] === 'fuel_amount');
        
        // Only rename if old column exists and new column does not
        if (hasMiscExpense && !hasFuelAmount) {
            db.exec('ALTER TABLE dumper_operation RENAME COLUMN misc_expense TO fuel_amount');
        }
    }
};

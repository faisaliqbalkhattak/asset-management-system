// =====================================================
// SEED DATABASE SCRIPT
// Run: npm run db:seed
// Adds/updates master data without deleting existing rows
// =====================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development.local') });

const { initializeDatabase, saveDatabase, closeDatabase } = require('../sqlite/db');
const { seedDatabaseInternal } = require('../sqlite/seeds');

async function main() {
    try {
        console.log('========================================');
        console.log('Asset Management System - DB Seed');
        console.log('========================================\n');

        await initializeDatabase();
        seedDatabaseInternal();
        saveDatabase();
        console.log('\n✓ Seed complete. Database saved.');
    } catch (err) {
        console.error('Seed failed:', err);
        process.exitCode = 1;
    } finally {
        try {
            closeDatabase();
        } catch (err) {
            console.error('Failed to close database:', err);
        }
    }
}

main();

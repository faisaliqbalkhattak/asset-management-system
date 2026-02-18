// =====================================================
// DATABASE INITIALIZATION SCRIPT
// Run: npm run db:init
// Deletes old DB, creates fresh tables, seeds default data
// =====================================================

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development.local') });

const { initializeDatabase, closeDatabase, createTables, saveDatabase, config } = require('../sqlite/db');

console.log('========================================');
console.log('Process Management System - DB Setup');
console.log('========================================\n');

async function main() {
    try {
        // Delete old database for a fresh start
        const dbPath = config.dbPath || path.join(__dirname, '..', 'data', 'process_management.db');
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('✓ Old database deleted');
        }

        // Initialize database (async - loads sql.js)
        await initializeDatabase();

        // Create all tables
        console.log('Creating tables...');
        createTables();
        saveDatabase();
        console.log('✓ Tables created\n');

        // Seed default data
        console.log('Seeding default data...');

        const ExpenseCategoryRepository = require('../sqlite/repositories/ExpenseCategoryRepository');
        const AggregateClassificationRepository = require('../sqlite/repositories/AggregateClassificationRepository');
        const EquipmentRepository = require('../sqlite/repositories/EquipmentRepository');
        const VehicleRepository = require('../sqlite/repositories/VehicleRepository');
        const HumanResourceRepository = require('../sqlite/repositories/HumanResourceRepository');
        const hrRepo = new HumanResourceRepository();

        // Seed expense categories
        try {
            const cats = ExpenseCategoryRepository.seedDefaults();
            console.log(`  ✓ ${cats.length} expense categories seeded`);
        } catch (e) {
            console.error('  ✗ Error seeding expense categories:', e.message);
        }

        // Seed default aggregate classification
        try {
            AggregateClassificationRepository.create({
                classification_name: 'Standard Mix',
                description: 'Default aggregate size distribution',
                mm10_percentage: 10,
                mm13_percentage: 10,
                mm16_percentage: 35,
                mm20_percentage: 15,
                mm38_percentage: 10,
                mm50_percentage: 20,
                is_default: 1
            });
            console.log('  ✓ Aggregate classification seeded');
        } catch (e) {
            console.error('  ✗ Error seeding aggregate classification:', e.message);
        }

        // Seed default equipment
        const defaultEquipment = [
            { equipment_code: 'DMP-TKR219', equipment_name: 'Dumper TKR-219', equipment_type: 'DUMPER', rate_type: 'PER_TRIP', default_rate: 1.9, capacity_cft: 838 },
            { equipment_code: 'DMP-TAC388', equipment_name: 'Dumper TAC-388', equipment_type: 'DUMPER', rate_type: 'PER_TRIP', default_rate: 1.9, capacity_cft: 937 },
            { equipment_code: 'DMP-TAB959', equipment_name: 'Dumper TAB-959', equipment_type: 'DUMPER', rate_type: 'PER_TRIP', default_rate: 1.9, capacity_cft: 937 },
            { equipment_code: 'DMP-TAJ656', equipment_name: 'Dumper TAJ-656', equipment_type: 'DUMPER', rate_type: 'PER_TRIP', default_rate: 1.9, capacity_cft: 950 },
            { equipment_code: 'DMP-TAE601', equipment_name: 'Dumper TAE-601', equipment_type: 'DUMPER', rate_type: 'PER_TRIP', default_rate: 1.9, capacity_cft: 181 },
            { equipment_code: 'GEN-001', equipment_name: 'Generator 100KVA Primary', equipment_type: 'GENERATOR', rate_type: 'PER_DAY', default_rate: 5000 },
            { equipment_code: 'EXC-001', equipment_name: 'Excavator Ex-400', equipment_type: 'EXCAVATOR', rate_type: 'PER_HOUR', default_rate: 2500 },
            { equipment_code: 'LDR-966F', equipment_name: 'Loader 966-F', equipment_type: 'LOADER', rate_type: 'PER_MONTH', default_rate: 550000 },
            { equipment_code: 'LDR-950E', equipment_name: 'Loader 950-E', equipment_type: 'LOADER', rate_type: 'PER_MONTH', default_rate: 550000 },
        ];
        let eqCount = 0;
        for (const eq of defaultEquipment) {
            try { EquipmentRepository.create(eq); eqCount++; } catch (e) { console.error(`  ✗ Equipment ${eq.equipment_code}:`, e.message); }
        }
        console.log(`  ✓ ${eqCount} equipment items seeded`);

        // Seed default vehicles
        const defaultVehicles = [
            { vehicle_number: 'TKR-219', vehicle_type: 'DUMPER', capacity_cubic_feet: 838, default_rate: 1.9 },
            { vehicle_number: 'TAC-388', vehicle_type: 'DUMPER', capacity_cubic_feet: 937, default_rate: 1.9 },
            { vehicle_number: 'TAB-959', vehicle_type: 'DUMPER', capacity_cubic_feet: 937, default_rate: 1.9 },
            { vehicle_number: 'TAJ-656', vehicle_type: 'DUMPER', capacity_cubic_feet: 950, default_rate: 1.9 },
            { vehicle_number: 'TAE-601', vehicle_type: 'DUMPER', capacity_cubic_feet: 181, default_rate: 1.9 },
        ];
        let vCount = 0;
        for (const v of defaultVehicles) {
            try { VehicleRepository.create(v); vCount++; } catch (e) { console.error(`  ✗ Vehicle ${v.vehicle_number}:`, e.message); }
        }
        console.log(`  ✓ ${vCount} vehicles seeded`);

        // Seed default human resources / employees
        const defaultEmployees = [
            { employee_name: 'Muhammad Ali', designation: 'Plant Operator', base_salary: 35000, status: 'active' },
            { employee_name: 'Ahmad Khan', designation: 'Excavator Operator', base_salary: 40000, status: 'active' },
            { employee_name: 'Imran Shah', designation: 'Loader Operator', base_salary: 38000, status: 'active' },
            { employee_name: 'Bilal Ahmed', designation: 'Driver', base_salary: 30000, status: 'active' },
            { employee_name: 'Usman Ghani', designation: 'Helper', base_salary: 25000, status: 'active' },
            { employee_name: 'Farhan Malik', designation: 'Driver', base_salary: 30000, status: 'active' },
            { employee_name: 'Zahid Hussain', designation: 'Watchman', base_salary: 22000, status: 'active' },
            { employee_name: 'Rashid Khan', designation: 'Cook (Langar)', base_salary: 28000, status: 'active' },
        ];
        let hrCount = 0;
        for (const emp of defaultEmployees) {
            try { hrRepo.create(emp); hrCount++; } catch (e) { console.error(`  ✗ Employee ${emp.employee_name}:`, e.message); }
        }
        console.log(`  ✓ ${hrCount} employees seeded`);

        // Save database to file
        saveDatabase();

        console.log('\n========================================');
        console.log('✓ Database is ready to use!');
        console.log('========================================');
    } catch (error) {
        console.error('Error initializing database:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        closeDatabase();
    }
}

main();

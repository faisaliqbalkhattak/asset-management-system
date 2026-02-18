// Seeding Logic
const UserRepository = require('./repositories/UserRepository');
const EquipmentRepository = require('./repositories/EquipmentRepository');
const VehicleRepository = require('./repositories/VehicleRepository');
const MaterialRepository = require('./repositories/MaterialRepository');
const HumanResourceRepository = require('./repositories/HumanResourceRepository');
const ExpenseCategoryRepository = require('./repositories/ExpenseCategoryRepository');
const AggregateClassificationRepository = require('./repositories/AggregateClassificationRepository');

const seedData = {
    users: [
        {
            username: 'admin',
            email: 'admin@plant.local',
            password: 'Admin@123',
            full_name: 'System Administrator',
            role: 'ADMIN'
        },
        {
            username: 'operator',
            email: 'operator@plant.local',
            password: 'Operator@123',
            full_name: 'Plant Operator',
            role: 'USER'
        }
    ],

    equipment: [
        {
            equipment_code: 'GEN-001',
            equipment_name: 'Generator 100KVA Primary',
            equipment_type: 'GENERATOR',
            rate_type: 'PER_DAY',
            default_rate: 5000
        },
        {
            equipment_code: 'EXC-001',
            equipment_name: 'Excavator Ex-400',
            equipment_type: 'EXCAVATOR',
            rate_type: 'PER_HOUR',
            default_rate: 2500
        },
        {
            equipment_code: 'LDR-966F',
            equipment_name: 'Loader 966-F',
            equipment_type: 'LOADER',
            rate_type: 'PER_MONTH',
            default_rate: 550000
        },
        {
            equipment_code: 'LDR-950E',
            equipment_name: 'Loader 950-E',
            equipment_type: 'LOADER',
            rate_type: 'PER_MONTH',
            default_rate: 550000
        },
        {
            equipment_code: 'DMP-TKR219',
            equipment_name: 'Dumper TKR-219',
            equipment_type: 'DUMPER',
            rate_type: 'PER_TRIP',
            default_rate: 1.9,
            capacity_cft: 838
        },
        {
            equipment_code: 'DMP-TAC388',
            equipment_name: 'Dumper TAC-388',
            equipment_type: 'DUMPER',
            rate_type: 'PER_TRIP',
            default_rate: 1.9,
            capacity_cft: 937
        }
    ],

    vehicles: [
        {
            vehicle_number: 'TKR-219',
            vehicle_type: 'DUMPER',
            capacity_cubic_feet: 838,
            default_rate: 1.9
        },
        {
            vehicle_number: 'TAC-388',
            vehicle_type: 'DUMPER',
            capacity_cubic_feet: 937,
            default_rate: 1.9
        }
    ],

    materials: [
         {
            material_code: 'DSL-001',
            material_name: 'Diesel',
            material_type: 'FUEL',
            unit: 'liters',
            default_rate: 280
        }
    ],

    employees: [
        {
            name: 'Muhammad Ali',
            designation: 'Plant Supervisor',
            department: 'PLANT',
            base_salary_month: 45000
        },
        {
            name: 'Ahmed Khan',
            designation: 'Excavator Operator',
            department: 'PLANT',
            base_salary_month: 35000
        },
        {
            name: 'Rashid Hussain',
            designation: 'Loader Operator',
            department: 'PLANT',
            base_salary_month: 32000
        },
        {
            name: 'Imran Shah',
            designation: 'Helper',
            department: 'PLANT',
            base_salary_month: 20000
        }
    ],

    expenseCategories: [
        { category_code: 'LANGAR', category_name: 'Langar (Food) Expenses' },
        { category_code: 'PLANT_EXP', category_name: 'Plant Expenses' },
        { category_code: 'MISC', category_name: 'Miscellaneous Expenses' },
        { category_code: 'UTILITIES', category_name: 'Utilities' },
        { category_code: 'TRANSPORT', category_name: 'Transport Charges' },
        { category_code: 'REPAIR', category_name: 'Repairs & Maintenance' }
    ],

    aggregateClassifications: [
        {
            classification_name: 'Standard Mix',
            description: 'Default aggregate size distribution for road construction',
            mm10_percentage: 10,
            mm13_percentage: 10,
            mm16_percentage: 35,
            mm20_percentage: 15,
            mm38_percentage: 10,
            mm50_percentage: 20,
            is_default: 1
        }
    ]
};

function seedDatabaseInternal() {
    console.log('Seeding initial data...');

    // Users — UserRepository exports a CLASS, so instantiate it
    const userRepo = new UserRepository();
    for (const user of seedData.users) {
        try { userRepo.create(user); } catch (e) {}
    }

    // Equipment
    for (const item of seedData.equipment) {
        try { EquipmentRepository.create(item); } catch (e) {}
    }

    // Vehicles
    for (const item of seedData.vehicles) {
        try { VehicleRepository.create(item); } catch (e) {}
    }

    // Materials
    for (const item of seedData.materials) {
        try { MaterialRepository.create(item); } catch (e) {}
    }

    // Employees — HumanResourceRepository exports a CLASS, so we must instantiate it
    // HumanResourceRepository.create() accepts both 'name' and 'employee_name'
    // and both 'base_salary_month' and 'base_salary' (handled inside the repo)
    const hrRepo = new HumanResourceRepository();
    for (const item of seedData.employees) {
        try { 
            hrRepo.create(item); 
        } catch (e) {
            console.error(`Failed to seed employee '${item.name || item.employee_name}':`, e.message);
        }
    }

    // Expense Categories
    for (const item of seedData.expenseCategories) {
        try { ExpenseCategoryRepository.create(item); } catch (e) {}
    }

    // Aggregate Classifications
    for (const item of seedData.aggregateClassifications) {
        try { AggregateClassificationRepository.create(item); } catch (e) {}
    }
    
    console.log('Seeding complete.');
}

module.exports = { seedDatabaseInternal };

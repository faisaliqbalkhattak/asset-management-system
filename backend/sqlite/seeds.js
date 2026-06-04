// Seeding Logic
const { run } = require('./db');
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
            const { run, getDatabase } = require('./db');
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
                    const database = getDatabase();
                    database.run('UPDATE human_resources SET is_active = 0');
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
        },
        {
            equipment_code: 'GEN-500KVA',
            equipment_name: 'Generator 500 KVA',
            equipment_type: 'GENERATOR',
            rate_type: 'PER_DAY',
                    database.run('UPDATE equipment SET is_active = 0');
        },
        {
            equipment_code: 'DMP-TAB959',
            equipment_name: 'Dumper TAB-959',
            equipment_type: 'DUMPER',
            rate_type: 'PER_TRIP',
            default_rate: 1.9,
            capacity_cft: 937
        },
        {
            equipment_code: 'DMP-TAE601',
            equipment_name: 'Dumper TAE-601',
            equipment_type: 'DUMPER',
            rate_type: 'PER_TRIP',
            default_rate: 1.9,
            capacity_cft: 181
        }
    ],

    vehicles: [
        {
            vehicle_number: 'TKR-219',
                    database.run('UPDATE expense_categories SET is_active = 0');
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
                    console.error('Failed to sync master tables:', e.message);
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
        { category_code: 'BLAST_FUEL', category_name: 'Fuel Consumed Blasting', category_type: 'BLASTING_ITEM' },
        { category_code: 'BLAST_JAGGERY', category_name: 'Jaggery', category_type: 'BLASTING_ITEM' },
        { category_code: 'BLAST_AMMONIUM_NITRATE', category_name: 'AN (Ammonium nitrate)', category_type: 'BLASTING_ITEM' },
        { category_code: 'BLAST_DETONATOR', category_name: 'Detonator', category_type: 'BLASTING_ITEM' },
        { category_code: 'BLAST_TIP_TO_STAFF', category_name: 'Tip to staff', category_type: 'BLASTING_ITEM' },
        { category_code: 'PLANT_REPAIR_MAINT', category_name: 'Repairs & Maintenance', category_type: 'PLANT_EXPENSE' },
        { category_code: 'PLANT_ACCESSORIES', category_name: 'Plant accessories', category_type: 'PLANT_EXPENSE' },
        { category_code: 'PLANT_RENT', category_name: 'Plant Rent', category_type: 'PLANT_EXPENSE' }
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

    // Employees — keep only the seed set active
    try {
        const hrRepo = new HumanResourceRepository();
        run('UPDATE human_resources SET is_active = 0');
        for (const item of seedData.employees) {
            const existing = hrRepo.getByName(item.name);
            if (existing) {
                hrRepo.update(existing.id, {
                    employee_name: item.name,
                    designation: item.designation,
                    department: item.department,
                    base_salary: item.base_salary_month,
                    status: 'active',
                    is_active: 1,
                });
            } else {
                hrRepo.create(item);
            }
        }
    } catch (e) {
        console.error('Failed to sync human resources:', e.message);
    }

    // Equipment — keep only the seed set active
    try {
        run('UPDATE equipment SET is_active = 0');
        for (const item of seedData.equipment) {
            const existing = EquipmentRepository.findByCode(item.equipment_code);
            if (existing) {
                EquipmentRepository.update(existing.id, {
                    equipment_code: item.equipment_code,
                    equipment_name: item.equipment_name,
                    equipment_type: item.equipment_type,
                    rate_type: item.rate_type,
                    default_rate: item.default_rate || 0,
                    capacity_cft: item.capacity_cft || null,
                    is_active: 1,
                });
            } else {
                EquipmentRepository.create(item);
            }
        }
    } catch (e) {
        console.error('Failed to sync equipment:', e.message);
    }

    // Expense Categories — keep only the seed set active
    try {
        run('UPDATE expense_categories SET is_active = 0');
        for (const item of seedData.expenseCategories) {
            const existingByCode = ExpenseCategoryRepository.findByCode(item.category_code);
            if (existingByCode) {
                ExpenseCategoryRepository.update(existingByCode.id, {
                    category_code: item.category_code,
                    category_name: item.category_name,
                    category_type: item.category_type,
                    is_active: 1
                });
                continue;
            }

            const existingByName = ExpenseCategoryRepository.rawOne(
                'SELECT * FROM expense_categories WHERE LOWER(category_name) = LOWER(?) LIMIT 1',
                [item.category_name]
            );
            if (existingByName) {
                ExpenseCategoryRepository.update(existingByName.id, {
                    category_code: item.category_code,
                    category_name: item.category_name,
                    category_type: item.category_type,
                    is_active: 1
                });
                continue;
            }

            ExpenseCategoryRepository.create(item);
        }
    } catch (e) {
        console.error('Failed to sync expense categories:', e.message);
    }

    // Aggregate Classifications
    for (const item of seedData.aggregateClassifications) {
        try { AggregateClassificationRepository.create(item); } catch (e) {}
    }
    
    console.log('Seeding complete.');
}

module.exports = { seedDatabaseInternal };

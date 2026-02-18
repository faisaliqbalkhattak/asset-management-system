// =====================================================
// SQLITE REPOSITORIES INDEX (UPDATED)
// Central export for all database repositories
// =====================================================

// Base
const BaseRepository = require('./BaseRepository');

// Authentication
const UserRepository = require('./UserRepository');

// Master Data Repositories
const EquipmentRepository = require('./EquipmentRepository');
const EquipmentOperationRepository = require('./EquipmentOperationRepository');
const VehicleRepository = require('./VehicleRepository');
const ExpenseCategoryRepository = require('./ExpenseCategoryRepository');
const AggregateClassificationRepository = require('./AggregateClassificationRepository');

// NEW Repositories for restructured schema
const GeneratorOperationRepository = require('./GeneratorOperationRepository');
const ExcavatorOperationRepository = require('./ExcavatorOperationRepository');
const LoaderOperationNewRepository = require('./LoaderOperationNewRepository');
const BlastingMaterialNewRepository = require('./BlastingMaterialNewRepository');
const LangarExpenseRepository = require('./LangarExpenseRepository');
const PlantExpenseRepository = require('./PlantExpenseRepository');
const MiscExpenseGeneralRepository = require('./MiscExpenseGeneralRepository');
const DumperOperationRepository = require('./DumperOperationRepository');
const DumperMiscExpenseRepository = require('./DumperMiscExpenseRepository');
const LoaderMiscExpenseRepository = require('./LoaderMiscExpenseRepository');
const HumanResourceRepository = require('./HumanResourceRepository');
const HumanResourceSalaryRepository = require('./HumanResourceSalaryRepository');
const MonthlyProductionSummaryRepository = require('./MonthlyProductionSummaryRepository');
const MonthlyExpenseSummaryRepository = require('./MonthlyExpenseSummaryRepository');
const ProfitSharingNewRepository = require('./ProfitSharingNewRepository');

module.exports = {
    // Base
    BaseRepository,
    
    // Authentication
    UserRepository,
    
    // Master Data
    EquipmentRepository,
    EquipmentOperationRepository,
    VehicleRepository,
    ExpenseCategoryRepository,
    AggregateClassificationRepository,
    
    // Generator
    GeneratorOperationRepository,
    
    // Excavator
    ExcavatorOperationRepository,
    
    // Loaders (both in one row)
    LoaderOperationNewRepository,
    LoaderMiscExpenseRepository,
    
    // Blasting Material
    BlastingMaterialNewRepository,
    
    // Langar
    LangarExpenseRepository,
    
    // Plant Expenses
    PlantExpenseRepository,
    
    // Misc Expenses (separate table)
    MiscExpenseGeneralRepository,
    
    // Dumpers
    DumperOperationRepository,
    DumperMiscExpenseRepository,
    
    // Human Resources
    HumanResourceRepository,
    HumanResourceSalaryRepository,
    
    // Production
    MonthlyProductionSummaryRepository,
    
    // Summary & Profit Sharing
    MonthlyExpenseSummaryRepository,
    ProfitSharingNewRepository
};

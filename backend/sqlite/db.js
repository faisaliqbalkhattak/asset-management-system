// =====================================================
// SQLITE DATABASE CONNECTION
// Uses sql.js - Pure JavaScript SQLite implementation
// No native compilation required
// =====================================================

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Define data directory
// Priority:
// 1. Environment Variable DB_PATH
// 2. Next to the executable (same folder as .exe)
// 3. AppData (fallback)

let userDataDir;

// Helper to find the database directory
// Places the DB one level UP from the install/exe folder so
// uninstalling the app does NOT delete the database file.
// Example: If installed at .../Programs/Process Management System/
//          DB goes to        .../Programs/DO_NOT_DELETE_management_system_data.db
const getDbDir = () => {
    // Check if we're in a pkg environment
    if (process.pkg) {
        // One level up from the exe
        return path.dirname(path.dirname(process.execPath));
    }
    
    // Check if we're in Electron production
    if (process.versions.electron && process.env.NODE_ENV === 'production') {
        // process.execPath = .../Process Management System/MyApp.exe
        // Go one level up to the parent of the install folder
        const parentDir = path.dirname(path.dirname(process.execPath));
        try {
            fs.accessSync(parentDir, fs.constants.W_OK);
            return parentDir;
        } catch (err) {
            console.warn(`Write permission denied for ${parentDir}. Requesting fallback.`);
            return null;
        }
    }

    // Default to current working directory in development
    return process.cwd();
};

userDataDir = getDbDir();

// Fallback to AppData if we couldn't get a writable parent path
if (!userDataDir) {
     userDataDir = process.env.APPDATA 
    ? path.join(process.env.APPDATA, 'ProcessManagementSystemData')
    : path.join(process.env.HOME || process.env.USERPROFILE, '.process-management-system-data');
    console.log('Using AppData fallback for database storage.');
}


console.log(`Setting database directory to: ${userDataDir}`);


// Ensure the directory exists
try {
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create data directory. Falling back to AppData.', error);
  userDataDir = process.env.APPDATA 
    ? path.join(process.env.APPDATA, 'ProcessManagementSystemData')
    : path.join(process.env.HOME || process.env.USERPROFILE, '.process-management-system-data');
}

// =====================================================
// DATABASE CONFIGURATION
// =====================================================
const config = {
    // Database file location
    dbPath: process.env.DB_PATH || path.join(userDataDir, 'DO_NOT_DELETE_management_system_data.db'),
    
    // Auto-save interval (ms) - saves to file periodically
    // Set to 1 minute for better safety
    autoSaveInterval: 60000,
    
    // Verbose logging for saves (only log on explicit operations, not auto-save)
    verbose: false,
    
    // Development mode
    isDev: process.env.NODE_ENV === 'development'
};

// =====================================================
// DATABASE INSTANCE (Singleton)
// =====================================================
let db = null;
let SQL = null;
let saveTimer = null;
let isInitialized = false;

/**
 * Initialize SQL.js and database
 * Must be called before using database
 * @returns {Promise<Database>} SQLite database instance
 */
async function initializeDatabase() {
    if (db && isInitialized) return db;
    
    // Initialize SQL.js
    SQL = await initSqlJs();
    
    // Ensure data directory exists
    const dataDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Track if this is a new database
    let isNewDatabase = false;
    
    // Load existing database or create new
    if (fs.existsSync(config.dbPath)) {
        const fileBuffer = fs.readFileSync(config.dbPath);
        db = new SQL.Database(fileBuffer);
        if (config.verbose) console.log(`✓ SQLite database loaded: ${config.dbPath}`);
    } else {
        db = new SQL.Database();
        isNewDatabase = true;
        if (config.verbose) console.log(`✓ SQLite database created: ${config.dbPath}`);
    }
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    isInitialized = true;
    
    // Always ensure schema exists (Idempotent - CREATE TABLE IF NOT EXISTS)
    try {
        createTables();
    } catch(err) {
        console.error("Error creating tables:", err);
    }

    // ONLY seed on first run (when the .db file was just created)
    // On subsequent runs, the file already exists so isNewDatabase = false
    // This prevents re-seeding and overwriting user data
    if (isNewDatabase) {
        console.log('First run detected - seeding master data...');
        try {
            const { seedDatabaseInternal } = require('./seeds');
            seedDatabaseInternal();
            saveDatabase();
            console.log('✓ Database seeded and saved to disk.');
        } catch (seedErr) {
            console.error('Error during seeding:', seedErr);
        }
    } else {
        console.log('Existing database loaded - skipping seed.');
    }
    
    // Start auto-save timer
    startAutoSave();
    
    // Hook into process exit to ensure we save on close
    process.on('SIGINT', () => {
        console.log('Received SIGINT. Saving database...');
        saveDatabase(true);
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM. Saving database...');
        saveDatabase(true);
        process.exit(0);
    });

    console.log(`✓ SQLite database connected: ${config.dbPath}`);
    
    return db;
}

/**
 * Get database connection (synchronous - must call initializeDatabase first)
 * @returns {Database} SQLite database instance
 */
function getDatabase() {
    if (!db || !isInitialized) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Save database to file
 * @param {boolean} silent - If true, don't log the save message
 */
function saveDatabase(silent = false) {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(config.dbPath, buffer);
        if (!silent && config.isDev) console.log('✓ Database saved to disk');
    }
}

/**
 * Start auto-save timer (silent to reduce console noise)
 */
function startAutoSave() {
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => saveDatabase(true), config.autoSaveInterval);
}

/**
 * Stop auto-save timer
 */
function stopAutoSave() {
    if (saveTimer) {
        clearInterval(saveTimer);
        saveTimer = null;
    }
}

/**
 * Close database connection
 */
function closeDatabase() {
    if (db) {
        stopAutoSave();
        saveDatabase(); // Final save
        db.close();
        db = null;
        isInitialized = false;
        console.log('✓ SQLite database connection closed');
    }
}

/**
 * Get database file path
 * @returns {string} Path to database file
 */
function getDatabasePath() {
    return config.dbPath;
}

/**
 * Check if database exists
 * @returns {boolean} True if database file exists
 */
function databaseExists() {
    return fs.existsSync(config.dbPath);
}

/**
 * Backup database to a file
 * @param {string} backupPath - Path for backup file
 */
function backupDatabase(backupPath) {
    saveDatabase(); // Save current state first
    const backup = backupPath || config.dbPath.replace('.db', `_backup_${Date.now()}.db`);
    fs.copyFileSync(config.dbPath, backup);
    console.log(`✓ Database backed up to: ${backup}`);
    return backup;
}

// =====================================================
// QUERY HELPERS
// =====================================================

/**
 * Run multiple statements in a transaction
 * @param {Function} fn - Function containing database operations
 * @returns {*} Result of the function
 */
function runTransaction(fn) {
    const database = getDatabase();
    try {
        database.run('BEGIN TRANSACTION');
        const result = fn();
        database.run('COMMIT');
        saveDatabase(); // Save after transaction
        return result;
    } catch (error) {
        database.run('ROLLBACK');
        throw error;
    }
}

/**
 * Get last insert row ID
 * @returns {number} Last insert row ID
 */
function getLastInsertRowId() {
    const database = getDatabase();
    const result = database.exec('SELECT last_insert_rowid() as id');
    return result.length > 0 ? result[0].values[0][0] : 0;
}

/**
 * Execute a SQL statement (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL statement
 * @param {Array} params - Parameters
 * @returns {Object} Result info with changes and lastInsertRowid
 */
function run(sql, params = []) {
    const database = getDatabase();
    database.run(sql, params);
    const changes = database.getRowsModified();
    const lastInsertRowid = getLastInsertRowId();
    
    // Save to disk after every write operation (INSERT/UPDATE/DELETE)
    // This is the critical fix: sql.js is in-memory, so without this,
    // data is lost if the process exits between auto-save intervals
    const sqlUpper = sql.trim().toUpperCase();
    if (sqlUpper.startsWith('INSERT') || sqlUpper.startsWith('UPDATE') || sqlUpper.startsWith('DELETE')) {
        saveDatabase(true);
    }
    
    return { changes, lastInsertRowid };
}

/**
 * Get a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters
 * @returns {Object|undefined} Row or undefined
 */
function get(sql, params = []) {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    
    if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        stmt.free();
        
        // Convert to object
        const row = {};
        columns.forEach((col, i) => {
            row[col] = values[i];
        });
        return row;
    }
    
    stmt.free();
    return undefined;
}

/**
 * Get all rows
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters
 * @returns {Array} Array of rows
 */
function all(sql, params = []) {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    
    const rows = [];
    const columns = stmt.getColumnNames();
    
    while (stmt.step()) {
        const values = stmt.get();
        const row = {};
        columns.forEach((col, i) => {
            row[col] = values[i];
        });
        rows.push(row);
    }
    
    stmt.free();
    return rows;
}

/**
 * Execute raw SQL (for DDL statements like CREATE TABLE)
 * @param {string} sql - SQL statement(s)
 */
function exec(sql) {
    const database = getDatabase();
    database.run(sql);
}

// =====================================================
// PREPARED STATEMENT WRAPPER
// =====================================================

/**
 * Create a prepared statement wrapper compatible with better-sqlite3 API
 * @param {string} sql - SQL statement
 * @returns {Object} Statement object with run, get, all methods
 */
function prepare(sql) {
    return {
        run: (...params) => run(sql, params.length === 1 && Array.isArray(params[0]) ? params[0] : params),
        get: (...params) => get(sql, params.length === 1 && Array.isArray(params[0]) ? params[0] : params),
        all: (...params) => all(sql, params.length === 1 && Array.isArray(params[0]) ? params[0] : params)
    };
}

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    initializeDatabase,
    getDatabase,
    closeDatabase,
    getDatabasePath,
    databaseExists,
    backupDatabase,
    saveDatabase,
    runTransaction,
    prepare,
    run,
    get,
    all,
    exec,
    config
};

function createTables() {
    const db = getDatabase();
    db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_code TEXT UNIQUE NOT NULL,
        equipment_name TEXT NOT NULL,
        equipment_type TEXT CHECK(equipment_type IN ('GENERATOR', 'EXCAVATOR', 'LOADER', 'DUMPER')),
        rate_type TEXT CHECK(rate_type IN ('PER_DAY', 'PER_HOUR', 'PER_MONTH', 'PER_TRIP')),
        default_rate REAL,
        capacity_cft REAL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT UNIQUE NOT NULL,
        vehicle_type TEXT,
        capacity_cubic_feet REAL,
        default_rate REAL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_code TEXT UNIQUE,
        category_name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS human_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT NOT NULL,
        designation TEXT,
        department TEXT DEFAULT 'PLANT',
        base_salary REAL DEFAULT 0,
        phone TEXT,
        address TEXT,
        joining_date DATE,
        status TEXT DEFAULT 'active',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        salary_month TEXT NOT NULL,
        base_salary REAL DEFAULT 0,
        overtime REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        net_salary REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES human_resources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_production (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        production_date DATE NOT NULL UNIQUE,
        day_name TEXT,
        gravel_cft REAL DEFAULT 0,
        clay_dust_percent REAL DEFAULT 33.33,
        clay_dust_cft REAL DEFAULT 0,
        aggregate_produced REAL DEFAULT 0,
        allowance_percent REAL DEFAULT 15,
        allowance_cft REAL DEFAULT 0,
        net_aggregate_cft REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_production_aggregate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        one_inch_production REAL,
        half_inch_production REAL,
        p_s_production REAL,
        dust_production REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS aggregate_classification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        classification_name TEXT UNIQUE NOT NULL,
        description TEXT,
        mm10_percentage REAL,
        mm13_percentage REAL,
        mm16_percentage REAL,
        mm20_percentage REAL,
        mm38_percentage REAL,
        mm50_percentage REAL,
        total_percentage REAL,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        effective_from DATE,
        effective_to DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generator_fuel_consumption (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        opening_reading REAL,
        closing_reading REAL,
        running_hours REAL,
        fuel_consumed REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generator_rent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        rent_amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS excavator_fuel_consumption (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        opening_reading REAL,
        closing_reading REAL,
        running_hours REAL,
        fuel_consumed REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS excavator_rent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        rent_amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS excavator_misc_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        description TEXT,
        amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loader_fuel_consumption (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        loader_type TEXT CHECK(loader_type IN ('966-F', '950-E')),
        opening_reading REAL,
        closing_reading REAL,
        running_hours REAL,
        fuel_consumed REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loader_rent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        loader_type TEXT CHECK(loader_type IN ('966-F', '950-E')),
        rent_amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loader_misc_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        loader_type TEXT CHECK(loader_type IN ('966-F', '950-E')),
        description TEXT,
        amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dumper_trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        dumper_id INTEGER NOT NULL,
        trip_count INTEGER,
        rate REAL,
        total_amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dumper_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS dumper_misc_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE,
        dumper_id INTEGER,
        vehicle_number TEXT,
        expense_date DATE,
        description TEXT,
        amount REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dumper_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS blasting_material (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_date DATE NOT NULL,
        day_name TEXT,
        description TEXT,
        quantity REAL DEFAULT 0,
        rate REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        transport_charges REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS langar_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date DATE NOT NULL,
        day_name TEXT,
        description TEXT,
        amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plant_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date DATE NOT NULL,
        day_name TEXT,
        category TEXT,
        description TEXT,
        amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS misc_expense_general (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date DATE NOT NULL,
        day_name TEXT,
        category TEXT,
        description TEXT,
        amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generator_operation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        operation_date DATE NOT NULL,
        day_name TEXT,
        timing_hours REAL DEFAULT 0,
        fuel_consumed REAL DEFAULT 0,
        fuel_rate REAL DEFAULT 0,
        fuel_amount REAL DEFAULT 0,
        rent_per_day REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS excavator_operation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        operation_date DATE NOT NULL,
        day_name TEXT,
        hours_operated REAL DEFAULT 0,
        rate_per_hour REAL DEFAULT 0,
        fuel_consumed REAL DEFAULT 0,
        fuel_rate REAL DEFAULT 0,
        misc_expense REAL DEFAULT 0,
        misc_description TEXT,
        rent_amount REAL DEFAULT 0,
        fuel_amount REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS loader_operation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        operation_date DATE NOT NULL,
        day_name TEXT,
        rent_per_day REAL DEFAULT 0,
        fuel_consumed REAL DEFAULT 0,
        fuel_per_day REAL DEFAULT 0,
        fuel_rate REAL DEFAULT 0,
        fuel_amount REAL DEFAULT 0,
        defunct_hours REAL DEFAULT 0,
        defunct_cost_per_hour REAL DEFAULT 0,
        defunct_cost REAL DEFAULT 0,
        misc_expense REAL DEFAULT 0,
        misc_description TEXT,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS dumper_operation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        trip_date DATE NOT NULL,
        day_name TEXT,
        gravel_trips INTEGER DEFAULT 0,
        clay_trips INTEGER DEFAULT 0,
        cft_per_trip REAL DEFAULT 0,
        rate_per_cft REAL DEFAULT 0,
        total_trips INTEGER DEFAULT 0,
        total_cft REAL DEFAULT 0,
        trip_amount REAL DEFAULT 0,
        misc_expense REAL DEFAULT 0,
        misc_description TEXT,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS general_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        expense_date DATE NOT NULL,
        description TEXT,
        amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_expense_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        summary_month INTEGER NOT NULL,
        summary_year INTEGER NOT NULL,
        generator_total REAL DEFAULT 0,
        excavator_total REAL DEFAULT 0,
        excavator_misc_total REAL DEFAULT 0,
        loaders_total REAL DEFAULT 0,
        dumper_tkr219_total REAL DEFAULT 0,
        dumper_tac388_total REAL DEFAULT 0,
        dumper_tab959_total REAL DEFAULT 0,
        dumper_taj656_total REAL DEFAULT 0,
        dumper_tae601_total REAL DEFAULT 0,
        blasting_material_total REAL DEFAULT 0,
        langar_total REAL DEFAULT 0,
        plant_expense_total REAL DEFAULT 0,
        human_resource_total REAL DEFAULT 0,
        misc_expense_total REAL DEFAULT 0,
        grand_total REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_production_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        summary_month INTEGER NOT NULL,
        summary_year INTEGER NOT NULL,
        total_net_aggregate_cft REAL DEFAULT 0,
        sold_at_site_cft REAL DEFAULT 0,
        sold_at_site_amount REAL DEFAULT 0,
        approx_per_cft_cost REAL DEFAULT 0,
        per_cft_cost REAL DEFAULT 0,
        stock_at_site_cft REAL DEFAULT 0,
        cost_of_stocked_material REAL DEFAULT 0,
        total_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profit_sharing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period_month INTEGER NOT NULL,
        period_year INTEGER NOT NULL,
        actual_amount REAL DEFAULT 0,
        stock_at_site_cft REAL DEFAULT 0,
        estimated_rate REAL DEFAULT 0,
        estimated_amount REAL DEFAULT 0,
        actual_expenses REAL DEFAULT 0,
        total_income REAL DEFAULT 0,
        profit REAL DEFAULT 0,
        partner1_share_percentage REAL DEFAULT 50,
        partner1_share_amount REAL DEFAULT 0,
        partner1_sub1_amount REAL DEFAULT 0,
        partner2_share_percentage REAL DEFAULT 50,
        partner2_share_amount REAL DEFAULT 0,
        partner2_sub1_amount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment_operation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        operation_date DATE NOT NULL,
        day_name TEXT,
        operating_hours REAL DEFAULT 0,
        fuel_consumed_liters REAL DEFAULT 0,
        fuel_rate_per_liter REAL DEFAULT 0,
        fuel_amount REAL DEFAULT 0,
        rate_per_unit REAL DEFAULT 0,
        rate_amount REAL DEFAULT 0,
        misc_expense_amount REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS misc_expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_type TEXT,
        parent_id INTEGER,
        expense_description TEXT,
        expense_amount REAL DEFAULT 0,
        expense_type TEXT,
        diesel_liters REAL DEFAULT 0,
        diesel_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_production_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_month TEXT NOT NULL,
        sale_year INTEGER NOT NULL,
        total_production_cft REAL DEFAULT 0,
        sold_cft REAL DEFAULT 0,
        sale_rate_per_cft REAL DEFAULT 0,
        total_sale_amount REAL DEFAULT 0,
        remaining_stock_cft REAL DEFAULT 0,
        total_expenses REAL DEFAULT 0,
        cost_per_cft REAL DEFAULT 0,
        stock_value REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sale_month, sale_year)
    );
    `);
}

module.exports.createTables = createTables;

// =====================================================
// BASE REPOSITORY - Common CRUD Operations
// All models extend this for consistent database access
// =====================================================

const { run, get, all, runTransaction } = require('../db');
const { validateRequired, sanitizeString } = require('../shared/utilities');

class BaseRepository {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    // =====================================================
    // CREATE
    // =====================================================
    
    /**
     * Insert a new record
     * @param {object} data - Column values
     * @returns {object} - Inserted record with ID
     */
    insert(data) {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        const result = run(sql, values);
        
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Create alias for insert (for compatibility)
     * @param {object} data - Column values
     * @returns {object} - Inserted record with ID
     */
    create(data) {
        return this.insert(data);
    }

    /**
     * Insert multiple records
     * @param {Array} records - Array of data objects
     * @returns {Array} - Inserted records
     */
    insertMany(records) {
        if (!records.length) return [];
        
        const inserted = [];
        runTransaction(() => {
            for (const data of records) {
                const record = this.insert(data);
                inserted.push(record);
            }
        });
        return inserted;
    }

    // =====================================================
    // READ
    // =====================================================

    /**
     * Find a record by ID
     * @param {number} id 
     * @returns {object|null}
     */
    findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        return get(sql, [id]);
    }

    /**
     * Find one record by conditions
     * @param {object} conditions - { column: value }
     * @returns {object|null}
     */
    findOne(conditions = {}) {
        const { where, values } = this._buildWhere(conditions);
        const sql = `SELECT * FROM ${this.tableName}${where} LIMIT 1`;
        return get(sql, values);
    }

    /**
     * Find all records matching conditions
     * @param {object} conditions - { column: value }
     * @param {object} options - { orderBy, limit, offset }
     * @returns {Array}
     */
    findAll(conditions = {}, options = {}) {
        const { where, values } = this._buildWhere(conditions);
        let sql = `SELECT * FROM ${this.tableName}${where}`;
        
        if (options.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;
        }
        if (options.limit) {
            sql += ` LIMIT ${options.limit}`;
        }
        if (options.offset) {
            sql += ` OFFSET ${options.offset}`;
        }
        
        return all(sql, values);
    }

    /**
     * Get all records
     * @param {object} options - { orderBy, limit, offset }
     * @returns {Array}
     */
    getAll(options = {}) {
        return this.findAll({}, options);
    }

    /**
     * Count records matching conditions
     * @param {object} conditions 
     * @returns {number}
     */
    count(conditions = {}) {
        const { where, values } = this._buildWhere(conditions);
        const sql = `SELECT COUNT(*) as count FROM ${this.tableName}${where}`;
        const result = get(sql, values);
        return result ? result.count : 0;
    }

    /**
     * Check if record exists
     * @param {object} conditions 
     * @returns {boolean}
     */
    exists(conditions) {
        return this.count(conditions) > 0;
    }

    // =====================================================
    // UPDATE
    // =====================================================

    /**
     * Update a record by ID
     * @param {number} id 
     * @param {object} data - Updated values
     * @returns {object|null} - Updated record
     */
    updateById(id, data) {
        // Add updated_at timestamp
        data.updated_at = new Date().toISOString();
        
        const columns = Object.keys(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(data), id];
        
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
        run(sql, values);
        
        return this.findById(id);
    }

    /**
     * Alias for updateById - allows routes to call repo.update(id, data)
     */
    update(id, data) {
        return this.updateById(id, data);
    }

    /**
     * Update multiple records matching conditions
     * @param {object} conditions 
     * @param {object} data 
     * @returns {number} - Number of rows updated
     */
    updateMany(conditions, data) {
        data.updated_at = new Date().toISOString();
        
        const columns = Object.keys(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const { where, values: whereValues } = this._buildWhere(conditions);
        
        const values = [...Object.values(data), ...whereValues];
        const sql = `UPDATE ${this.tableName} SET ${setClause}${where}`;
        
        const result = run(sql, values);
        return result.changes;
    }

    // =====================================================
    // DELETE
    // =====================================================

    /**
     * Delete a record by ID
     * @param {number} id 
     * @returns {boolean} - Success
     */
    delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        const result = run(sql, [id]);
        return result.changes > 0;
    }

    /**
     * Alias for delete
     */
    deleteById(id) {
        return this.delete(id);
    }

    /**
     * Delete records matching conditions
     * @param {object} conditions 
     * @returns {number} - Number of rows deleted
     */
    deleteMany(conditions) {
        const { where, values } = this._buildWhere(conditions);
        const sql = `DELETE FROM ${this.tableName}${where}`;
        const result = run(sql, values);
        return result.changes;
    }

    // =====================================================
    // UPSERT (Insert or Update)
    // =====================================================

    /**
     * Insert or update based on unique constraint
     * @param {object} data 
     * @param {Array} conflictColumns - Columns that define uniqueness
     * @returns {object}
     */
    upsert(data, conflictColumns) {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const updateClause = columns
            .filter(c => !conflictColumns.includes(c))
            .map(col => `${col} = excluded.${col}`)
            .join(', ');
        
        const sql = `
            INSERT INTO ${this.tableName} (${columns.join(', ')}) 
            VALUES (${placeholders})
            ON CONFLICT(${conflictColumns.join(', ')}) 
            DO UPDATE SET ${updateClause}, updated_at = datetime('now')
        `;
        
        const result = run(sql, Object.values(data));
        return this.findById(result.lastInsertRowid);
    }

    // =====================================================
    // SOFT DELETE (if is_active column exists)
    // =====================================================

    /**
     * Soft delete by setting is_active = 0
     * @param {number} id 
     * @returns {object|null}
     */
    softDelete(id) {
        return this.updateById(id, { is_active: 0 });
    }

    /**
     * Restore soft deleted record
     * @param {number} id 
     * @returns {object|null}
     */
    restore(id) {
        return this.updateById(id, { is_active: 1 });
    }

    /**
     * Find only active records
     * @param {object} conditions 
     * @param {object} options 
     * @returns {Array}
     */
    findActive(conditions = {}, options = {}) {
        return this.findAll({ ...conditions, is_active: 1 }, options);
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Build WHERE clause from conditions object
     * @private
     */
    _buildWhere(conditions) {
        const keys = Object.keys(conditions);
        if (!keys.length) return { where: '', values: [] };
        
        const clauses = [];
        const values = [];
        
        for (const key of keys) {
            const value = conditions[key];
            
            if (value === null) {
                clauses.push(`${key} IS NULL`);
            } else if (Array.isArray(value)) {
                const placeholders = value.map(() => '?').join(', ');
                clauses.push(`${key} IN (${placeholders})`);
                values.push(...value);
            } else {
                clauses.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        return { 
            where: ` WHERE ${clauses.join(' AND ')}`, 
            values 
        };
    }

    /**
     * Execute raw SQL query
     * @param {string} sql 
     * @param {Array} params 
     * @returns {Array}
     */
    raw(sql, params = []) {
        return all(sql, params);
    }

    /**
     * Execute raw SQL and get one result
     * @param {string} sql 
     * @param {Array} params 
     * @returns {object|null}
     */
    rawOne(sql, params = []) {
        return get(sql, params);
    }
}

module.exports = BaseRepository;

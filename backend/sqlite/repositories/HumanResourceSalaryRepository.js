// =====================================================
// HUMAN RESOURCE SALARY REPOSITORY
// =====================================================
// Monthly salary records for employees
// Table: salaries
// Columns: employee_id, salary_month (YYYY-MM), base_salary, overtime, deductions, net_salary, remarks
// =====================================================

const BaseRepository = require('./BaseRepository');
const { get, all } = require('../db');

class HumanResourceSalaryRepository extends BaseRepository {
    constructor() {
        super('salaries');
    }

    /**
     * Calculate net salary before save
     */
    calculateNetSalary(data) {
        const baseSalary = parseFloat(data.base_salary) || 0;
        const overtime = parseFloat(data.overtime) || 0;
        const deductions = parseFloat(data.deductions) || 0;
        const netSalary = baseSalary + overtime - deductions;

        return {
            ...data,
            base_salary: baseSalary,
            overtime: overtime,
            deductions: deductions,
            net_salary: Math.round(netSalary * 100) / 100
        };
    }

    /**
     * Create a new salary entry
     */
    create(data) {
        const processedData = this.calculateNetSalary(data);
        return super.create(processedData);
    }

    /**
     * Update an existing salary entry
     */
    update(id, data) {
        const processedData = this.calculateNetSalary(data);
        return super.update(id, processedData);
    }

    /**
     * Get salaries by employee
     */
    getByEmployee(employeeId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE employee_id = ? ORDER BY salary_month DESC`;
        return all(sql, [employeeId]);
    }

    /**
     * Get salaries by month (YYYY-MM format) with employee details
     */
    getByMonth(salaryMonth) {
        const sql = `
            SELECT s.*, h.employee_name, h.designation 
            FROM ${this.tableName} s
            LEFT JOIN human_resources h ON s.employee_id = h.id
            WHERE s.salary_month = ?
            ORDER BY h.employee_name
        `;
        return all(sql, [salaryMonth]);
    }

    /**
     * Get monthly total for a salary_month (YYYY-MM)
     */
    getMonthlyTotal(salaryMonth) {
        const sql = `
            SELECT 
                COALESCE(SUM(net_salary), 0) as total,
                COALESCE(SUM(base_salary), 0) as base_total,
                COALESCE(SUM(overtime), 0) as overtime_total,
                COALESCE(SUM(deductions), 0) as deductions_total,
                COUNT(*) as employee_count
            FROM ${this.tableName}
            WHERE salary_month = ?
        `;
        return get(sql, [salaryMonth]);
    }

    /**
     * Get all monthly totals for a year
     */
    getYearlyTotals(year) {
        const sql = `
            SELECT 
                salary_month as month,
                COALESCE(SUM(net_salary), 0) as total,
                COALESCE(SUM(base_salary), 0) as base_total,
                COUNT(*) as employee_count
            FROM ${this.tableName}
            WHERE salary_month LIKE ?
            GROUP BY salary_month
            ORDER BY salary_month
        `;
        return all(sql, [`${year}-%`]);
    }

    /**
     * Find all with employee name
     */
    findAllWithName() {
        const sql = `
            SELECT s.*, h.employee_name, h.designation
            FROM ${this.tableName} s
            LEFT JOIN human_resources h ON s.employee_id = h.id
            ORDER BY s.salary_month DESC, h.employee_name
        `;
        return all(sql);
    }

    /**
     * Find by ID with employee name
     */
    findByIdWithName(id) {
        const sql = `
            SELECT s.*, h.employee_name, h.designation
            FROM ${this.tableName} s
            LEFT JOIN human_resources h ON s.employee_id = h.id
            WHERE s.id = ?
        `;
        return get(sql, [id]);
    }
}

module.exports = HumanResourceSalaryRepository;

import axios from 'axios';

// API Base URL - configure based on environment
// Use relative URL so it works regardless of host/port
// (frontend is served by the same Express server)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('[API] Response error:', message);
    return Promise.reject(new Error(message));
  }
);

// ============================================================
// GENERATOR API
// Total = fuel + rent per day
// ============================================================
export const generatorApi = {
  // Get all operations
  getAll: () => api.get('/generator'),
  // Get single operation
  getById: (id) => api.get(`/generator/${id}`),
  // Create new operation
  create: (data) => api.post('/generator', data),
  // Update operation
  update: (id, data) => api.put(`/generator/${id}`, data),
  // Delete operation
  delete: (id) => api.delete(`/generator/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/generator/monthly/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/generator/yearly/${year}`),
};

// ============================================================
// EXCAVATOR API
// Total = fuel + rent + misc (misc shown separately in views)
// ============================================================
export const excavatorApi = {
  // Get all operations
  getAll: () => api.get('/excavator'),
  // Get single operation
  getById: (id) => api.get(`/excavator/${id}`),
  // Create new operation
  create: (data) => api.post('/excavator', data),
  // Update operation
  update: (id, data) => api.put(`/excavator/${id}`, data),
  // Delete operation
  delete: (id) => api.delete(`/excavator/${id}`),
  // Get monthly summary (includes total and misc_total separately)
  getMonthly: (year, month) => api.get(`/excavator/monthly/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/excavator/yearly/${year}`),
};

// ============================================================
// LOADERS API (966-F and 950-E in one row)
// Total = rent/day + fuel + misc - defunct for each loader
// ============================================================
export const loadersApi = {
  // Get all loader operations (both loaders in one row)
  getAll: () => api.get('/loaders'),
  // Get single operation
  getById: (id) => api.get(`/loaders/${id}`),
  // Create new operation (both loaders in one record)
  create: (data) => api.post('/loaders', data),
  // Update operation
  update: (id, data) => api.put(`/loaders/${id}`, data),
  // Delete operation
  delete: (id) => api.delete(`/loaders/${id}`),
  // Get monthly summary (matches backend /month/:year/:month)
  getMonthly: (year, month) => api.get(`/loaders/month/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/loaders/yearly/${year}`),
};


// ============================================================
// BLASTING MATERIAL API
// One item per row, amount summed by month, includes transport charges
// ============================================================
export const blastingApi = {
  // Get all purchases
  getAll: () => api.get('/blasting'),
  // Get single purchase
  getById: (id) => api.get(`/blasting/${id}`),
  // Create new purchase
  create: (data) => api.post('/blasting', data),
  // Update purchase
  update: (id, data) => api.put(`/blasting/${id}`, data),
  // Delete purchase
  delete: (id) => api.delete(`/blasting/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/blasting/monthly/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/blasting/yearly/${year}`),
};

// ============================================================
// LANGAR API
// Description + amount per item, monthly totals
// ============================================================
export const langarApi = {
  // Get all expenses
  getAll: () => api.get('/langar'),
  // Get single expense
  getById: (id) => api.get(`/langar/${id}`),
  // Create new expense
  create: (data) => api.post('/langar', data),
  // Update expense
  update: (id, data) => api.put(`/langar/${id}`, data),
  // Delete expense
  delete: (id) => api.delete(`/langar/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/langar/monthly/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/langar/yearly/${year}`),
};

// ============================================================
// PLANT EXPENSE API
// Same structure as langar - description + amount
// ============================================================
export const plantExpenseApi = {
  // Get all expenses
  getAll: () => api.get('/plant-expense'),
  // Get single expense
  getById: (id) => api.get(`/plant-expense/${id}`),
  // Create new expense
  create: (data) => api.post('/plant-expense', data),
  // Update expense
  update: (id, data) => api.put(`/plant-expense/${id}`, data),
  // Delete expense
  delete: (id) => api.delete(`/plant-expense/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/plant-expense/monthly/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/plant-expense/yearly/${year}`),
};

// ============================================================
// MISC EXPENSE API (General - separate table)
// Separate entry point, shown in separate column in views
// ============================================================
export const miscExpenseApi = {
  // Get all misc expenses
  getAll: () => api.get('/misc-expense'),
  // Get single expense
  getById: (id) => api.get(`/misc-expense/${id}`),
  // Create new expense
  create: (data) => api.post('/misc-expense', data),
  // Update expense
  update: (id, data) => api.put(`/misc-expense/${id}`, data),
  // Delete expense
  delete: (id) => api.delete(`/misc-expense/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/misc-expense/monthly/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/misc-expense/yearly/${year}`),
};

// ============================================================
// DUMPERS API (Operations - trips only)
// Total = trip amount ONLY (trips × cft × rate)
// ============================================================
export const dumpersApi = {
  // Get all operations
  getAll: () => api.get('/dumpers/operations'),
  // Get single operation
  getById: (id) => api.get(`/dumpers/operations/${id}`),
  // Get operations by dumper/vehicle number
  getByDumper: (vehicleNumber) => api.get(`/dumpers/operations/vehicle/${encodeURIComponent(vehicleNumber)}`),
  // Create new operation
  create: (data) => api.post('/dumpers/operations', data),
  // Update operation
  update: (id, data) => api.put(`/dumpers/operations/${id}`, data),
  // Delete operation
  delete: (id) => api.delete(`/dumpers/operations/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/dumpers/operations/month/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/dumpers/operations/yearly/${year}`),
  // Get distinct vehicles
  getVehicles: () => api.get('/dumpers/vehicles'),
};

// ============================================================
// DUMPER MISC EXPENSE API (Separate from operations)
// Misc tracked per dumper per month
// ============================================================
export const dumperMiscApi = {
  // Get all misc expenses
  getAll: () => api.get('/dumpers/misc'),
  // Get by dumper/vehicle number
  getByDumper: (vehicleNumber) => api.get(`/dumpers/misc/vehicle/${encodeURIComponent(vehicleNumber)}`),
  // Create new expense
  create: (data) => api.post('/dumpers/misc', data),
  // Update expense
  update: (id, data) => api.put(`/dumpers/misc/${id}`, data),
  // Delete expense
  delete: (id) => api.delete(`/dumpers/misc/${id}`),
  // Get monthly totals
  getMonthly: (year, month) => api.get(`/dumpers/misc/total/${year}/${month}`),
  // Get yearly totals
  getYearly: (year) => api.get(`/dumpers/misc/yearly/${year}`),
};

// ============================================================
// LOADER MISC EXPENSE API (Separate from operations)
// Misc tracked per loader (966-F, 950-E) per month
// ============================================================
export const loaderMiscApi = {
  // Get all misc expenses
  getAll: () => api.get('/loaders/misc/all'),
  // Get by loader name
  getByLoader: (loaderName) => api.get(`/loaders/misc/loader/${encodeURIComponent(loaderName)}`),
  // Get by ID
  getById: (id) => api.get(`/loaders/misc/${id}`),
  // Create new expense
  create: (data) => api.post('/loaders/misc', data),
  // Update expense
  update: (id, data) => api.put(`/loaders/misc/${id}`, data),
  // Delete expense
  delete: (id) => api.delete(`/loaders/misc/${id}`),
  // Get monthly totals
  getMonthly: (year, month) => api.get(`/loaders/misc/total/${year}/${month}`),
  // Get yearly totals
  getYearly: (year) => api.get(`/loaders/misc/yearly/${year}`),
};

// ============================================================
// HUMAN RESOURCE API (Employee Master)
// ============================================================
export const humanResourceApi = {
  // Get all employees
  getAll: () => api.get('/human-resource'),
  // Get single employee
  getById: (id) => api.get(`/human-resource/${id}`),
  // Create new employee
  create: (data) => api.post('/human-resource', data),
  // Update employee
  update: (id, data) => api.put(`/human-resource/${id}`, data),
  // Delete employee
  delete: (id) => api.delete(`/human-resource/${id}`),
};

// ============================================================
// HUMAN RESOURCE SALARY API
// ============================================================
export const humanResourceSalaryApi = {
  // Get all salaries
  getAll: () => api.get('/human-resource/salaries/all'),
  // Get salaries by employee
  getByEmployee: (employeeId) => api.get(`/human-resource/${employeeId}/salaries`),
  // Create new salary record
  create: (data) => api.post('/human-resource/salaries', data),
  // Update salary record
  update: (id, data) => api.put(`/human-resource/salaries/${id}`, data),
  // Delete salary record
  delete: (id) => api.delete(`/human-resource/salaries/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/human-resource/salaries/month/${year}/${month}`),
  // Get monthly total
  getMonthlyTotal: (year, month) => api.get(`/human-resource/salaries/total/${year}/${month}`),
  // Get yearly totals
  getYearly: (year) => api.get(`/human-resource/salaries/yearly/${year}`),
};

// ============================================================
// PRODUCTION API (Daily Production)
// Gravel → Clay/Dust (%) → Aggregate → Allowance (%) → Net Aggregate
// ============================================================
export const productionApi = {
  // Get all daily production records
  getAll: () => api.get('/production/daily'),
  // Get single production record
  getById: (id) => api.get(`/production/daily/${id}`),
  // Create new production record
  create: (data) => api.post('/production/daily', data),
  // Update production record
  update: (id, data) => api.put(`/production/daily/${id}`, data),
  // Delete production record
  delete: (id) => api.delete(`/production/daily/${id}`),
  // Get monthly summary
  getMonthly: (year, month) => api.get(`/production/daily/month/${year}/${month}`),
  // Get monthly total
  getMonthlyTotal: (year, month) => api.get(`/production/daily/total/${year}/${month}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/production/daily/yearly/${year}`),
};

// ============================================================
// MONTHLY PRODUCTION SUMMARY API
// Sold at site, stock, per cft cost, stocked material cost
// ============================================================
export const monthlyProductionApi = {
  // Get all monthly summaries
  getAll: () => api.get('/production/monthly'),
  // Get summary by month/year
  getByMonth: (year, month) => api.get(`/production/monthly/${year}/${month}`),
  // Get summaries by year
  getByYear: (year) => api.get(`/production/monthly/year/${year}`),
  // Create/update monthly summary (upsert)
  save: (data) => api.post('/production/monthly', data),
  // Update summary
  update: (id, data) => api.put(`/production/monthly/${id}`, data),
};

// ============================================================
// MONTHLY PRODUCTION SALES API
// Monthly sales price, sold CFT, remaining stock, cost per CFT
// ============================================================
export const productionSalesApi = {
  // Get all sales records
  getAll: () => api.get('/production-sales'),
  // Get sales by month/year
  getByMonth: (year, month) => api.get(`/production-sales/${year}/${month}`),
  // Get sales for a year
  getByYear: (year) => api.get(`/production-sales/year/${year}`),
  // Save (upsert) monthly sales
  save: (data) => api.post('/production-sales', data),
  // Delete sales record
  delete: (id) => api.delete(`/production-sales/${id}`),
};

// ============================================================
// SUMMARY API (Monthly Expense Summary)
// All expense totals for the month
// ============================================================
export const summaryApi = {
  // Get all summaries
  getAll: () => api.get('/summary'),
  // Get single summary
  getById: (id) => api.get(`/summary/${id}`),
  // Get summary by month/year
  getByMonth: (year, month) => api.get(`/summary/period/${year}/${month}`),
  // Calculate summary for month (auto-aggregates from all tables)
  calculate: (year, month) => api.post(`/summary/calculate/${year}/${month}`),
  // Save summary
  save: (data) => api.post('/summary', data),
  // Update summary
  update: (id, data) => api.put(`/summary/${id}`, data),
  // Delete summary
  delete: (id) => api.delete(`/summary/${id}`),
  // Get yearly summary
  getYearly: (year) => api.get(`/summary/yearly/${year}`),
};

// ============================================================
// PROFIT SHARING API
// Income from production, expenses from summary, split between partners
// ============================================================
export const profitSharingApi = {
  // Get all profit sharing records
  getAll: () => api.get('/summary/profit'),
  // Get single record
  getById: (id) => api.get(`/summary/profit/${id}`),
  // Get by month/year
  getByMonth: (year, month) => api.get(`/summary/profit/${year}/${month}`),
  // Save profit sharing
  save: (data) => api.post('/summary/profit', data),
  // Update profit sharing
  update: (id, data) => api.put(`/summary/profit/${id}`, data),
  // Get by year
  getByYear: (year) => api.get(`/summary/profit/year/${year}`),
};

// ============================================================
// EQUIPMENT API
// Master data for equipment (Generator, Excavator, Loaders, Dumpers)
// ============================================================
export const equipmentApi = {
  // Get all equipment
  getAll: () => api.get('/equipment'),
  // Get single equipment
  getById: (id) => api.get(`/equipment/${id}`),
  // Create new equipment
  create: (data) => api.post('/equipment', data),
  // Update equipment
  update: (id, data) => api.put(`/equipment/${id}`, data),
  // Delete equipment
  delete: (id) => api.delete(`/equipment/${id}`),
  // Get equipment operations
  getOperations: (id) => api.get(`/equipment/${id}/operations`),
  // Create operation
  createOperation: (id, data) => api.post(`/equipment/${id}/operations`, data),
  // Get monthly summary
  getMonthlySummary: (id, year, month) => api.get(`/equipment/${id}/summary/${year}/${month}`),
};

// ============================================================
// EXPENSE CATEGORY API
// Master data for expense categories (Blasting, Langar, Plant, Misc)
// ============================================================
export const expenseCategoryApi = {
  // Get all categories
  getAll: () => api.get('/expenses/categories'),
  // Get categories by type (MAIN, BLASTING_ITEM, PLANT_EXPENSE, MISC_EXPENSE)
  getByType: (type) => api.get(`/expenses/categories?type=${type}`),
  // Get single category
  getById: (id) => api.get(`/expenses/categories/${id}`),
  // Create new category
  create: (data) => api.post('/expenses/categories', data),
  // Update category
  update: (id, data) => api.put(`/expenses/categories/${id}`, data),
  // Delete category
  delete: (id) => api.delete(`/expenses/categories/${id}`),
};

// ============================================================
// HEALTH CHECK
// ============================================================
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;

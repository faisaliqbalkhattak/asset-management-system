import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/api';

const DataContext = createContext(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // ============================================================
  // STATE - All data entities
  // ============================================================
  
  // Generator operations (fuel + rent = total)
  const [generatorOperations, setGeneratorOperations] = useState([]);
  
  // Excavator operations (fuel + rent + misc = total, misc shown separately)
  const [excavatorOperations, setExcavatorOperations] = useState([]);
  
  // Loader operations (both 966-F and 950-E in one row)
  const [loaderOperations, setLoaderOperations] = useState([]);
  
  // Blasting material purchases
  const [blastingMaterials, setBlastingMaterials] = useState([]);
  
  // Langar expenses
  const [langarExpenses, setLangarExpenses] = useState([]);
  
  // Plant expenses
  const [plantExpenses, setPlantExpenses] = useState([]);
  
  // Misc expenses (general - separate table)
  const [miscExpenses, setMiscExpenses] = useState([]);
  
  // Dumper operations (trips only)
  const [dumperOperations, setDumperOperations] = useState([]);
  
  // Dumper misc expenses (tracked separately)
  const [dumperMiscExpenses, setDumperMiscExpenses] = useState([]);
  
  // Loader misc expenses (tracked separately per loader)
  const [loaderMiscExpenses, setLoaderMiscExpenses] = useState([]);
  
  // Human resource (employees)
  const [humanResources, setHumanResources] = useState([]);
  
  // Salaries
  const [salaries, setSalaries] = useState([]);
  
  // Daily production
  const [dailyProductions, setDailyProductions] = useState([]);

  // Monthly production summaries
  const [monthlyProductionSummaries, setMonthlyProductionSummaries] = useState([]);
  
  // Monthly expense summaries
  // eslint-disable-next-line no-unused-vars
  const [expenseSummaries, setExpenseSummaries] = useState([]);
  
  // Profit sharing records
  // eslint-disable-next-line no-unused-vars
  const [profitSharing, setProfitSharing] = useState([]);

  // Equipment master data
  const [equipment, setEquipment] = useState([]);

  // Expense categories
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Computed: category lists for dropdown items - all use master expense categories
  const allCategoryNames = useMemo(() => {
    return expenseCategories.map(c => c.category_name).filter(Boolean);
  }, [expenseCategories]);
  const blastingItems = useMemo(() => {
    return allCategoryNames.length > 0 ? allCategoryNames : ['Gelatin', 'Detonator', 'Fuse Wire', 'Safety Fuse', 'Blasting Powder', 'Other'];
  }, [allCategoryNames]);
  const plantExpenseCategories = useMemo(() => {
    return allCategoryNames.length > 0 ? allCategoryNames : ['Maintenance', 'Repair', 'Spare Parts', 'Electrical', 'Other'];
  }, [allCategoryNames]);
  const miscExpenseCategories = useMemo(() => {
    return allCategoryNames.length > 0 ? allCategoryNames : ['General', 'Transport', 'Office', 'Utility', 'Other'];
  }, [allCategoryNames]);

  // eslint-disable-next-line no-unused-vars
  const [equipmentTypes, setEquipmentTypes] = useState(['GENERATOR', 'EXCAVATOR', 'LOADER', 'DUMPER']);

  // Rate types
  // eslint-disable-next-line no-unused-vars
  const [rateTypes, setRateTypes] = useState(['PER_DAY', 'PER_HOUR', 'PER_MONTH', 'PER_TRIP']);

  // App settings
  // eslint-disable-next-line no-unused-vars
  const [appSettings, setAppSettings] = useState({
    partnerAShare: 50,
    partnerBShare: 50,
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // FETCH DATA
  // ============================================================
  
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        generatorRes,
        excavatorRes,
        loadersRes,
        blastingRes,
        langarRes,
        plantRes,
        miscRes,
        dumpersRes,
        dumperMiscRes,
        loaderMiscRes,
        hrRes,
        salariesRes,
        productionRes,
        equipmentRes,
        expenseCategoriesRes,
        monthlySummaryRes,
        profitSharingRes,
      ] = await Promise.all([
        api.generatorApi.getAll().catch(() => ({ data: [] })),
        api.excavatorApi.getAll().catch(() => ({ data: [] })),
        api.loadersApi.getAll().catch(() => ({ data: [] })),
        api.blastingApi.getAll().catch(() => ({ data: [] })),
        api.langarApi.getAll().catch(() => ({ data: [] })),
        api.plantExpenseApi.getAll().catch(() => ({ data: [] })),
        api.miscExpenseApi.getAll().catch(() => ({ data: [] })),
        api.dumpersApi.getAll().catch(() => ({ data: [] })),
        api.dumperMiscApi.getAll().catch(() => ({ data: [] })),
        api.loaderMiscApi.getAll().catch(() => ({ data: [] })),
        api.humanResourceApi.getAll().catch(() => ({ data: [] })),
        api.humanResourceSalaryApi.getAll().catch(() => ({ data: [] })),
        api.productionApi.getAll().catch(() => ({ data: [] })),
        api.equipmentApi.getAll().catch(() => ({ data: [] })),
        api.expenseCategoryApi.getAll().catch(() => ({ data: [] })),
        api.monthlyProductionApi.getAll().catch(() => ({ data: [] })),
        api.profitSharingApi.getAll().catch(() => ({ data: [] })),
      ]);

      setGeneratorOperations(generatorRes.data || []);
      setExcavatorOperations(excavatorRes.data || []);
      setLoaderOperations(loadersRes.data || []);
      setBlastingMaterials(blastingRes.data || []);
      setLangarExpenses(langarRes.data || []);
      setPlantExpenses(plantRes.data || []);
      setMiscExpenses(miscRes.data || []);
      setDumperOperations(dumpersRes.data || []);
      setDumperMiscExpenses(dumperMiscRes.data || []);
      setLoaderMiscExpenses(loaderMiscRes.data || []);
      setHumanResources(hrRes.data || []);
      setSalaries(salariesRes.data || []);
      setDailyProductions(productionRes.data || []);
      setEquipment(equipmentRes.data || []);
      setExpenseCategories(expenseCategoriesRes.data || []);
      setMonthlyProductionSummaries(monthlySummaryRes.data || []);
      setProfitSharing(profitSharingRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ============================================================
  // GENERATOR CRUD (fuel + rent = total)
  // ============================================================
  const addGeneratorOperation = async (data) => {
    const res = await api.generatorApi.create(data);
    setGeneratorOperations([...generatorOperations, res.data]);
    return res.data;
  };

  const updateGeneratorOperation = async (id, data) => {
    const res = await api.generatorApi.update(id, data);
    setGeneratorOperations(generatorOperations.map(o => o.id === id ? res.data : o));
    return res.data;
  };

  const deleteGeneratorOperation = async (id) => {
    await api.generatorApi.delete(id);
    setGeneratorOperations(generatorOperations.filter(o => o.id !== id));
  };

  const getGeneratorMonthly = async (year, month) => {
    const res = await api.generatorApi.getMonthly(year, month);
    return res.data;
  };

  const getGeneratorYearly = async (year) => {
    const res = await api.generatorApi.getYearly(year);
    return res.data;
  };

  // ============================================================
  // EXCAVATOR CRUD (fuel + rent + misc = total, misc shown separately)
  // ============================================================
  const addExcavatorOperation = async (data) => {
    const res = await api.excavatorApi.create(data);
    setExcavatorOperations([...excavatorOperations, res.data]);
    return res.data;
  };

  const updateExcavatorOperation = async (id, data) => {
    const res = await api.excavatorApi.update(id, data);
    setExcavatorOperations(excavatorOperations.map(o => o.id === id ? res.data : o));
    return res.data;
  };

  const deleteExcavatorOperation = async (id) => {
    await api.excavatorApi.delete(id);
    setExcavatorOperations(excavatorOperations.filter(o => o.id !== id));
  };

  const getExcavatorMonthly = async (year, month) => {
    const res = await api.excavatorApi.getMonthly(year, month);
    return res.data;
  };

  const getExcavatorYearly = async (year) => {
    const res = await api.excavatorApi.getYearly(year);
    return res.data;
  };

  // ============================================================
  // LOADERS CRUD (both 966-F and 950-E in one row)
  // ============================================================
  const addLoaderOperation = async (data) => {
    const res = await api.loadersApi.create(data);
    setLoaderOperations([...loaderOperations, res.data]);
    return res.data;
  };

  const updateLoaderOperation = async (id, data) => {
    const res = await api.loadersApi.update(id, data);
    setLoaderOperations(loaderOperations.map(o => o.id === id ? res.data : o));
    return res.data;
  };

  const deleteLoaderOperation = async (id) => {
    await api.loadersApi.delete(id);
    setLoaderOperations(loaderOperations.filter(o => o.id !== id));
  };

  const getLoadersMonthly = async (year, month) => {
    const res = await api.loadersApi.getMonthly(year, month);
    return res.data;
  };

  const getLoadersYearly = async (year) => {
    const res = await api.loadersApi.getYearly(year);
    return res.data;
  };

  // ============================================================
  // BLASTING MATERIAL CRUD
  // ============================================================
  const addBlastingMaterial = async (data) => {
    const res = await api.blastingApi.create(data);
    setBlastingMaterials([...blastingMaterials, res.data]);
    return res.data;
  };

  const updateBlastingMaterial = async (id, data) => {
    const res = await api.blastingApi.update(id, data);
    setBlastingMaterials(blastingMaterials.map(m => m.id === id ? res.data : m));
    return res.data;
  };

  const deleteBlastingMaterial = async (id) => {
    await api.blastingApi.delete(id);
    setBlastingMaterials(blastingMaterials.filter(m => m.id !== id));
  };

  const getBlastingMonthly = async (year, month) => {
    const res = await api.blastingApi.getMonthly(year, month);
    return res.data;
  };

  // ============================================================
  // LANGAR EXPENSE CRUD
  // ============================================================
  const addLangarExpense = async (data) => {
    const res = await api.langarApi.create(data);
    setLangarExpenses([...langarExpenses, res.data]);
    return res.data;
  };

  const updateLangarExpense = async (id, data) => {
    const res = await api.langarApi.update(id, data);
    setLangarExpenses(langarExpenses.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const deleteLangarExpense = async (id) => {
    await api.langarApi.delete(id);
    setLangarExpenses(langarExpenses.filter(e => e.id !== id));
  };

  const getLangarMonthly = async (year, month) => {
    const res = await api.langarApi.getMonthly(year, month);
    return res.data;
  };

  // ============================================================
  // PLANT EXPENSE CRUD
  // ============================================================
  const addPlantExpense = async (data) => {
    const res = await api.plantExpenseApi.create(data);
    setPlantExpenses([...plantExpenses, res.data]);
    return res.data;
  };

  const updatePlantExpense = async (id, data) => {
    const res = await api.plantExpenseApi.update(id, data);
    setPlantExpenses(plantExpenses.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const deletePlantExpense = async (id) => {
    await api.plantExpenseApi.delete(id);
    setPlantExpenses(plantExpenses.filter(e => e.id !== id));
  };

  const getPlantMonthly = async (year, month) => {
    const res = await api.plantExpenseApi.getMonthly(year, month);
    return res.data;
  };

  // ============================================================
  // MISC EXPENSE CRUD (General - separate table)
  // ============================================================
  const addMiscExpense = async (data) => {
    const res = await api.miscExpenseApi.create(data);
    setMiscExpenses([...miscExpenses, res.data]);
    return res.data;
  };

  const updateMiscExpense = async (id, data) => {
    const res = await api.miscExpenseApi.update(id, data);
    setMiscExpenses(miscExpenses.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const deleteMiscExpense = async (id) => {
    await api.miscExpenseApi.delete(id);
    setMiscExpenses(miscExpenses.filter(e => e.id !== id));
  };

  const getMiscMonthly = async (year, month) => {
    const res = await api.miscExpenseApi.getMonthly(year, month);
    return res.data;
  };

  // ============================================================
  // DUMPER OPERATIONS CRUD (trips only, misc tracked separately)
  // ============================================================
  const addDumperOperation = async (data) => {
    const res = await api.dumpersApi.create(data);
    setDumperOperations([...dumperOperations, res.data]);
    return res.data;
  };

  const updateDumperOperation = async (id, data) => {
    const res = await api.dumpersApi.update(id, data);
    setDumperOperations(dumperOperations.map(o => o.id === id ? res.data : o));
    return res.data;
  };

  const deleteDumperOperation = async (id) => {
    await api.dumpersApi.delete(id);
    setDumperOperations(dumperOperations.filter(o => o.id !== id));
  };

  const getDumpersMonthly = async (year, month) => {
    const res = await api.dumpersApi.getMonthly(year, month);
    return res.data;
  };

  // ============================================================
  // DUMPER MISC EXPENSE CRUD
  // ============================================================
  const addDumperMiscExpense = async (data) => {
    const res = await api.dumperMiscApi.create(data);
    setDumperMiscExpenses([...dumperMiscExpenses, res.data]);
    return res.data;
  };

  const updateDumperMiscExpense = async (id, data) => {
    const res = await api.dumperMiscApi.update(id, data);
    setDumperMiscExpenses(dumperMiscExpenses.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const deleteDumperMiscExpense = async (id) => {
    await api.dumperMiscApi.delete(id);
    setDumperMiscExpenses(dumperMiscExpenses.filter(e => e.id !== id));
  };

  // ============================================================
  // LOADER MISC EXPENSE CRUD
  // ============================================================
  const addLoaderMiscExpense = async (data) => {
    const res = await api.loaderMiscApi.create(data);
    setLoaderMiscExpenses([...loaderMiscExpenses, res.data]);
    return res.data;
  };

  const updateLoaderMiscExpense = async (id, data) => {
    const res = await api.loaderMiscApi.update(id, data);
    setLoaderMiscExpenses(loaderMiscExpenses.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const deleteLoaderMiscExpense = async (id) => {
    await api.loaderMiscApi.delete(id);
    setLoaderMiscExpenses(loaderMiscExpenses.filter(e => e.id !== id));
  };

  // ============================================================
  // HUMAN RESOURCE CRUD
  // ============================================================
  const addHumanResource = async (data) => {
    const res = await api.humanResourceApi.create(data);
    setHumanResources([...humanResources, res.data]);
    return res.data;
  };

  const updateHumanResource = async (id, data) => {
    const res = await api.humanResourceApi.update(id, data);
    setHumanResources(humanResources.map(h => h.id === id ? res.data : h));
    return res.data;
  };

  const deleteHumanResource = async (id) => {
    await api.humanResourceApi.delete(id);
    setHumanResources(humanResources.filter(h => h.id !== id));
  };

  // ============================================================
  // SALARY CRUD
  // ============================================================
  const addSalary = async (data) => {
    const res = await api.humanResourceSalaryApi.create(data);
    setSalaries([...salaries, res.data]);
    return res.data;
  };

  const updateSalary = async (id, data) => {
    const res = await api.humanResourceSalaryApi.update(id, data);
    setSalaries(salaries.map(s => s.id === id ? res.data : s));
    return res.data;
  };

  const deleteSalary = async (id) => {
    await api.humanResourceSalaryApi.delete(id);
    setSalaries(salaries.filter(s => s.id !== id));
  };

  const getSalariesMonthly = async (year, month) => {
    const res = await api.humanResourceSalaryApi.getMonthly(year, month);
    return res.data;
  };

  // ============================================================
  // PRODUCTION CRUD (Gravel → Clay/Dust → Aggregate → Allowance → Net)
  // ============================================================
  const addDailyProduction = async (data) => {
    const res = await api.productionApi.create(data);
    setDailyProductions([...dailyProductions, res.data]);
    return res.data;
  };

  const updateDailyProduction = async (id, data) => {
    const res = await api.productionApi.update(id, data);
    setDailyProductions(dailyProductions.map(p => p.id === id ? res.data : p));
    return res.data;
  };

  const deleteDailyProduction = async (id) => {
    await api.productionApi.delete(id);
    setDailyProductions(dailyProductions.filter(p => p.id !== id));
  };

  const getProductionMonthly = async (year, month) => {
    const res = await api.productionApi.getMonthly(year, month);
    return res.data;
  };

  const getProductionYearly = async (year) => {
    const res = await api.productionApi.getYearly(year);
    return res.data;
  };

  // ============================================================
  // MONTHLY PRODUCTION SUMMARY (sold at site, stock, costs)
  // ============================================================
  const saveMonthlyProduction = async (data) => {
    const res = await api.monthlyProductionApi.save(data);
    
    // The backend returns summary_month as full name ("February") after save
    // But frontend sends month as "02". We need to match by what backend returns.
    const savedMonth = res.data?.summary_month;
    const savedYear = res.data?.summary_year;
    
    // Check if entry exists in local state
    const existingIndex = monthlyProductionSummaries.findIndex(
      item => item.summary_month === savedMonth && parseInt(item.summary_year) === parseInt(savedYear)
    );

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...monthlyProductionSummaries];
      updated[existingIndex] = res.data;
      setMonthlyProductionSummaries(updated);
    } else {
      // Add new
      setMonthlyProductionSummaries([...monthlyProductionSummaries, res.data]);
    }
    
    return res.data;
  };

  const getMonthlyProductionByMonth = async (year, month) => {
    const res = await api.monthlyProductionApi.getByMonth(year, month);
    return res.data;
  };

  // ============================================================
  // EXPENSE SUMMARY (all expense totals for month)
  // ============================================================
  const calculateExpenseSummary = async (year, month) => {
    const res = await api.summaryApi.calculate(year, month);
    return res.data;
  };

  const getExpenseSummaryByMonth = async (year, month) => {
    const res = await api.summaryApi.getByMonth(year, month);
    return res.data;
  };

  // ============================================================
  // PROFIT SHARING
  // ============================================================
  const calculateProfitSharing = async (year, month) => {
    const res = await api.profitSharingApi.calculate(year, month);
    return res.data;
  };

  const getProfitSharingByMonth = async (year, month) => {
    const res = await api.profitSharingApi.getByMonth(year, month);
    return res.data;
  };

  const saveProfitSharing = async (data) => {
    const res = await api.profitSharingApi.save(data);
    const saved = res.data;
    // Update local state: replace existing record for same month/year or add new
    setProfitSharing(prev => {
      const idx = prev.findIndex(p => p.period_month === saved.period_month && p.period_year === saved.period_year);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    return saved;
  };

  // ============================================================
  // EQUIPMENT CRUD
  // ============================================================
  const addEquipment = async (data) => {
    const res = await api.equipmentApi.create(data);
    setEquipment([...equipment, res.data]);
    return res.data;
  };

  const updateEquipment = async (id, data) => {
    const res = await api.equipmentApi.update(id, data);
    setEquipment(equipment.map(e => e.id === id ? res.data : e));
    return res.data;
  };

  const deleteEquipment = async (id) => {
    await api.equipmentApi.delete(id);
    setEquipment(equipment.filter(e => e.id !== id));
  };

  // ============================================================
  // EXPENSE CATEGORY CRUD
  // ============================================================
  const addExpenseCategory = async (data) => {
    const res = await api.expenseCategoryApi.create(data);
    setExpenseCategories([...expenseCategories, res.data]);
    return res.data;
  };

  const updateExpenseCategory = async (id, data) => {
    const res = await api.expenseCategoryApi.update(id, data);
    setExpenseCategories(expenseCategories.map(c => c.id === id ? res.data : c));
    return res.data;
  };

  const deleteExpenseCategory = async (id) => {
    await api.expenseCategoryApi.delete(id);
    setExpenseCategories(expenseCategories.filter(c => c.id !== id));
  };

  // ============================================================
  // GET TRANSACTIONS (combined view of all operations)
  // ============================================================
  const getTransactions = useCallback(() => {
    const transactions = [];

    // Generator operations
    generatorOperations.forEach(op => {
      transactions.push({
        ...op,
        id: `gen-${op.id}`,
        operationId: op.id,
        date: op.operation_date,
        modelType: 'Generator',
        description: `Generator - Fuel: ${op.fuel_amount}, Rent: ${op.rent_per_day}`,
        amount: op.total_amount || 0,
        month: new Date(op.operation_date).toLocaleString('default', { month: 'long' }),
        year: new Date(op.operation_date).getFullYear().toString(),
      });
    });

    // Excavator operations
    excavatorOperations.forEach(op => {
      transactions.push({
        ...op,
        id: `exc-${op.id}`,
        operationId: op.id,
        date: op.operation_date,
        modelType: 'Excavator',
        description: `Excavator EX-400 - Fuel: ${op.fuel_amount}, Rent: ${op.rent_amount}, Misc: ${op.misc_expense}`,
        amount: op.total_amount || 0,
        miscAmount: op.misc_expense || 0,
        month: new Date(op.operation_date).toLocaleString('default', { month: 'long' }),
        year: new Date(op.operation_date).getFullYear().toString(),
      });
    });

    // Loader operations (each loader is a separate row)
    loaderOperations.forEach(op => {
      transactions.push({
        ...op,
        id: `loader-${op.id}`,
        operationId: op.id,
        date: op.operation_date,
        modelType: 'Loaders',
        description: `${op.equipment_name || 'Loader'} - Total: ${op.total_amount}`,
        amount: op.total_amount || 0,
        month: new Date(op.operation_date).toLocaleString('default', { month: 'long' }),
        year: new Date(op.operation_date).getFullYear().toString(),
      });
    });

    // Blasting materials
    blastingMaterials.forEach(m => {
      transactions.push({
        ...m,
        id: `blast-${m.id}`,
        operationId: m.id,
        date: m.purchase_date,
        modelType: 'Blasting Material',
        description: `${m.description} - ${m.quantity} @ ${m.rate}`,
        amount: m.total_amount || 0,
        month: new Date(m.purchase_date).toLocaleString('default', { month: 'long' }),
        year: new Date(m.purchase_date).getFullYear().toString(),
      });
    });

    // Langar expenses
    langarExpenses.forEach(e => {
      transactions.push({
        ...e,
        id: `lang-${e.id}`,
        operationId: e.id,
        date: e.expense_date,
        modelType: 'Langar',
        description: e.description,
        amount: e.amount || 0,
        month: new Date(e.expense_date).toLocaleString('default', { month: 'long' }),
        year: new Date(e.expense_date).getFullYear().toString(),
      });
    });

    // Plant expenses
    plantExpenses.forEach(e => {
      transactions.push({
        ...e,
        id: `plant-${e.id}`,
        operationId: e.id,
        date: e.expense_date,
        modelType: 'Plant Expense',
        description: e.description,
        amount: e.amount || 0,
        month: new Date(e.expense_date).toLocaleString('default', { month: 'long' }),
        year: new Date(e.expense_date).getFullYear().toString(),
      });
    });

    // Misc expenses
    miscExpenses.forEach(e => {
      transactions.push({
        ...e,
        id: `misc-${e.id}`,
        operationId: e.id,
        date: e.expense_date,
        modelType: 'Misc Expense',
        description: e.description,
        amount: e.amount || 0,
        month: new Date(e.expense_date).toLocaleString('default', { month: 'long' }),
        year: new Date(e.expense_date).getFullYear().toString(),
      });
    });

    // Dumper operations
    dumperOperations.forEach(op => {
      transactions.push({
        ...op,
        id: `dump-${op.id}`,
        operationId: op.id,
        date: op.trip_date,
        modelType: 'Dumper Trip',
        description: `${op.dumper_name} - ${op.gravel_trips + op.clay_trips} trips`,
        amount: op.trip_amount || 0,
        month: new Date(op.trip_date).toLocaleString('default', { month: 'long' }),
        year: new Date(op.trip_date).getFullYear().toString(),
      });
    });

    // Dumper misc expenses
    dumperMiscExpenses.forEach(e => {
      transactions.push({
        ...e,
        id: `dumpmsc-${e.id}`,
        operationId: e.id,
        date: e.expense_date,
        modelType: 'Dumper Misc',
        description: `${e.dumper_name} - ${e.description}`,
        amount: e.amount || 0,
        month: new Date(e.expense_date).toLocaleString('default', { month: 'long' }),
        year: new Date(e.expense_date).getFullYear().toString(),
      });
    });

    // Salaries
    salaries.forEach(s => {
      const employee = humanResources.find(h => h.id === s.employee_id);
      transactions.push({
        ...s,
        id: `sal-${s.id}`,
        operationId: s.id,
        employee_name: employee?.employee_name || 'Employee',
        date: s.salary_month ? `${s.salary_month}-01` : s.created_at,
        modelType: 'Salary',
        description: `${employee?.employee_name || 'Employee'} - ${s.salary_month}`,
        amount: s.net_salary || 0,
        month: s.salary_month ? new Date(`${s.salary_month}-01`).toLocaleString('default', { month: 'long' }) : '',
        year: s.salary_month ? s.salary_month.split('-')[0] : '',
      });
    });

    // Daily production
    dailyProductions.forEach(p => {
      transactions.push({
        ...p,
        id: `prod-${p.id}`,
        operationId: p.id,
        date: p.production_date,
        modelType: 'Production',
        description: `Gravel: ${p.gravel_cft}, Net Agg: ${p.net_aggregate_cft}`,
        amount: p.net_aggregate_cft || 0,
        month: new Date(p.production_date).toLocaleString('default', { month: 'long' }),
        year: new Date(p.production_date).getFullYear().toString(),
      });
    });

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [generatorOperations, excavatorOperations, loaderOperations, blastingMaterials, langarExpenses, plantExpenses, miscExpenses, dumperOperations, dumperMiscExpenses, salaries, humanResources, dailyProductions]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const value = {
    // Data
    generatorOperations,
    excavatorOperations,
    loaderOperations,
    blastingMaterials,
    langarExpenses,
    plantExpenses,
    miscExpenses,
    dumperOperations,
    dumperMiscExpenses,
    humanResources,
    salaries,
    dailyProductions,
    monthlyProductionSummaries,
    expenseSummaries,
    profitSharing,

    // Loading state
    loading,
    error,

    // Refresh
    refreshData: fetchAllData,

    // Generator CRUD
    addGeneratorOperation,
    updateGeneratorOperation,
    deleteGeneratorOperation,
    getGeneratorMonthly,
    getGeneratorYearly,

    // Excavator CRUD
    addExcavatorOperation,
    updateExcavatorOperation,
    deleteExcavatorOperation,
    getExcavatorMonthly,
    getExcavatorYearly,

    // Loader CRUD
    addLoaderOperation,
    updateLoaderOperation,
    deleteLoaderOperation,
    getLoadersMonthly,
    getLoadersYearly,

    // Blasting Material CRUD
    addBlastingMaterial,
    updateBlastingMaterial,
    deleteBlastingMaterial,
    getBlastingMonthly,

    // Langar CRUD
    addLangarExpense,
    updateLangarExpense,
    deleteLangarExpense,
    getLangarMonthly,

    // Plant Expense CRUD
    addPlantExpense,
    updatePlantExpense,
    deletePlantExpense,
    getPlantMonthly,

    // Misc Expense CRUD
    addMiscExpense,
    updateMiscExpense,
    deleteMiscExpense,
    getMiscMonthly,

    // Dumper CRUD
    addDumperOperation,
    updateDumperOperation,
    deleteDumperOperation,
    getDumpersMonthly,

    // Dumper Misc CRUD
    addDumperMiscExpense,
    updateDumperMiscExpense,
    deleteDumperMiscExpense,

    // Loader Misc CRUD
    loaderMiscExpenses,
    addLoaderMiscExpense,
    updateLoaderMiscExpense,
    deleteLoaderMiscExpense,

    // Human Resource CRUD
    addHumanResource,
    updateHumanResource,
    deleteHumanResource,

    // Salary CRUD
    addSalary,
    updateSalary,
    deleteSalary,
    getSalariesMonthly,

    // Production CRUD
    addDailyProduction,
    updateDailyProduction,
    deleteDailyProduction,
    getProductionMonthly,
    getProductionYearly,

    // Monthly Production Summary
    saveMonthlyProduction,
    getMonthlyProductionByMonth,

    // Expense Summary
    calculateExpenseSummary,
    getExpenseSummaryByMonth,

    // Profit Sharing
    calculateProfitSharing,
    getProfitSharingByMonth,
    saveProfitSharing,

    // Equipment CRUD
    equipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,

    // Expense Category CRUD
    expenseCategories,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    blastingItems,
    plantExpenseCategories,
    miscExpenseCategories,

    // Equipment Types
    equipmentTypes,

    // Rate Types
    rateTypes,

    // App Settings
    appSettings,

    // Transactions
    getTransactions,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';

// ============================================================
// COLUMN CONFIGURATIONS - maps each model type to its DB columns
// ============================================================
const COLUMN_CONFIGS = {
  Generator: {
    dateField: 'operation_date',
    primaryColumns: ['operation_date', 'equipment_name', 'fuel_amount', 'rent_per_day', 'total_amount'],
    allColumns: ['operation_date', 'day_name', 'equipment_name', 'timing_hours', 'fuel_consumption_rate', 'fuel_consumed', 'fuel_rate', 'fuel_amount', 'rent_per_day', 'total_amount', 'remarks'],
    labels: {
      operation_date: 'Date', day_name: 'Day', equipment_name: 'Equipment', timing_hours: 'Hours',
      fuel_consumption_rate: 'Fuel Rate/Hr', fuel_consumed: 'Fuel (L)', fuel_rate: 'Fuel Rate',
      fuel_amount: 'Fuel Amount', rent_per_day: 'Rent/Day', total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      timing_hours: { type: 'number', step: '0.5' },
      fuel_consumption_rate: { type: 'number', step: '0.01' },
      fuel_consumed: { type: 'number', step: '0.01' },
      fuel_rate: { type: 'number', step: '0.01' },
      rent_per_day: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const fuelConsumptionRate = parseFloat(data.fuel_consumption_rate) || 0;
      const timingHours = parseFloat(data.timing_hours) || 0;
      const fuelConsumed = fuelConsumptionRate > 0 && timingHours > 0
        ? fuelConsumptionRate * timingHours
        : (parseFloat(data.fuel_consumed) || 0);
      const fuelAmount = fuelConsumed * (parseFloat(data.fuel_rate) || 0);
      const rentPerDay = parseFloat(data.rent_per_day) || 0;
      return {
        equipment_name: data.equipment_name,
        operation_date: data.operation_date,
        timing_hours: timingHours,
        fuel_consumption_rate: fuelConsumptionRate,
        fuel_consumed: fuelConsumed,
        fuel_rate: parseFloat(data.fuel_rate) || 0,
        fuel_amount: fuelAmount,
        rent_per_day: rentPerDay,
        total_amount: fuelAmount + rentPerDay,
        remarks: data.remarks || null,
      };
    },
  },
  Excavator: {
    dateField: 'operation_date',
    primaryColumns: ['operation_date', 'equipment_name', 'rent_amount', 'fuel_amount', 'total_amount'],
    allColumns: ['operation_date', 'day_name', 'equipment_name', 'hours_operated', 'rate_per_hour', 'rent_amount', 'fuel_consumption_rate', 'fuel_consumed', 'fuel_rate', 'fuel_amount', 'misc_expense', 'misc_description', 'misc_expense_2', 'misc_description_2', 'total_amount', 'remarks'],
    labels: {
      operation_date: 'Date', day_name: 'Day', equipment_name: 'Equipment', hours_operated: 'Hours',
      rate_per_hour: 'Rate/Hr', rent_amount: 'Rent', fuel_consumption_rate: 'Fuel Rate/Hr', fuel_consumed: 'Fuel (L)',
      fuel_rate: 'Fuel Rate', fuel_amount: 'Fuel Amount', misc_expense: 'Misc 1',
      misc_description: 'Misc 1 Desc', misc_expense_2: 'Misc 2', misc_description_2: 'Misc 2 Desc',
      total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      hours_operated: { type: 'number', step: '0.5' },
      rate_per_hour: { type: 'number', step: '0.01' },
      fuel_consumption_rate: { type: 'number', step: '0.01' },
      fuel_rate: { type: 'number', step: '0.01' },
      misc_expense: { type: 'number', step: '0.01' },
      misc_description: { type: 'text' },
      misc_expense_2: { type: 'number', step: '0.01' },
      misc_description_2: { type: 'text' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const rentAmount = (parseFloat(data.hours_operated) || 0) * (parseFloat(data.rate_per_hour) || 0);
      const fuelConsumptionRate = parseFloat(data.fuel_consumption_rate) || 0;
      const hoursOperated = parseFloat(data.hours_operated) || 0;
      const fuelConsumed = fuelConsumptionRate > 0 && hoursOperated > 0
        ? fuelConsumptionRate * hoursOperated
        : (parseFloat(data.fuel_consumed) || 0);
      const fuelAmount = fuelConsumed * (parseFloat(data.fuel_rate) || 0);
      return {
        equipment_name: data.equipment_name,
        operation_date: data.operation_date,
        hours_operated: parseFloat(data.hours_operated) || 0,
        rate_per_hour: parseFloat(data.rate_per_hour) || 0,
        rent_amount: rentAmount,
        fuel_consumption_rate: fuelConsumptionRate,
        fuel_consumed: fuelConsumed,
        fuel_rate: parseFloat(data.fuel_rate) || 0,
        fuel_amount: fuelAmount,
        misc_expense: parseFloat(data.misc_expense) || 0,
        misc_description: data.misc_description || null,
        misc_expense_2: parseFloat(data.misc_expense_2) || 0,
        misc_description_2: data.misc_description_2 || null,
        total_amount: rentAmount + fuelAmount,
        remarks: data.remarks || null,
      };
    },
  },
  Loaders: {
    dateField: 'operation_date',
    primaryColumns: ['operation_date', 'equipment_name', 'rent_per_day', 'fuel_amount', 'total_amount'],
    allColumns: ['operation_date', 'day_name', 'equipment_name', 'rent_per_day', 'fuel_consumed', 'fuel_rate', 'fuel_amount', 'defunct_hours', 'defunct_cost_per_hour', 'defunct_cost', 'misc_expense', 'misc_description', 'misc_expense_2', 'misc_description_2', 'total_amount', 'remarks'],
    labels: {
      operation_date: 'Date', day_name: 'Day', equipment_name: 'Loader', rent_per_day: 'Rent/Day',
      fuel_consumed: 'Fuel (L)', fuel_rate: 'Fuel Rate', fuel_amount: 'Fuel Amount',
      defunct_hours: 'Defunct Hrs', defunct_cost_per_hour: 'Defunct Cost/Hr', defunct_cost: 'Defunct Cost',
      misc_expense: 'Misc 1', misc_description: 'Misc 1 Desc', misc_expense_2: 'Misc 2',
      misc_description_2: 'Misc 2 Desc', total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      rent_per_day: { type: 'number', step: '0.01' },
      fuel_consumed: { type: 'number', step: '0.01' },
      fuel_rate: { type: 'number', step: '0.01' },
      defunct_hours: { type: 'number', step: '0.01' },
      defunct_cost_per_hour: { type: 'number', step: '0.01' },
      misc_expense: { type: 'number', step: '0.01' },
      misc_description: { type: 'text' },
      misc_expense_2: { type: 'number', step: '0.01' },
      misc_description_2: { type: 'text' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const fuelAmount = (parseFloat(data.fuel_consumed) || 0) * (parseFloat(data.fuel_rate) || 0);
      const defunctCost = (parseFloat(data.defunct_hours) || 0) * (parseFloat(data.defunct_cost_per_hour) || 0);
      return {
        equipment_name: data.equipment_name,
        operation_date: data.operation_date,
        rent_per_day: parseFloat(data.rent_per_day) || 0,
        fuel_consumed: parseFloat(data.fuel_consumed) || 0,
        fuel_per_day: parseFloat(data.fuel_consumed) || 0,
        fuel_rate: parseFloat(data.fuel_rate) || 0,
        fuel_amount: fuelAmount,
        defunct_hours: parseFloat(data.defunct_hours) || 0,
        defunct_cost_per_hour: parseFloat(data.defunct_cost_per_hour) || 0,
        defunct_cost: defunctCost,
        misc_expense: parseFloat(data.misc_expense) || 0,
        misc_description: data.misc_description || null,
        misc_expense_2: parseFloat(data.misc_expense_2) || 0,
        misc_description_2: data.misc_description_2 || null,
        total_amount: (parseFloat(data.rent_per_day) || 0) + fuelAmount - defunctCost,
        remarks: data.remarks || null,
      };
    },
  },
  'Dumper Trip': {
    dateField: 'trip_date',
    primaryColumns: ['trip_date', 'dumper_name', 'total_trips', 'total_cft', 'trip_amount'],
    allColumns: ['trip_date', 'day_name', 'dumper_name', 'gravel_trips', 'clay_trips', 'cft_per_trip', 'rate_per_cft', 'total_trips', 'total_cft', 'trip_amount', 'misc_fuel_qty', 'misc_fuel_rate', 'misc_expense', 'misc_description', 'misc_expense_2', 'misc_description_2', 'total_amount', 'remarks'],
    labels: {
      trip_date: 'Date', day_name: 'Day', dumper_name: 'Dumper', gravel_trips: 'Gravel Trips',
      clay_trips: 'Clay Trips', cft_per_trip: 'CFT/Trip', rate_per_cft: 'Rate/CFT',
      total_trips: 'Total Trips', total_cft: 'Total CFT', trip_amount: 'Trip Amount',
      misc_fuel_qty: 'Fuel Qty', misc_fuel_rate: 'Fuel Rate', misc_expense: 'Fuel Amount',
      misc_description: 'Fuel Remarks', misc_expense_2: 'Misc 2', misc_description_2: 'Misc 2 Desc',
      total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      gravel_trips: { type: 'number', step: '1' },
      clay_trips: { type: 'number', step: '1' },
      cft_per_trip: { type: 'number', step: '0.01' },
      rate_per_cft: { type: 'number', step: '0.01' },
      misc_fuel_qty: { type: 'number', step: '0.01' },
      misc_fuel_rate: { type: 'number', step: '0.01' },
      misc_description: { type: 'text' },
      misc_expense_2: { type: 'number', step: '0.01' },
      misc_description_2: { type: 'text' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const totalTrips = (parseInt(data.gravel_trips) || 0) + (parseInt(data.clay_trips) || 0);
      const totalCft = totalTrips * (parseFloat(data.cft_per_trip) || 0);
      const tripAmount = totalCft * (parseFloat(data.rate_per_cft) || 0);
      const miscFuelQty = parseFloat(data.misc_fuel_qty) || 0;
      const miscFuelRate = parseFloat(data.misc_fuel_rate) || 0;
      const miscExpense = miscFuelQty * miscFuelRate;
      return {
        dumper_name: data.dumper_name,
        trip_date: data.trip_date,
        gravel_trips: parseInt(data.gravel_trips) || 0,
        clay_trips: parseInt(data.clay_trips) || 0,
        cft_per_trip: parseFloat(data.cft_per_trip) || 0,
        rate_per_cft: parseFloat(data.rate_per_cft) || 0,
        total_cft: totalCft,
        trip_amount: tripAmount,
        misc_fuel_qty: miscFuelQty,
        misc_fuel_rate: miscFuelRate,
        misc_expense: miscExpense,
        misc_description: data.misc_description || null,
        misc_expense_2: parseFloat(data.misc_expense_2) || 0,
        misc_description_2: data.misc_description_2 || null,
        total_amount: tripAmount,
        remarks: data.remarks || null,
      };
    },
  },
  'Dumper Misc': {
    dateField: 'expense_date',
    primaryColumns: ['expense_date', 'dumper_name', 'description', 'amount'],
    allColumns: ['expense_date', 'day_name', 'dumper_name', 'description', 'amount', 'remarks'],
    labels: {
      expense_date: 'Date', day_name: 'Day', dumper_name: 'Dumper',
      description: 'Description', amount: 'Amount', remarks: 'Remarks',
    },
    editableFields: {
      description: { type: 'text' },
      amount: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => ({
      dumper_name: data.dumper_name,
      expense_date: data.expense_date,
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      remarks: data.remarks || null,
    }),
  },
  'Blasting Material': {
    dateField: 'purchase_date',
    primaryColumns: ['purchase_date', 'description', 'quantity', 'rate', 'total_amount'],
    allColumns: ['purchase_date', 'day_name', 'description', 'quantity', 'rate', 'amount', 'transport_charges', 'total_amount', 'remarks'],
    labels: {
      purchase_date: 'Date', day_name: 'Day', description: 'Item', quantity: 'Qty',
      rate: 'Rate', amount: 'Amount', transport_charges: 'Transport',
      total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      category_id: { type: 'select', optionsKey: 'blastingItems' },
      quantity: { type: 'number', step: '0.01' },
      rate: { type: 'number', step: '0.01' },
      transport_charges: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const itemAmount = (parseFloat(data.quantity) || 0) * (parseFloat(data.rate) || 0);
      return {
        purchase_date: data.purchase_date,
        category_id: data.category_id || null,
        quantity: parseFloat(data.quantity) || 0,
        rate: parseFloat(data.rate) || 0,
        amount: itemAmount,
        transport_charges: parseFloat(data.transport_charges) || 0,
        total_amount: itemAmount + (parseFloat(data.transport_charges) || 0),
        remarks: data.remarks || null,
      };
    },
  },
  'Plant Mess': {
    dateField: 'expense_date',
    primaryColumns: ['expense_date', 'description', 'amount'],
    allColumns: ['expense_date', 'day_name', 'description', 'amount', 'remarks'],
    labels: {
      expense_date: 'Date', day_name: 'Day', description: 'Description',
      amount: 'Amount', remarks: 'Remarks',
    },
    editableFields: {
      description: { type: 'text' },
      amount: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => ({
      expense_date: data.expense_date,
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      remarks: data.remarks || null,
    }),
  },
  'Plant Expense': {
    dateField: 'expense_date',
    primaryColumns: ['expense_date', 'category', 'description', 'amount'],
    allColumns: ['expense_date', 'day_name', 'category', 'description', 'amount', 'remarks'],
    labels: {
      expense_date: 'Date', day_name: 'Day', category: 'Category',
      description: 'Description', amount: 'Amount', remarks: 'Remarks',
    },
    editableFields: {
      category_id: { type: 'select', optionsKey: 'plantExpenseCategories' },
      description: { type: 'text' },
      amount: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => ({
      expense_date: data.expense_date,
      category_id: data.category_id || null,
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      remarks: data.remarks || null,
    }),
  },
  Salary: {
    dateField: 'salary_month',
    primaryColumns: ['salary_month', 'employee_name', 'base_salary', 'net_salary'],
    allColumns: ['salary_month', 'employee_name', 'base_salary', 'overtime', 'deductions', 'net_salary', 'remarks'],
    labels: {
      salary_month: 'Month', employee_name: 'Employee', base_salary: 'Base Salary',
      overtime: 'Overtime', deductions: 'Deductions', net_salary: 'Net Salary', remarks: 'Remarks',
    },
    editableFields: {
      base_salary: { type: 'number', step: '0.01' },
      overtime: { type: 'number', step: '0.01' },
      deductions: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => ({
      employee_id: data.employee_id,
      salary_month: data.salary_month,
      base_salary: parseFloat(data.base_salary) || 0,
      overtime: parseFloat(data.overtime) || 0,
      deductions: parseFloat(data.deductions) || 0,
      net_salary: (parseFloat(data.base_salary) || 0) + (parseFloat(data.overtime) || 0) - (parseFloat(data.deductions) || 0),
      remarks: data.remarks || null,
    }),
  },
  Production: {
    dateField: 'production_date',
    primaryColumns: ['production_date', 'gravel_cft', 'aggregate_produced', 'net_aggregate_cft'],
    allColumns: ['production_date', 'day_name', 'gravel_cft', 'clay_dust_percent', 'clay_dust_cft', 'aggregate_produced', 'net_aggregate_cft', 'notes'],
    labels: {
      production_date: 'Date', day_name: 'Day', gravel_cft: 'Gravel CFT',
      clay_dust_percent: 'Clay/Dust %', clay_dust_cft: 'Clay/Dust CFT',
      aggregate_produced: 'Aggregate', net_aggregate_cft: 'Net Aggregate', notes: 'Notes',
    },
    editableFields: {
      gravel_cft: { type: 'number', step: '0.01' },
      clay_dust_percent: { type: 'number', step: '0.01' },
      notes: { type: 'text' },
    },
    computePayload: (data) => {
      const gravel = parseFloat(data.gravel_cft) || 0;
      const clayPercent = parseFloat(data.clay_dust_percent) || 0;
      const clayCft = gravel * (clayPercent / 100);
      const aggregate = gravel - clayCft;
      return {
        production_date: data.production_date,
        gravel_cft: gravel,
        clay_dust_percent: clayPercent,
        clay_dust_cft: clayCft,
        aggregate_produced: aggregate,
        net_aggregate_cft: aggregate,
        notes: data.notes || null,
      };
    },
  },
};

// Map modelType to the update function name in DataContext
const UPDATE_FN_MAP = {
  Generator: 'updateGeneratorOperation',
  Excavator: 'updateExcavatorOperation',
  Loaders: 'updateLoaderOperation',
  'Dumper Trip': 'updateDumperOperation',
  'Dumper Misc': 'updateDumperMiscExpense',
  'Blasting Material': 'updateBlastingMaterial',
  'Plant Mess': 'updatePlantMessExpense',
  'Plant Expense': 'updatePlantExpense',
  Salary: 'updateSalary',
  Production: 'updateDailyProduction',
};

const DELETE_FN_MAP = {
  Generator: 'deleteGeneratorOperation',
  Excavator: 'deleteExcavatorOperation',
  Loaders: 'deleteLoaderOperation',
  'Dumper Trip': 'deleteDumperOperation',
  'Dumper Misc': 'deleteDumperMiscExpense',
  'Blasting Material': 'deleteBlastingMaterial',
  'Plant Mess': 'deletePlantMessExpense',
  'Plant Expense': 'deletePlantExpense',
  Salary: 'deleteSalary',
  Production: 'deleteDailyProduction',
};

// TRANSACTIONS PAGE
// ============================================================
const Transactions = () => {
  const data = useData();
  const { getTransactions, equipment, blastingItems, plantExpenseCategories } = data;

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDay, setSelectedDay] = useState('');
  const [showCount, setShowCount] = useState(25);
  const [editingId, setEditingId] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');

  const transactions = useMemo(() => getTransactions(), [getTransactions]);

  const getMonthKey = useCallback((dateStr) => {
    if (!dateStr) return '';
    const value = String(dateStr);
    return value.length >= 7 ? value.slice(0, 7) : '';
  }, []);

  const normalizeDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const value = String(dateStr);
    return value.length >= 10 ? value.slice(0, 10) : value;
  }, []);

  const normalizeText = useCallback((value) => {
    return String(value || '').trim().toLowerCase();
  }, []);

  const dumperOptions = useMemo(() => {
    const dumpers = (equipment || [])
      .filter((e) => e.equipment_type === 'DUMPER')
      .map((e) => {
        const value = e.equipment_name || e.equipment_code || '';
        const label = e.equipment_code && e.equipment_name
          ? `${e.equipment_code} - ${e.equipment_name}`
          : (e.equipment_name || e.equipment_code || 'Dumper');
        return { value, label };
      })
      .filter((item) => item.value);

    const unique = new Map();
    dumpers.forEach((item) => {
      if (!unique.has(item.value)) {
        unique.set(item.value, item);
      }
    });
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [equipment]);

  const equipmentOptionsByType = useMemo(() => {
    const grouped = (equipment || []).reduce((acc, item) => {
      if (!item.equipment_type) return acc;
      if (item.is_active !== undefined && item.is_active !== 1 && item.is_active !== true) return acc;

      if (!acc[item.equipment_type]) acc[item.equipment_type] = [];

      const value = item.equipment_name || item.equipment_code || '';
      if (!value) return acc;

      const label = item.equipment_code && item.equipment_name
        ? `${item.equipment_code} - ${item.equipment_name}`
        : (item.equipment_name || item.equipment_code);

      acc[item.equipment_type].push({ value, label });
      return acc;
    }, {});

    Object.keys(grouped).forEach((type) => {
      const unique = new Map();
      grouped[type].forEach((item) => {
        if (!unique.has(item.value)) unique.set(item.value, item);
      });
      grouped[type] = [...unique.values()].sort((a, b) => a.label.localeCompare(b.label));
    });

    return grouped;
  }, [equipment]);

  const subCategoryConfig = useMemo(() => {
    if (selectedFilter === 'group:Blasting Material' || selectedFilter === 'model:Blasting Material') {
      return { label: 'Blasting Item', options: blastingItems || [] };
    }
    if (selectedFilter === 'group:Plant Expense' || selectedFilter === 'model:Plant Expense') {
      return { label: 'Plant Expense Category', options: plantExpenseCategories || [] };
    }
    if (selectedFilter === 'group:Generator' || selectedFilter === 'model:Generator') {
      return { label: 'Generator', options: equipmentOptionsByType.GENERATOR || [] };
    }
    if (selectedFilter === 'group:Excavator' || selectedFilter === 'model:Excavator') {
      return { label: 'Excavator', options: equipmentOptionsByType.EXCAVATOR || [] };
    }
    if (selectedFilter === 'group:Loaders' || selectedFilter === 'model:Loaders') {
      return { label: 'Loader', options: equipmentOptionsByType.LOADER || [] };
    }
    if (selectedFilter === 'group:Dumpers' || selectedFilter === 'model:Dumper Trip' || selectedFilter === 'model:Dumper Misc') {
      return { label: 'Dumper', options: dumperOptions || [] };
    }
    return { label: 'Sub Category', options: [] };
  }, [selectedFilter, blastingItems, plantExpenseCategories, dumperOptions, equipmentOptionsByType]);

  const isSubCategoryEnabled = subCategoryConfig.options.length > 0;

  const selectedSubCategoryLabel = useMemo(() => {
    if (!isSubCategoryEnabled || selectedSubCategory === 'All') return '';
    const option = subCategoryConfig.options.find((item) => {
      const value = typeof item === 'string' ? item : item.value;
      return String(value) === String(selectedSubCategory);
    });
    return typeof option === 'string' ? option : (option?.label || '');
  }, [isSubCategoryEnabled, selectedSubCategory, subCategoryConfig.options]);

  useEffect(() => {
    if (!isSubCategoryEnabled && selectedSubCategory !== 'All') {
      setSelectedSubCategory('All');
      return;
    }
    if (isSubCategoryEnabled && selectedSubCategory !== 'All') {
      const optionValues = subCategoryConfig.options.map((option) => (
        typeof option === 'string' ? option : option.value
      ));
      const hasOption = optionValues.includes(selectedSubCategory);
      if (!hasOption) {
        setSelectedSubCategory('All');
      }
    }
  }, [isSubCategoryEnabled, selectedSubCategory, subCategoryConfig.options]);

  const dailyEntryGroups = useMemo(() => ([
    { value: 'group:Generator', label: 'Generator', modelTypes: ['Generator'] },
    { value: 'group:Excavator', label: 'Excavator', modelTypes: ['Excavator'] },
    { value: 'group:Loaders', label: 'Loaders', modelTypes: ['Loaders'] },
    { value: 'group:Dumpers', label: 'Dumpers', modelTypes: ['Dumper Trip', 'Dumper Misc'] },
    { value: 'group:Blasting Material', label: 'Blasting Material', modelTypes: ['Blasting Material'] },
    { value: 'group:Plant Mess', label: 'Plant Mess', modelTypes: ['Plant Mess'] },
    { value: 'group:Plant Expense', label: 'Plant Expense', modelTypes: ['Plant Expense'] },
    { value: 'group:Salary', label: 'Staff Salaries', modelTypes: ['Salary'] },
  ]), []);

  const dailyEntryGroupMap = useMemo(() => {
    return dailyEntryGroups.reduce((acc, group) => {
      acc[group.value] = group.modelTypes;
      return acc;
    }, {});
  }, [dailyEntryGroups]);

  const monthOptions = useMemo(() => {
    const monthMap = new Map();
    transactions.forEach((t) => {
      const key = getMonthKey(t.date);
      if (!key || monthMap.has(key)) return;
      const label = new Date(`${key}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
      monthMap.set(key, label);
    });
    return [...monthMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label }));
  }, [transactions, getMonthKey]);

  const selectedLabel = useMemo(() => {
    if (selectedFilter === 'All') return '';
    if (selectedFilter.startsWith('group:')) {
      const group = dailyEntryGroups.find((g) => g.value === selectedFilter);
      return group ? group.label : '';
    }
    if (selectedFilter.startsWith('equipment:')) return selectedFilter.replace('equipment:', '');
    if (selectedFilter.startsWith('category:')) return selectedFilter.replace('category:', '');
    if (selectedFilter.startsWith('model:')) return selectedFilter.replace('model:', '');
    return '';
  }, [selectedFilter, dailyEntryGroups]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    const isEquipmentGroupFilter =
      selectedFilter === 'group:Generator' ||
      selectedFilter === 'group:Excavator' ||
      selectedFilter === 'group:Loaders' ||
      selectedFilter === 'group:Dumpers' ||
      selectedFilter === 'model:Generator' ||
      selectedFilter === 'model:Excavator' ||
      selectedFilter === 'model:Loaders' ||
      selectedFilter === 'model:Dumper Trip' ||
      selectedFilter === 'model:Dumper Misc';

    if (selectedFilter !== 'All' && selectedFilter.startsWith('group:')) {
      const types = dailyEntryGroupMap[selectedFilter] || [];
      filtered = filtered.filter((t) => types.includes(t.modelType));
    }

    if (selectedFilter !== 'All' && selectedFilter.startsWith('equipment:')) {
      const name = selectedFilter.replace('equipment:', '');
      const normalizedName = normalizeText(name);
      filtered = filtered.filter((t) => {
        const equipmentName = normalizeText(t.equipment_name);
        const dumperName = normalizeText(t.dumper_name);
        return equipmentName === normalizedName || dumperName === normalizedName;
      });
    }

    if (selectedFilter !== 'All' && selectedFilter.startsWith('category:')) {
      const name = selectedFilter.replace('category:', '');
      const normalizedName = normalizeText(name);
      filtered = filtered.filter((t) => {
        const category = normalizeText(t.category);
        const description = normalizeText(t.description);
        const subCategory = normalizeText(t.subCategory);
        return category === normalizedName || description === normalizedName || subCategory === normalizedName;
      });
    }

    if (selectedFilter !== 'All' && selectedFilter.startsWith('model:')) {
      const name = selectedFilter.replace('model:', '');
      filtered = filtered.filter((t) => t.modelType === name);
    }

    if (selectedSubCategory !== 'All' && isSubCategoryEnabled) {
      const normalizedSubCategory = normalizeText(selectedSubCategory);
      const normalizedSubCategoryLabel = normalizeText(selectedSubCategoryLabel);
      if (isEquipmentGroupFilter) {
        filtered = filtered.filter((t) => {
          const dumperName = normalizeText(t.dumper_name || t.equipment_name);
          return dumperName === normalizedSubCategory;
        });
      } else {
        filtered = filtered.filter((t) => {
          const categoryId = normalizeText(t.category_id);
          const category = normalizeText(t.category);
          const description = normalizeText(t.description);
          const subCategory = normalizeText(t.subCategory);
          return categoryId === normalizedSubCategory || category === normalizedSubCategory || description === normalizedSubCategory || subCategory === normalizedSubCategory || category === normalizedSubCategoryLabel || description === normalizedSubCategoryLabel || subCategory === normalizedSubCategoryLabel;
        });
      }
    }

    if (selectedMonth !== 'All') {
      filtered = filtered.filter((t) => getMonthKey(t.date) === selectedMonth);
    }

    if (selectedDay) {
      filtered = filtered.filter((t) => normalizeDate(t.date) === selectedDay);
    }

    return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedFilter, selectedSubCategory, selectedMonth, selectedDay, isSubCategoryEnabled, getMonthKey, normalizeDate, normalizeText, dailyEntryGroupMap]);

  // Paginated/limited view
  const displayedTransactions = useMemo(() => {
    if (showCount === 0) return filteredTransactions; // 0 = show all
    return filteredTransactions.slice(0, showCount);
  }, [filteredTransactions, showCount]);

  // Summary totals for filtered transactions
  const summaryTotals = useMemo(() => {
    const totals = { total: 0, misc: 0 };
    filteredTransactions.forEach(t => {
      totals.total += (t.amount || 0);
      totals.misc += (parseFloat(t.misc_expense) || 0) + (parseFloat(t.misc_expense_2) || 0);
    });
    totals.balance = totals.total - totals.misc;
    return totals;
  }, [filteredTransactions]);

  // Get the update function for a given model type
  const getUpdateFn = useCallback((modelType) => {
    const fnName = UPDATE_FN_MAP[modelType];
    return fnName ? data[fnName] : null;
  }, [data]);

  const getDeleteFn = useCallback((modelType) => {
    const fnName = DELETE_FN_MAP[modelType];
    return fnName ? data[fnName] : null;
  }, [data]);

  const handleUpdate = useCallback(async (modelType, operationId, payload) => {
    const updateFn = getUpdateFn(modelType);
    if (!updateFn) {
      throw new Error(`No update function found for ${modelType}`);
    }
    await updateFn(operationId, payload);
  }, [getUpdateFn]);

  const handleDelete = useCallback(async (modelType, operationId) => {
    const deleteFn = getDeleteFn(modelType);
    if (!deleteFn) {
      throw new Error(`No delete function found for ${modelType}`);
    }
    const confirmed = window.confirm('Delete this entry permanently?');
    if (!confirmed) return;
    await deleteFn(operationId);
    setEditingId(null);
  }, [getDeleteFn]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Transactions</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px]">
            <Label htmlFor="type-filter">Transaction Type</Label>
            <Select
              id="type-filter"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="All">All</option>
              <optgroup label="Daily Entries">
                {dailyEntryGroups.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
            </Select>
          </div>

          <div className="min-w-[200px]">
            <Label htmlFor="month-filter">Month</Label>
            <Select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>

          <div className="min-w-[220px]">
            <Label htmlFor="sub-category-filter">{subCategoryConfig.label}</Label>
            <Select
              id="sub-category-filter"
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              disabled={!isSubCategoryEnabled}
            >
              <option value="All">All</option>
              {subCategoryConfig.options.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <option key={`subcat:${value}`} value={value}>{label}</option>
                );
              })}
            </Select>
          </div>

          <div className="min-w-[180px]">
            <Label htmlFor="day-filter">Day</Label>
            <Input
              id="day-filter"
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            />
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="show-count">Show Entries</Label>
            <Select
              id="show-count"
              value={showCount}
              onChange={(e) => setShowCount(parseInt(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={0}>All</option>
            </Select>
          </div>

          <div className="text-sm text-gray-500 self-end pb-2">
            Showing {displayedTransactions.length} of {filteredTransactions.length} entries
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {displayedTransactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No transactions found. Add entries in the Daily Entries tab.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <AllTransactionsTable
              transactions={displayedTransactions}
              editingId={editingId}
              onStartEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {/* Summary Totals Bar */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-gray-500 uppercase block">Total Amount</span>
              <span className="text-xl font-bold text-emerald-700">{summaryTotals.total.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase block">Operational Misc</span>
              <span className="text-xl font-bold text-amber-600">{summaryTotals.misc.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase block">Balance (Total − Misc)</span>
              <span className="text-xl font-bold text-blue-700">{summaryTotals.balance.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Summary of {filteredTransactions.length} {selectedLabel ? `${selectedLabel} ` : ''}entries
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ALL TRANSACTIONS TABLE - Mixed types, generic columns
// ============================================================
const AllTransactionsTable = ({ transactions, editingId, onStartEdit, onCancelEdit, onUpdate, onDelete }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {transactions.map((t) => {
          const config = COLUMN_CONFIGS[t.modelType];
          if (!config) {
            return (
              <tr key={t.id}>
                <td className="px-4 py-3 text-sm">{t.date}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{t.modelType}</span>
                </td>
                <td className="px-4 py-3 text-sm">{t.description}</td>
                <td className="px-4 py-3 text-sm font-medium text-emerald-700">{t.amount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">-</td>
              </tr>
            );
          }
          return (
            <AllTransactionRow
              key={t.id}
              transaction={t}
              config={config}
              isEditing={editingId === t.id}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onUpdate={(opId, payload) => onUpdate(t.modelType, opId, payload)}
              onDelete={onDelete}
            />
          );
        })}
      </tbody>
    </table>
  );
};

// Row for AllTransactionsTable - shows date, type, description, amount + expandable details
const AllTransactionRow = ({ transaction, config, isEditing, onStartEdit, onCancelEdit, onUpdate, onDelete }) => {
  const { blastingItems, plantExpenseCategories } = useData();
  const [expanded, setExpanded] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleStartEdit = () => {
    const initialData = {};
    config.allColumns.forEach(col => {
      initialData[col] = transaction[col] !== undefined && transaction[col] !== null
        ? transaction[col].toString()
        : '';
    });
    if (transaction.category_id !== undefined && transaction.category_id !== null) initialData.category_id = String(transaction.category_id);
    if (transaction.equipment_name) initialData.equipment_name = transaction.equipment_name;
    if (transaction.dumper_name) initialData.dumper_name = transaction.dumper_name;
    if (transaction.employee_id) initialData.employee_id = transaction.employee_id;
    setEditData(initialData);
    setExpanded(true);
    onStartEdit(transaction.id);
  };

  const handleSave = async () => {
    if (!config.computePayload) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = config.computePayload(editData);
      await onUpdate(transaction.operationId, payload);
      onCancelEdit();
    } catch (err) {
      setSaveError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'number') return val.toLocaleString();
    return val;
  };

  const optionSources = {
    blastingItems,
    plantExpenseCategories,
  };

  return (
    <>
      <tr
        className={`hover:bg-gray-50 cursor-pointer ${isEditing ? 'bg-yellow-50' : ''}`}
        onClick={() => !isEditing && setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm">{transaction.date}</td>
        <td className="px-4 py-3 text-sm">
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{transaction.modelType}</span>
        </td>
        <td className="px-4 py-3 text-sm">{transaction.description}</td>
        <td className="px-4 py-3 text-sm font-medium text-emerald-700">{transaction.amount?.toLocaleString()}</td>
        <td className="px-4 py-3 text-sm flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-gray-500 hover:text-gray-700"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▲' : '▼'}
          </button>
          {!isEditing && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(transaction.modelType, transaction.operationId); }}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className={isEditing ? 'bg-yellow-50' : 'bg-gray-50'}>
          <td colSpan={5} className="px-4 py-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(config.editableFields).map(([field, fieldConfig]) => (
                    <div key={field}>
                      <Label className="text-xs text-gray-500">{config.labels[field] || field}</Label>
                      {fieldConfig.type === 'select' ? (
                        <Select
                          value={editData[field] || ''}
                          onChange={(e) => handleEditChange(field, e.target.value)}
                          className="mt-1"
                        >
                          <option value="">Select...</option>
                          {(optionSources[fieldConfig.optionsKey] || []).map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type={fieldConfig.type}
                          step={fieldConfig.step}
                          value={editData[field] || ''}
                          onChange={(e) => handleEditChange(field, e.target.value)}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {saveError && <div className="text-red-600 text-sm">{saveError}</div>}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={onCancelEdit} disabled={saving}>Cancel</Button>
                  <Button type="button" variant="success" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {config.allColumns.map(col => (
                  <div key={col}>
                    <span className="text-xs text-gray-500 uppercase">{config.labels[col] || col}</span>
                    <div className="text-sm font-medium">{formatValue(transaction[col])}</div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export default Transactions;

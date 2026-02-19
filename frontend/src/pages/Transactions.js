import React, { useState, useMemo, useCallback } from 'react';
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
    allColumns: ['operation_date', 'day_name', 'equipment_name', 'hours_operated', 'rate_per_hour', 'rent_amount', 'fuel_consumed', 'fuel_rate', 'fuel_amount', 'misc_expense', 'misc_description', 'misc_expense_2', 'misc_description_2', 'total_amount', 'remarks'],
    labels: {
      operation_date: 'Date', day_name: 'Day', equipment_name: 'Equipment', hours_operated: 'Hours',
      rate_per_hour: 'Rate/Hr', rent_amount: 'Rent', fuel_consumed: 'Fuel (L)',
      fuel_rate: 'Fuel Rate', fuel_amount: 'Fuel Amount', misc_expense: 'Misc 1',
      misc_description: 'Misc 1 Desc', misc_expense_2: 'Misc 2', misc_description_2: 'Misc 2 Desc',
      total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      hours_operated: { type: 'number', step: '0.5' },
      rate_per_hour: { type: 'number', step: '0.01' },
      fuel_consumed: { type: 'number', step: '0.01' },
      fuel_rate: { type: 'number', step: '0.01' },
      misc_expense: { type: 'number', step: '0.01' },
      misc_description: { type: 'text' },
      misc_expense_2: { type: 'number', step: '0.01' },
      misc_description_2: { type: 'text' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const rentAmount = (parseFloat(data.hours_operated) || 0) * (parseFloat(data.rate_per_hour) || 0);
      const fuelAmount = (parseFloat(data.fuel_consumed) || 0) * (parseFloat(data.fuel_rate) || 0);
      return {
        equipment_name: data.equipment_name,
        operation_date: data.operation_date,
        hours_operated: parseFloat(data.hours_operated) || 0,
        rate_per_hour: parseFloat(data.rate_per_hour) || 0,
        rent_amount: rentAmount,
        fuel_consumed: parseFloat(data.fuel_consumed) || 0,
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
    allColumns: ['trip_date', 'day_name', 'dumper_name', 'gravel_trips', 'clay_trips', 'cft_per_trip', 'rate_per_cft', 'total_trips', 'total_cft', 'trip_amount', 'misc_expense', 'misc_description', 'misc_expense_2', 'misc_description_2', 'total_amount', 'remarks'],
    labels: {
      trip_date: 'Date', day_name: 'Day', dumper_name: 'Dumper', gravel_trips: 'Gravel Trips',
      clay_trips: 'Clay Trips', cft_per_trip: 'CFT/Trip', rate_per_cft: 'Rate/CFT',
      total_trips: 'Total Trips', total_cft: 'Total CFT', trip_amount: 'Trip Amount',
      misc_expense: 'Misc 1', misc_description: 'Misc 1 Desc', misc_expense_2: 'Misc 2',
      misc_description_2: 'Misc 2 Desc', total_amount: 'Total', remarks: 'Remarks',
    },
    editableFields: {
      gravel_trips: { type: 'number', step: '1' },
      clay_trips: { type: 'number', step: '1' },
      cft_per_trip: { type: 'number', step: '0.01' },
      rate_per_cft: { type: 'number', step: '0.01' },
      misc_expense: { type: 'number', step: '0.01' },
      misc_description: { type: 'text' },
      misc_expense_2: { type: 'number', step: '0.01' },
      misc_description_2: { type: 'text' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const totalTrips = (parseInt(data.gravel_trips) || 0) + (parseInt(data.clay_trips) || 0);
      const totalCft = totalTrips * (parseFloat(data.cft_per_trip) || 0);
      const tripAmount = totalCft * (parseFloat(data.rate_per_cft) || 0);
      return {
        dumper_name: data.dumper_name,
        trip_date: data.trip_date,
        gravel_trips: parseInt(data.gravel_trips) || 0,
        clay_trips: parseInt(data.clay_trips) || 0,
        cft_per_trip: parseFloat(data.cft_per_trip) || 0,
        rate_per_cft: parseFloat(data.rate_per_cft) || 0,
        total_cft: totalCft,
        trip_amount: tripAmount,
        misc_expense: parseFloat(data.misc_expense) || 0,
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
      description: { type: 'text' },
      quantity: { type: 'number', step: '0.01' },
      rate: { type: 'number', step: '0.01' },
      transport_charges: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => {
      const itemAmount = (parseFloat(data.quantity) || 0) * (parseFloat(data.rate) || 0);
      return {
        purchase_date: data.purchase_date,
        description: data.description,
        quantity: parseFloat(data.quantity) || 0,
        rate: parseFloat(data.rate) || 0,
        amount: itemAmount,
        transport_charges: parseFloat(data.transport_charges) || 0,
        total_amount: itemAmount + (parseFloat(data.transport_charges) || 0),
        remarks: data.remarks || null,
      };
    },
  },
  Langar: {
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
      category: { type: 'text' },
      description: { type: 'text' },
      amount: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => ({
      expense_date: data.expense_date,
      category: data.category || '',
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      remarks: data.remarks || null,
    }),
  },
  'Misc Expense': {
    dateField: 'expense_date',
    primaryColumns: ['expense_date', 'category', 'description', 'amount'],
    allColumns: ['expense_date', 'day_name', 'category', 'description', 'amount', 'remarks'],
    labels: {
      expense_date: 'Date', day_name: 'Day', category: 'Category',
      description: 'Description', amount: 'Amount', remarks: 'Remarks',
    },
    editableFields: {
      category: { type: 'text' },
      description: { type: 'text' },
      amount: { type: 'number', step: '0.01' },
      remarks: { type: 'text' },
    },
    computePayload: (data) => ({
      expense_date: data.expense_date,
      category: data.category || '',
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
  Langar: 'updateLangarExpense',
  'Plant Expense': 'updatePlantExpense',
  'Misc Expense': 'updateMiscExpense',
  Salary: 'updateSalary',
  Production: 'updateDailyProduction',
};

// ============================================================
// TRANSACTION ROW - Expandable row with edit capability
// ============================================================
const TransactionRow = ({ transaction, config, onUpdate, isEditing, onStartEdit, onCancelEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleStartEdit = () => {
    // Initialize edit data from the transaction's raw data
    const initialData = {};
    config.allColumns.forEach(col => {
      initialData[col] = transaction[col] !== undefined && transaction[col] !== null
        ? transaction[col].toString()
        : '';
    });
    // Also carry forward identifier fields
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

  const formatValue = (col, val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'number') return val.toLocaleString();
    return val;
  };

  // Extra columns not in primaryColumns
  const extraColumns = config.allColumns.filter(c => !config.primaryColumns.includes(c));

  return (
    <>
      {/* Collapsed Row - Primary Columns */}
      <tr
        className={`hover:bg-gray-50 cursor-pointer ${isEditing ? 'bg-yellow-50' : ''}`}
        onClick={() => !isEditing && setExpanded(!expanded)}
      >
        {config.primaryColumns.map(col => (
          <td key={col} className={`px-4 py-3 text-sm ${col.includes('total') || col === 'amount' || col === 'net_salary' || col === 'trip_amount' ? 'font-medium text-emerald-700' : ''}`}>
            {formatValue(col, transaction[col])}
          </td>
        ))}
        <td className="px-4 py-3 text-sm">
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            {transaction.modelType}
          </span>
        </td>
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
        </td>
      </tr>

      {/* Expanded Row - All additional columns / Edit form */}
      {expanded && (
        <tr className={isEditing ? 'bg-yellow-50' : 'bg-gray-50'}>
          <td colSpan={config.primaryColumns.length + 2} className="px-4 py-4">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(config.editableFields).map(([field, fieldConfig]) => (
                    <div key={field}>
                      <Label className="text-xs text-gray-500">{config.labels[field] || field}</Label>
                      <Input
                        type={fieldConfig.type}
                        step={fieldConfig.step}
                        value={editData[field] || ''}
                        onChange={(e) => handleEditChange(field, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
                {saveError && (
                  <div className="text-red-600 text-sm">{saveError}</div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={onCancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="button" variant="success" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode - Show all extra columns */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {extraColumns.map(col => (
                  <div key={col}>
                    <span className="text-xs text-gray-500 uppercase">{config.labels[col] || col}</span>
                    <div className="text-sm font-medium">{formatValue(col, transaction[col])}</div>
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

// ============================================================
// TRANSACTIONS PAGE
// ============================================================
const Transactions = () => {
  const data = useData();
  const { getTransactions } = data;

  const [selectedType, setSelectedType] = useState('All');
  const [showCount, setShowCount] = useState(25);
  const [editingId, setEditingId] = useState(null);

  const transactions = useMemo(() => getTransactions(), [getTransactions]);

  // Get unique model types from transactions
  const modelTypes = useMemo(() => {
    const types = [...new Set(transactions.map(t => t.modelType))];
    return ['All', ...types.sort()];
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (selectedType !== 'All') {
      filtered = filtered.filter(t => t.modelType === selectedType);
    }
    return filtered;
  }, [transactions, selectedType]);

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

  const handleUpdate = useCallback(async (modelType, operationId, payload) => {
    const updateFn = getUpdateFn(modelType);
    if (!updateFn) {
      throw new Error(`No update function found for ${modelType}`);
    }
    await updateFn(operationId, payload);
  }, [getUpdateFn]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Transactions</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <Label htmlFor="type-filter">Transaction Type</Label>
            <Select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {modelTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
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
            {/* Group rendering by type when All is selected, or single table when filtered */}
            {selectedType === 'All' ? (
              <AllTransactionsTable
                transactions={displayedTransactions}
                editingId={editingId}
                onStartEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={handleUpdate}
              />
            ) : (
              <TypedTransactionsTable
                transactions={displayedTransactions}
                modelType={selectedType}
                editingId={editingId}
                onStartEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={handleUpdate}
              />
            )}
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
              <span className="text-xs text-gray-500 uppercase block">Misc Expenses</span>
              <span className="text-xl font-bold text-amber-600">{summaryTotals.misc.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase block">Balance (Total − Misc)</span>
              <span className="text-xl font-bold text-blue-700">{summaryTotals.balance.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Summary of {filteredTransactions.length} {selectedType === 'All' ? '' : selectedType + ' '}entries
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ALL TRANSACTIONS TABLE - Mixed types, generic columns
// ============================================================
const AllTransactionsTable = ({ transactions, editingId, onStartEdit, onCancelEdit, onUpdate }) => {
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
            />
          );
        })}
      </tbody>
    </table>
  );
};

// Row for AllTransactionsTable - shows date, type, description, amount + expandable details
const AllTransactionRow = ({ transaction, config, isEditing, onStartEdit, onCancelEdit, onUpdate }) => {
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
                      <Input
                        type={fieldConfig.type}
                        step={fieldConfig.step}
                        value={editData[field] || ''}
                        onChange={(e) => handleEditChange(field, e.target.value)}
                        className="mt-1"
                      />
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

// ============================================================
// TYPED TRANSACTIONS TABLE - Single type, type-specific columns
// ============================================================
const TypedTransactionsTable = ({ transactions, modelType, editingId, onStartEdit, onCancelEdit, onUpdate }) => {
  const config = COLUMN_CONFIGS[modelType];

  if (!config) {
    return (
      <div className="p-4 text-gray-500">
        No column configuration for type: {modelType}
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {config.primaryColumns.map(col => (
            <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {config.labels[col] || col}
            </th>
          ))}
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            config={config}
            isEditing={editingId === t.id}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onUpdate={(opId, payload) => onUpdate(t.modelType, opId, payload)}
          />
        ))}
      </tbody>
    </table>
  );
};

export default Transactions;

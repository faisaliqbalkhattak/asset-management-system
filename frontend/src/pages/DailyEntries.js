import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

// ============================================================
// REUSABLE RECENT ENTRIES SECTION
// Shows configurable number of recent entries with expandable rows
// ============================================================
const RecentEntriesSection = ({
  data,
  primaryColumns,  // [{key, label, cellClassName?}]
  allColumns,       // [{key, label}] - all columns from DB
  editingId,
  onEdit,
  formatters = {},  // optional per-column value formatters
}) => {
  const [recentCount, setRecentCount] = useState(5);
  const [expandedRows, setExpandedRows] = useState({});

  const displayedData = useMemo(() => {
    if (recentCount === 0) return [...data].reverse();
    return data.slice(-recentCount).reverse();
  }, [data, recentCount]);

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatValue = (col, val) => {
    if (formatters[col]) return formatters[col](val);
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'number') return val.toLocaleString();
    return String(val);
  };

  // Extra columns = allColumns that are not in primaryColumns
  const primaryKeys = primaryColumns.map(c => c.key);
  const extraColumns = allColumns.filter(c => !primaryKeys.includes(c.key));

  if (data.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium text-gray-900">Recent Entries</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show:</span>
          <select
            value={recentCount}
            onChange={e => setRecentCount(parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={0}>All ({data.length})</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {primaryColumns.map(col => (
                <th key={col.key} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${col.headerClassName || ''}`}>
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedData.map(item => (
              <React.Fragment key={item.id}>
                <tr className={`hover:bg-gray-50 ${editingId === item.id ? 'bg-yellow-50' : ''}`}>
                  {primaryColumns.map(col => (
                    <td key={col.key} className={`px-4 py-3 text-sm ${col.cellClassName || ''}`}>
                      {formatValue(col.key, item[col.key])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="text-gray-500 hover:text-gray-700"
                        title={expandedRows[item.id] ? 'Collapse' : 'Expand'}
                      >
                        {expandedRows[item.id] ? '▲' : '▼'}
                      </button>
                      <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    </div>
                  </td>
                </tr>
                {expandedRows[item.id] && extraColumns.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={primaryColumns.length + 1} className="px-4 py-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {extraColumns.map(col => (
                          <div key={col.key}>
                            <span className="text-xs text-gray-500 uppercase">{col.label}</span>
                            <div className="text-sm font-medium">{formatValue(col.key, item[col.key])}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-400 text-right">
        Showing {displayedData.length} of {data.length} entries
      </div>
    </div>
  );
};

const DailyEntries = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Daily Entries</h1>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="excavator">Excavator</TabsTrigger>
          <TabsTrigger value="loaders">Loaders</TabsTrigger>
          <TabsTrigger value="dumpers">Dumpers</TabsTrigger>
          <TabsTrigger value="blasting">Blasting Material</TabsTrigger>
          <TabsTrigger value="langar">Langar</TabsTrigger>
          <TabsTrigger value="plant">Plant Expense</TabsTrigger>
          <TabsTrigger value="misc">Misc Expense</TabsTrigger>
          <TabsTrigger value="salary">Salaries</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <GeneratorForm />
        </TabsContent>

        <TabsContent value="excavator">
          <ExcavatorForm />
        </TabsContent>

        <TabsContent value="loaders">
          <LoadersForm />
        </TabsContent>

        <TabsContent value="dumpers">
          <DumpersForm />
        </TabsContent>

        <TabsContent value="blasting">
          <BlastingMaterialForm />
        </TabsContent>

        <TabsContent value="langar">
          <LangarForm />
        </TabsContent>

        <TabsContent value="plant">
          <PlantExpenseForm />
        </TabsContent>

        <TabsContent value="misc">
          <MiscExpenseForm />
        </TabsContent>

        <TabsContent value="salary">
          <SalaryForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================
// GENERATOR FORM - Select from registered generators
// ============================================================
const GeneratorForm = () => {
  const { equipment, generatorOperations, addGeneratorOperation, updateGeneratorOperation } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Filter equipment by type (backend stores uppercase types and is_active as 1/0)
  const generators = useMemo(() => 
    equipment.filter(e => e.equipment_type === 'GENERATOR' && (e.is_active === 1 || e.is_active === true)),
    [equipment]
  );

  const [formData, setFormData] = useState({
    equipment_name: '',
    operation_date: new Date().toISOString().split('T')[0],
    timing_hours: '',
    fuel_consumption_rate: '',
    fuel_consumed: '',
    fuel_rate: '',
    rent_per_day: '19354.84', // Default: 600000/31 days
    remarks: '',
  });

  // Update default equipment when generators load
  React.useEffect(() => {
    if (generators.length > 0 && !formData.equipment_name) {
      setFormData(prev => ({ ...prev, equipment_name: generators[0].equipment_name }));
    }
  }, [generators, formData.equipment_name]);

  const fuelConsumptionRate = parseFloat(formData.fuel_consumption_rate) || 0;
  const timingHours = parseFloat(formData.timing_hours) || 0;
  // If fuel_consumption_rate is set, auto-calculate fuel_consumed
  const effectiveFuelConsumed = fuelConsumptionRate > 0 && timingHours > 0
    ? fuelConsumptionRate * timingHours
    : (parseFloat(formData.fuel_consumed) || 0);
  const fuelAmount = effectiveFuelConsumed * (parseFloat(formData.fuel_rate) || 0);
  const rentPerDay = parseFloat(formData.rent_per_day) || 0;
  const total = fuelAmount + rentPerDay;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setFormData({
      equipment_name: op.equipment_name || generators[0]?.equipment_name || '',
      operation_date: op.operation_date,
      timing_hours: op.timing_hours?.toString() || '',
      fuel_consumption_rate: op.fuel_consumption_rate?.toString() || '',
      fuel_consumed: op.fuel_consumed?.toString() || '',
      fuel_rate: op.fuel_rate?.toString() || '',
      rent_per_day: op.rent_per_day?.toString() || '19354.84',
      remarks: op.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      equipment_name: generators[0]?.equipment_name || '',
      operation_date: new Date().toISOString().split('T')[0],
      timing_hours: '',
      fuel_consumption_rate: formData.fuel_consumption_rate,
      fuel_consumed: '',
      fuel_rate: formData.fuel_rate,
      rent_per_day: formData.rent_per_day,
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipment_name) {
      setError('Please select a generator. Add generators in Master Data first.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        equipment_name: formData.equipment_name,
        operation_date: formData.operation_date,
        timing_hours: parseFloat(formData.timing_hours) || 0,
        fuel_consumption_rate: fuelConsumptionRate,
        fuel_consumed: effectiveFuelConsumed,
        fuel_rate: parseFloat(formData.fuel_rate) || 0,
        fuel_amount: fuelAmount,
        rent_per_day: rentPerDay,
        total_amount: total,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateGeneratorOperation(editingId, payload);
        setSuccess('Generator entry updated!');
        showToast('Generator entry updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addGeneratorOperation(payload);
        setSuccess('Generator entry saved!');
        showToast('Generator entry saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({
        equipment_name: formData.equipment_name,
        operation_date: new Date().toISOString().split('T')[0],
        timing_hours: '',
        fuel_consumption_rate: formData.fuel_consumption_rate,
        fuel_consumed: '',
        fuel_rate: formData.fuel_rate,
        rent_per_day: formData.rent_per_day,
        remarks: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Generator Entry</h2>
      <p className="text-sm text-gray-600 mb-4">Total = Fuel Amount + Rent/Day</p>

      {generators.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          No generators registered. Please add generators in <strong>Master Data → Equipment</strong> first.
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="equipment_name">Select Generator *</Label>
            <Select
              id="equipment_name"
              name="equipment_name"
              value={formData.equipment_name}
              onChange={handleChange}
              disabled={generators.length === 0}
            >
              {generators.length === 0 ? (
                <option value="">No generators available</option>
              ) : (
                generators.map(g => <option key={g.id} value={g.equipment_name}>{g.equipment_name}</option>)
              )}
            </Select>
          </div>

          <div>
            <Label htmlFor="operation_date">Date *</Label>
            <Input type="date" id="operation_date" name="operation_date" value={formData.operation_date} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="timing_hours">Timing (Hours)</Label>
            <Input type="number" id="timing_hours" name="timing_hours" value={formData.timing_hours} onChange={handleChange} placeholder="0" step="0.5" />
          </div>

          <div>
            <Label htmlFor="fuel_consumption_rate">Fuel Rate/Hr (L/hr)</Label>
            <Input type="number" id="fuel_consumption_rate" name="fuel_consumption_rate" value={formData.fuel_consumption_rate} onChange={handleChange} placeholder="e.g. 12" step="0.01" />
            {fuelConsumptionRate > 0 && timingHours > 0 && (
              <span className="text-xs text-blue-600">{fuelConsumptionRate} L/hr × {timingHours} hrs = {effectiveFuelConsumed.toFixed(2)} L</span>
            )}
          </div>

          <div>
            <Label htmlFor="fuel_consumed">Fuel Consumed (L){fuelConsumptionRate > 0 ? ' (auto)' : ''}</Label>
            <Input
              type="number" id="fuel_consumed" name="fuel_consumed"
              value={fuelConsumptionRate > 0 && timingHours > 0 ? effectiveFuelConsumed.toFixed(2) : formData.fuel_consumed}
              onChange={handleChange} placeholder="0" step="0.01"
              disabled={fuelConsumptionRate > 0 && timingHours > 0}
              className={fuelConsumptionRate > 0 && timingHours > 0 ? 'bg-gray-100' : ''}
            />
          </div>

          <div>
            <Label htmlFor="fuel_rate">Fuel Rate (PKR/L)</Label>
            <Input type="number" id="fuel_rate" name="fuel_rate" value={formData.fuel_rate} onChange={handleChange} placeholder="282.90" step="0.01" />
          </div>

          <div>
            <Label htmlFor="rent_per_day">Rent/Day (PKR)</Label>
            <Input type="number" id="rent_per_day" name="rent_per_day" value={formData.rent_per_day} onChange={handleChange} placeholder="19354.84" step="0.01" />
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional notes" />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 p-4 rounded-lg grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-600">Fuel Amount</Label>
            <div className="text-lg font-bold">{fuelAmount.toLocaleString()}</div>
            <span className="text-xs text-gray-500">{effectiveFuelConsumed.toFixed(2)}L × Rs.{formData.fuel_rate || 0}/L</span>
          </div>
          <div>
            <Label className="text-gray-600">Rent/Day</Label>
            <div className="text-lg font-bold">{rentPerDay.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-emerald-600">Total</Label>
            <div className="text-2xl font-bold text-emerald-700">{total.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Fuel + Rent</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting || generators.length === 0}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={generatorOperations}
        primaryColumns={[
          { key: 'operation_date', label: 'Date' },
          { key: 'equipment_name', label: 'Equipment' },
          { key: 'timing_hours', label: 'Hours' },
          { key: 'fuel_consumed', label: 'Fuel (L)' },
          { key: 'rent_per_day', label: 'Rent/Day' },
          { key: 'total_amount', label: 'Total', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'operation_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'equipment_name', label: 'Equipment' },
          { key: 'timing_hours', label: 'Hours' },
          { key: 'fuel_consumption_rate', label: 'Fuel Rate/Hr' },
          { key: 'fuel_consumed', label: 'Fuel (L)' },
          { key: 'fuel_rate', label: 'Fuel Rate' },
          { key: 'fuel_amount', label: 'Fuel Amount' },
          { key: 'rent_per_day', label: 'Rent/Day' },
          { key: 'total_amount', label: 'Total' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// EXCAVATOR FORM - Select from registered excavators
// ============================================================
const ExcavatorForm = () => {
  const { equipment, excavatorOperations, addExcavatorOperation, updateExcavatorOperation } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const excavators = useMemo(() => 
    equipment.filter(e => e.equipment_type === 'EXCAVATOR' && (e.is_active === 1 || e.is_active === true)),
    [equipment]
  );

  const [formData, setFormData] = useState({
    equipment_name: '',
    operation_date: new Date().toISOString().split('T')[0],
    hours_operated: '',
    rate_per_hour: '3500',
    fuel_consumed: '',
    fuel_rate: '',
    misc_expense: '',
    misc_description: '',
    misc_expense_2: '',
    misc_description_2: '',
    remarks: '',
  });

  React.useEffect(() => {
    if (excavators.length > 0 && !formData.equipment_name) {
      setFormData(prev => ({ ...prev, equipment_name: excavators[0].equipment_name }));
    }
  }, [excavators, formData.equipment_name]);

  const rentAmount = (parseFloat(formData.hours_operated) || 0) * (parseFloat(formData.rate_per_hour) || 0);
  const fuelAmount = (parseFloat(formData.fuel_consumed) || 0) * (parseFloat(formData.fuel_rate) || 0);
  const miscAmount = parseFloat(formData.misc_expense) || 0;
  const miscAmount2 = parseFloat(formData.misc_expense_2) || 0;
  const totalMisc = miscAmount + miscAmount2;
  const total = rentAmount + fuelAmount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setFormData({
      equipment_name: op.equipment_name || excavators[0]?.name || '',
      operation_date: op.operation_date,
      hours_operated: op.hours_operated?.toString() || '',
      rate_per_hour: op.rate_per_hour?.toString() || '3500',
      fuel_consumed: op.fuel_consumed?.toString() || '',
      fuel_rate: op.fuel_rate?.toString() || '',
      misc_expense: op.misc_expense?.toString() || '',
      misc_description: op.misc_description || '',
      misc_expense_2: op.misc_expense_2?.toString() || '',
      misc_description_2: op.misc_description_2 || '',
      remarks: op.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      equipment_name: excavators[0]?.name || '',
      operation_date: new Date().toISOString().split('T')[0],
      hours_operated: '',
      rate_per_hour: formData.rate_per_hour,
      fuel_consumed: '',
      fuel_rate: formData.fuel_rate,
      misc_expense: '',
      misc_description: '',
      misc_expense_2: '',
      misc_description_2: '',
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipment_name) {
      setError('Please select an excavator. Add excavators in Master Data first.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        equipment_name: formData.equipment_name,
        operation_date: formData.operation_date,
        hours_operated: parseFloat(formData.hours_operated) || 0,
        rate_per_hour: parseFloat(formData.rate_per_hour) || 0,
        rent_amount: rentAmount,
        fuel_consumed: parseFloat(formData.fuel_consumed) || 0,
        fuel_rate: parseFloat(formData.fuel_rate) || 0,
        fuel_amount: fuelAmount,
        misc_expense: miscAmount,
        misc_description: formData.misc_description || null,
        misc_expense_2: miscAmount2,
        misc_description_2: formData.misc_description_2 || null,
        total_amount: total,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateExcavatorOperation(editingId, payload);
        setSuccess('Excavator entry updated!');
        showToast('Excavator entry updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addExcavatorOperation(payload);
        setSuccess('Excavator entry saved!');
        showToast('Excavator entry saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({
        equipment_name: formData.equipment_name,
        operation_date: new Date().toISOString().split('T')[0],
        hours_operated: '',
        rate_per_hour: formData.rate_per_hour,
        fuel_consumed: '',
        fuel_rate: formData.fuel_rate,
        misc_expense: '',
        misc_description: '',
        misc_expense_2: '',
        misc_description_2: '',
        remarks: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Excavator Entry</h2>
      <p className="text-sm text-gray-600 mb-4">Rent = Hours × Rate/Hr | Fuel = Fuel Consumed × Rate | Total = Rent + Fuel (Misc tracked separately)</p>

      {excavators.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          No excavators registered. Please add excavators in <strong>Master Data → Equipment</strong> first.
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="equipment_name">Select Excavator *</Label>
            <Select id="equipment_name" name="equipment_name" value={formData.equipment_name} onChange={handleChange} disabled={excavators.length === 0}>
              {excavators.length === 0 ? <option value="">No excavators available</option> : excavators.map(e => <option key={e.id} value={e.equipment_name}>{e.equipment_name}</option>)}
            </Select>
          </div>

          <div>
            <Label htmlFor="operation_date">Date *</Label>
            <Input type="date" id="operation_date" name="operation_date" value={formData.operation_date} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="hours_operated">Hours Operated</Label>
            <Input type="number" id="hours_operated" name="hours_operated" value={formData.hours_operated} onChange={handleChange} placeholder="0" step="0.5" />
          </div>

          <div>
            <Label htmlFor="rate_per_hour">Rate/Hour (PKR)</Label>
            <Input type="number" id="rate_per_hour" name="rate_per_hour" value={formData.rate_per_hour} onChange={handleChange} placeholder="3500" step="0.01" />
          </div>

          <div>
            <Label htmlFor="fuel_consumed">Fuel Consumed (L)</Label>
            <Input type="number" id="fuel_consumed" name="fuel_consumed" value={formData.fuel_consumed} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="fuel_rate">Fuel Rate (PKR/L)</Label>
            <Input type="number" id="fuel_rate" name="fuel_rate" value={formData.fuel_rate} onChange={handleChange} placeholder="282.15" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_expense">Misc Expense 1 (PKR)</Label>
            <Input type="number" id="misc_expense" name="misc_expense" value={formData.misc_expense} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_description">Misc 1 Description</Label>
            <Input type="text" id="misc_description" name="misc_description" value={formData.misc_description} onChange={handleChange} placeholder="What is misc for?" />
          </div>

          <div>
            <Label htmlFor="misc_expense_2">Misc Expense 2 (PKR)</Label>
            <Input type="number" id="misc_expense_2" name="misc_expense_2" value={formData.misc_expense_2} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_description_2">Misc 2 Description</Label>
            <Input type="text" id="misc_description_2" name="misc_description_2" value={formData.misc_description_2} onChange={handleChange} placeholder="What is misc 2 for?" />
          </div>
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional notes" className="max-w-md" />
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 p-4 rounded-lg grid grid-cols-4 gap-4">
          <div>
            <Label className="text-gray-600">Rent</Label>
            <div className="text-lg font-bold">{rentAmount.toLocaleString()}</div>
            <span className="text-xs text-gray-500">{formData.hours_operated || 0}hrs × Rs.{formData.rate_per_hour}/hr</span>
          </div>
          <div>
            <Label className="text-gray-600">Fuel</Label>
            <div className="text-lg font-bold">{fuelAmount.toLocaleString()}</div>
            <span className="text-xs text-gray-500">{formData.fuel_consumed || 0}L × Rs.{formData.fuel_rate || 0}/L</span>
          </div>
          <div>
            <Label className="text-amber-600">Misc (separate)</Label>
            <div className="text-lg font-bold text-amber-700">{totalMisc.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Not added to total</span>
          </div>
          <div>
            <Label className="text-emerald-600">Total</Label>
            <div className="text-2xl font-bold text-emerald-700">{total.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Rent + Fuel only</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting || excavators.length === 0}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={excavatorOperations}
        primaryColumns={[
          { key: 'operation_date', label: 'Date' },
          { key: 'equipment_name', label: 'Equipment' },
          { key: 'hours_operated', label: 'Hours' },
          { key: 'rent_amount', label: 'Rent' },
          { key: 'fuel_amount', label: 'Fuel' },
          { key: 'total_amount', label: 'Total', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'operation_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'equipment_name', label: 'Equipment' },
          { key: 'hours_operated', label: 'Hours' },
          { key: 'rate_per_hour', label: 'Rate/Hr' },
          { key: 'rent_amount', label: 'Rent' },
          { key: 'fuel_consumed', label: 'Fuel (L)' },
          { key: 'fuel_rate', label: 'Fuel Rate' },
          { key: 'fuel_amount', label: 'Fuel Amount' },
          { key: 'misc_expense', label: 'Misc 1' },
          { key: 'misc_description', label: 'Misc 1 Desc' },
          { key: 'misc_expense_2', label: 'Misc 2' },
          { key: 'misc_description_2', label: 'Misc 2 Desc' },
          { key: 'total_amount', label: 'Total' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// LOADERS FORM - Select from registered loaders (tracked separately)
// ============================================================
const LoadersForm = () => {
  const { equipment, loaderOperations, addLoaderOperation, updateLoaderOperation } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Filter loaders from equipment master data
  const loaders = useMemo(() => 
    equipment.filter(e => e.equipment_type === 'LOADER' && (e.is_active === 1 || e.is_active === true)),
    [equipment]
  );

  const [formData, setFormData] = useState({
    equipment_name: '',
    operation_date: new Date().toISOString().split('T')[0],
    rent_per_day: '',
    fuel_consumed: '',
    fuel_rate: '',
    defunct_hours: '',
    defunct_cost_per_hour: '739.25',
    misc_expense: '',
    misc_description: '',
    misc_expense_2: '',
    misc_description_2: '',
    remarks: '',
  });

  React.useEffect(() => {
    if (loaders.length > 0 && !formData.equipment_name) {
      setFormData(prev => ({ ...prev, equipment_name: loaders[0].equipment_name }));
    }
  }, [loaders, formData.equipment_name]);

  const fuelAmount = (parseFloat(formData.fuel_consumed) || 0) * (parseFloat(formData.fuel_rate) || 0);
  const defunctCost = (parseFloat(formData.defunct_hours) || 0) * (parseFloat(formData.defunct_cost_per_hour) || 0);
  const miscAmount = parseFloat(formData.misc_expense) || 0;
  const miscAmount2 = parseFloat(formData.misc_expense_2) || 0;
  const totalMisc = miscAmount + miscAmount2;
  const total = (parseFloat(formData.rent_per_day) || 0) + fuelAmount - defunctCost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setFormData({
      equipment_name: op.equipment_name || loaders[0]?.name || '',
      operation_date: op.operation_date,
      rent_per_day: op.rent_per_day?.toString() || '',
      fuel_consumed: op.fuel_consumed?.toString() || op.fuel_per_day?.toString() || '',
      fuel_rate: op.fuel_rate?.toString() || '',
      defunct_hours: op.defunct_hours?.toString() || '',
      defunct_cost_per_hour: op.defunct_cost_per_hour?.toString() || '739.25',
      misc_expense: op.misc_expense?.toString() || '',
      misc_description: op.misc_description || '',
      misc_expense_2: op.misc_expense_2?.toString() || '',
      misc_description_2: op.misc_description_2 || '',
      remarks: op.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      equipment_name: loaders[0]?.name || '',
      operation_date: new Date().toISOString().split('T')[0],
      rent_per_day: formData.rent_per_day,
      fuel_consumed: '',
      fuel_rate: formData.fuel_rate,
      defunct_hours: '',
      defunct_cost_per_hour: formData.defunct_cost_per_hour,
      misc_expense: '',
      misc_description: '',
      misc_expense_2: '',
      misc_description_2: '',
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipment_name) {
      setError('Please select a loader. Add loaders in Master Data first.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        equipment_name: formData.equipment_name,
        operation_date: formData.operation_date,
        rent_per_day: parseFloat(formData.rent_per_day) || 0,
        fuel_consumed: parseFloat(formData.fuel_consumed) || 0,
        fuel_per_day: parseFloat(formData.fuel_consumed) || 0,
        fuel_rate: parseFloat(formData.fuel_rate) || 0,
        fuel_amount: fuelAmount,
        defunct_hours: parseFloat(formData.defunct_hours) || 0,
        defunct_cost_per_hour: parseFloat(formData.defunct_cost_per_hour) || 739.25,
        defunct_cost: defunctCost,
        misc_expense: miscAmount,
        misc_description: formData.misc_description || null,
        misc_expense_2: miscAmount2,
        misc_description_2: formData.misc_description_2 || null,
        total_amount: total,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateLoaderOperation(editingId, payload);
        setSuccess('Loader entry updated!');
        showToast('Loader entry updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addLoaderOperation(payload);
        setSuccess('Loader entry saved!');
        showToast('Loader entry saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({
        equipment_name: formData.equipment_name,
        operation_date: new Date().toISOString().split('T')[0],
        rent_per_day: formData.rent_per_day,
        fuel_consumed: '',
        fuel_rate: formData.fuel_rate,
        defunct_hours: '',
        defunct_cost_per_hour: formData.defunct_cost_per_hour,
        misc_expense: '',
        misc_description: '',
        misc_expense_2: '',
        misc_description_2: '',
        remarks: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Loader Entry</h2>
      <p className="text-sm text-gray-600 mb-4">Total = Rent + Fuel - Defunct (Misc tracked separately)</p>

      {loaders.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          No loaders registered. Please add loaders in <strong>Master Data → Equipment</strong> first.
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="equipment_name">Select Loader *</Label>
            <Select id="equipment_name" name="equipment_name" value={formData.equipment_name} onChange={handleChange} disabled={loaders.length === 0}>
              {loaders.length === 0 ? <option value="">No loaders available</option> : loaders.map(l => <option key={l.id} value={l.equipment_name}>{l.equipment_name}</option>)}
            </Select>
          </div>

          <div>
            <Label htmlFor="operation_date">Date *</Label>
            <Input type="date" id="operation_date" name="operation_date" value={formData.operation_date} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="rent_per_day">Rent/Day (PKR)</Label>
            <Input type="number" id="rent_per_day" name="rent_per_day" value={formData.rent_per_day} onChange={handleChange} placeholder="17741.94" step="0.01" />
          </div>

          <div>
            <Label htmlFor="fuel_consumed">Fuel Consumed (L)</Label>
            <Input type="number" id="fuel_consumed" name="fuel_consumed" value={formData.fuel_consumed} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="fuel_rate">Fuel Rate (PKR/L)</Label>
            <Input type="number" id="fuel_rate" name="fuel_rate" value={formData.fuel_rate} onChange={handleChange} placeholder="282.15" step="0.01" />
          </div>

          <div>
            <Label htmlFor="defunct_hours">Defunct Hours</Label>
            <Input type="number" id="defunct_hours" name="defunct_hours" value={formData.defunct_hours} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="defunct_cost_per_hour">Defunct Cost/Hr</Label>
            <Input type="number" id="defunct_cost_per_hour" name="defunct_cost_per_hour" value={formData.defunct_cost_per_hour} onChange={handleChange} placeholder="739.25" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_expense">Misc Expense 1 (PKR)</Label>
            <Input type="number" id="misc_expense" name="misc_expense" value={formData.misc_expense} onChange={handleChange} placeholder="0" step="0.01" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="misc_description">Misc 1 Description</Label>
            <Input type="text" id="misc_description" name="misc_description" value={formData.misc_description} onChange={handleChange} placeholder="Oil change, repairs, etc." />
          </div>
          <div>
            <Label htmlFor="misc_expense_2">Misc Expense 2 (PKR)</Label>
            <Input type="number" id="misc_expense_2" name="misc_expense_2" value={formData.misc_expense_2} onChange={handleChange} placeholder="0" step="0.01" />
          </div>
          <div>
            <Label htmlFor="misc_description_2">Misc 2 Description</Label>
            <Input type="text" id="misc_description_2" name="misc_description_2" value={formData.misc_description_2} onChange={handleChange} placeholder="What is misc 2 for?" />
          </div>
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional notes" />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 p-4 rounded-lg grid grid-cols-5 gap-4">
          <div>
            <Label className="text-gray-600">Rent/Day</Label>
            <div className="text-lg font-bold">{(parseFloat(formData.rent_per_day) || 0).toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-gray-600">Fuel</Label>
            <div className="text-lg font-bold">{fuelAmount.toLocaleString()}</div>
            <span className="text-xs text-gray-500">{formData.fuel_consumed || 0}L × Rs.{formData.fuel_rate || 0}/L</span>
          </div>
          <div>
            <Label className="text-red-600">Defunct (-)</Label>
            <div className="text-lg font-bold text-red-700">-{defunctCost.toLocaleString()}</div>
            <span className="text-xs text-red-500">{formData.defunct_hours || 0}hrs × Rs.{formData.defunct_cost_per_hour}/hr</span>
          </div>
          <div>
            <Label className="text-amber-600">Misc (separate)</Label>
            <div className="text-lg font-bold text-amber-700">{totalMisc.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Not added to total</span>
          </div>
          <div>
            <Label className="text-emerald-600">Total</Label>
            <div className="text-2xl font-bold text-emerald-700">{total.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Rent + Fuel - Defunct</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting || loaders.length === 0}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={loaderOperations}
        primaryColumns={[
          { key: 'operation_date', label: 'Date' },
          { key: 'equipment_name', label: 'Loader' },
          { key: 'rent_per_day', label: 'Rent' },
          { key: 'fuel_amount', label: 'Fuel' },
          { key: 'defunct_cost', label: 'Defunct', headerClassName: 'text-red-500', cellClassName: 'text-red-700' },
          { key: 'total_amount', label: 'Total', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'operation_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'equipment_name', label: 'Loader' },
          { key: 'rent_per_day', label: 'Rent/Day' },
          { key: 'fuel_consumed', label: 'Fuel (L)' },
          { key: 'fuel_rate', label: 'Fuel Rate' },
          { key: 'fuel_amount', label: 'Fuel Amount' },
          { key: 'defunct_hours', label: 'Defunct Hrs' },
          { key: 'defunct_cost_per_hour', label: 'Defunct Cost/Hr' },
          { key: 'defunct_cost', label: 'Defunct Cost' },
          { key: 'misc_expense', label: 'Misc 1' },
          { key: 'misc_description', label: 'Misc 1 Desc' },
          { key: 'misc_expense_2', label: 'Misc 2' },
          { key: 'misc_description_2', label: 'Misc 2 Desc' },
          { key: 'total_amount', label: 'Total' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// DUMPERS FORM - Select from registered dumpers
// ============================================================
const DumpersForm = () => {
  const { equipment, dumperOperations, addDumperOperation, updateDumperOperation } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Filter dumpers from equipment master data
  const dumpers = useMemo(() => 
    equipment.filter(e => e.equipment_type === 'DUMPER' && (e.is_active === 1 || e.is_active === true)),
    [equipment]
  );

  const [formData, setFormData] = useState({
    dumper_name: '',
    trip_date: new Date().toISOString().split('T')[0],
    gravel_trips: '',
    clay_trips: '',
    cft_per_trip: '',
    rate_per_cft: '',
    misc_expense: '',
    misc_description: '',
    misc_expense_2: '',
    misc_description_2: '',
    remarks: '',
  });

  React.useEffect(() => {
    if (dumpers.length > 0 && !formData.dumper_name) {
      setFormData(prev => ({ ...prev, dumper_name: dumpers[0].equipment_name }));
    }
  }, [dumpers, formData.dumper_name]);

  const totalTrips = (parseInt(formData.gravel_trips) || 0) + (parseInt(formData.clay_trips) || 0);
  const totalCft = totalTrips * (parseFloat(formData.cft_per_trip) || 0);
  const tripAmount = totalCft * (parseFloat(formData.rate_per_cft) || 0);
  const miscAmount = parseFloat(formData.misc_expense) || 0;
  const miscAmount2 = parseFloat(formData.misc_expense_2) || 0;
  const totalMisc = miscAmount + miscAmount2;
  const total = tripAmount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setFormData({
      dumper_name: op.dumper_name || dumpers[0]?.name || '',
      trip_date: op.trip_date,
      gravel_trips: op.gravel_trips?.toString() || '',
      clay_trips: op.clay_trips?.toString() || '',
      cft_per_trip: op.cft_per_trip?.toString() || '',
      rate_per_cft: op.rate_per_cft?.toString() || '',
      misc_expense: op.misc_expense?.toString() || '',
      misc_description: op.misc_description || '',
      misc_expense_2: op.misc_expense_2?.toString() || '',
      misc_description_2: op.misc_description_2 || '',
      remarks: op.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      dumper_name: dumpers[0]?.name || '',
      trip_date: new Date().toISOString().split('T')[0],
      gravel_trips: '',
      clay_trips: '',
      cft_per_trip: formData.cft_per_trip,
      rate_per_cft: formData.rate_per_cft,
      misc_expense: '',
      misc_description: '',
      misc_expense_2: '',
      misc_description_2: '',
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dumper_name) {
      setError('Please select a dumper. Add dumpers in Master Data first.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        dumper_name: formData.dumper_name,
        trip_date: formData.trip_date,
        gravel_trips: parseInt(formData.gravel_trips) || 0,
        clay_trips: parseInt(formData.clay_trips) || 0,
        cft_per_trip: parseFloat(formData.cft_per_trip) || 0,
        rate_per_cft: parseFloat(formData.rate_per_cft) || 0,
        total_cft: totalCft,
        trip_amount: tripAmount,
        misc_expense: miscAmount,
        misc_description: formData.misc_description || null,
        misc_expense_2: miscAmount2,
        misc_description_2: formData.misc_description_2 || null,
        total_amount: total,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateDumperOperation(editingId, payload);
        setSuccess('Dumper entry updated!');
        showToast('Dumper entry updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addDumperOperation(payload);
        setSuccess('Dumper entry saved!');
        showToast('Dumper entry saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({
        dumper_name: formData.dumper_name,
        trip_date: new Date().toISOString().split('T')[0],
        gravel_trips: '',
        clay_trips: '',
        cft_per_trip: formData.cft_per_trip,
        rate_per_cft: formData.rate_per_cft,
        misc_expense: '',
        misc_description: '',
        misc_expense_2: '',
        misc_description_2: '',
        remarks: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Dumper Entry</h2>
      <p className="text-sm text-gray-600 mb-4">Trip Amount = Trips × CFT × Rate | Total = Trip Amount (Misc tracked separately)</p>

      {dumpers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          No dumpers registered. Please add dumpers in <strong>Master Data → Equipment</strong> first.
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="dumper_name">Select Dumper *</Label>
            <Select id="dumper_name" name="dumper_name" value={formData.dumper_name} onChange={handleChange} disabled={dumpers.length === 0}>
              {dumpers.length === 0 ? <option value="">No dumpers available</option> : dumpers.map(d => <option key={d.id} value={d.equipment_name}>{d.equipment_name}</option>)}
            </Select>
          </div>

          <div>
            <Label htmlFor="trip_date">Date *</Label>
            <Input type="date" id="trip_date" name="trip_date" value={formData.trip_date} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="gravel_trips">Gravel Trips</Label>
            <Input type="number" id="gravel_trips" name="gravel_trips" value={formData.gravel_trips} onChange={handleChange} placeholder="0" />
          </div>

          <div>
            <Label htmlFor="clay_trips">Clay Trips</Label>
            <Input type="number" id="clay_trips" name="clay_trips" value={formData.clay_trips} onChange={handleChange} placeholder="0" />
          </div>

          <div>
            <Label htmlFor="cft_per_trip">CFT per Trip</Label>
            <Input type="number" id="cft_per_trip" name="cft_per_trip" value={formData.cft_per_trip} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="rate_per_cft">Rate/CFT (PKR)</Label>
            <Input type="number" id="rate_per_cft" name="rate_per_cft" value={formData.rate_per_cft} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_expense">Misc Expense 1 (PKR)</Label>
            <Input type="number" id="misc_expense" name="misc_expense" value={formData.misc_expense} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_description">Misc 1 Description</Label>
            <Input type="text" id="misc_description" name="misc_description" value={formData.misc_description} onChange={handleChange} placeholder="Oil, repairs, etc." />
          </div>

          <div>
            <Label htmlFor="misc_expense_2">Misc Expense 2 (PKR)</Label>
            <Input type="number" id="misc_expense_2" name="misc_expense_2" value={formData.misc_expense_2} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="misc_description_2">Misc 2 Description</Label>
            <Input type="text" id="misc_description_2" name="misc_description_2" value={formData.misc_description_2} onChange={handleChange} placeholder="What is misc 2 for?" />
          </div>
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional notes" className="max-w-md" />
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 p-4 rounded-lg grid grid-cols-5 gap-4">
          <div>
            <Label className="text-gray-600">Total Trips</Label>
            <div className="text-lg font-bold">{totalTrips}</div>
            <span className="text-xs text-gray-500">{formData.gravel_trips || 0} gravel + {formData.clay_trips || 0} clay</span>
          </div>
          <div>
            <Label className="text-gray-600">Total CFT</Label>
            <div className="text-lg font-bold">{totalCft.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-gray-600">Trip Amount</Label>
            <div className="text-lg font-bold">{tripAmount.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-amber-600">Misc (separate)</Label>
            <div className="text-lg font-bold text-amber-700">{totalMisc.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Not added to total</span>
          </div>
          <div>
            <Label className="text-emerald-600">Total</Label>
            <div className="text-2xl font-bold text-emerald-700">{total.toLocaleString()}</div>
            <span className="text-xs text-gray-500">Trip Amount only</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting || dumpers.length === 0}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={dumperOperations}
        primaryColumns={[
          { key: 'trip_date', label: 'Date' },
          { key: 'dumper_name', label: 'Dumper' },
          { key: 'gravel_trips', label: 'Gravel' },
          { key: 'clay_trips', label: 'Clay' },
          { key: 'total_cft', label: 'CFT' },
          { key: 'trip_amount', label: 'Amount', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'trip_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'dumper_name', label: 'Dumper' },
          { key: 'gravel_trips', label: 'Gravel Trips' },
          { key: 'clay_trips', label: 'Clay Trips' },
          { key: 'cft_per_trip', label: 'CFT/Trip' },
          { key: 'rate_per_cft', label: 'Rate/CFT' },
          { key: 'total_trips', label: 'Total Trips' },
          { key: 'total_cft', label: 'Total CFT' },
          { key: 'trip_amount', label: 'Trip Amount' },
          { key: 'misc_expense', label: 'Misc 1' },
          { key: 'misc_description', label: 'Misc 1 Desc' },
          { key: 'misc_expense_2', label: 'Misc 2' },
          { key: 'misc_description_2', label: 'Misc 2 Desc' },
          { key: 'total_amount', label: 'Total' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// BLASTING MATERIAL FORM - Uses dropdown for item selection
// ============================================================
const BlastingMaterialForm = () => {
  const { blastingItems, blastingMaterials, addBlastingMaterial, updateBlastingMaterial } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Items from expense_categories DB (BLASTING_ITEM type) with fallback
  const defaultItems = blastingItems;
  
  const [formData, setFormData] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    description: defaultItems[0],
    quantity: '',
    rate: '',
    transport_charges: '',
    remarks: '',
  });

  const itemAmount = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.rate) || 0);
  const total = itemAmount + (parseFloat(formData.transport_charges) || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      purchase_date: item.purchase_date,
      description: item.description || defaultItems[0],
      quantity: item.quantity?.toString() || '',
      rate: item.rate?.toString() || '',
      transport_charges: item.transport_charges?.toString() || '',
      remarks: item.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      purchase_date: new Date().toISOString().split('T')[0],
      description: defaultItems[0],
      quantity: '',
      rate: '',
      transport_charges: '',
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) {
      setError('Please select an item');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        purchase_date: formData.purchase_date,
        description: formData.description,
        quantity: parseFloat(formData.quantity) || 0,
        rate: parseFloat(formData.rate) || 0,
        amount: itemAmount,
        transport_charges: parseFloat(formData.transport_charges) || 0,
        total_amount: total,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateBlastingMaterial(editingId, payload);
        setSuccess('Blasting material entry updated!');
        showToast('Blasting material entry updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addBlastingMaterial(payload);
        setSuccess('Blasting material entry saved!');
        showToast('Blasting material entry saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({
        purchase_date: new Date().toISOString().split('T')[0],
        description: formData.description,
        quantity: '',
        rate: '',
        transport_charges: '',
        remarks: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Blasting Material</h2>
      <p className="text-sm text-gray-600 mb-4">Total = (Qty × Rate) + Transport Charges</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="purchase_date">Date *</Label>
            <Input type="date" id="purchase_date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="description">Item *</Label>
            <Select id="description" name="description" value={formData.description} onChange={handleChange}>
              {defaultItems.map(item => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="rate">Rate (PKR)</Label>
            <Input type="number" id="rate" name="rate" value={formData.rate} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="transport_charges">Transport (PKR)</Label>
            <Input type="number" id="transport_charges" name="transport_charges" value={formData.transport_charges} onChange={handleChange} placeholder="0" step="0.01" />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="remarks">Remarks</Label>
            <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional notes" />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 p-4 rounded-lg grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-600">Item Amount</Label>
            <div className="text-lg font-bold">{itemAmount.toLocaleString()}</div>
            <span className="text-xs text-gray-500">{formData.quantity || 0} × Rs.{formData.rate || 0}</span>
          </div>
          <div>
            <Label className="text-gray-600">Transport</Label>
            <div className="text-lg font-bold">{(parseFloat(formData.transport_charges) || 0).toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-emerald-600">Total</Label>
            <div className="text-2xl font-bold text-emerald-700">{total.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={blastingMaterials}
        primaryColumns={[
          { key: 'purchase_date', label: 'Date' },
          { key: 'description', label: 'Item' },
          { key: 'quantity', label: 'Qty' },
          { key: 'rate', label: 'Rate' },
          { key: 'total_amount', label: 'Total', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'purchase_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'description', label: 'Item' },
          { key: 'quantity', label: 'Qty' },
          { key: 'rate', label: 'Rate' },
          { key: 'amount', label: 'Item Amount' },
          { key: 'transport_charges', label: 'Transport' },
          { key: 'total_amount', label: 'Total' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// LANGAR FORM
// ============================================================
const LangarForm = () => {
  const { langarExpenses, addLangarExpense, updateLangarExpense } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    remarks: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setFormData({
      expense_date: exp.expense_date,
      description: exp.description || '',
      amount: exp.amount?.toString() || '',
      remarks: exp.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ expense_date: new Date().toISOString().split('T')[0], description: '', amount: '', remarks: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        expense_date: formData.expense_date,
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateLangarExpense(editingId, payload);
        setSuccess('Langar expense updated!');
        showToast('Langar expense updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addLangarExpense(payload);
        setSuccess('Langar expense saved!');
        showToast('Langar expense saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({ expense_date: new Date().toISOString().split('T')[0], description: '', amount: '', remarks: '' });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Langar Expense</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="expense_date">Date *</Label>
            <Input type="date" id="expense_date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input type="text" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Food, groceries, etc." />
          </div>
          <div>
            <Label htmlFor="amount">Amount (PKR) *</Label>
            <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} placeholder="0" step="0.01" required />
          </div>
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={langarExpenses}
        primaryColumns={[
          { key: 'expense_date', label: 'Date' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'expense_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// PLANT EXPENSE FORM - Uses expense categories dropdown
// ============================================================
const PlantExpenseForm = () => {
  const { plantExpenseCategories, plantExpenses, addPlantExpense, updatePlantExpense } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Categories from expense_categories DB (PLANT_EXPENSE type) with fallback
  const categories = plantExpenseCategories;

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: categories[0] || '',
    description: '',
    amount: '',
    remarks: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setFormData({
      expense_date: exp.expense_date,
      category: exp.category || categories[0] || '',
      description: exp.description || '',
      amount: exp.amount?.toString() || '',
      remarks: exp.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ expense_date: new Date().toISOString().split('T')[0], category: categories[0] || '', description: '', amount: '', remarks: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updatePlantExpense(editingId, payload);
        setSuccess('Plant expense updated!');
        showToast('Plant expense updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addPlantExpense(payload);
        setSuccess('Plant expense saved!');
        showToast('Plant expense saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({ expense_date: new Date().toISOString().split('T')[0], category: formData.category, description: '', amount: '', remarks: '' });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Plant Expense</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="expense_date">Date *</Label>
            <Input type="date" id="expense_date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select id="category" name="category" value={formData.category} onChange={handleChange}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input type="text" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Details" />
          </div>
          <div>
            <Label htmlFor="amount">Amount (PKR) *</Label>
            <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} placeholder="0" step="0.01" required />
          </div>
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional" className="max-w-md" />
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={plantExpenses}
        primaryColumns={[
          { key: 'expense_date', label: 'Date' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'expense_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// MISC EXPENSE FORM - Uses expense categories dropdown
// ============================================================
const MiscExpenseForm = () => {
  const { miscExpenseCategories, miscExpenses, addMiscExpense, updateMiscExpense } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Categories from expense_categories DB (MISC_EXPENSE type) with fallback
  const categories = miscExpenseCategories;

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: categories[0] || '',
    description: '',
    amount: '',
    remarks: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setFormData({
      expense_date: exp.expense_date,
      category: exp.category || categories[0] || '',
      description: exp.description || '',
      amount: exp.amount?.toString() || '',
      remarks: exp.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ expense_date: new Date().toISOString().split('T')[0], category: categories[0] || '', description: '', amount: '', remarks: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateMiscExpense(editingId, payload);
        setSuccess('Misc expense updated!');
        showToast('Misc expense updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addMiscExpense(payload);
        setSuccess('Misc expense saved!');
        showToast('Misc expense saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      setFormData({ expense_date: new Date().toISOString().split('T')[0], category: formData.category, description: '', amount: '', remarks: '' });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Misc Expense</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="expense_date">Date *</Label>
            <Input type="date" id="expense_date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select id="category" name="category" value={formData.category} onChange={handleChange}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input type="text" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Details" />
          </div>
          <div>
            <Label htmlFor="amount">Amount (PKR) *</Label>
            <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} placeholder="0" step="0.01" required />
          </div>
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional" className="max-w-md" />
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={miscExpenses}
        primaryColumns={[
          { key: 'expense_date', label: 'Date' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'expense_date', label: 'Date' },
          { key: 'day_name', label: 'Day' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
      />
    </div>
  );
};

// ============================================================
// SALARY FORM
// ============================================================
const SalaryForm = () => {
  const { humanResources, salaries, addSalary, updateSalary } = useData();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const activeEmployees = humanResources.filter(h => h.status === 'active');

  const [formData, setFormData] = useState({
    employee_id: '',
    salary_month: new Date().toISOString().slice(0, 7),
    base_salary: '',
    overtime: '',
    deductions: '',
    remarks: '',
  });

  React.useEffect(() => {
    if (activeEmployees.length > 0 && !formData.employee_id) {
      const emp = activeEmployees[0];
      setFormData(prev => ({ 
        ...prev, 
        employee_id: emp.id.toString(),
        base_salary: emp.base_salary?.toString() || ''
      }));
    }
  }, [activeEmployees, formData.employee_id]);

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = activeEmployees.find(h => h.id.toString() === empId);
    setFormData({
      ...formData,
      employee_id: empId,
      base_salary: emp?.base_salary?.toString() || ''
    });
    setError('');
  };

  const netSalary = (parseFloat(formData.base_salary) || 0) + (parseFloat(formData.overtime) || 0) - (parseFloat(formData.deductions) || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleEdit = (sal) => {
    setEditingId(sal.id);
    setFormData({
      employee_id: sal.employee_id?.toString() || '',
      salary_month: sal.salary_month,
      base_salary: sal.base_salary?.toString() || '',
      overtime: sal.overtime?.toString() || '',
      deductions: sal.deductions?.toString() || '',
      remarks: sal.remarks || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    const emp = activeEmployees[0];
    setFormData({
      employee_id: emp?.id?.toString() || '',
      salary_month: new Date().toISOString().slice(0, 7),
      base_salary: emp?.base_salary?.toString() || '',
      overtime: '',
      deductions: '',
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id) {
      setError('Please select an employee');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        employee_id: parseInt(formData.employee_id),
        salary_month: formData.salary_month,
        base_salary: parseFloat(formData.base_salary) || 0,
        overtime: parseFloat(formData.overtime) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        net_salary: netSalary,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await updateSalary(editingId, payload);
        setSuccess('Salary updated!');
        showToast('Salary updated!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
        setEditingId(null);
      } else {
        await addSalary(payload);
        setSuccess('Salary saved!');
        showToast('Salary saved!', 'success');
        setJustSaved(true); setTimeout(() => setJustSaved(false), 1500);
      }

      const emp = activeEmployees[0];
      setFormData({
        employee_id: emp?.id?.toString() || '',
        salary_month: new Date().toISOString().slice(0, 7),
        base_salary: emp?.base_salary?.toString() || '',
        overtime: '',
        deductions: '',
        remarks: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmployeeName = (id) => {
    const emp = humanResources.find(h => h.id === id);
    return emp?.employee_name || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Salary Entry</h2>

      {activeEmployees.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          No active employees. Please add employees in <strong>Master Data → Human Resources</strong> first.
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="employee_id">Employee *</Label>
            <Select id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleEmployeeChange} disabled={activeEmployees.length === 0}>
              {activeEmployees.length === 0 ? <option value="">No employees</option> : activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.employee_name} ({emp.designation})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="salary_month">Month *</Label>
            <Input type="month" id="salary_month" name="salary_month" value={formData.salary_month} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="base_salary">Base Salary (PKR)</Label>
            <Input type="number" id="base_salary" name="base_salary" value={formData.base_salary} onChange={handleChange} placeholder="0" step="0.01" />
          </div>
          <div>
            <Label htmlFor="overtime">Overtime (PKR)</Label>
            <Input type="number" id="overtime" name="overtime" value={formData.overtime} onChange={handleChange} placeholder="0" step="0.01" />
          </div>
          <div>
            <Label htmlFor="deductions">Deductions (PKR)</Label>
            <Input type="number" id="deductions" name="deductions" value={formData.deductions} onChange={handleChange} placeholder="0" step="0.01" />
          </div>
          <div>
            <Label className="text-emerald-600">Net Salary</Label>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{netSalary.toLocaleString()}</div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input type="text" id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
          <Button type="submit" variant={justSaved ? 'danger' : 'success'} disabled={isSubmitting || activeEmployees.length === 0}
            className={justSaved ? 'shadow-lg shadow-red-500/50 scale-105' : ''}>
            {isSubmitting ? 'Saving...' : justSaved ? '✓ Saved!' : editingId ? 'Update' : 'Save Entry'}
          </Button>
        </div>
      </form>

      {/* Recent Entries */}
      <RecentEntriesSection
        data={salaries}
        primaryColumns={[
          { key: 'salary_month', label: 'Month' },
          { key: 'employee_id', label: 'Employee' },
          { key: 'base_salary', label: 'Base' },
          { key: 'overtime', label: 'Overtime' },
          { key: 'deductions', label: 'Deductions' },
          { key: 'net_salary', label: 'Net', cellClassName: 'font-medium text-emerald-700' },
        ]}
        allColumns={[
          { key: 'salary_month', label: 'Month' },
          { key: 'employee_id', label: 'Employee' },
          { key: 'base_salary', label: 'Base Salary' },
          { key: 'overtime', label: 'Overtime' },
          { key: 'deductions', label: 'Deductions' },
          { key: 'net_salary', label: 'Net Salary' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        editingId={editingId}
        onEdit={handleEdit}
        formatters={{
          employee_id: (val) => getEmployeeName(val),
        }}
      />
    </div>
  );
};

export default DailyEntries;

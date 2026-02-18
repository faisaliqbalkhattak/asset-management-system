import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];

const MonthlySummary = () => {
  const {
    equipment,
    generatorOperations,
    excavatorOperations,
    loaderOperations,
    blastingMaterials,
    langarExpenses,
    plantExpenses,
    miscExpenses,
    dumperOperations,
    dumperMiscExpenses,
    salaries,
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const DUMPER_KEY_MAP = useMemo(() => {
    const dumperMap = {};
    equipment
      .filter(e => e.equipment_type === 'DUMPER') // Include all dumpers, even inactive
      .forEach(d => {
        // Create consistent key based on code
        // Remove 'DMP-' prefix and dashes to match initMonth keys (e.g., 'DMP-TKR219' -> 'dumper_tkr219')
        const cleanCode = d.equipment_code.toLowerCase().replace('dmp-', '').replace(/-/g, '');
        const key = `dumper_${cleanCode}`;
        dumperMap[d.equipment_name] = key;
        if (d.id) dumperMap[d.id] = key; // Map ID to key for robust lookup
      });
    return dumperMap;
  }, [equipment]);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set();
    const allData = [
      ...generatorOperations,
      ...salaries,
    ];
    
    allData.forEach((item) => {
      const date = item.operation_date || item.trip_date || item.expense_date || 
                   item.purchase_date || item.production_date || item.salary_month;
      if (date) {
        years.add(new Date(date).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [generatorOperations, salaries]);

  // Calculate monthly data for all categories
  const monthlySummaryData = useMemo(() => {
    const data = {};
    
    const getMonthKey = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return `${MONTH_NAMES[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
    };

    const getFullKey = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return { month: d.getMonth(), year: d.getFullYear() };
    };

    const initMonth = (key) => {
      if (!data[key]) {
        data[key] = {
          generator: 0, 
          excavator: 0, excavator_misc: 0,
          loaders: 0,
          dumper_tkr219: 0, dumper_tkr219_misc: 0,
          dumper_tac388: 0, dumper_tac388_misc: 0,
          dumper_tab959: 0, dumper_tab959_misc: 0,
          dumper_taj656: 0, dumper_taj656_misc: 0,
          dumper_tae601: 0, dumper_tae601_misc: 0,
          blasting: 0, langar: 0, plant_exp: 0, human_res: 0, misc_exp: 0,
          total: 0, grand_total: 0
        };
      }
    };

    // Filter function for selected month/year
    const shouldInclude = (dateStr) => {
      if (!selectedMonth && !selectedYear) return true;
      const parsed = getFullKey(dateStr);
      if (!parsed) return false;
      if (selectedMonth && FULL_MONTH_NAMES[parsed.month] !== selectedMonth) return false;
      if (selectedYear && parsed.year.toString() !== selectedYear) return false;
      return true;
    };

    // Generator Operations
    generatorOperations.forEach(op => {
      if (!shouldInclude(op.operation_date)) return;
      const monthKey = getMonthKey(op.operation_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].generator += op.total_amount || 0;
    });

    // Excavator Operations (with misc tracked separately)
    excavatorOperations.forEach(op => {
      if (!shouldInclude(op.operation_date)) return;
      const monthKey = getMonthKey(op.operation_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].excavator += op.total_amount || 0;
      data[monthKey].excavator_misc += op.misc_amount || 0;
    });

    // Loader Operations
    loaderOperations.forEach(op => {
      if (!shouldInclude(op.operation_date)) return;
      const monthKey = getMonthKey(op.operation_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].loaders += op.total_amount || 0;
    });

    // Dumper Operations (trip amount only)
    dumperOperations.forEach(op => {
      if (!shouldInclude(op.trip_date)) return;
      const monthKey = getMonthKey(op.trip_date);
      if (!monthKey) return;
      initMonth(monthKey);
      // Try ID first, then name
      const key = DUMPER_KEY_MAP[op.equipment_id] || DUMPER_KEY_MAP[op.dumper_name];
      if (key) {
        data[monthKey][key] += op.trip_amount || 0;
      }
    });

    // Dumper Misc Expenses (tracked separately)
    dumperMiscExpenses.forEach(exp => {
      if (!shouldInclude(exp.expense_date)) return;
      const monthKey = getMonthKey(exp.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      // Try ID first, then name (note: misc repo uses dumper_id)
      const key = DUMPER_KEY_MAP[exp.dumper_id] || DUMPER_KEY_MAP[exp.dumper_name];
      if (key) {
        data[monthKey][key + '_misc'] += exp.amount || 0;
      }
    });

    // Blasting Materials
    blastingMaterials.forEach(m => {
      if (!shouldInclude(m.purchase_date)) return;
      const monthKey = getMonthKey(m.purchase_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].blasting += m.total_amount || 0;
    });

    // Langar Expenses
    langarExpenses.forEach(e => {
      if (!shouldInclude(e.expense_date)) return;
      const monthKey = getMonthKey(e.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].langar += e.amount || 0;
    });

    // Plant Expenses
    plantExpenses.forEach(e => {
      if (!shouldInclude(e.expense_date)) return;
      const monthKey = getMonthKey(e.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].plant_exp += e.amount || 0;
    });

    // Misc Expenses
    miscExpenses.forEach(e => {
      if (!shouldInclude(e.expense_date)) return;
      const monthKey = getMonthKey(e.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].misc_exp += e.amount || 0;
    });

    // Salaries (salary_month is YYYY-MM format, convert to date for filtering)
    salaries.forEach(s => {
      const salaryDate = s.salary_month ? s.salary_month + '-01' : null;
      if (!shouldInclude(salaryDate)) return;
      const monthKey = getMonthKey(salaryDate);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].human_res += s.net_salary || 0;
    });

    // Calculate totals for each month
    Object.keys(data).forEach(key => {
      const d = data[key];
      // Total excludes misc (misc is for reference only, not included in cost calculation)
      d.total = d.generator + d.excavator + d.loaders +
                d.dumper_tkr219 + d.dumper_tac388 + d.dumper_tab959 + 
                d.dumper_taj656 + d.dumper_tae601 +
                d.blasting + d.langar + d.plant_exp + d.human_res + d.misc_exp;
      
      // Grand total includes misc for full visibility
      d.grand_total = d.total + d.excavator_misc +
                      d.dumper_tkr219_misc + d.dumper_tac388_misc + d.dumper_tab959_misc +
                      d.dumper_taj656_misc + d.dumper_tae601_misc;
    });

    return data;
  }, [generatorOperations, excavatorOperations, loaderOperations, dumperOperations,
      dumperMiscExpenses, blastingMaterials, langarExpenses, plantExpenses, 
      miscExpenses, salaries, selectedMonth, selectedYear]);

  // Sort months chronologically
  const sortedMonths = useMemo(() => {
    return Object.keys(monthlySummaryData).sort((a, b) => {
      const [aMonth, aYear] = a.split('-');
      const [bMonth, bYear] = b.split('-');
      const aDate = new Date(`20${aYear}`, MONTH_NAMES.indexOf(aMonth));
      const bDate = new Date(`20${bYear}`, MONTH_NAMES.indexOf(bMonth));
      return bDate - aDate;
    });
  }, [monthlySummaryData]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const totals = {
      generator: 0, excavator: 0, excavator_misc: 0, loaders: 0,
      dumper_tkr219: 0, dumper_tkr219_misc: 0,
      dumper_tac388: 0, dumper_tac388_misc: 0,
      dumper_tab959: 0, dumper_tab959_misc: 0,
      dumper_taj656: 0, dumper_taj656_misc: 0,
      dumper_tae601: 0, dumper_tae601_misc: 0,
      blasting: 0, langar: 0, plant_exp: 0, human_res: 0, misc_exp: 0,
      total: 0, grand_total: 0
    };
    
    Object.values(monthlySummaryData).forEach(d => {
      Object.keys(totals).forEach(key => {
        totals[key] += d[key] || 0;
      });
    });
    
    return totals;
  }, [monthlySummaryData]);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '-';
    return value.toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Monthly Summary</h1>
        
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="monthFilter">Month</Label>
            <Select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {FULL_MONTH_NAMES.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="yearFilter">Year</Label>
            <Select
              id="yearFilter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
      </p>

      {sortedMonths.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No data available for the selected period.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-emerald-700 uppercase sticky left-0 bg-emerald-50 z-10">
                    Month
                  </th>
                  {/* Generator */}
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Generator
                  </th>
                  {/* Excavator with Misc */}
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Excavator
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">
                    Exc.Misc
                  </th>
                  {/* Loaders */}
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Loaders
                  </th>
                  {/* Dumpers with Misc */}
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    TKR-219
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">
                    Misc
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    TAC-388
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">
                    Misc
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    TAB-959
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">
                    Misc
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    TAJ-656
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">
                    Misc
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    TAE-601
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">
                    Misc
                  </th>
                  {/* Other expenses */}
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Blasting
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Langar
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Plant Exp
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    HR Salaries
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                    Misc Exp
                  </th>
                  {/* Totals */}
                  <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-emerald-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMonths.map((monthKey) => {
                  const d = monthlySummaryData[monthKey];
                  return (
                    <tr key={monthKey} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {monthKey}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.generator)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.excavator)}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d.excavator_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.loaders)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.dumper_tkr219)}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d.dumper_tkr219_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.dumper_tac388)}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d.dumper_tac388_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.dumper_tab959)}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d.dumper_tab959_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.dumper_taj656)}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d.dumper_taj656_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.dumper_tae601)}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d.dumper_tae601_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.blasting)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.langar)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.plant_exp)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.human_res)}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d.misc_exp)}</td>
                      <td className="px-3 py-2 text-sm text-right font-bold text-white bg-emerald-600">
                        {formatCurrency(d.total)}
                      </td>
                    </tr>
                  );
                })}
                {/* Grand Total Row */}
                <tr className="bg-emerald-100 font-bold">
                  <td className="px-3 py-3 text-sm font-bold text-emerald-800 sticky left-0 bg-emerald-100 z-10">
                    GRAND TOTAL
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.generator)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.excavator)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals.excavator_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.loaders)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.dumper_tkr219)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals.dumper_tkr219_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.dumper_tac388)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals.dumper_tac388_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.dumper_tab959)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals.dumper_tab959_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.dumper_taj656)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals.dumper_taj656_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.dumper_tae601)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals.dumper_tae601_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.blasting)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.langar)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.plant_exp)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.human_res)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals.misc_exp)}</td>
                  <td className="px-3 py-3 text-sm text-right text-white bg-emerald-700">
                    {formatCurrency(grandTotals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Equipment (Gen + Exc + Loaders)</span>
              <span className="font-medium">
                {formatCurrency(grandTotals.generator + grandTotals.excavator + grandTotals.loaders)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dumpers (All 5)</span>
              <span className="font-medium">
                {formatCurrency(
                  grandTotals.dumper_tkr219 + grandTotals.dumper_tac388 + 
                  grandTotals.dumper_tab959 + grandTotals.dumper_taj656 + grandTotals.dumper_tae601
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Materials (Blasting)</span>
              <span className="font-medium">{formatCurrency(grandTotals.blasting)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Operating (Langar + Plant)</span>
              <span className="font-medium">
                {formatCurrency(grandTotals.langar + grandTotals.plant_exp)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">HR Salaries</span>
              <span className="font-medium">{formatCurrency(grandTotals.human_res)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Misc Expenses</span>
              <span className="font-medium">{formatCurrency(grandTotals.misc_exp)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold text-emerald-700">
              <span>Total Expenses</span>
              <span>{formatCurrency(grandTotals.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Misc Expenses (Reference)</h3>
          <p className="text-sm text-gray-500 mb-4">These are tracked separately and not included in Total</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-amber-600">Excavator Misc</span>
              <span className="font-medium text-amber-700">{formatCurrency(grandTotals.excavator_misc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">TKR-219 Misc</span>
              <span className="font-medium text-amber-700">{formatCurrency(grandTotals.dumper_tkr219_misc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">TAC-388 Misc</span>
              <span className="font-medium text-amber-700">{formatCurrency(grandTotals.dumper_tac388_misc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">TAB-959 Misc</span>
              <span className="font-medium text-amber-700">{formatCurrency(grandTotals.dumper_tab959_misc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">TAJ-656 Misc</span>
              <span className="font-medium text-amber-700">{formatCurrency(grandTotals.dumper_taj656_misc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">TAE-601 Misc</span>
              <span className="font-medium text-amber-700">{formatCurrency(grandTotals.dumper_tae601_misc)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold text-amber-700">
              <span>Total Misc</span>
              <span>
                {formatCurrency(
                  grandTotals.excavator_misc + grandTotals.dumper_tkr219_misc + 
                  grandTotals.dumper_tac388_misc + grandTotals.dumper_tab959_misc + 
                  grandTotals.dumper_taj656_misc + grandTotals.dumper_tae601_misc
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-200 p-6">
          <h3 className="text-lg font-medium text-emerald-800 mb-4">Summary</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-emerald-600">Total Months</div>
              <div className="text-2xl font-bold text-emerald-800">{sortedMonths.length}</div>
            </div>
            <div>
              <div className="text-sm text-emerald-600">Total Expenses</div>
              <div className="text-2xl font-bold text-emerald-800">{formatCurrency(grandTotals.total)}</div>
            </div>
            <div>
              <div className="text-sm text-emerald-600">Average Monthly</div>
              <div className="text-2xl font-bold text-emerald-800">
                {sortedMonths.length > 0 
                  ? formatCurrency(Math.round(grandTotals.total / sortedMonths.length))
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;

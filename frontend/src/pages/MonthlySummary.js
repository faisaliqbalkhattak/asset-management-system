import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];

// Non-equipment expense categories (from separate DB tables)
// misc_exp intentionally excluded from the main expense table
const NON_EQUIPMENT_CATEGORIES = [
  { key: 'blasting', label: 'Blasting' },
  { key: 'langar', label: 'Langar' },
  { key: 'plant_exp', label: 'Plant Exp' },
  { key: 'human_res', label: 'HR Salaries' },
];

const MonthlySummary = () => {
  const {
    equipment,
    expenseCategories,
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

  // Build dynamic equipment categories from master table (non-DUMPER types)
  const equipmentCategories = useMemo(() => {
    const types = [...new Set((equipment || []).map(e => e.equipment_type))];
    const mapping = {
      'GENERATOR': { key: 'generator', label: 'Generator', hasMisc: false },
      'EXCAVATOR': { key: 'excavator', label: 'Excavator', hasMisc: true },
      'LOADER': { key: 'loaders', label: 'Loaders', hasMisc: true },
    };
    return types.filter(t => t !== 'DUMPER' && mapping[t]).map(t => mapping[t]);
  }, [equipment]);

  // Build dynamic dumper list from equipment master table
  const dumpers = useMemo(() => {
    return equipment
      .filter(e => e.equipment_type === 'DUMPER')
      .map(d => {
        const cleanCode = d.equipment_code.toLowerCase().replace('dmp-', '').replace(/-/g, '');
        return {
          key: `dumper_${cleanCode}`,
          miscKey: `dumper_${cleanCode}_misc`,
          label: d.equipment_name,
          id: d.id,
          code: d.equipment_code,
        };
      });
  }, [equipment]);

  // Build name/id to key lookup map for dumpers
  const dumperKeyMap = useMemo(() => {
    const map = {};
    dumpers.forEach(d => {
      map[d.label] = d.key;
      if (d.id) map[d.id] = d.key;
    });
    return map;
  }, [dumpers]);

  // Equipment categories that have misc tracking - dynamically from equipment master table
  const miscCategories = useMemo(() => {
    const cats = [];
    // Add misc for equipment types that have misc columns (detected from equipment master)
    equipmentCategories.filter(ec => ec.hasMisc).forEach(ec => {
      cats.push({ key: `${ec.key}_misc`, label: `${ec.label} Misc` });
    });
    // Add misc for each registered dumper
    dumpers.forEach(d => {
      cats.push({ key: d.miscKey, label: `${d.label} Misc` });
    });
    return cats;
  }, [equipmentCategories, dumpers]);

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

    // Dynamic initMonth based on registered equipment and dumpers from master table
    const initMonth = (key) => {
      if (!data[key]) {
        const monthData = {
          total: 0, total_misc: 0, balance: 0, grand_total: 0
        };
        // Initialize equipment categories dynamically from master table
        equipmentCategories.forEach(ec => {
          monthData[ec.key] = 0;
          if (ec.hasMisc) monthData[`${ec.key}_misc`] = 0;
        });
        // Initialize dumpers dynamically from master table
        dumpers.forEach(d => {
          monthData[d.key] = 0;
          monthData[d.miscKey] = 0;
        });
        // Initialize non-equipment categories
        NON_EQUIPMENT_CATEGORIES.forEach(c => {
          monthData[c.key] = 0;
        });
        data[key] = monthData;
      }
    };

    const shouldInclude = (dateStr) => {
      if (!selectedMonth && !selectedYear) return true;
      const parsed = getFullKey(dateStr);
      if (!parsed) return false;
      if (selectedMonth && FULL_MONTH_NAMES[parsed.month] !== selectedMonth) return false;
      if (selectedYear && parsed.year.toString() !== selectedYear) return false;
      return true;
    };

    generatorOperations.forEach(op => {
      if (!shouldInclude(op.operation_date)) return;
      const monthKey = getMonthKey(op.operation_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].generator += op.total_amount || 0;
    });

    excavatorOperations.forEach(op => {
      if (!shouldInclude(op.operation_date)) return;
      const monthKey = getMonthKey(op.operation_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].excavator += op.total_amount || 0;
      data[monthKey].excavator_misc += (op.misc_expense || 0) + (op.misc_expense_2 || 0);
    });

    loaderOperations.forEach(op => {
      if (!shouldInclude(op.operation_date)) return;
      const monthKey = getMonthKey(op.operation_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].loaders += op.total_amount || 0;
      data[monthKey].loaders_misc += (op.misc_expense || 0) + (op.misc_expense_2 || 0);
    });

    dumperOperations.forEach(op => {
      if (!shouldInclude(op.trip_date)) return;
      const monthKey = getMonthKey(op.trip_date);
      if (!monthKey) return;
      initMonth(monthKey);
      const key = dumperKeyMap[op.equipment_id] || dumperKeyMap[op.dumper_name];
      if (key) {
        data[monthKey][key] = (data[monthKey][key] || 0) + (op.trip_amount || 0);
        data[monthKey][key + '_misc'] = (data[monthKey][key + '_misc'] || 0) + (op.misc_expense || 0) + (op.misc_expense_2 || 0);
      }
    });

    dumperMiscExpenses.forEach(exp => {
      if (!shouldInclude(exp.expense_date)) return;
      const monthKey = getMonthKey(exp.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      const key = dumperKeyMap[exp.dumper_id] || dumperKeyMap[exp.dumper_name];
      if (key) {
        data[monthKey][key + '_misc'] = (data[monthKey][key + '_misc'] || 0) + (exp.amount || 0);
      }
    });

    blastingMaterials.forEach(m => {
      if (!shouldInclude(m.purchase_date)) return;
      const monthKey = getMonthKey(m.purchase_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].blasting += m.total_amount || 0;
    });

    langarExpenses.forEach(e => {
      if (!shouldInclude(e.expense_date)) return;
      const monthKey = getMonthKey(e.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].langar += e.amount || 0;
    });

    plantExpenses.forEach(e => {
      if (!shouldInclude(e.expense_date)) return;
      const monthKey = getMonthKey(e.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].plant_exp += e.amount || 0;
    });

    miscExpenses.forEach(e => {
      if (!shouldInclude(e.expense_date)) return;
      const monthKey = getMonthKey(e.expense_date);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].misc_exp += e.amount || 0;
    });

    salaries.forEach(s => {
      const salaryDate = s.salary_month ? s.salary_month + '-01' : null;
      if (!shouldInclude(salaryDate)) return;
      const monthKey = getMonthKey(salaryDate);
      if (!monthKey) return;
      initMonth(monthKey);
      data[monthKey].human_res += s.net_salary || 0;
    });

    Object.keys(data).forEach(key => {
      const d = data[key];
      // Equipment totals (dynamic from master table)
      let equipmentTotal = 0;
      equipmentCategories.forEach(ec => {
        equipmentTotal += d[ec.key] || 0;
      });
      // Dumper totals
      let dumperTotal = 0;
      let dumperMiscTotal = 0;
      dumpers.forEach(dm => {
        dumperTotal += d[dm.key] || 0;
        dumperMiscTotal += d[dm.miscKey] || 0;
      });
      // Non-equipment category totals
      let categoryTotal = 0;
      NON_EQUIPMENT_CATEGORIES.forEach(c => {
        categoryTotal += d[c.key] || 0;
      });
      // Total excludes misc expenses (misc is tracked separately as reference)
      d.total = equipmentTotal + dumperTotal + categoryTotal;
      // Misc total from all equipment types that have misc columns
      let equipMiscTotal = 0;
      equipmentCategories.filter(ec => ec.hasMisc).forEach(ec => {
        equipMiscTotal += d[`${ec.key}_misc`] || 0;
      });
      d.total_misc = equipMiscTotal + dumperMiscTotal;
      d.balance = d.total + d.total_misc;
      d.grand_total = d.balance;
    });

    return data;
  }, [generatorOperations, excavatorOperations, loaderOperations, dumperOperations,
      dumperMiscExpenses, blastingMaterials, langarExpenses, plantExpenses, 
      miscExpenses, salaries, selectedMonth, selectedYear, dumpers, dumperKeyMap,
      equipmentCategories]);

  const sortedMonths = useMemo(() => {
    return Object.keys(monthlySummaryData).sort((a, b) => {
      const [aMonth, aYear] = a.split('-');
      const [bMonth, bYear] = b.split('-');
      const aDate = new Date(`20${aYear}`, MONTH_NAMES.indexOf(aMonth));
      const bDate = new Date(`20${bYear}`, MONTH_NAMES.indexOf(bMonth));
      return bDate - aDate;
    });
  }, [monthlySummaryData]);

  const grandTotals = useMemo(() => {
    const totals = {
      total: 0, total_misc: 0, balance: 0, grand_total: 0
    };
    // Initialize from dynamic equipment categories
    equipmentCategories.forEach(ec => {
      totals[ec.key] = 0;
      if (ec.hasMisc) totals[`${ec.key}_misc`] = 0;
    });
    // Initialize dumpers
    dumpers.forEach(d => {
      totals[d.key] = 0;
      totals[d.miscKey] = 0;
    });
    // Initialize non-equipment categories
    NON_EQUIPMENT_CATEGORIES.forEach(c => {
      totals[c.key] = 0;
    });
    Object.values(monthlySummaryData).forEach(d => {
      Object.keys(totals).forEach(key => {
        totals[key] += d[key] || 0;
      });
    });
    return totals;
  }, [monthlySummaryData, dumpers, equipmentCategories]);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '-';
    return value.toLocaleString();
  };

  const expenseBreakdown = useMemo(() => {
    const groups = [];
    // Equipment categories from master table
    const equipTotal = equipmentCategories.reduce((sum, ec) => sum + (grandTotals[ec.key] || 0), 0);
    if (equipmentCategories.length > 0) {
      groups.push({ label: `Equipment (${equipmentCategories.map(ec => ec.label).join(' + ')})`, value: equipTotal });
    }
    // Dumpers from master table
    if (dumpers.length > 0) {
      groups.push({ label: `Dumpers (All ${dumpers.length})`, value: dumpers.reduce((sum, d) => sum + (grandTotals[d.key] || 0), 0) });
    }
    // Non-equipment categories (from DB tables)
    NON_EQUIPMENT_CATEGORIES.forEach(cat => {
      groups.push({ label: cat.label, value: grandTotals[cat.key] || 0 });
    });
    return groups;
  }, [grandTotals, dumpers, equipmentCategories]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Monthly Summary</h1>
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="monthFilter">Month</Label>
            <Select id="monthFilter" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">All Months</option>
              {FULL_MONTH_NAMES.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="yearFilter">Year</Label>
            <Select id="yearFilter" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Columns are dynamically generated from registered equipment and expense categories.
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
                  <th className="px-3 py-3 text-left text-xs font-medium text-emerald-700 uppercase sticky left-0 bg-emerald-50 z-10">Month</th>
                  {/* Dynamic equipment columns from master table */}
                  {equipmentCategories.map(ec => (
                    <React.Fragment key={ec.key}>
                      <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{ec.label}</th>
                      {ec.hasMisc && (
                        <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">{ec.label.slice(0,3)}.M</th>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Dynamic dumper columns from master table */}
                  {dumpers.map(d => (
                    <React.Fragment key={d.key}>
                      <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{d.label}</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">Misc</th>
                    </React.Fragment>
                  ))}
                  {/* Non-equipment expense categories */}
                  {NON_EQUIPMENT_CATEGORIES.map(cat => (
                    <th key={cat.key} className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{cat.label}</th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-emerald-600">Total</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-amber-600">Misc Total</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-blue-600">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMonths.map((monthKey) => {
                  const d = monthlySummaryData[monthKey];
                  return (
                    <tr key={monthKey} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">{monthKey}</td>
                      {/* Dynamic equipment columns */}
                      {equipmentCategories.map(ec => (
                        <React.Fragment key={ec.key}>
                          <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d[ec.key])}</td>
                          {ec.hasMisc && (
                            <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d[`${ec.key}_misc`])}</td>
                          )}
                        </React.Fragment>
                      ))}
                      {/* Dynamic dumper columns */}
                      {dumpers.map(dm => (
                        <React.Fragment key={dm.key}>
                          <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d[dm.key])}</td>
                          <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d[dm.miscKey])}</td>
                        </React.Fragment>
                      ))}
                      {/* Non-equipment categories */}
                      {NON_EQUIPMENT_CATEGORIES.map(cat => (
                        <td key={cat.key} className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d[cat.key])}</td>
                      ))}
                      <td className="px-3 py-2 text-sm text-right font-bold text-white bg-emerald-600">{formatCurrency(d.total)}</td>
                      <td className="px-3 py-2 text-sm text-right font-bold text-white bg-amber-600">{formatCurrency(d.total_misc)}</td>
                      <td className="px-3 py-2 text-sm text-right font-bold text-white bg-blue-600">{formatCurrency(d.balance)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-emerald-100 font-bold">
                  <td className="px-3 py-3 text-sm font-bold text-emerald-800 sticky left-0 bg-emerald-100 z-10">GRAND TOTAL</td>
                  {/* Dynamic equipment grand totals */}
                  {equipmentCategories.map(ec => (
                    <React.Fragment key={ec.key}>
                      <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals[ec.key])}</td>
                      {ec.hasMisc && (
                        <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals[`${ec.key}_misc`])}</td>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Dynamic dumper grand totals */}
                  {dumpers.map(dm => (
                    <React.Fragment key={dm.key}>
                      <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals[dm.key])}</td>
                      <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals[dm.miscKey])}</td>
                    </React.Fragment>
                  ))}
                  {/* Non-equipment grand totals */}
                  {NON_EQUIPMENT_CATEGORIES.map(cat => (
                    <td key={cat.key} className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals[cat.key])}</td>
                  ))}
                  <td className="px-3 py-3 text-sm text-right text-white bg-emerald-700">{formatCurrency(grandTotals.total)}</td>
                  <td className="px-3 py-3 text-sm text-right text-white bg-amber-700">{formatCurrency(grandTotals.total_misc)}</td>
                  <td className="px-3 py-3 text-sm text-right text-white bg-blue-700">{formatCurrency(grandTotals.balance)}</td>
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
            {expenseBreakdown.map((group) => (
              <div key={group.label} className="flex justify-between">
                <span className="text-gray-600">{group.label}</span>
                <span className="font-medium">{formatCurrency(group.value)}</span>
              </div>
            ))}
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
            {miscCategories.map(cat => (
              <div key={cat.key} className="flex justify-between">
                <span className="text-amber-600">{cat.label}</span>
                <span className="font-medium text-amber-700">{formatCurrency(grandTotals[cat.key])}</span>
              </div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold text-amber-700">
              <span>Total Misc</span>
              <span>{formatCurrency(grandTotals.total_misc)}</span>
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
              <div className="text-sm text-emerald-600">Total (Operations)</div>
              <div className="text-2xl font-bold text-emerald-800">{formatCurrency(grandTotals.total)}</div>
            </div>
            <div>
              <div className="text-sm text-amber-600">Misc Total</div>
              <div className="text-2xl font-bold text-amber-700">{formatCurrency(grandTotals.total_misc)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600">Balance (Total + Misc)</div>
              <div className="text-2xl font-bold text-blue-800">{formatCurrency(grandTotals.balance)}</div>
            </div>
            <div>
              <div className="text-sm text-emerald-600">Average Monthly</div>
              <div className="text-2xl font-bold text-emerald-800">
                {sortedMonths.length > 0 
                  ? formatCurrency(Math.round(grandTotals.balance / sortedMonths.length))
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

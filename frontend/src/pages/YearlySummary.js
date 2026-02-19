import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Non-equipment expense categories (from separate DB tables)
// misc_exp intentionally excluded from the main expense total
const NON_EQUIPMENT_CATEGORIES = [
  { key: 'blasting', label: 'Blasting', shortLabel: 'Blast' },
  { key: 'langar', label: 'Langar', shortLabel: 'Lang' },
  { key: 'plant_exp', label: 'Plant Exp', shortLabel: 'Plant' },
  { key: 'human_res', label: 'HR Salaries', shortLabel: 'HR' },
];

const YearlySummary = () => {
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
    dailyProductions,
  } = useData();

  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());

  // Get registered dumpers from equipment
  const registeredDumpers = useMemo(() => {
    return (equipment || [])
      .filter(e => e.equipment_type === 'DUMPER') // Include inactive for historical data
      .map(d => ({
        id: d.id,
        name: d.equipment_name,
        key: `dumper_${d.equipment_code.toLowerCase().replace(/-/g, '')}`
      }));
  }, [equipment]);

  // Dynamic equipment categories from master table (non-DUMPER)
  const equipmentCategories = useMemo(() => {
    const types = [...new Set((equipment || []).map(e => e.equipment_type))];
    const mapping = {
      'GENERATOR': { key: 'generator', label: 'Generator', shortLabel: 'Gen', hasMisc: false },
      'EXCAVATOR': { key: 'excavator', label: 'Excavator', shortLabel: 'Exc', hasMisc: true },
      'LOADER': { key: 'loaders', label: 'Loaders', shortLabel: 'Load', hasMisc: true },
    };
    return types.filter(t => t !== 'DUMPER' && mapping[t]).map(t => mapping[t]);
  }, [equipment]);

  // Get available years from all data
  const availableYears = useMemo(() => {
    const years = new Set();
    const allData = [
      ...generatorOperations,
      ...excavatorOperations,
      ...loaderOperations,
      ...blastingMaterials,
      ...langarExpenses,
      ...plantExpenses,
      ...miscExpenses,
      ...dumperOperations,
      ...salaries,
      ...dailyProductions,
    ];
    
    allData.forEach((item) => {
      const date = item.operation_date || item.trip_date || item.expense_date || 
                   item.purchase_date || item.production_date || item.salary_month;
      if (date) {
        years.add(new Date(date).getFullYear().toString());
      }
    });
    
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [generatorOperations, excavatorOperations, loaderOperations, blastingMaterials,
      langarExpenses, plantExpenses, miscExpenses, dumperOperations, salaries, dailyProductions]);

  // Calculate yearly summary by month
  const monthlySummary = useMemo(() => {
    const year = parseInt(selectedYear);

    return MONTH_NAMES.map((month, index) => {
      const filterByMonth = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() === index && d.getFullYear() === year;
      };

      // Generator
      const generator = generatorOperations
        .filter((op) => filterByMonth(op.operation_date))
        .reduce((sum, op) => sum + (op.total_amount || 0), 0);

      // Excavator (main + misc)
      const excavator = excavatorOperations
        .filter((op) => filterByMonth(op.operation_date))
        .reduce((sum, op) => sum + (op.total_amount || 0), 0);
      const excavator_misc = excavatorOperations
        .filter((op) => filterByMonth(op.operation_date))
        .reduce((sum, op) => sum + (op.misc_expense || 0), 0);

      // Loaders
      const loaders = loaderOperations
        .filter((op) => filterByMonth(op.operation_date))
        .reduce((sum, op) => sum + (op.total_amount || 0), 0);
      const loaders_misc = loaderOperations
        .filter((op) => filterByMonth(op.operation_date))
        .reduce((sum, op) => sum + (op.misc_expense || 0), 0);

      // Initialize dynamic dumper data based on registered dumpers
      const dumperData = {};
      registeredDumpers.forEach(d => {
        dumperData[d.key] = 0;
        dumperData[`${d.key}_misc`] = 0;
      });

      // Dumper Operations (trip amount only)
      dumperOperations.filter((op) => filterByMonth(op.trip_date)).forEach(op => {
        // Try finding dumper by ID first, then name
        const dumper = registeredDumpers.find(d => d.id === op.equipment_id) || 
                       registeredDumpers.find(d => d.name === op.dumper_name);
        if (dumper) {
          dumperData[dumper.key] += op.trip_amount || 0;
        }
      });

      // Dumper Misc Expenses
      dumperMiscExpenses.filter((exp) => filterByMonth(exp.expense_date)).forEach(exp => {
        // Try finding dumper by ID first, then name
        const dumper = registeredDumpers.find(d => d.id === exp.dumper_id) || 
                       registeredDumpers.find(d => d.name === exp.dumper_name);
        if (dumper) {
          dumperData[`${dumper.key}_misc`] += exp.amount || 0;
        }
      });

      // Blasting Materials
      const blasting = blastingMaterials
        .filter((m) => filterByMonth(m.purchase_date))
        .reduce((sum, m) => sum + (m.total_amount || 0), 0);

      // Langar Expenses
      const langar = langarExpenses
        .filter((e) => filterByMonth(e.expense_date))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Plant Expenses
      const plant_exp = plantExpenses
        .filter((e) => filterByMonth(e.expense_date))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Misc Expenses
      const misc_exp = miscExpenses
        .filter((e) => filterByMonth(e.expense_date))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Salaries (salary_month is YYYY-MM format)
      const human_res = salaries
        .filter((s) => {
          const salaryDate = s.salary_month ? s.salary_month + '-01' : null;
          return filterByMonth(salaryDate);
        })
        .reduce((sum, s) => sum + (s.net_salary || 0), 0);

      // Production
      const production = dailyProductions
        .filter((p) => filterByMonth(p.production_date))
        .reduce((sum, p) => sum + (p.net_aggregate_cft || 0), 0);

      // Sum all dumper trip amounts
      const dumperTotal = Object.keys(dumperData)
        .filter(k => !k.endsWith('_misc'))
        .reduce((sum, k) => sum + (dumperData[k] || 0), 0);

      // Total (excludes misc - misc is reference only)
      const total = generator + excavator + loaders + dumperTotal +
                    blasting + langar + plant_exp + human_res;

      // Total misc (all misc columns)
      const total_misc = excavator_misc + loaders_misc + 
        Object.keys(dumperData)
          .filter(k => k.endsWith('_misc'))
          .reduce((sum, k) => sum + (dumperData[k] || 0), 0);

      return {
        month,
        generator,
        excavator,
        excavator_misc,
        loaders,
        loaders_misc,
        ...dumperData,
        blasting,
        langar,
        plant_exp,
        human_res,
        misc_exp,
        production,
        total,
        total_misc,
      };
    });
  }, [selectedYear, generatorOperations, excavatorOperations, loaderOperations, 
      dumperOperations, dumperMiscExpenses, blastingMaterials, langarExpenses, 
      plantExpenses, miscExpenses, salaries, dailyProductions, registeredDumpers]);

  // Calculate yearly totals
  const yearlyTotals = useMemo(() => {
    if (monthlySummary.length === 0) return {};
    
    // Get all keys from first month as template
    const keys = Object.keys(monthlySummary[0]).filter(k => k !== 'month');
    const initTotals = {};
    keys.forEach(k => initTotals[k] = 0);

    return monthlySummary.reduce((acc, m) => {
      keys.forEach(key => {
        acc[key] = (acc[key] || 0) + (m[key] || 0);
      });
      return acc;
    }, { ...initTotals });
  }, [monthlySummary]);

  // Calculate total dumper amount for yearly summary
  const totalDumperAmount = useMemo(() => {
    return Object.keys(yearlyTotals)
      .filter(k => k.startsWith('dumper_') && !k.endsWith('_misc'))
      .reduce((sum, k) => sum + (yearlyTotals[k] || 0), 0);
  }, [yearlyTotals]);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '-';
    return value.toLocaleString();
  };

  // Create short display names for dumpers
  const getDumperShortName = (name) => {
    // Extract just the vehicle number like TKR-219, TAC-388
    const match = name.match(/([A-Z]{2,3}[-\s]?\d{3})/i);
    return match ? match[1].toUpperCase().replace(/\s/g, '-') : name.slice(0, 6);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Yearly Summary</h1>
        
        <div className="w-48">
          <Label htmlFor="year">Select Year</Label>
          <Select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(yearlyTotals.total)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Net Production</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(yearlyTotals.production)} CFT</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-sm text-amber-700">Total Misc (Reference)</div>
          <div className="text-2xl font-bold text-amber-700">{formatCurrency(yearlyTotals.total_misc)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-sm text-emerald-700">Cost per CFT</div>
          <div className="text-2xl font-bold text-emerald-700">
            {yearlyTotals.production > 0 
              ? (yearlyTotals.total / yearlyTotals.production).toFixed(2)
              : '-'}
          </div>
        </div>
      </div>

      {/* Expense Category Cards - Dynamic from master table */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {/* Equipment categories from master table */}
        {equipmentCategories.map(ec => {
          const colors = {
            generator: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bold: 'text-yellow-800' },
            excavator: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bold: 'text-orange-800' },
            loaders: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bold: 'text-amber-800' },
          };
          const c = colors[ec.key] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', bold: 'text-gray-800' };
          return (
            <div key={ec.key} className={`${c.bg} ${c.border} border rounded-lg p-3`}>
              <div className={`text-xs ${c.text}`}>{ec.label}</div>
              <div className={`text-lg font-bold ${c.bold}`}>{formatCurrency(yearlyTotals[ec.key])}</div>
            </div>
          );
        })}
        {/* All Dumpers */}
        {registeredDumpers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700">All Dumpers</div>
            <div className="text-lg font-bold text-blue-800">
              {formatCurrency(totalDumperAmount)}
            </div>
          </div>
        )}
        {/* Non-equipment categories */}
        {NON_EQUIPMENT_CATEGORIES.map(cat => {
          const colors = {
            blasting: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bold: 'text-red-800' },
            langar: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bold: 'text-green-800' },
            plant_exp: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bold: 'text-purple-800' },
            human_res: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', bold: 'text-pink-800' },
          };
          const c = colors[cat.key] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', bold: 'text-gray-800' };
          return (
            <div key={cat.key} className={`${c.bg} ${c.border} border rounded-lg p-3`}>
              <div className={`text-xs ${c.text}`}>{cat.label}</div>
              <div className={`text-lg font-bold ${c.bold}`}>{formatCurrency(yearlyTotals[cat.key])}</div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Columns are dynamically generated from registered equipment and expense categories.
      </p>

      {/* Monthly Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
          <h2 className="text-lg font-medium text-emerald-800">Monthly Breakdown - {selectedYear}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-emerald-700 uppercase sticky left-0 bg-emerald-50 z-10">
                  Month
                </th>
                {/* Dynamic equipment headers from master table */}
                {equipmentCategories.map(ec => (
                  <React.Fragment key={ec.key}>
                    <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{ec.shortLabel}</th>
                    {ec.hasMisc && (
                      <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">{ec.shortLabel.slice(0,1)}.M</th>
                    )}
                  </React.Fragment>
                ))}
                {/* Dynamic Dumper Headers */}
                {registeredDumpers.map(dumper => (
                  <React.Fragment key={dumper.key}>
                    <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                      {getDumperShortName(dumper.name)}
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">M</th>
                  </React.Fragment>
                ))}
                {/* Non-equipment category headers */}
                {NON_EQUIPMENT_CATEGORIES.map(cat => (
                  <th key={cat.key} className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{cat.shortLabel}</th>
                ))}
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-emerald-600">Total</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-green-700 uppercase bg-green-50">Prod</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlySummary.map((row) => (
                <tr key={row.month} className={row.total > 0 ? 'hover:bg-emerald-50' : 'text-gray-400'}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {row.month}
                  </td>
                  {/* Dynamic equipment data */}
                  {equipmentCategories.map(ec => (
                    <React.Fragment key={ec.key}>
                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(row[ec.key])}</td>
                      {ec.hasMisc && (
                        <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(row[`${ec.key}_misc`])}</td>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Dynamic Dumper Data */}
                  {registeredDumpers.map(dumper => (
                    <React.Fragment key={dumper.key}>
                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(row[dumper.key])}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(row[`${dumper.key}_misc`])}</td>
                    </React.Fragment>
                  ))}
                  {/* Non-equipment categories */}
                  {NON_EQUIPMENT_CATEGORIES.map(cat => (
                    <td key={cat.key} className="px-3 py-2 text-sm text-right">{formatCurrency(row[cat.key])}</td>
                  ))}
                  <td className="px-3 py-2 text-sm text-right font-bold text-white bg-emerald-600">
                    {formatCurrency(row.total)}
                  </td>
                  <td className="px-3 py-2 text-sm text-right text-green-700 bg-green-50 font-medium">
                    {formatCurrency(row.production)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-emerald-100">
              <tr className="font-bold">
                <td className="px-3 py-3 text-sm font-bold text-emerald-800 sticky left-0 bg-emerald-100 z-10">
                  TOTAL
                </td>
                {/* Dynamic equipment totals */}
                {equipmentCategories.map(ec => (
                  <React.Fragment key={ec.key}>
                    <td className="px-3 py-3 text-sm text-right">{formatCurrency(yearlyTotals[ec.key])}</td>
                    {ec.hasMisc && (
                      <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(yearlyTotals[`${ec.key}_misc`])}</td>
                    )}
                  </React.Fragment>
                ))}
                {/* Dynamic Dumper Totals */}
                {registeredDumpers.map(dumper => (
                  <React.Fragment key={dumper.key}>
                    <td className="px-3 py-3 text-sm text-right">{formatCurrency(yearlyTotals[dumper.key])}</td>
                    <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(yearlyTotals[`${dumper.key}_misc`])}</td>
                  </React.Fragment>
                ))}
                {/* Non-equipment totals */}
                {NON_EQUIPMENT_CATEGORIES.map(cat => (
                  <td key={cat.key} className="px-3 py-3 text-sm text-right">{formatCurrency(yearlyTotals[cat.key])}</td>
                ))}
                <td className="px-3 py-3 text-sm text-right text-white bg-emerald-700">
                  {formatCurrency(yearlyTotals.total)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-green-800 bg-green-100 font-bold">
                  {formatCurrency(yearlyTotals.production)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* No Registered Dumpers Info */}
      {registeredDumpers.length === 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          No dumpers registered. Go to <strong>Master Data → Equipment</strong> to add dumpers.
        </div>
      )}

      {/* Quarterly Summary */}
      <div className="mt-8">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Quarterly Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((q) => {
            const quarterMonths = monthlySummary.slice(q * 3, (q + 1) * 3);
            const quarterTotal = quarterMonths.reduce((sum, m) => sum + m.total, 0);
            const quarterProduction = quarterMonths.reduce((sum, m) => sum + m.production, 0);
            const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
            
            return (
              <div key={q} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{quarterNames[q]}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses</span>
                    <span className="font-bold text-gray-900">{formatCurrency(quarterTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Production</span>
                    <span className="font-bold text-green-600">{formatCurrency(quarterProduction)} CFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost/CFT</span>
                    <span className="font-bold text-emerald-700">
                      {quarterProduction > 0 ? (quarterTotal / quarterProduction).toFixed(2) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default YearlySummary;

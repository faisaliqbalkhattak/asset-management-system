import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import {
  MONTH_NAMES,
  FULL_MONTH_NAMES,
  NON_EQUIPMENT_CATEGORIES,
  buildEquipmentCategories,
  buildGroupedDumpers,
  buildGroupedDumperKeyMap,
  calculateSummaryByMonth,
  createSummaryRowTemplate,
  getAvailableYears,
} from '../utils/summaryCalculations';

const TRANSACTION_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'GENERATOR', label: 'Generator' },
  { value: 'EXCAVATOR', label: 'Excavator' },
  { value: 'LOADER', label: 'Loaders' },
  { value: 'DUMPER', label: 'Dumpers' },
  { value: 'BLASTING', label: 'Blasting Material' },
  { value: 'PLANT_MESS', label: 'Plant Mess' },
  { value: 'PLANT_EXP', label: 'Plant Expense' },
  { value: 'HUMAN_RES', label: 'Staff Salaries' },
];

const EQUIPMENT_TYPE_KEY = {
  GENERATOR: 'generator',
  EXCAVATOR: 'excavator',
  LOADER: 'loaders',
};

const NON_EQUIPMENT_TYPE_KEY = {
  BLASTING: 'blasting',
  PLANT_MESS: 'plant_mess',
  PLANT_EXP: 'plant_exp',
  HUMAN_RES: 'human_res',
};

const YearlySummary = () => {
  const {
    equipment,
    generatorOperations,
    excavatorOperations,
    loaderOperations,
    blastingMaterials,
    plantMessExpenses,
    plantExpenses,
    dumperOperations,
    dumperMiscExpenses,
    salaries,
    monthlyProductionSummaries,
  } = useData();

  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState('');
  const [selectedTransactionType, setSelectedTransactionType] = React.useState('');

  const selectedMonthShort = useMemo(() => {
    if (!selectedMonth) return '';
    const index = FULL_MONTH_NAMES.indexOf(selectedMonth);
    return index >= 0 ? MONTH_NAMES[index] : selectedMonth;
  }, [selectedMonth]);

  // Grouped dumper column (single column for all dumpers)
  const dumpers = useMemo(() => {
    return buildGroupedDumpers(equipment);
  }, [equipment]);

  // Dynamic equipment categories from master table (non-DUMPER)
  const equipmentCategories = useMemo(() => {
    return buildEquipmentCategories(equipment);
  }, [equipment]);

  const visibleEquipmentCategories = useMemo(() => {
    if (!selectedTransactionType) return equipmentCategories;
    const key = EQUIPMENT_TYPE_KEY[selectedTransactionType];
    return key ? equipmentCategories.filter((ec) => ec.key === key) : [];
  }, [equipmentCategories, selectedTransactionType]);

  const visibleDumpers = useMemo(() => {
    if (!selectedTransactionType) return dumpers;
    if (selectedTransactionType !== 'DUMPER') return [];
    return dumpers;
  }, [dumpers, selectedTransactionType]);

  const visibleNonEquipmentCategories = useMemo(() => {
    if (!selectedTransactionType) return NON_EQUIPMENT_CATEGORIES;
    const key = NON_EQUIPMENT_TYPE_KEY[selectedTransactionType];
    return key ? NON_EQUIPMENT_CATEGORIES.filter((cat) => cat.key === key) : [];
  }, [selectedTransactionType]);

  const dumperKeyMap = useMemo(() => {
    if (!selectedTransactionType) return buildGroupedDumperKeyMap(equipment);
    if (selectedTransactionType !== 'DUMPER') return {};
    return buildGroupedDumperKeyMap(equipment);
  }, [equipment, selectedTransactionType]);

  // Get available years from all data
  const availableYears = useMemo(() => {
    return getAvailableYears({
      generatorOperations,
      excavatorOperations,
      loaderOperations,
      dumperOperations,
      dumperMiscExpenses,
      blastingMaterials,
      plantMessExpenses,
      plantExpenses,
      salaries,
      monthlyProductionSummaries,
    });
  }, [generatorOperations, excavatorOperations, loaderOperations, blastingMaterials,
      plantMessExpenses, plantExpenses, dumperOperations, dumperMiscExpenses, salaries, monthlyProductionSummaries]);

  const filteredGeneratorOperations = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'GENERATOR') return generatorOperations;
    return [];
  }, [generatorOperations, selectedTransactionType]);

  const filteredExcavatorOperations = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'EXCAVATOR') return excavatorOperations;
    return [];
  }, [excavatorOperations, selectedTransactionType]);

  const filteredLoaderOperations = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'LOADER') return loaderOperations;
    return [];
  }, [loaderOperations, selectedTransactionType]);

  const filteredDumperOperations = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'DUMPER') return dumperOperations;
    return [];
  }, [dumperOperations, selectedTransactionType]);

  const filteredDumperMiscExpenses = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'DUMPER') return dumperMiscExpenses;
    return [];
  }, [dumperMiscExpenses, selectedTransactionType]);

  const filteredBlastingMaterials = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'BLASTING') return blastingMaterials;
    return [];
  }, [blastingMaterials, selectedTransactionType]);

  const filteredPlantMessExpenses = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'PLANT_MESS') return plantMessExpenses;
    return [];
  }, [plantMessExpenses, selectedTransactionType]);

  const filteredPlantExpenses = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'PLANT_EXP') return plantExpenses;
    return [];
  }, [plantExpenses, selectedTransactionType]);

  const filteredSalaries = useMemo(() => {
    if (!selectedTransactionType || selectedTransactionType === 'HUMAN_RES') return salaries;
    return [];
  }, [salaries, selectedTransactionType]);

  const monthlySummaryData = useMemo(() => {
    return calculateSummaryByMonth({
      generatorOperations: filteredGeneratorOperations,
      excavatorOperations: filteredExcavatorOperations,
      loaderOperations: filteredLoaderOperations,
      dumperOperations: filteredDumperOperations,
      dumperMiscExpenses: filteredDumperMiscExpenses,
      blastingMaterials: filteredBlastingMaterials,
      plantMessExpenses: filteredPlantMessExpenses,
      plantExpenses: filteredPlantExpenses,
      salaries: filteredSalaries,
      equipmentCategories: visibleEquipmentCategories,
      dumpers: visibleDumpers,
      dumperKeyMap,
      selectedMonth: selectedMonthShort,
      selectedYear,
    });
  }, [
    selectedMonthShort,
    selectedYear,
    filteredGeneratorOperations,
    filteredExcavatorOperations,
    filteredLoaderOperations,
    filteredDumperOperations,
    filteredDumperMiscExpenses,
    filteredBlastingMaterials,
    filteredPlantMessExpenses,
    filteredPlantExpenses,
    filteredSalaries,
    visibleEquipmentCategories,
    visibleDumpers,
    dumperKeyMap,
  ]);

  // Calculate yearly summary by month
  const monthlySummary = useMemo(() => {
    const year = Number(selectedYear);
    const yearSuffix = String(year).slice(-2);
    const emptyRow = createSummaryRowTemplate(visibleEquipmentCategories, visibleDumpers);

    return MONTH_NAMES.map((month, index) => {
      const monthKey = `${month}-${yearSuffix}`;
      const base = monthlySummaryData[monthKey] || emptyRow;

      // Revenue from monthly production summaries (sold amount + stock value)
      const matchingSummary = (monthlyProductionSummaries || []).find(
        (s) => String(s.summary_year) === String(year) && s.summary_month === FULL_MONTH_NAMES[index]
      );
      const revenue = matchingSummary ? (matchingSummary.total_cost || 0) : 0;

      if (selectedMonthShort && month !== selectedMonthShort) {
        return {
          month,
          ...emptyRow,
          revenue: 0,
        };
      }

      return {
        month,
        ...base,
        revenue,
      };
    });
  }, [selectedYear, selectedMonthShort, monthlySummaryData, monthlyProductionSummaries, visibleEquipmentCategories, visibleDumpers]);

  const visibleMonthlySummary = useMemo(() => {
    if (!selectedMonthShort) return monthlySummary;
    return monthlySummary.filter((row) => row.month === selectedMonthShort);
  }, [monthlySummary, selectedMonthShort]);

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
    return visibleDumpers.reduce((sum, d) => sum + (yearlyTotals[d.key] || 0), 0);
  }, [yearlyTotals, visibleDumpers]);

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
        
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="equipmentFilter">Transaction Type</Label>
            <Select
              id="equipmentFilter"
              value={selectedTransactionType}
              onChange={(e) => setSelectedTransactionType(e.target.value)}
            >
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
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
          <div className="w-48">
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
        </div>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Spending</div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(yearlyTotals.spending)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-sm text-amber-700">Misc</div>
          <div className="text-2xl font-bold text-amber-700">{formatCurrency(yearlyTotals.misc)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-sm text-emerald-700">Total Expenses</div>
          <div className="text-2xl font-bold text-emerald-800">{formatCurrency(yearlyTotals.total)}</div>
        </div>
        <div className={`border rounded-lg p-4 ${((yearlyTotals.revenue || 0) - (yearlyTotals.total || 0)) >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-sm ${((yearlyTotals.revenue || 0) - (yearlyTotals.total || 0)) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Net Profit</div>
          <div className={`text-2xl font-bold ${((yearlyTotals.revenue || 0) - (yearlyTotals.total || 0)) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatCurrency((yearlyTotals.revenue || 0) - (yearlyTotals.total || 0))}
          </div>
        </div>
      </div>

      {/* Expense Category Cards - Dynamic from master table */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {/* Equipment categories from master table */}
        {visibleEquipmentCategories.map(ec => {
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
        {visibleDumpers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700">All Dumpers</div>
            <div className="text-lg font-bold text-blue-800">
              {formatCurrency(totalDumperAmount)}
            </div>
          </div>
        )}
        {/* Non-equipment categories */}
        {visibleNonEquipmentCategories.map(cat => {
          const colors = {
            blasting: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bold: 'text-red-800' },
            plant_mess: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bold: 'text-green-800' },
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
                {visibleEquipmentCategories.map(ec => (
                  <React.Fragment key={ec.key}>
                    <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{ec.shortLabel}</th>
                    {ec.hasMisc && (
                      <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">{ec.shortLabel.slice(0,1)}.M</th>
                    )}
                  </React.Fragment>
                ))}
                {/* Dynamic Dumper Headers */}
                {visibleDumpers.map(dumper => (
                  <React.Fragment key={dumper.key}>
                    <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">
                      {dumper.key === 'dumpers' ? dumper.label : getDumperShortName(dumper.label)}
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">M</th>
                  </React.Fragment>
                ))}
                {/* Non-equipment category headers */}
                {visibleNonEquipmentCategories.map(cat => (
                  <React.Fragment key={cat.key}>
                    <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{cat.shortLabel}</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">{cat.shortLabel}.M</th>
                  </React.Fragment>
                ))}
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-blue-600">Spending</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-amber-600">Misc</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-emerald-600">Total</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-green-700 uppercase bg-green-50">Revenue</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase bg-emerald-50">Profit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleMonthlySummary.map((row) => (
                <tr key={row.month} className={row.total > 0 ? 'hover:bg-emerald-50' : 'text-gray-400'}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {row.month}
                  </td>
                  {/* Dynamic equipment data */}
                  {visibleEquipmentCategories.map(ec => (
                    <React.Fragment key={ec.key}>
                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(row[ec.key])}</td>
                      {ec.hasMisc && (
                        <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(row[`${ec.key}_misc`])}</td>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Dynamic Dumper Data */}
                  {visibleDumpers.map(dumper => (
                    <React.Fragment key={dumper.key}>
                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(row[dumper.key])}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(row[`${dumper.key}_misc`])}</td>
                    </React.Fragment>
                  ))}
                  {/* Non-equipment categories */}
                  {visibleNonEquipmentCategories.map(cat => (
                    <React.Fragment key={cat.key}>
                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(row[cat.key])}</td>
                      <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(row[`${cat.key}_misc`])}</td>
                    </React.Fragment>
                  ))}
                  <td className="px-3 py-2 text-sm text-right font-bold text-white bg-blue-600">
                    {formatCurrency(row.spending)}
                  </td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-white bg-amber-600">
                    {formatCurrency(row.misc)}
                  </td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-white bg-emerald-600">
                    {formatCurrency(row.total)}
                  </td>
                  <td className="px-3 py-2 text-sm text-right text-green-700 bg-green-50 font-medium">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className={`px-3 py-2 text-sm text-right font-medium bg-emerald-50 ${(row.revenue - row.total) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatCurrency(row.revenue - row.total)}
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
                {visibleEquipmentCategories.map(ec => (
                  <React.Fragment key={ec.key}>
                    <td className="px-3 py-3 text-sm text-right">{formatCurrency(yearlyTotals[ec.key])}</td>
                    {ec.hasMisc && (
                      <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(yearlyTotals[`${ec.key}_misc`])}</td>
                    )}
                  </React.Fragment>
                ))}
                {/* Dynamic Dumper Totals */}
                {visibleDumpers.map(dumper => (
                  <React.Fragment key={dumper.key}>
                    <td className="px-3 py-3 text-sm text-right">{formatCurrency(yearlyTotals[dumper.key])}</td>
                    <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(yearlyTotals[`${dumper.key}_misc`])}</td>
                  </React.Fragment>
                ))}
                {/* Non-equipment totals */}
                {visibleNonEquipmentCategories.map(cat => (
                  <React.Fragment key={cat.key}>
                    <td className="px-3 py-3 text-sm text-right">{formatCurrency(yearlyTotals[cat.key])}</td>
                    <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(yearlyTotals[`${cat.key}_misc`])}</td>
                  </React.Fragment>
                ))}
                <td className="px-3 py-3 text-sm text-right text-white bg-blue-700">
                  {formatCurrency(yearlyTotals.spending)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-white bg-amber-700">
                  {formatCurrency(yearlyTotals.misc)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-white bg-emerald-700">
                  {formatCurrency(yearlyTotals.total)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-green-800 bg-green-100 font-bold">
                  {formatCurrency(yearlyTotals.revenue)}
                </td>
                <td className={`px-3 py-3 text-sm text-right font-bold bg-emerald-100 ${((yearlyTotals.revenue || 0) - (yearlyTotals.total || 0)) >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                  {formatCurrency((yearlyTotals.revenue || 0) - (yearlyTotals.total || 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* No Registered Dumpers Info */}
      {visibleDumpers.length === 0 && (
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
            const quarterRevenue = quarterMonths.reduce((sum, m) => sum + m.revenue, 0);
            const quarterProfit = quarterRevenue - quarterTotal;
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
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-bold text-green-600">{formatCurrency(quarterRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Profit</span>
                    <span className={`font-bold ${quarterProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrency(quarterProfit)}
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

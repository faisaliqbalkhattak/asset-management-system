import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  MONTH_NAMES,
  FULL_MONTH_NAMES,
  NON_EQUIPMENT_CATEGORIES,
  buildEquipmentCategories,
  buildGroupedDumpers,
  buildGroupedDumperKeyMap,
  calculateSummaryByMonth,
  calculateGrandTotals,
  calculatePerEquipmentItemSummary,
  calculateDetailedItemSummaries,
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

const MonthlySummary = () => {
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
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('');

  // Build dynamic equipment categories from master table (non-DUMPER types)
  const equipmentCategories = useMemo(() => {
    return buildEquipmentCategories(equipment);
  }, [equipment]);

  // Grouped dumper column (single column for all dumpers)
  const dumpers = useMemo(() => {
    return buildGroupedDumpers(equipment);
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

  // Build name/id to key lookup map for dumpers
  const dumperKeyMap = useMemo(() => {
    if (!selectedTransactionType) return buildGroupedDumperKeyMap(equipment);
    if (selectedTransactionType !== 'DUMPER') return {};
    return buildGroupedDumperKeyMap(equipment);
  }, [equipment, selectedTransactionType]);

  // Equipment categories that have misc tracking - dynamically from equipment master table
  const miscCategories = useMemo(() => {
    const cats = [];
    // Add misc for all visible equipment types
    visibleEquipmentCategories.forEach(ec => {
      cats.push({ key: `${ec.key}_misc`, label: `${ec.label} Misc` });
    });
    // Add misc for each registered dumper
    visibleDumpers.forEach(d => {
      cats.push({ key: d.miscKey, label: `${d.label} Misc` });
    });
    // Add misc for non-equipment categories
    visibleNonEquipmentCategories.forEach(cat => {
      cats.push({ key: `${cat.key}_misc`, label: `${cat.label} Misc` });
    });
    return cats;
  }, [visibleEquipmentCategories, visibleDumpers, visibleNonEquipmentCategories]);

  // Filtered operational datasets (for summaries)
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

  // Per-equipment item summary
  const perEquipmentItemSummary = useMemo(() => {
    return calculatePerEquipmentItemSummary({
      equipment,
      generatorOperations: filteredGeneratorOperations,
      excavatorOperations: filteredExcavatorOperations,
      loaderOperations: filteredLoaderOperations,
      dumperOperations: filteredDumperOperations,
      selectedMonth,
      selectedYear,
    });
  }, [equipment, filteredGeneratorOperations, filteredExcavatorOperations, filteredLoaderOperations, filteredDumperOperations, selectedMonth, selectedYear]);

  // Detailed item/subcategory summaries
  const detailedItemSummaries = useMemo(() => {
    return calculateDetailedItemSummaries({
      blastingMaterials: filteredBlastingMaterials,
      plantMessExpenses: filteredPlantMessExpenses,
      plantExpenses: filteredPlantExpenses,
      salaries: filteredSalaries,
      selectedMonth,
      selectedYear,
    });
  }, [filteredBlastingMaterials, filteredPlantMessExpenses, filteredPlantExpenses, filteredSalaries, selectedMonth, selectedYear]);

  // Get available years from data
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
    });
  }, [
    generatorOperations,
    excavatorOperations,
    loaderOperations,
    dumperOperations,
    dumperMiscExpenses,
    blastingMaterials,
    plantMessExpenses,
    plantExpenses,
    salaries,
  ]);
  // Calculate monthly data for all categories
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
      selectedMonth,
      selectedYear,
    });
  }, [filteredGeneratorOperations, filteredExcavatorOperations, filteredLoaderOperations,
      filteredDumperOperations, filteredDumperMiscExpenses, filteredBlastingMaterials,
      filteredPlantMessExpenses, filteredPlantExpenses, filteredSalaries,
      selectedMonth, selectedYear, visibleDumpers, dumperKeyMap, visibleEquipmentCategories]);

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
    return calculateGrandTotals(monthlySummaryData, visibleEquipmentCategories, visibleDumpers);
  }, [monthlySummaryData, visibleDumpers, visibleEquipmentCategories]);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '-';
    return value.toLocaleString();
  };

  const expenseBreakdown = useMemo(() => {
    const groups = [];
    // Equipment categories from master table
    const equipTotal = visibleEquipmentCategories.reduce((sum, ec) => sum + (grandTotals[ec.key] || 0), 0);
    if (visibleEquipmentCategories.length > 0) {
      groups.push({ label: `Equipment (${visibleEquipmentCategories.map(ec => ec.label).join(' + ')})`, value: equipTotal });
    }
    // Dumpers from master table
    if (visibleDumpers.length > 0) {
      const dumperCount = (equipment || []).filter((e) => e.equipment_type === 'DUMPER').length;
      const dumperTotal = visibleDumpers.reduce((sum, d) => sum + (grandTotals[d.key] || 0), 0);
      groups.push({ label: `Dumpers (All ${dumperCount})`, value: dumperTotal });
    }
    // Non-equipment categories (from DB tables)
    visibleNonEquipmentCategories.forEach(cat => {
      groups.push({ label: cat.label, value: grandTotals[cat.key] || 0 });
    });
    return groups;
  }, [grandTotals, visibleDumpers, visibleEquipmentCategories, visibleNonEquipmentCategories, equipment]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Monthly Summary</h1>
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="equipmentFilter">Transaction Type</Label>
            <Select id="equipmentFilter" value={selectedTransactionType} onChange={(e) => setSelectedTransactionType(e.target.value)}>
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview Matrix</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Item Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                      {visibleEquipmentCategories.map(ec => (
                        <React.Fragment key={ec.key}>
                          <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{ec.label}</th>
                          {ec.hasMisc && (
                            <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">{ec.label.slice(0,3)}.M</th>
                          )}
                        </React.Fragment>
                      ))}
                      {/* Dynamic dumper columns from master table */}
                      {visibleDumpers.map(d => (
                        <React.Fragment key={d.key}>
                          <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{d.label}</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">Misc</th>
                        </React.Fragment>
                      ))}
                      {/* Non-equipment expense categories with misc columns */}
                      {visibleNonEquipmentCategories.map(cat => (
                        <React.Fragment key={cat.key}>
                          <th className="px-3 py-3 text-right text-xs font-medium text-emerald-700 uppercase">{cat.label}</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-amber-600 uppercase bg-amber-50">{cat.shortLabel}.M</th>
                        </React.Fragment>
                      ))}
                      <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-blue-600">Spending</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-amber-600">Misc Total</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase bg-emerald-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedMonths.map((monthKey) => {
                      const d = monthlySummaryData[monthKey];
                      return (
                        <tr key={monthKey} className="hover:bg-emerald-50 transition-colors">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">{monthKey}</td>
                          {/* Dynamic equipment columns */}
                          {visibleEquipmentCategories.map(ec => (
                            <React.Fragment key={ec.key}>
                              <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d[ec.key])}</td>
                              {ec.hasMisc && (
                                <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d[`${ec.key}_misc`])}</td>
                              )}
                            </React.Fragment>
                          ))}
                          {/* Dynamic dumper columns */}
                          {visibleDumpers.map(dm => (
                            <React.Fragment key={dm.key}>
                              <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d[dm.key])}</td>
                              <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d[dm.miscKey])}</td>
                            </React.Fragment>
                          ))}
                          {/* Non-equipment categories */}
                          {visibleNonEquipmentCategories.map(cat => (
                            <React.Fragment key={cat.key}>
                              <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(d[cat.key])}</td>
                              <td className="px-3 py-2 text-sm text-right text-amber-600 bg-amber-50">{formatCurrency(d[`${cat.key}_misc`])}</td>
                            </React.Fragment>
                          ))}
                          <td className="px-3 py-2 text-sm text-right font-bold text-white bg-blue-600">{formatCurrency(d.spending)}</td>
                          <td className="px-3 py-2 text-sm text-right font-bold text-white bg-amber-600">{formatCurrency(d.misc)}</td>
                          <td className="px-3 py-2 text-sm text-right font-bold text-white bg-emerald-600">{formatCurrency(d.total)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-emerald-100 font-bold">
                      <td className="px-3 py-3 text-sm font-bold text-emerald-800 sticky left-0 bg-emerald-100 z-10">GRAND TOTAL</td>
                      {/* Dynamic equipment grand totals */}
                      {visibleEquipmentCategories.map(ec => (
                        <React.Fragment key={ec.key}>
                          <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals[ec.key])}</td>
                          {ec.hasMisc && (
                            <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals[`${ec.key}_misc`])}</td>
                          )}
                        </React.Fragment>
                      ))}
                      {/* Dynamic dumper grand totals */}
                      {visibleDumpers.map(dm => (
                        <React.Fragment key={dm.key}>
                          <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals[dm.key])}</td>
                          <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals[dm.miscKey])}</td>
                        </React.Fragment>
                      ))}
                      {/* Non-equipment grand totals */}
                      {visibleNonEquipmentCategories.map(cat => (
                        <React.Fragment key={cat.key}>
                          <td className="px-3 py-3 text-sm text-right text-emerald-800">{formatCurrency(grandTotals[cat.key])}</td>
                          <td className="px-3 py-3 text-sm text-right text-amber-700 bg-amber-100">{formatCurrency(grandTotals[`${cat.key}_misc`])}</td>
                        </React.Fragment>
                      ))}
                      <td className="px-3 py-3 text-sm text-right text-white bg-blue-700">{formatCurrency(grandTotals.spending)}</td>
                      <td className="px-3 py-3 text-sm text-right text-white bg-amber-700">{formatCurrency(grandTotals.misc)}</td>
                      <td className="px-3 py-3 text-sm text-right text-white bg-emerald-700">{formatCurrency(grandTotals.total)}</td>
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
                <div className="flex justify-between text-sm text-blue-700 mt-1">
                  <span>Spending</span>
                  <span>{formatCurrency(grandTotals.spending)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Misc</span>
                  <span>{formatCurrency(grandTotals.misc)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Misc Expenses (Reference)</h3>
              <p className="text-sm text-gray-500 mb-4">These are tracked separately and included in the Total amount</p>
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
                  <span>{formatCurrency(grandTotals.misc)}</span>
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
                  <div className="text-sm text-blue-600">Spending</div>
                  <div className="text-2xl font-bold text-blue-800">{formatCurrency(grandTotals.spending)}</div>
                </div>
                <div>
                  <div className="text-sm text-amber-600">Misc Total</div>
                  <div className="text-2xl font-bold text-amber-700">{formatCurrency(grandTotals.misc)}</div>
                </div>
                <div>
                  <div className="text-sm text-emerald-600">Total (Spending + Misc)</div>
                  <div className="text-2xl font-bold text-emerald-800">{formatCurrency(grandTotals.total)}</div>
                </div>
                <div>
                  <div className="text-sm text-emerald-600">Average Monthly Total</div>
                  <div className="text-2xl font-bold text-emerald-800">
                    {sortedMonths.length > 0 
                      ? formatCurrency(Math.round(grandTotals.total / sortedMonths.length))
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-8 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Detailed Item & Category Breakdown</h2>
            <p className="text-sm text-gray-500">Individual item spending and miscellaneous expense summaries for the selected period.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Equipment Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <h3 className="text-lg font-medium text-blue-800">Equipment Items</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Spending</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Misc</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {perEquipmentItemSummary.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.type}</td>
                        <td className="px-4 py-2 text-sm text-right text-blue-700">{formatCurrency(item.spending)}</td>
                        <td className="px-4 py-2 text-sm text-right text-amber-700">{formatCurrency(item.misc)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-emerald-700">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {perEquipmentItemSummary.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">No equipment items found for the selected period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Blasting Materials */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                <h3 className="text-lg font-medium text-red-800">Blasting Materials</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Spending</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Misc</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedItemSummaries.blasting.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-right text-blue-700">{formatCurrency(item.spending)}</td>
                        <td className="px-4 py-2 text-sm text-right text-amber-700">{formatCurrency(item.misc)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-emerald-700">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {detailedItemSummaries.blasting.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No blasting entries found for the selected period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plant Expenses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                <h3 className="text-lg font-medium text-purple-800">Plant Expenses Categories</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Spending</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Misc</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedItemSummaries.plantExp.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-right text-blue-700">{formatCurrency(item.spending)}</td>
                        <td className="px-4 py-2 text-sm text-right text-amber-700">{formatCurrency(item.misc)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-emerald-700">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {detailedItemSummaries.plantExp.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No plant expense entries found for the selected period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plant Mess Expenses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <h3 className="text-lg font-medium text-green-800">Plant Mess Breakdown</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Spending</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Misc</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedItemSummaries.plantMess.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-right text-blue-700">{formatCurrency(item.spending)}</td>
                        <td className="px-4 py-2 text-sm text-right text-amber-700">{formatCurrency(item.misc)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-emerald-700">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {detailedItemSummaries.plantMess.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No mess entries found for the selected period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Salaries */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
              <div className="px-6 py-4 border-b border-gray-200 bg-pink-50">
                <h3 className="text-lg font-medium text-pink-800">Staff Salaries Summary</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Spending</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Misc</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedItemSummaries.salaries.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-right text-blue-700">{formatCurrency(item.spending)}</td>
                        <td className="px-4 py-2 text-sm text-right text-amber-700">{formatCurrency(item.misc)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-emerald-700">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {detailedItemSummaries.salaries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No salary entries found for the selected period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonthlySummary;

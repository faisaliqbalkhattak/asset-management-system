import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

const ProfitSharing = () => {
  const {
    generatorOperations = [],
    excavatorOperations = [],
    loaderOperations = [],
    blastingMaterials = [],
    langarExpenses = [],
    plantExpenses = [],
    miscExpenses = [],
    dumperOperations = [],
    salaries = [],
    dailyProductions = [],
    monthlyProductionSummaries = [], // Destructure this from context
    profitSharing = [],
    saveProfitSharing,
    appSettings,
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState(MONTH_NAMES[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [partnerAShare, setPartnerAShare] = useState(appSettings.partnerAShare);
  const [partnerBShare, setPartnerBShare] = useState(appSettings.partnerBShare);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  // Calculate expenses for selected month/year
  const monthlyExpenses = useMemo(() => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    
    const filterByMonth = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    };

    // Initialize expense breakdown
    const expenses = {
      generator: 0,
      excavator: 0,
      loaders: 0,
      dumpers: 0,
      blasting: 0,
      langar: 0,
      plant_exp: 0,
      human_res: 0,
      misc_exp: 0,
    };

    // Generator
    generatorOperations.filter(op => filterByMonth(op.operation_date))
      .forEach(op => { expenses.generator += parseFloat(op.total_amount) || 0; });

    // Excavator (includes misc as it's part of total)
    excavatorOperations.filter(op => filterByMonth(op.operation_date))
      .forEach(op => { expenses.excavator += parseFloat(op.total_amount) || 0; });

    // Loaders
    loaderOperations.filter(op => filterByMonth(op.operation_date))
      .forEach(op => { expenses.loaders += parseFloat(op.total_amount) || 0; });

    // Dumpers (trip amount only, excluding misc)
    dumperOperations.filter(op => filterByMonth(op.trip_date))
      .forEach(op => { expenses.dumpers += parseFloat(op.trip_amount) || 0; });

    // Blasting Materials
    blastingMaterials.filter(m => filterByMonth(m.purchase_date))
      .forEach(m => { expenses.blasting += parseFloat(m.total_amount) || 0; });

    // Langar Expenses
    langarExpenses.filter(e => filterByMonth(e.expense_date))
      .forEach(e => { expenses.langar += parseFloat(e.amount) || 0; });

    // Plant Expenses
    plantExpenses.filter(e => filterByMonth(e.expense_date))
      .forEach(e => { expenses.plant_exp += parseFloat(e.amount) || 0; });

    // Misc Expenses
    miscExpenses.filter(e => filterByMonth(e.expense_date))
      .forEach(e => { expenses.misc_exp += parseFloat(e.amount) || 0; });

    // Salaries (salary_month is YYYY-MM format)
    salaries.filter(s => {
      const salaryDate = s.salary_month ? s.salary_month + '-01' : null;
      return filterByMonth(salaryDate);
    }).forEach(s => { expenses.human_res += parseFloat(s.net_salary) || 0; });

    expenses.total = Object.values(expenses).reduce((sum, val) => sum + val, 0);

    return expenses;
  }, [selectedMonth, selectedYear, generatorOperations, excavatorOperations, loaderOperations,
      dumperOperations, blastingMaterials, langarExpenses, plantExpenses, miscExpenses, salaries]);

// ================================================================
    // PRODUCTION & REVENUE - Monthly calculations
    // ================================================================
    // DB columns (monthly_production_summary table):
    //   total_net_aggregate_cft  = Total production for the month
    //   sold_at_site_cft         = Quantity sold (CFT)
    //   sold_at_site_amount      = Total cash received from sales (PKR)
    //   approx_per_cft_cost      = Expected per-CFT value of remaining stock
    //   per_cft_cost             = sold_amount / sold_cft (auto-calculated)
    //   stock_at_site_cft        = production - sold (auto-calculated)
    //   cost_of_stocked_material = stock_cft * approx_cost (auto-calculated)
    //   total_cost               = sold_amount + cost_of_stocked_material
    // ================================================================
  const monthlyProduction = useMemo(() => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    
    // 1. Start from Daily Productions (Live Data)
    const filtered = dailyProductions.filter(p => {
      if (!p.production_date) return false;
      const d = new Date(p.production_date);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    // Initialize with zeros
    let gravel_cft = 0;           // Raw gravel input
    let net_aggregate = 0;        // Net production after deductions
    let sold_qty_cft = 0;         // How many CFT were sold
    let sold_total_amount = 0;    // Total cash received from sales (PKR)
    let stock_qty_cft = 0;        // Remaining stock = production - sold
    let stock_rate_per_cft = 0;   // Expected value per CFT of remaining stock
    let sold_rate_per_cft = 0;    // Per CFT price at which we sold = sold_amount/sold_qty

    // Sum daily production entries
    filtered.forEach(p => {
      gravel_cft += p.gravel_cft || 0;
      net_aggregate += p.net_aggregate_cft || p.net_aggregate || 0;
    });

    // 2. Check for Monthly Summary (Finalized Data Override)
    //    The Production page saves month as "February" (full name)
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const summary = monthlyProductionSummaries.find(s => 
      (s.summary_month === selectedMonth || s.summary_month === monthNum) && 
      parseInt(s.summary_year) === year
    );

    if (summary) {
      // Override with saved snapshot values
      if (summary.total_net_aggregate_cft) net_aggregate = parseFloat(summary.total_net_aggregate_cft);
      sold_qty_cft = parseFloat(summary.sold_at_site_cft) || 0;
      sold_total_amount = parseFloat(summary.sold_at_site_amount) || 0;
      stock_qty_cft = parseFloat(summary.stock_at_site_cft) || 0;
      stock_rate_per_cft = parseFloat(summary.approx_per_cft_cost) || 0;
    } else {
      // No saved summary — stock is everything produced, nothing sold
      stock_qty_cft = net_aggregate;
    }

    // Derived calculations
    sold_rate_per_cft = sold_qty_cft > 0 ? (sold_total_amount / sold_qty_cft) : 0;
    const stock_total_value = stock_qty_cft * stock_rate_per_cft;    // Value of remaining stock
    const total_revenue = sold_total_amount + stock_total_value;      // Cash + Stock Value

    return {
      gravel_cft,
      net_aggregate,
      sold_qty_cft,           // Quantity sold
      sold_total_amount,      // Cash received from sales
      sold_rate_per_cft,      // Per-CFT selling price
      stock_qty_cft,          // Remaining stock quantity
      stock_rate_per_cft,     // Per-CFT expected cost of stock
      stock_total_value,      // Total value of remaining stock
      total_revenue,          // Grand total = Cash Sales + Stock Value
      // Legacy aliases for compatibility
      valuation_rate_per_cft: stock_rate_per_cft,
      sale_amount: sold_total_amount,
      gross_value_generated: total_revenue,
    };
  }, [selectedMonth, selectedYear, dailyProductions, monthlyProductionSummaries]);

  // Calculate profit
  // Profit = (Cash Sales + Stock Value) - Expenses
  // Or Profit = Gross Value Generated - Expenses
  const netProfit = monthlyProduction.gross_value_generated - monthlyExpenses.total;
  const partnerAAmount = (netProfit * partnerAShare / 100);
  const partnerBAmount = (netProfit * partnerBShare / 100);

  // Auto-balance shares
  const handleShareChange = (partner, value) => {
    const newValue = Math.min(100, Math.max(0, parseFloat(value) || 0));
    if (partner === 'A') {
      setPartnerAShare(newValue);
      setPartnerBShare(100 - newValue);
    } else {
      setPartnerBShare(newValue);
      setPartnerAShare(100 - newValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await saveProfitSharing({
        month: selectedMonth,
        year: parseInt(selectedYear),
        total_revenue: monthlyProduction.gross_value_generated,
        total_expenses: monthlyExpenses.total,
        net_profit: netProfit,
        partner_a_share: partnerAShare,
        partner_b_share: partnerBShare,
        partner_a_amount: partnerAAmount,
        partner_b_amount: partnerBAmount,
        net_aggregate_cft: monthlyProduction.net_aggregate,
        sold_cft: monthlyProduction.sold_cft,
        sold_amount: monthlyProduction.sale_amount,
        cost_per_cft: monthlyProduction.valuation_rate_per_cft || 0,
        stock_cft: monthlyProduction.stock_cft,
        stock_value: monthlyProduction.stock_value,
      });
      setSuccess('Profit sharing saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error saving profit sharing');
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profit Sharing Summary</h1>

      {/* Month/Year Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Period</h2>
        <div className="flex gap-4 items-end">
          <div className="w-48">
            <Label htmlFor="month">Month</Label>
            <Select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {MONTH_NAMES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
          <div className="w-32">
            <Label htmlFor="year">Year</Label>
            <Select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700">Total Value (Sales + Stock)</div>
          <div className="text-2xl font-bold text-green-800">
            PKR {formatCurrency(monthlyProduction.gross_value_generated)}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700">Total Expenses</div>
          <div className="text-2xl font-bold text-red-800">
            PKR {formatCurrency(monthlyExpenses.total)}
          </div>
        </div>
        <div className={`${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
          <div className={`text-sm ${netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
            Net {netProfit >= 0 ? 'Profit' : 'Loss'}
          </div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>
            PKR {formatCurrency(Math.abs(netProfit))}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700">Stock Valuation Rate</div>
          <div className="text-2xl font-bold text-blue-800">
            PKR {(monthlyProduction.valuation_rate_per_cft || 0).toFixed(2)}/CFT
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Expense Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-4">Expense Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Generator</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.generator)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Excavator</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.excavator)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Loaders</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.loaders)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Dumpers</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.dumpers)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Blasting Material</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.blasting)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Langar</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.langar)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Plant Expense</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.plant_exp)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Human Resources</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.human_res)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Misc Expenses</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.misc_exp)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg text-red-700">
              <span>Total Expenses</span>
              <span>PKR {formatCurrency(monthlyExpenses.total)}</span>
            </div>
          </div>
        </div>

        {/* Production Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-800 mb-4">Production & Revenue Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Gravel Input</span>
              <span className="font-medium">{formatCurrency(monthlyProduction.gravel_cft)} CFT</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Net Aggregate Produced</span>
              <span className="font-medium">{formatCurrency(monthlyProduction.net_aggregate)} CFT</span>
            </div>
            
            {/* Sales Section */}
            <div className="bg-green-50 p-2 rounded -mx-2 my-2">
              <div className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Sold</div>
              <div className="flex justify-between py-1 border-b border-green-100">
                <span className="text-green-800">Quantity Sold</span>
                <span className="font-bold text-green-700">{formatCurrency(monthlyProduction.sold_qty_cft)} CFT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-green-100">
                <span className="text-green-800">Cash Received</span>
                <span className="font-bold text-green-700">PKR {formatCurrency(monthlyProduction.sold_total_amount)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-xs text-green-600 italic">Cost per CFT (Avg. Selling Price)</span>
                <span className="text-xs text-green-600 italic">
                   PKR {monthlyProduction.sold_rate_per_cft.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Stock Section */}
            <div className="bg-amber-50 p-2 rounded -mx-2 my-2">
              <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Remaining Stock</div>
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-amber-800">Stock Quantity</span>
                <span className="font-bold text-amber-700">{formatCurrency(monthlyProduction.stock_qty_cft)} CFT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-amber-800">Expected Rate per CFT</span>
                <span className="font-bold text-amber-700">
                  PKR {(monthlyProduction.stock_rate_per_cft || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-amber-800">Est. Stock Value</span>
                <span className="font-bold text-amber-700">PKR {formatCurrency(monthlyProduction.stock_total_value)}</span>
              </div>
            </div>

            <div className="flex justify-between py-3 mt-2 border-t-2 border-green-200">
              <span className="font-bold text-lg text-emerald-800">Total Revenue</span>
              <div className="text-right">
                <div className="font-bold text-lg text-emerald-800">PKR {formatCurrency(monthlyProduction.total_revenue)}</div>
                <div className="text-xs text-emerald-600 font-normal">(Cash Received + Stock Value)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Share Calculation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Share Distribution</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="partnerAShare">Partner A Share (%)</Label>
            <Input
              type="number"
              id="partnerAShare"
              value={partnerAShare}
              onChange={(e) => handleShareChange('A', e.target.value)}
              min="0"
              max="100"
              className="bg-blue-50"
            />
          </div>
          <div>
            <Label>Partner A Amount</Label>
            <Input
              type="text"
              value={`PKR ${formatCurrency(partnerAAmount)}`}
              readOnly
              className={`font-bold ${partnerAAmount >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}
            />
          </div>
          <div>
            <Label htmlFor="partnerBShare">Partner B Share (%)</Label>
            <Input
              type="number"
              id="partnerBShare"
              value={partnerBShare}
              onChange={(e) => handleShareChange('B', e.target.value)}
              min="0"
              max="100"
              className="bg-purple-50"
            />
          </div>
          <div>
            <Label>Partner B Amount</Label>
            <Input
              type="text"
              value={`PKR ${formatCurrency(partnerBAmount)}`}
              readOnly
              className={`font-bold ${partnerBAmount >= 0 ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}
            />
          </div>
        </div>

        <div className={`p-3 rounded-md text-sm font-medium mb-4 ${
          partnerAShare + partnerBShare === 100
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {partnerAShare + partnerBShare === 100
            ? `✓ Shares total: ${partnerAShare + partnerBShare}% (Valid)`
            : `✗ Shares total: ${partnerAShare + partnerBShare}% (Must equal exactly 100%)`
          }
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || partnerAShare + partnerBShare !== 100}
          >
            {isSubmitting ? 'Saving...' : 'Save Profit Sharing'}
          </Button>
        </div>
      </div>

      {/* Profit Sharing History */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
          <h2 className="text-lg font-medium text-emerald-800">Profit Sharing History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Partner A</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-600 uppercase">Partner B</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Production</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/CFT</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profitSharing.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No profit sharing records yet
                  </td>
                </tr>
              ) : (
                [...profitSharing]
                  .sort((a, b) => {
                    const yearA = a.period_year || a.year;
                    const yearB = b.period_year || b.year;
                    if (yearB !== yearA) return yearB - yearA;
                    return MONTH_NAMES.indexOf(b.period_month || b.month) - MONTH_NAMES.indexOf(a.period_month || a.month);
                  })
                  .map((ps) => {
                    const month = ps.period_month || ps.month;
                    const year = ps.period_year || ps.year;
                    const revenue = ps.total_income || ps.total_revenue || 0;
                    const expenses = ps.actual_expenses || ps.total_expenses || 0;
                    const netProfit = ps.profit || ps.net_profit || (revenue - expenses);
                    const partnerAAmount = ps.partner1_share_amount || ps.partner_a_amount || 0;
                    const partnerAShare = ps.partner1_share_percentage || ps.partner_a_share || 50;
                    const partnerBAmount = ps.partner2_share_amount || ps.partner_b_amount || 0;
                    const partnerBShare = ps.partner2_share_percentage || ps.partner_b_share || 50;
                    const production = ps.stock_at_site_cft || ps.net_aggregate_cft || 0;
                    const costPerCft = ps.estimated_rate || ps.cost_per_cft || 0;
                    return (
                    <tr key={ps.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{month} {year}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-700">{formatCurrency(revenue)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrency(expenses)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                        {formatCurrency(netProfit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-700 font-medium">
                        {formatCurrency(partnerAAmount)} ({partnerAShare}%)
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-purple-700 font-medium">
                        {formatCurrency(partnerBAmount)} ({partnerBShare}%)
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {formatCurrency(production)} CFT
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {costPerCft?.toFixed(2) || '-'}
                      </td>
                    </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitSharing;

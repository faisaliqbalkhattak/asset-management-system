import React, { useState, useMemo, useEffect } from 'react';
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
    plantMessExpenses = [],
    plantExpenses = [],
    dumperOperations = [],
    salaries = [],
    dailyProductions = [],
    monthlyProductionSummaries = [], // Destructure this from context
    profitSharing = [],
    saveProfitSharing,
    partnerLedgerEntries = [],
    partnerLedgerBalances = [],
    addPartnerPayment,
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState(MONTH_NAMES[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [historyMonth, setHistoryMonth] = useState('');
  const [historyYear, setHistoryYear] = useState('');
  const [partnerShares, setPartnerShares] = useState({
    partner1: 25,
    partner2: 25,
    partner3: 25,
    partner4: 25,
  });
  const [paymentForm, setPaymentForm] = useState({
    partner_id: '1',
    entry_date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: '',
  });
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
      ...plantMessExpenses,
      ...plantExpenses,
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
      plantMessExpenses, plantExpenses, dumperOperations, salaries, dailyProductions]);

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
      plant_mess: 0,
      plant_exp: 0,
      human_res: 0,
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

    // Dumpers (total_amount includes trip amount + misc)
    dumperOperations.filter(op => filterByMonth(op.trip_date))
      .forEach(op => { expenses.dumpers += parseFloat(op.total_amount) || 0; });

    // Blasting Materials
    blastingMaterials.filter(m => filterByMonth(m.purchase_date))
      .forEach(m => { expenses.blasting += parseFloat(m.total_amount) || 0; });

    // Plant Mess Expenses
    plantMessExpenses.filter(e => filterByMonth(e.expense_date))
      .forEach(e => { expenses.plant_mess += parseFloat(e.total_amount) || 0; });

    // Plant Expenses
    plantExpenses.filter(e => filterByMonth(e.expense_date))
      .forEach(e => { expenses.plant_exp += parseFloat(e.total_amount) || 0; });

    // Salaries (salary_month is YYYY-MM format)
    salaries.filter(s => {
      const salaryDate = s.salary_month ? s.salary_month + '-01' : null;
      return filterByMonth(salaryDate);
    }).forEach(s => { expenses.human_res += parseFloat(s.total_amount) || 0; });

    expenses.total = Object.values(expenses).reduce((sum, val) => sum + val, 0);

    return expenses;
  }, [selectedMonth, selectedYear, generatorOperations, excavatorOperations, loaderOperations,
      dumperOperations, blastingMaterials, plantMessExpenses, plantExpenses, salaries]);

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
    let stock_qty_cft = 0;        // Remaining stock (after allowance)
    let stock_qty_raw = 0;        // Remaining stock before allowance
    let stock_rate_per_cft = 0;   // Expected value per CFT of remaining stock
    let sold_rate_per_cft = 0;    // Per CFT price at which we sold = sold_amount/sold_qty
    let allowance_cft = 0;

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
      allowance_cft = parseFloat(summary.allowance_cft) || 0;
      stock_qty_raw = stock_qty_cft + allowance_cft;
    } else {
      // No saved summary — stock is everything produced, nothing sold
      stock_qty_cft = net_aggregate;
      stock_qty_raw = net_aggregate;
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
      stock_qty_raw,          // Remaining before allowance
      allowance_cft,
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
  const partner1Amount = (netProfit * (parseFloat(partnerShares.partner1) || 0) / 100);
  const partner2Amount = (netProfit * (parseFloat(partnerShares.partner2) || 0) / 100);
  const partner3Amount = (netProfit * (parseFloat(partnerShares.partner3) || 0) / 100);
  const partner4Amount = (netProfit * (parseFloat(partnerShares.partner4) || 0) / 100);
  const shareTotal =
    (parseFloat(partnerShares.partner1) || 0) +
    (parseFloat(partnerShares.partner2) || 0) +
    (parseFloat(partnerShares.partner3) || 0) +
    (parseFloat(partnerShares.partner4) || 0);

  const currentRecord = useMemo(() => {
    return profitSharing.find((ps) => {
      const month = ps.period_month || ps.month;
      const year = ps.period_year || ps.year;
      return month === selectedMonth && String(year) === String(selectedYear);
    });
  }, [profitSharing, selectedMonth, selectedYear]);

  const historyRecords = useMemo(() => {
    return [...profitSharing]
      .filter((ps) => {
        const month = ps.period_month || ps.month;
        const year = ps.period_year || ps.year;
        if (historyMonth && month !== historyMonth) return false;
        if (historyYear && String(year) !== String(historyYear)) return false;
        return true;
      })
      .sort((a, b) => {
        const yearA = a.period_year || a.year;
        const yearB = b.period_year || b.year;
        if (yearB !== yearA) return yearB - yearA;
        return MONTH_NAMES.indexOf(b.period_month || b.month) - MONTH_NAMES.indexOf(a.period_month || a.month);
      });
  }, [profitSharing, historyMonth, historyYear]);

  useEffect(() => {
    if (!currentRecord) {
      setPartnerShares({ partner1: 25, partner2: 25, partner3: 25, partner4: 25 });
      return;
    }
    setPartnerShares({
      partner1: currentRecord.partner1_share_percentage ?? 25,
      partner2: currentRecord.partner2_share_percentage ?? 25,
      partner3: currentRecord.partner3_share_percentage ?? 25,
      partner4: currentRecord.partner4_share_percentage ?? 25,
    });
  }, [currentRecord]);

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
        partner1_share_percentage: parseFloat(partnerShares.partner1) || 0,
        partner2_share_percentage: parseFloat(partnerShares.partner2) || 0,
        partner3_share_percentage: parseFloat(partnerShares.partner3) || 0,
        partner4_share_percentage: parseFloat(partnerShares.partner4) || 0,
        partner1_share_amount: partner1Amount,
        partner2_share_amount: partner2Amount,
        partner3_share_amount: partner3Amount,
        partner4_share_amount: partner4Amount,
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
              <span className="text-gray-600">Plant Mess</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.plant_mess)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Plant Expense</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.plant_exp)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Staff Salaries</span>
              <span className="font-medium">PKR {formatCurrency(monthlyExpenses.human_res)}</span>
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
                <span className="text-amber-800">Stock (Before Allowance)</span>
                <span className="font-bold text-amber-700">{formatCurrency(monthlyProduction.stock_qty_raw)} CFT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-amber-800">Allowance on Remaining</span>
                <span className="font-bold text-amber-700">-{formatCurrency(monthlyProduction.allowance_cft)} CFT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-amber-800">Stock (After Allowance)</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800">Partner 1</div>
            <Label className="mt-2">Share %</Label>
            <Input
              type="number"
              value={partnerShares.partner1}
              onChange={(e) => setPartnerShares(prev => ({ ...prev, partner1: e.target.value }))}
              min="0"
              max="100"
              className="bg-white"
            />
            <div className="text-lg font-bold text-blue-700">PKR {formatCurrency(partner1Amount)}</div>
            <div className="text-xs text-blue-700 mt-1">Balance: PKR {formatCurrency((partnerLedgerBalances.find(b => b.partner_id === 1)?.balance) || 0)}</div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <div className="text-sm font-medium text-purple-800">Partner 2</div>
            <Label className="mt-2">Share %</Label>
            <Input
              type="number"
              value={partnerShares.partner2}
              onChange={(e) => setPartnerShares(prev => ({ ...prev, partner2: e.target.value }))}
              min="0"
              max="100"
              className="bg-white"
            />
            <div className="text-lg font-bold text-purple-700">PKR {formatCurrency(partner2Amount)}</div>
            <div className="text-xs text-purple-700 mt-1">Balance: PKR {formatCurrency((partnerLedgerBalances.find(b => b.partner_id === 2)?.balance) || 0)}</div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <div className="text-sm font-medium text-amber-800">Partner 3</div>
            <Label className="mt-2">Share %</Label>
            <Input
              type="number"
              value={partnerShares.partner3}
              onChange={(e) => setPartnerShares(prev => ({ ...prev, partner3: e.target.value }))}
              min="0"
              max="100"
              className="bg-white"
            />
            <div className="text-lg font-bold text-amber-700">PKR {formatCurrency(partner3Amount)}</div>
            <div className="text-xs text-amber-700 mt-1">Balance: PKR {formatCurrency((partnerLedgerBalances.find(b => b.partner_id === 3)?.balance) || 0)}</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <div className="text-sm font-medium text-emerald-800">Partner 4</div>
            <Label className="mt-2">Share %</Label>
            <Input
              type="number"
              value={partnerShares.partner4}
              onChange={(e) => setPartnerShares(prev => ({ ...prev, partner4: e.target.value }))}
              min="0"
              max="100"
              className="bg-white"
            />
            <div className="text-lg font-bold text-emerald-700">PKR {formatCurrency(partner4Amount)}</div>
            <div className="text-xs text-emerald-700 mt-1">Balance: PKR {formatCurrency((partnerLedgerBalances.find(b => b.partner_id === 4)?.balance) || 0)}</div>
          </div>
        </div>

        <div className={`p-3 rounded-md text-sm font-medium mb-4 ${
          shareTotal === 100
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {shareTotal === 100
            ? `✓ Shares total: ${shareTotal}% (Valid)`
            : `✗ Shares total: ${shareTotal}% (Must equal exactly 100%)`
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
            disabled={isSubmitting || shareTotal !== 100}
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
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label htmlFor="historyMonth">Month</Label>
              <Select
                id="historyMonth"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Label htmlFor="historyYear">Year</Label>
              <Select
                id="historyYear"
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
              >
                <option value="">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Partner 1 (Share)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-600 uppercase">Partner 2 (Share)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Partner 3 (Share)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Partner 4 (Share)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Production</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/CFT</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                    No profit sharing records found
                  </td>
                </tr>
              ) : (
                historyRecords.map((ps) => {
                    const month = ps.period_month || ps.month;
                    const year = ps.period_year || ps.year;
                    const revenue = ps.total_income || ps.total_revenue || 0;
                    const expenses = ps.actual_expenses || ps.total_expenses || 0;
                    const netProfit = ps.profit || ps.net_profit || (revenue - expenses);
                    const partner1Amount = ps.partner1_share_amount || 0;
                    const partner2Amount = ps.partner2_share_amount || 0;
                    const partner3Amount = ps.partner3_share_amount || 0;
                    const partner4Amount = ps.partner4_share_amount || 0;
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
                        {formatCurrency(partner1Amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-purple-700 font-medium">
                        {formatCurrency(partner2Amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-amber-700 font-medium">
                        {formatCurrency(partner3Amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-700 font-medium">
                        {formatCurrency(partner4Amount)}
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

      {/* Partner Ledger */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Ledger (Shares & Payments)</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addPartnerPayment({
              partner_id: paymentForm.partner_id,
              entry_date: paymentForm.entry_date,
              amount: paymentForm.amount,
              notes: paymentForm.notes,
            });
            setPaymentForm({
              partner_id: '1',
              entry_date: new Date().toISOString().split('T')[0],
              amount: '',
              notes: '',
            });
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"
        >
          <div>
            <Label>Partner</Label>
            <Select
              value={paymentForm.partner_id}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, partner_id: e.target.value }))}
            >
              <option value="1">Partner 1</option>
              <option value="2">Partner 2</option>
              <option value="3">Partner 3</option>
              <option value="4">Partner 4</option>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={paymentForm.entry_date}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, entry_date: e.target.value }))}
            />
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit">Add Payment</Button>
          </div>
        </form>

        {/* Totals by Partner */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Allocated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partnerLedgerBalances.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No balances found</td>
                </tr>
              ) : (
                partnerLedgerBalances.map((row) => (
                  <tr key={row.partner_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">Partner {row.partner_id}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(row.total_share)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(row.total_paid)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(row.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Allocations (Share Entries) */}
        <div className="overflow-x-auto mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Allocations (Share Entries)</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partnerLedgerEntries.filter(e => e.entry_type === 'SHARE').length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No allocation entries found</td>
                </tr>
              ) : (
                partnerLedgerEntries
                  .filter(e => e.entry_type === 'SHARE')
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.entry_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.period_month ? `${entry.period_month} ${entry.period_year || ''}` : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Partner {entry.partner_id}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.notes || '-'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Payments */}
        <div className="overflow-x-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Payments</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partnerLedgerEntries.filter(e => e.entry_type === 'PAYMENT').length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No payment entries found</td>
                </tr>
              ) : (
                partnerLedgerEntries
                  .filter(e => e.entry_type === 'PAYMENT')
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.entry_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Partner {entry.partner_id}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.notes || '-'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitSharing;

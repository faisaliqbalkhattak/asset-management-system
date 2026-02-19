import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

const Production = () => {
  const { dailyProductions, addDailyProduction, updateDailyProduction, deleteDailyProduction, saveMonthlyProduction, monthlyProductionSummaries } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingProductionId, setEditingProductionId] = useState(null);

  // Monthly Sales Form State
  const [salesData, setSalesData] = useState({
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    sold_cft: '',
    sold_amount: '',
    approx_cost: '',
    allowance_percent: '15',
  });
  
  // New form with proper production workflow
  const [formData, setFormData] = useState({
    production_date: '',
    gravel_cft: '',           // Input: Gravel in cubic feet
    clay_dust_percent: '33.33', // Default 33.33% deduction for clay & stone dust
    notes: '',
  });

  // Auto-calculated values
  const gravelCft = parseFloat(formData.gravel_cft) || 0;
  const clayDustPercent = parseFloat(formData.clay_dust_percent) || 33.33;
  
  // Calculations matching the Excel workflow (allowance moved to monthly level)
  const clayDustCft = (gravelCft * clayDustPercent / 100);
  const aggregateProduced = gravelCft - clayDustCft;
  const netAggregateCft = aggregateProduced;

  // Form validation
  const isFormValid = formData.production_date && formData.gravel_cft && gravelCft > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const resetForm = () => {
    setFormData({
      production_date: '',
      gravel_cft: '',
      clay_dust_percent: '33.33',
      notes: '',
    });
    setError('');
    setSuccess('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await addDailyProduction({
        production_date: formData.production_date,
        gravel_cft: gravelCft,
        clay_dust_percent: clayDustPercent,
        clay_dust_cft: clayDustCft,
        aggregate_produced: aggregateProduced,
        allowance_percent: 0,
        allowance_cft: 0,
        net_aggregate_cft: netAggregateCft,
        notes: formData.notes || '',
      });
      setSuccess('Production entry saved successfully!');
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding production');
      setIsSubmitting(false);
    }
  };

  // Monthly summary with proper calculations
  const productionByMonth = useMemo(() => {
    return dailyProductions.reduce((acc, prod) => {
      const date = new Date(prod.production_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = { 
          totalGravel: 0, 
          totalNet: 0, 
          count: 0 
        };
      }
      acc[key].totalGravel += prod.gravel_cft || 0;
      acc[key].totalNet += prod.net_aggregate_cft || 0;
      acc[key].count += 1;
      return acc;
    }, {});
  }, [dailyProductions]);

  // Monthly Sales Calculations
  const salesCalculations = useMemo(() => {
    const monthKey = `${salesData.year}-${salesData.month}`;
    
    // Helper to get month name from number "01" -> "January"
    const getMonthName = (m) => {
      const idx = parseInt(m) - 1;
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return months[idx];
    };
    
    // Check if we have a summary from backend
    // Backend returns summary_month (name) and summary_year
    const summary = monthlyProductionSummaries?.find(s => 
      (s.summary_year == salesData.year && s.summary_month === getMonthName(salesData.month)) ||
      s.month === monthKey // Fallback if API changed to return formatted key
    );
    
    let totalProducedRaw = 0;
    if (summary?.net_aggregate_cft) {
      // Use stored net aggregate if available (snapshot)
      totalProducedRaw = summary.total_net_aggregate_cft || summary.net_aggregate_cft;
    } else {
      // Fallback to daily calculations
      totalProducedRaw = productionByMonth[monthKey]?.totalNet || 0;
    }

    // Round total production to nearest integer to match the UI display and prevent
    // floating point confusion (e.g., -0.000...1 stock resulting in negative value).
    // Users expect "what they see is what is calculated".
    const totalProducedRaw2 = Math.round(totalProducedRaw);

    // Apply monthly allowance deduction
    const allowancePercent = parseFloat(salesData.allowance_percent) || 0;
    const allowanceDeduction = Math.round(totalProducedRaw2 * allowancePercent / 100);
    const totalProduced = totalProducedRaw2 - allowanceDeduction;

    const soldCft = parseFloat(salesData.sold_cft) || 0;
    const soldAmount = parseFloat(salesData.sold_amount) || 0;
    const approxCost = parseFloat(salesData.approx_cost) || 0;

    const remainingStock = totalProduced - soldCft;
    const perCftCostSold = soldCft > 0 ? (soldAmount / soldCft) : 0;
    
    // Stock Value logic: User requirement - approx cost is per CFT of remaining stock
    const stockValue = remainingStock * approxCost; 
    const totalMonthlyValue = soldAmount + stockValue;
    // Unit cost for display is now just the input approx cost
    const unitCost = approxCost;

    return {
      monthKey,
      totalProducedRaw: totalProducedRaw2,
      allowancePercent,
      allowanceDeduction,
      totalProduced,
      remainingStock,
      perCftCostSold,
      stockValue,
      totalMonthlyValue,
      unitCost
    };
  }, [salesData, monthlyProductionSummaries, productionByMonth]);

  const handleSalesChange = (e) => {
    const { name, value } = e.target;
    setSalesData(prev => ({ ...prev, [name]: value }));
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Reuse existing error/success states or create new ones if needed. 
    // Since UI uses single success/error message area, we can reuse.
    // However, the UI location for sales form is different.
    // I'll assume reusing is fine for now, or I'll just rely on the existing states 
    // but I'll make sure to clear them on other actions.
    setError('');
    setSuccess('');

    try {
      // Pass the calculated total production to be saved
      await saveMonthlyProduction({
        month: salesData.month,
        year: salesData.year,
        sold_cft: parseFloat(salesData.sold_cft),
        sold_amount: parseFloat(salesData.sold_amount),
        approx_cost: parseFloat(salesData.approx_cost),
        allowance_percent: parseFloat(salesData.allowance_percent) || 0,
        // Important: Save the current total production so the snapshot is consistent
        net_aggregate_cft: salesCalculations.totalProduced
      });
      setSuccess('Monthly sales data saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving monthly sales');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit production entry - populate form with existing data
  const handleEditProduction = (prod) => {
    setEditingProductionId(prod.id);
    setFormData({
      production_date: prod.production_date,
      gravel_cft: prod.gravel_cft || '',
      clay_dust_percent: prod.clay_dust_percent || '33.33',
      notes: prod.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update production entry
  const handleUpdateProduction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await updateDailyProduction(editingProductionId, {
        production_date: formData.production_date,
        gravel_cft: gravelCft,
        clay_dust_percent: clayDustPercent,
        clay_dust_cft: clayDustCft,
        aggregate_produced: aggregateProduced,
        allowance_percent: 0,
        allowance_cft: 0,
        net_aggregate_cft: netAggregateCft,
        notes: formData.notes || '',
      });
      setSuccess('Production entry updated successfully!');
      setEditingProductionId(null);
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating production');
      setIsSubmitting(false);
    }
  };

  // Delete production entry
  const handleDeleteProduction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this production entry?')) return;
    try {
      await deleteDailyProduction(id);
      setSuccess('Production entry deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting production');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingProductionId(null);
    resetForm();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Daily Production</h1>

      {/* Add Production Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-emerald-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
          {editingProductionId ? 'Edit Daily Aggregate Production' : 'Add Daily Aggregate Production'}
        </h2>

        {/* Process Flow Diagram */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="font-medium text-emerald-800">Gravel Input</div>
              <div className="text-2xl font-bold text-emerald-600">{gravelCft.toLocaleString()}</div>
              <div className="text-xs text-emerald-600">CFT</div>
            </div>
            <div className="text-emerald-400">→</div>
            <div className="text-center">
              <div className="font-medium text-amber-800">- Clay/Dust ({clayDustPercent}%)</div>
              <div className="text-2xl font-bold text-amber-600">-{clayDustCft.toFixed(0)}</div>
              <div className="text-xs text-amber-600">CFT</div>
            </div>
            <div className="text-emerald-400">→</div>
            <div className="text-center bg-green-100 p-2 rounded-lg">
              <div className="font-medium text-green-800">Net Aggregate</div>
              <div className="text-2xl font-bold text-green-700">{netAggregateCft.toFixed(0)}</div>
              <div className="text-xs text-green-600">CFT</div>
            </div>
          </div>
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

        <form onSubmit={editingProductionId ? handleUpdateProduction : handleSubmit} className="space-y-4">
          {/* Main Input Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="production_date">Date *</Label>
              <Input
                type="date"
                id="production_date"
                name="production_date"
                value={formData.production_date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="gravel_cft">Gravel Input (CFT) *</Label>
              <Input
                type="number"
                id="gravel_cft"
                name="gravel_cft"
                value={formData.gravel_cft}
                onChange={handleChange}
                placeholder="e.g., 58186"
                step="1"
                min="0"
                required
                className="bg-emerald-50 border-emerald-200"
              />
            </div>

            <div>
              <Label htmlFor="clay_dust_percent">Clay & Dust Deduction (%)</Label>
              <Input
                type="number"
                id="clay_dust_percent"
                name="clay_dust_percent"
                value={formData.clay_dust_percent}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                className="bg-amber-50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              type="text"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional remarks"
            />
          </div>

          <div className="flex justify-end gap-2">
            {editingProductionId && (
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={resetForm}>
              Reset
            </Button>
            <Button 
              type="submit"
              disabled={!isFormValid || isSubmitting}
              submitted={success !== ''}
            >
              {isSubmitting && !success ? 'Saving...' : editingProductionId ? 'Update Production' : 'Save Production'}
            </Button>
          </div>
        </form>
      </div>

      {/* Monthly Sales & Stock Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-emerald-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
          Monthly Sales & Stock Management
        </h2>

        <form onSubmit={handleSalesSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Month/Year Selection */}
            <div>
              <Label>Month / Year</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  name="month"
                  value={salesData.month}
                  onChange={handleSalesChange}
                >
                  <option value="01">Jan</option>
                  <option value="02">Feb</option>
                  <option value="03">Mar</option>
                  <option value="04">Apr</option>
                  <option value="05">May</option>
                  <option value="06">Jun</option>
                  <option value="07">Jul</option>
                  <option value="08">Aug</option>
                  <option value="09">Sep</option>
                  <option value="10">Oct</option>
                  <option value="11">Nov</option>
                  <option value="12">Dec</option>
                </Select>
                <Select
                  name="year"
                  value={salesData.year}
                  onChange={handleSalesChange}
                >
                  {[2023, 2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Allowance */}
            <div>
              <Label htmlFor="allowance_percent">Allowance & Margin (%)</Label>
              <Input
                type="number"
                name="allowance_percent"
                value={salesData.allowance_percent}
                onChange={handleSalesChange}
                placeholder="15"
                step="0.01"
                min="0"
                max="100"
                className="bg-red-50 border-red-200"
              />
            </div>

            {/* Sales Inputs */}
            <div>
              <Label htmlFor="sold_cft">Quantity Sold (CFT)</Label>
              <Input
                type="number"
                name="sold_cft"
                value={salesData.sold_cft}
                onChange={handleSalesChange}
                placeholder="0"
                className="bg-blue-50"
              />
            </div>
            
            <div>
              <Label htmlFor="sold_amount">Total Sale Amount (PKR)</Label>
              <Input
                type="number"
                name="sold_amount"
                value={salesData.sold_amount}
                onChange={handleSalesChange}
                placeholder="0"
                className="bg-green-50"
              />
            </div>
            
            <div>
              <Label htmlFor="approx_cost">Expected Stock Rate (Per CFT)</Label>
              <Input
                type="number"
                name="approx_cost"
                value={salesData.approx_cost}
                onChange={handleSalesChange}
                placeholder="Rate per CFT for remaining stock"
                className="bg-amber-50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Update Sales Data
            </Button>
          </div>
        </form>

        {/* Real-time Calculations for Selected Month */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wider">
            Stock & Value Analysis ({salesData.month}/{salesData.year})
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 text-center">
            
            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Aggregate Produced</div>
              <div className="text-lg font-bold text-gray-800">
                {salesCalculations.totalProducedRaw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">CFT</div>
            </div>

            <div className="bg-red-50 p-3 rounded shadow-sm border border-red-100">
              <div className="text-xs text-red-600 mb-1">Allowance ({salesCalculations.allowancePercent}%)</div>
              <div className="text-lg font-bold text-red-600">
                -{salesCalculations.allowanceDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-red-400">CFT</div>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-green-200">
              <div className="text-xs text-green-600 mb-1">Net Production</div>
              <div className="text-lg font-bold text-green-700">
                {salesCalculations.totalProduced.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">CFT</div>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Remaining Stock</div>
              <div className="text-lg font-bold text-purple-700">
                {salesCalculations.remainingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">CFT</div>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Selling Price / CFT</div>
              <div className="text-lg font-bold text-blue-600">
                {salesCalculations.perCftCostSold.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400">PKR</div>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Est. Stock Value</div>
              <div className="text-lg font-bold text-amber-600">
                {salesCalculations.stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">@ {salesCalculations.unitCost.toFixed(2)} /CFT</div>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
              <div className="text-lg font-bold text-emerald-700">
                {salesCalculations.totalMonthlyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">Sales + Stock Value</div>
            </div>

          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      {Object.keys(productionByMonth).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(productionByMonth)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 3)
              .map(([month, data]) => (
                <div key={month} className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                  <div className="text-sm font-medium text-gray-600 mb-2">{month}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">Net Aggregate</div>
                      <div className="text-xl font-bold text-emerald-700">{data.totalNet.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">CFT</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Entries</div>
                      <div className="text-xl font-bold text-blue-600">{data.count}</div>
                      <div className="text-xs text-gray-500">days</div>
                    </div>
                  </div>

                </div>
              ))}
          </div>
        </div>
      )}
      {/* Monthly Sales History Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <h2 className="text-lg font-medium text-blue-900">Monthly Sales History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Production</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">Sold (CFT)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">Sale Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-600 uppercase tracking-wider">Stock (CFT)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase tracking-wider">Stock Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyProductionSummaries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No sales records found</td>
                </tr>
              ) : (
                [...monthlyProductionSummaries]
                  .sort((a, b) => {
                     const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                     if (parseInt(a.summary_year) !== parseInt(b.summary_year)) return parseInt(b.summary_year) - parseInt(a.summary_year);
                     const aIdx = MONTHS.indexOf(a.summary_month);
                     const bIdx = MONTHS.indexOf(b.summary_month);
                     return bIdx - aIdx;
                  })
                  .map((summary) => {
                  // Convert month name to number for the Edit button dropdown
                  const MONTH_MAP = { January:'01', February:'02', March:'03', April:'04', May:'05', June:'06', July:'07', August:'08', September:'09', October:'10', November:'11', December:'12' };
                  const monthNum = MONTH_MAP[summary.summary_month] || summary.summary_month;
                  const monthShort = MONTH_MAP[summary.summary_month]
                    ? summary.summary_month.substring(0, 3)
                    : summary.summary_month;

                  return (
                  <tr key={summary.id} className="hover:bg-blue-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {monthShort} {summary.summary_year}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {summary.total_net_aggregate_cft?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                      {summary.sold_at_site_cft?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">
                      {summary.sold_at_site_amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                      {summary.stock_at_site_cft?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-amber-600">
                      {(summary.approx_per_cft_cost || 0).toLocaleString()}/CFT
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-emerald-700 font-bold">
                      {(summary.total_cost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSalesData({
                            month: monthNum,
                            year: summary.summary_year.toString(),
                            sold_cft: summary.sold_at_site_cft || 0,
                            sold_amount: summary.sold_at_site_amount || 0,
                            approx_cost: summary.approx_per_cft_cost || 0,
                            allowance_percent: summary.allowance_percent ?? 15
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                  );
                }))
              }
            </tbody>
          </table>
        </div>
      </div>
      {/* Production History Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
          <h2 className="text-lg font-medium text-emerald-900">Production History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Gravel (CFT)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase">Dust</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-green-700 uppercase">Net (CFT)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyProductions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No production records yet
                  </td>
                </tr>
              ) : (
                [...dailyProductions]
                  .sort((a, b) => new Date(b.production_date) - new Date(a.production_date))
                  .slice(0, 20)
                  .map((prod) => (
                    <tr key={prod.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{prod.production_date}</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-700 font-medium">
                        {(prod.gravel_cft || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-amber-600">
                        -{(prod.clay_dust_cft || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                        {(prod.net_aggregate_cft || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={prod.notes || ''}>
                        {prod.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEditProduction(prod)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduction(prod.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
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

export default Production;

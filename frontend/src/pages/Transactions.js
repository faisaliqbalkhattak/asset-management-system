import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';

const Transactions = () => {
  const { getTransactions, expenseCategories } = useData();
  const [filters, setFilters] = useState({
    modelType: '',
    month: '',
    year: '',
  });
  const [expandedRow, setExpandedRow] = useState(null);

  const transactions = getTransactions();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.modelType && t.modelType !== filters.modelType) return false;
      if (filters.month && t.month !== filters.month) return false;
      if (filters.year && t.year !== filters.year) return false;
      return true;
    });
  }, [transactions, filters]);

  const modelTypes = [...new Set(transactions.map((t) => t.modelType))].sort();
  const months = [...new Set(transactions.map((t) => t.month))];
  const years = [...new Set(transactions.map((t) => t.year))].sort((a, b) => b - a);

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Get type-specific badge color
  const getTypeBadgeClass = (type) => {
    const category = expenseCategories.find(c => c.category_name === type);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  // Render detailed row based on transaction type
  const renderDetailRow = (t) => {
    switch (t.modelType) {
      case 'Generator':
        return (
          <tr className="bg-yellow-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Fuel (L):</span>
                  <p className="font-medium">{t.fuel_liters}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fuel Rate:</span>
                  <p className="font-medium">{t.fuel_rate}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fuel Amount:</span>
                  <p className="font-medium text-amber-600">{t.fuel_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rent:</span>
                  <p className="font-medium text-blue-600">{t.rent_per_day?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-bold text-green-600">{t.total_amount?.toLocaleString()}</p>
                </div>
                <div className="col-span-3">
                  <span className="text-gray-500">Remarks:</span>
                  <p className="font-medium">{t.remarks || '-'}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Excavator':
        return (
          <tr className="bg-orange-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Fuel (L):</span>
                  <p className="font-medium">{t.fuel_liters}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fuel Amount:</span>
                  <p className="font-medium text-amber-600">{t.fuel_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rent:</span>
                  <p className="font-medium text-blue-600">{t.rent_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Misc:</span>
                  <p className="font-medium text-red-600">{t.misc_expense?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-bold text-green-600">{t.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Loaders':
        return (
          <tr className="bg-amber-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Loader:</span>
                  <p className="font-medium">{t.equipment_name || 'Loader'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rent:</span>
                  <p className="font-medium">{t.rent_per_day?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fuel Amount:</span>
                  <p className="font-medium text-amber-600">{t.fuel_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-bold text-green-700">{t.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Dumper Trip':
        return (
          <tr className="bg-blue-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Dumper:</span>
                  <p className="font-medium">{t.dumper_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Trips:</span>
                  <p className="font-medium">{t.trips}</p>
                </div>
                <div>
                  <span className="text-gray-500">CFT:</span>
                  <p className="font-medium">{t.cft_per_trip}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rate:</span>
                  <p className="font-medium">{t.rate_per_cft}</p>
                </div>
                <div>
                  <span className="text-gray-500">Trip Amount:</span>
                  <p className="font-bold text-blue-600">{t.trip_amount?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Dumper Misc':
        return (
          <tr className="bg-sky-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Dumper:</span>
                  <p className="font-medium">{t.dumper_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="font-medium">{t.description}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <p className="font-bold text-sky-600">{t.amount?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Blasting Material':
        return (
          <tr className="bg-red-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Item:</span>
                  <p className="font-medium">{t.description}</p>
                </div>
                <div>
                  <span className="text-gray-500">Quantity:</span>
                  <p className="font-medium">{t.quantity}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rate:</span>
                  <p className="font-medium">{t.rate?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Transport:</span>
                  <p className="font-medium">{t.transport_charges?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-bold text-red-600">{t.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Langar':
      case 'Plant Expense':
      case 'Misc Expense':
        return (
          <tr className={`${t.modelType === 'Langar' ? 'bg-green-50' : t.modelType === 'Plant Expense' ? 'bg-purple-50' : 'bg-gray-50'}`}>
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="font-medium">{t.description}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <p className="font-bold">{t.amount?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Salary':
        return (
          <tr className="bg-pink-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Employee:</span>
                  <p className="font-medium">{t.employee_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Base Salary:</span>
                  <p className="font-medium">{t.base_salary?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Deductions:</span>
                  <p className="font-medium text-red-600">-{t.deductions?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bonus:</span>
                  <p className="font-medium text-green-600">+{t.bonus?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Net Salary:</span>
                  <p className="font-bold text-pink-600">{t.net_salary?.toLocaleString()}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      case 'Production':
        return (
          <tr className="bg-emerald-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Gravel:</span>
                  <p className="font-medium">{t.gravel_cft?.toLocaleString()} CFT</p>
                </div>
                <div>
                  <span className="text-gray-500">Clay/Dust:</span>
                  <p className="font-medium text-amber-600">-{t.clay_dust_cft?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Allowance:</span>
                  <p className="font-medium text-red-600">-{t.allowance_cft?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Net Aggregate:</span>
                  <p className="font-bold text-emerald-600">{t.net_aggregate_cft?.toLocaleString()} CFT</p>
                </div>
                <div>
                  <span className="text-gray-500">Notes:</span>
                  <p className="font-medium">{t.notes || '-'}</p>
                </div>
              </div>
            </td>
          </tr>
        );

      default:
        return (
          <tr className="bg-gray-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="text-sm">
                <span className="text-gray-500">Amount:</span>
                <p className="font-bold">{t.amount?.toLocaleString()}</p>
              </div>
            </td>
          </tr>
        );
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Transactions</h1>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="modelType">Transaction Type</Label>
            <Select
              id="modelType"
              value={filters.modelType}
              onChange={(e) => setFilters({ ...filters, modelType: e.target.value })}
            >
              <option value="">All Types</option>
              {modelTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="month">Month</Label>
            <Select
              id="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Select
              id="year"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ modelType: '', month: '', year: '' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-emerald-700">Showing {filteredTransactions.length} transactions</span>
          </div>
          <div>
            <span className="text-emerald-700">Total Amount: </span>
            <span className="text-2xl font-bold text-emerald-800">PKR {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, index) => (
                  <React.Fragment key={`${t.modelType}-${t.id}-${index}`}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${expandedRow === index ? 'bg-gray-100' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {expandedRow === index ? '▼' : '▶'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{t.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(t.modelType)}`}>
                          {t.modelType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[300px] truncate">
                        {t.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {t.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {t.month} {t.year}
                      </td>
                    </tr>
                    {expandedRow === index && renderDetailRow(t)}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Type Legend */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Transaction Types</h3>
        <div className="flex flex-wrap gap-2">
          {modelTypes.map((type) => (
            <span key={type} className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(type)}`}>
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Transactions;

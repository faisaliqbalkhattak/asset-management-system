import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Dashboard = () => {
  const {
    generatorOperations,
    excavatorOperations,
    loaderOperations,
    blastingMaterials,
    langarExpenses,
    plantExpenses,
    miscExpenses,
    dumperOperations,
    dumperMiscExpenses,
    humanResources,
    salaries,
    dailyProductions,
    profitSharing,
    loading,
  } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Generator Operations',
      count: generatorOperations.length,
      link: '/daily-entries',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      label: 'Excavator Operations',
      count: excavatorOperations.length,
      link: '/daily-entries',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      label: 'Loader Operations',
      count: loaderOperations.length,
      link: '/daily-entries',
      color: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Dumper Trips',
      count: dumperOperations.length,
      link: '/daily-entries',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Dumper Misc Expenses',
      count: dumperMiscExpenses.length,
      link: '/daily-entries',
      color: 'bg-sky-100 text-sky-800',
    },
    {
      label: 'Blasting Materials',
      count: blastingMaterials.length,
      link: '/daily-entries',
      color: 'bg-red-100 text-red-800',
    },
    {
      label: 'Langar Expenses',
      count: langarExpenses.length,
      link: '/daily-entries',
      color: 'bg-green-100 text-green-800',
    },
    {
      label: 'Plant Expenses',
      count: plantExpenses.length,
      link: '/daily-entries',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      label: 'Misc Expenses',
      count: miscExpenses.length,
      link: '/daily-entries',
      color: 'bg-gray-100 text-gray-800',
    },
    {
      label: 'Human Resources',
      count: humanResources.length,
      link: '/daily-entries',
      color: 'bg-pink-100 text-pink-800',
    },
    {
      label: 'Salaries Paid',
      count: salaries.length,
      link: '/daily-entries',
      color: 'bg-pink-100 text-pink-800',
    },
    {
      label: 'Daily Productions',
      count: dailyProductions.length,
      link: '/production',
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      label: 'Profit Sharings',
      count: profitSharing.length,
      link: '/profit-sharing',
      color: 'bg-indigo-100 text-indigo-800',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((stat, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <span className={`px-2 py-1 rounded ${stat.color}`}>{stat.label}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                  {stat.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    to={stat.link}
                    className="text-emerald-600 hover:text-emerald-800 underline"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-emerald-800 mb-2">Total Operations</h3>
          <div className="text-3xl font-bold text-emerald-700">
            {generatorOperations.length + excavatorOperations.length + loaderOperations.length + dumperOperations.length}
          </div>
          <p className="text-sm text-emerald-600 mt-1">Equipment & Vehicle operations</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Total Expenses</h3>
          <div className="text-3xl font-bold text-red-700">
            {blastingMaterials.length + langarExpenses.length + plantExpenses.length + miscExpenses.length}
          </div>
          <p className="text-sm text-red-600 mt-1">All expense entries</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Production Days</h3>
          <div className="text-3xl font-bold text-blue-700">{dailyProductions.length}</div>
          <p className="text-sm text-blue-600 mt-1">Total production entries</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

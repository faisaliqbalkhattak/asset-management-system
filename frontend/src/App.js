import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/Toast';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import DailyEntries from './pages/DailyEntries';
import Masters from './pages/Masters';
import Transactions from './pages/Transactions';
import Production from './pages/Production';
import MonthlySummary from './pages/MonthlySummary';
import ProfitSharing from './pages/ProfitSharing';
import YearlySummary from './pages/YearlySummary';

function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/daily-entries" element={<DailyEntries />} />
              <Route path="/masters" element={<Masters />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/production" element={<Production />} />
              <Route path="/monthly-summary" element={<MonthlySummary />} />
              <Route path="/profit-sharing" element={<ProfitSharing />} />
              <Route path="/yearly-summary" element={<YearlySummary />} />
            </Routes>
          </main>
        </div>
      </Router>
      </ToastProvider>
    </DataProvider>
  );
}

export default App;

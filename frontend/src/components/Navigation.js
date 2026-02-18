import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/daily-entries', label: 'Daily Entries' },
  { to: '/masters', label: 'Masters' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/production', label: 'Production' },
  { to: '/monthly-summary', label: 'Monthly Summary' },
  { to: '/profit-sharing', label: 'Profit Sharing' },
  { to: '/yearly-summary', label: 'Yearly Summary' },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center h-16 space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                location.pathname === link.to
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

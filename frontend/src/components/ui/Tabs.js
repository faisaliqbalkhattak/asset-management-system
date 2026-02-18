import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Color mapping for different tab types
const tabColors = {
  equipment: { active: 'border-blue-600 text-blue-600 bg-blue-50', hover: 'hover:text-blue-600 hover:bg-blue-50' },
  loader: { active: 'border-purple-600 text-purple-600 bg-purple-50', hover: 'hover:text-purple-600 hover:bg-purple-50' },
  vehicle: { active: 'border-teal-600 text-teal-600 bg-teal-50', hover: 'hover:text-teal-600 hover:bg-teal-50' },
  material: { active: 'border-orange-600 text-orange-600 bg-orange-50', hover: 'hover:text-orange-600 hover:bg-orange-50' },
  expense: { active: 'border-red-600 text-red-600 bg-red-50', hover: 'hover:text-red-600 hover:bg-red-50' },
  salary: { active: 'border-green-600 text-green-600 bg-green-50', hover: 'hover:text-green-600 hover:bg-green-50' },
  default: { active: 'border-gray-900 text-gray-900 bg-gray-50', hover: 'hover:text-gray-700 hover:bg-gray-50' },
};

export const TabsTrigger = ({ value, children, className = '' }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  const colors = tabColors[value] || tabColors.default;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-md ${
        isActive
          ? `border-b-2 ${colors.active}`
          : `text-gray-500 ${colors.hover}`
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }) => {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) return null;

  return <div className={className}>{children}</div>;
};

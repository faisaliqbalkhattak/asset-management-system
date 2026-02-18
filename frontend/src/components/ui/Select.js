import React from 'react';

export const Select = React.forwardRef(({ 
  children, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

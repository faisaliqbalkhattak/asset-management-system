import React from 'react';

export const Input = React.forwardRef(({ 
  className = '', 
  type = 'text', 
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

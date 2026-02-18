import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled = false,
  submitted = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform';
  
  // If submitted, show green success state
  if (submitted) {
    return (
      <button
        className={`${baseStyles} bg-green-600 text-white cursor-default px-4 py-2 text-sm ${className}`}
        disabled={true}
        {...props}
      >
        ✓ {children}
      </button>
    );
  }
  
  const variants = {
    // Primary: Grey when disabled → Blue when clickable
    primary: disabled 
      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-green-600 active:scale-95 focus:ring-blue-500 shadow-sm hover:shadow-md',
    secondary: disabled
      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 active:scale-95 focus:ring-gray-500',
    success: disabled
      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 active:scale-95 focus:ring-green-500 shadow-sm hover:shadow-md',
    danger: disabled
      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
      : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 active:scale-95 focus:ring-red-500 shadow-sm hover:shadow-md',
    warning: disabled
      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
      : 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 active:scale-95 focus:ring-amber-500 shadow-sm hover:shadow-md',
    ghost: disabled
      ? 'text-gray-400 cursor-not-allowed'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

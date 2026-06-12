import React from 'react';

export const Input = React.forwardRef(({ 
  className = '', 
  type = 'text', 
  step,
  min,
  max,
  onChange,
  onKeyDown,
  ...props 
}, ref) => {
  const isNumberInput = type === 'number';

  const getStepPrecision = (stepValue) => {
    const stepString = stepValue != null ? String(stepValue) : '';
    if (!stepString.includes('.')) return 0;
    return stepString.split('.')[1].length;
  };

  const clampValue = (value) => {
    let nextValue = value;
    const minValue = min === '' || min == null ? null : Number(min);
    const maxValue = max === '' || max == null ? null : Number(max);

    if (minValue != null && !Number.isNaN(minValue) && nextValue < minValue) {
      nextValue = minValue;
    }

    if (maxValue != null && !Number.isNaN(maxValue) && nextValue > maxValue) {
      nextValue = maxValue;
    }

    return nextValue;
  };

  const handleKeyDown = (event) => {
    if (onKeyDown) {
      onKeyDown(event);
    }

    if (!isNumberInput || event.defaultPrevented) {
      return;
    }

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    const stepValue = step == null || step === '' ? 1 : Number(step);
    if (Number.isNaN(stepValue) || stepValue === 0) {
      return;
    }

    const currentValue = event.currentTarget.value === '' ? 0 : Number(event.currentTarget.value);
    if (Number.isNaN(currentValue)) {
      return;
    }

    const precision = getStepPrecision(stepValue);
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    const nextValue = clampValue(currentValue + (stepValue * direction));
    const normalizedValue = precision > 0 ? nextValue.toFixed(precision) : String(nextValue);

    event.preventDefault();

    if (onChange) {
      onChange({
        target: {
          name: event.currentTarget.name,
          value: normalizedValue,
        },
      });
    }
  };

  const handleChange = (event) => {
    if (!onChange) {
      return;
    }

    if (!isNumberInput) {
      onChange(event);
      return;
    }

    onChange({
      target: {
        name: event.currentTarget.name,
        value: event.currentTarget.value.replace(/,/g, '.'),
      },
    });
  };

  return (
    <input
      type={isNumberInput ? 'text' : type}
      inputMode={isNumberInput ? 'decimal' : props.inputMode}
      pattern={isNumberInput ? '[0-9]*[.,]?[0-9]*' : props.pattern}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      ref={ref}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});

Input.displayName = 'Input';

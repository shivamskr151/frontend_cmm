import React from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface NumberFieldProps {
  field: FieldConfig;
  value: number;
  onChange: (value: number) => void;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  field,
  value,
  onChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        value={value || ''}
        onChange={handleChange}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};

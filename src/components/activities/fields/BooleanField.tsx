import React from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface BooleanFieldProps {
  field: FieldConfig;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const BooleanField: React.FC<BooleanFieldProps> = ({
  field,
  value,
  onChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={value || false}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      
      {field.description && (
        <p className="text-xs text-gray-500 ml-7">{field.description}</p>
      )}
    </div>
  );
};

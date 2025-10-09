import React from 'react';
import type { FieldConfig } from '../../../types/activityFields';
import './SliderField.css';

interface SliderFieldProps {
  field: FieldConfig;
  value: number;
  onChange: (value: number) => void;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  field,
  value,
  onChange
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(newValue);
  };

  const percentage = ((value - (field.min || 0)) / ((field.max || 100) - (field.min || 0))) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {value}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={field.min || 0}
          max={field.max || 100}
          step={field.step || 1}
          value={value || 0}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{field.min || 0}</span>
          <span>{field.max || 100}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={value || ''}
          onChange={handleInputChange}
          min={field.min}
          max={field.max}
          step={field.step}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-500">Direct input</span>
      </div>

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};

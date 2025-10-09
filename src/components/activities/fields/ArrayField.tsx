import React from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface ArrayFieldProps {
  field: FieldConfig;
  value: string[];
  onChange: (value: string[]) => void;
}

export const ArrayField: React.FC<ArrayFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const addItem = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index: number, newValue: string) => {
    const newItems = [...value];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Add New Item */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={field.placeholder || `Add ${field.label.toLowerCase()}`}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Items List */}
      {value.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm">No items configured</p>
          <p className="text-xs">Add items above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};

import React from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface MappingFieldProps {
  field: FieldConfig;
  value: Record<string, string | number | boolean>;
  onChange: (value: Record<string, string | number | boolean>) => void;
}

export const MappingField: React.FC<MappingFieldProps> = ({
  field,
  value = {},
  onChange
}) => {
  const [newKey, setNewKey] = React.useState('');
  const [newValue, setNewValue] = React.useState('');

  const addMapping = () => {
    if (newKey.trim() && newValue.trim()) {
      const updatedMapping = {
        ...value,
        [newKey.trim()]: isNaN(Number(newValue)) ? newValue : Number(newValue)
      };
      onChange(updatedMapping);
      setNewKey('');
      setNewValue('');
    }
  };

  const updateMapping = (key: string, newVal: string) => {
    const updatedMapping = {
      ...value,
      [key]: isNaN(Number(newVal)) ? newVal : Number(newVal)
    };
    onChange(updatedMapping);
  };

  const removeMapping = (key: string) => {
    const updatedMapping = { ...value };
    delete updatedMapping[key];
    onChange(updatedMapping);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMapping();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Add New Mapping */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Key"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Value"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={addMapping}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Mappings List */}
      {Object.keys(value).length === 0 ? (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm">No mappings configured</p>
          <p className="text-xs">Add key-value pairs above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newVal = value[key];
                    removeMapping(key);
                    updateMapping(e.target.value, String(newVal));
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-500">:</span>
                <input
                  type="text"
                  value={String(val)}
                  onChange={(e) => updateMapping(key, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMapping(key)}
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

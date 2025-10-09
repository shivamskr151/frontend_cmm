import React, { useState } from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface ObjectFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
}

export const ObjectField: React.FC<ObjectFieldProps> = ({
  field,
  value,
  onChange
}) => {
  const [jsonString, setJsonString] = useState(JSON.stringify(value, null, 2));
  const [isValid, setIsValid] = useState(true);

  const handleJsonChange = (newJsonString: string) => {
    setJsonString(newJsonString);
    
    try {
      const parsed = JSON.parse(newJsonString);
      setIsValid(true);
      onChange(parsed);
    } catch (error) {
      setIsValid(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setIsValid(true);
      onChange(parsed);
    } catch (error) {
      setIsValid(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <button
          type="button"
          onClick={formatJson}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Format JSON
        </button>
      </div>

      <textarea
        value={jsonString}
        onChange={(e) => handleJsonChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm min-h-[120px] ${
          !isValid ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
        placeholder="Enter JSON object"
      />

      {!isValid && (
        <p className="text-sm text-red-600">
          Invalid JSON format. Please check your syntax.
        </p>
      )}

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};

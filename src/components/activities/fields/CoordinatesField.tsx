import React from 'react';
import type { FieldConfig, Coordinates } from '../../../types/activityFields';

interface CoordinatesFieldProps {
  field: FieldConfig;
  value: Coordinates[];
  onChange: (value: Coordinates[]) => void;
}

export const CoordinatesField: React.FC<CoordinatesFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  const addCoordinate = () => {
    const newCoordinate: Coordinates = { x: 0, y: 0 };
    onChange([...value, newCoordinate]);
  };

  const updateCoordinate = (index: number, field: 'x' | 'y', coordValue: number) => {
    const newCoordinates = [...value];
    newCoordinates[index] = { ...newCoordinates[index], [field]: coordValue };
    onChange(newCoordinates);
  };

  const removeCoordinate = (index: number) => {
    const newCoordinates = value.filter((_, i) => i !== index);
    onChange(newCoordinates);
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
          onClick={addCoordinate}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          + Add Point
        </button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm">No coordinates configured</p>
          <p className="text-xs">Click "Add Point" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((coordinate, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-600 w-8">
                #{index + 1}
              </span>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-500">X:</label>
                <input
                  type="number"
                  value={coordinate.x}
                  onChange={(e) => updateCoordinate(index, 'x', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="text-xs text-gray-500">Y:</label>
                <input
                  type="number"
                  value={coordinate.y}
                  onChange={(e) => updateCoordinate(index, 'y', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeCoordinate(index)}
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

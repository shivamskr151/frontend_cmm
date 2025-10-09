import React from 'react';
import type { FieldConfig, SpeedLimit } from '../../../types/activityFields';

interface SpeedLimitsFieldProps {
  field: FieldConfig;
  value: SpeedLimit[];
  onChange: (value: SpeedLimit[]) => void;
}

export const SpeedLimitsField: React.FC<SpeedLimitsFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  const [newVehicleType, setNewVehicleType] = React.useState('');
  const [newSpeed, setNewSpeed] = React.useState('');

  // Normalize value to array format
  const normalizedValue = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Convert object format {car: 20, truck: 60} to array format
      return Object.entries(value).map(([vehicleType, speed]) => ({
        vehicleType,
        speed: typeof speed === 'number' ? speed : parseInt(String(speed)) || 0
      }));
    }
    
    return [];
  }, [value]);

  const addSpeedLimit = () => {
    if (newVehicleType.trim() && newSpeed.trim()) {
      const speed = parseInt(newSpeed);
      if (!isNaN(speed)) {
        const newSpeedLimit: SpeedLimit = {
          vehicleType: newVehicleType.trim(),
          speed: speed
        };
        onChange([...normalizedValue, newSpeedLimit]);
        setNewVehicleType('');
        setNewSpeed('');
      }
    }
  };

  const updateSpeedLimit = (index: number, field: 'vehicleType' | 'speed', newValue: string | number) => {
    const newSpeedLimits = [...normalizedValue];
    newSpeedLimits[index] = { ...newSpeedLimits[index], [field]: newValue };
    onChange(newSpeedLimits);
  };

  const removeSpeedLimit = (index: number) => {
    const newSpeedLimits = normalizedValue.filter((_, i) => i !== index);
    onChange(newSpeedLimits);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpeedLimit();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Add New Speed Limit */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newVehicleType}
          onChange={(e) => setNewVehicleType(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Vehicle type (e.g., car, truck)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="number"
          value={newSpeed}
          onChange={(e) => setNewSpeed(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Speed (km/h)"
          min="1"
          max="200"
          className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={addSpeedLimit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Speed Limits List */}
      {normalizedValue.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm">No speed limits configured</p>
          <p className="text-xs">Add vehicle types and their speed limits above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {normalizedValue.map((speedLimit, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  value={speedLimit.vehicleType}
                  onChange={(e) => updateSpeedLimit(index, 'vehicleType', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`Vehicle type for speed limit ${index + 1}`}
                  placeholder="Vehicle type"
                />
                <span className="text-gray-500">:</span>
                <input
                  type="number"
                  value={speedLimit.speed}
                  onChange={(e) => updateSpeedLimit(index, 'speed', parseInt(e.target.value) || 0)}
                  min="1"
                  max="200"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`Speed limit for ${speedLimit.vehicleType}`}
                  placeholder="Speed"
                />
                <span className="text-sm text-gray-500">km/h</span>
              </div>
              <button
                type="button"
                onClick={() => removeSpeedLimit(index)}
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

import React from 'react';
import type { FieldConfig, TimeRange } from '../../../types/activityFields';

interface TimeRangeFieldProps {
  field: FieldConfig;
  value: TimeRange[];
  onChange: (value: TimeRange[]) => void;
}

export const TimeRangeField: React.FC<TimeRangeFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  const addTimeRange = () => {
    const newTimeRange: TimeRange = { start: '08:00', end: '18:00' };
    onChange([...value, newTimeRange]);
  };

  const updateTimeRange = (index: number, field: 'start' | 'end', time: string) => {
    const newRanges = [...value];
    newRanges[index] = { ...newRanges[index], [field]: time };
    onChange(newRanges);
  };

  const removeTimeRange = (index: number) => {
    const newRanges = value.filter((_, i) => i !== index);
    onChange(newRanges);
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
          onClick={addTimeRange}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          + Add Time Range
        </button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm">No time ranges configured</p>
          <p className="text-xs">Click "Add Time Range" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((timeRange, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={timeRange.start}
                  onChange={(e) => updateTimeRange(index, 'start', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={timeRange.end}
                  onChange={(e) => updateTimeRange(index, 'end', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTimeRange(index)}
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

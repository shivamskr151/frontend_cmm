import React from 'react';
import type { FieldConfig, ScheduledTime } from '../../../types/activityFields';

interface ScheduledTimeFieldProps {
  field: FieldConfig;
  value: ScheduledTime[];
  onChange: (value: ScheduledTime[]) => void;
}

export const ScheduledTimeField: React.FC<ScheduledTimeFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  const [newTimeRange, setNewTimeRange] = React.useState({ start: '08:00', end: '18:00' });
  const [newDays, setNewDays] = React.useState<string[]>([]);
  const [newTimezone, setNewTimezone] = React.useState('UTC');

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Normalize value to array format and convert data structure
  const normalizedValue = React.useMemo(() => {
    try {
      if (Array.isArray(value)) {
        return value.map(item => {
          // Convert time_start_end to timeRanges format
          if (item && item.time_start_end && !item.timeRanges) {
            return {
              ...item,
              timeRanges: item.time_start_end.map(([start, end]) => ({ start, end }))
            };
          }
          return item;
        });
      }
      
      if (typeof value === 'object' && value !== null) {
        // Convert single object to array format
        if (value.time_start_end && !value.timeRanges) {
          return [{
            ...value,
            timeRanges: value.time_start_end.map(([start, end]) => ({ start, end }))
          }];
        }
        return [value];
      }
      
      return [];
    } catch (error) {
      console.error('Error normalizing scheduled time value:', error, value);
      return [];
    }
  }, [value]);

  const addScheduledTime = () => {
    if (newDays.length > 0) {
      const newScheduledTime: ScheduledTime = {
        timeRanges: [newTimeRange],
        days: newDays,
        timezone: newTimezone
      };
      onChange([...normalizedValue, newScheduledTime]);
      setNewTimeRange({ start: '08:00', end: '18:00' });
      setNewDays([]);
      setNewTimezone('UTC');
    }
  };

  const toggleDay = (day: string) => {
    setNewDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const removeScheduledTime = (index: number) => {
    const newScheduledTimes = normalizedValue.filter((_, i) => i !== index);
    onChange(newScheduledTimes);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Add New Scheduled Time */}
      <div className="bg-gray-50 p-4 rounded-md space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Add New Schedule</h4>
        
        {/* Time Range */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Time:</label>
          <input
            type="time"
            value={newTimeRange.start}
            onChange={(e) => setNewTimeRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Start time"
            placeholder="Start time"
          />
          <span className="text-gray-500">to</span>
          <input
            type="time"
            value={newTimeRange.end}
            onChange={(e) => setNewTimeRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="End time"
            placeholder="End time"
          />
        </div>

        {/* Days Selection */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Days:</label>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  newDays.includes(day)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Timezone:</label>
          <select
            value={newTimezone}
            onChange={(e) => setNewTimezone(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Timezone selection"
            title="Select timezone"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </div>

        <button
          type="button"
          onClick={addScheduledTime}
          disabled={newDays.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add Schedule
        </button>
      </div>

      {/* Scheduled Times List */}
      {normalizedValue.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm">No scheduled times configured</p>
          <p className="text-xs">Add time schedules above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {normalizedValue.map((scheduledTime, index) => (
            <div key={index} className="p-3 bg-white border border-gray-200 rounded-md">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Times: </span>
                    <span className="text-sm text-gray-600">
                      {(scheduledTime.timeRanges || []).map(range => 
                        `${range.start} - ${range.end}`
                      ).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Days: </span>
                    <span className="text-sm text-gray-600">
                      {(scheduledTime.days || []).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Timezone: </span>
                    <span className="text-sm text-gray-600">
                      {scheduledTime.timezone}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeScheduledTime(index)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  ×
                </button>
              </div>
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

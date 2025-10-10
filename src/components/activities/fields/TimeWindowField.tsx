import React from 'react';
import type { FieldConfig } from '../../../types/activityFields';

interface TimeWindow {
  time_start_end: string[][];
  days: string[];
  timezone?: string;
}

interface TimeWindowFieldProps {
  field: FieldConfig;
  value: TimeWindow[];
  onChange: (value: TimeWindow[]) => void;
}

export const TimeWindowField: React.FC<TimeWindowFieldProps> = ({
  field,
  value = [],
  onChange
}) => {
  // Ensure value is always an array with at least one time window
  const normalizedValue = Array.isArray(value) && value.length > 0 ? value : [{
    time_start_end: [['08:00', '18:00']],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timezone: 'Asia/Kolkata'
  }];

  // Ensure we always have exactly one time window
  React.useEffect(() => {
    if (normalizedValue.length === 0) {
      const defaultTimeWindow: TimeWindow = {
        time_start_end: [['08:00', '18:00']],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timezone: 'Asia/Kolkata'
      };
      onChange([defaultTimeWindow]);
    }
  }, [normalizedValue.length, onChange]);

  const updateTimeWindow = (index: number, updatedWindow: TimeWindow) => {
    const newWindows = [...normalizedValue];
    newWindows[index] = updatedWindow;
    onChange(newWindows);
  };

  const addTimeRange = (windowIndex: number) => {
    const window = normalizedValue[windowIndex];
    const newTimeRange = ['07:00', '19:00'];
    const updatedWindow = {
      ...window,
      time_start_end: [...(window.time_start_end || []), newTimeRange]
    };
    updateTimeWindow(windowIndex, updatedWindow);
  };

  const updateTimeRange = (windowIndex: number, rangeIndex: number, field: 'start' | 'end', time: string) => {
    const window = normalizedValue[windowIndex];
    const newTimeRanges = [...(window.time_start_end || [])];
    newTimeRanges[rangeIndex] = [
      field === 'start' ? time : newTimeRanges[rangeIndex][0],
      field === 'end' ? time : newTimeRanges[rangeIndex][1]
    ];
    const updatedWindow = {
      ...window,
      time_start_end: newTimeRanges
    };
    updateTimeWindow(windowIndex, updatedWindow);
  };

  const removeTimeRange = (windowIndex: number, rangeIndex: number) => {
    const window = normalizedValue[windowIndex];
    const newTimeRanges = (window.time_start_end || []).filter((_, i) => i !== rangeIndex);
    const updatedWindow = {
      ...window,
      time_start_end: newTimeRanges
    };
    updateTimeWindow(windowIndex, updatedWindow);
  };

  const toggleDay = (windowIndex: number, day: string) => {
    const window = normalizedValue[windowIndex];
    const currentDays = window.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    const updatedWindow = {
      ...window,
      days: newDays
    };
    updateTimeWindow(windowIndex, updatedWindow);
  };

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      <div className="space-y-4">
        {normalizedValue.map((timeWindow, windowIndex) => (
          <div key={windowIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">Time Window</h4>
            </div>

              {/* Time Ranges */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Time Ranges:</label>
                <div className="space-y-2">
                  {(timeWindow.time_start_end || []).map((range, rangeIndex) => (
                    <div key={rangeIndex} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={range[0]}
                        onChange={(e) => updateTimeRange(windowIndex, rangeIndex, 'start', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`Start time for range ${rangeIndex + 1}`}
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={range[1]}
                        onChange={(e) => updateTimeRange(windowIndex, rangeIndex, 'end', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`End time for range ${rangeIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeTimeRange(windowIndex, rangeIndex)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addTimeRange(windowIndex)}
                  className="mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  + Add Time Range
                </button>
              </div>

              {/* Days Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Days:</label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(windowIndex, day)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        (timeWindow.days || []).includes(day)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};

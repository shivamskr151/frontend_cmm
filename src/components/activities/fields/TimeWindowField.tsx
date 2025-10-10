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
    <div className="space-y-8">

      <div className="space-y-8">
        {normalizedValue.map((timeWindow, windowIndex) => (
          <div key={windowIndex} className="p-8 bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200/70 shadow-lg shadow-blue-200/20 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Time Ranges */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                  <label className="block text-base font-bold text-gray-800">Time Ranges</label>
                </div>
                <div className="space-y-4">
                  {(timeWindow.time_start_end || []).map((range, rangeIndex) => (
                    <div key={rangeIndex} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                          </svg>
                          <input
                            type="time"
                            value={range[0]}
                            onChange={(e) => updateTimeRange(windowIndex, rangeIndex, 'start', e.target.value)}
                            className="px-4 py-3 text-sm border border-blue-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white/80 font-medium"
                            aria-label={`Start time for range ${rangeIndex + 1}`}
                          />
                        </div>
                        <span className="text-gray-600 font-semibold text-sm">to</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={range[1]}
                            onChange={(e) => updateTimeRange(windowIndex, rangeIndex, 'end', e.target.value)}
                            className="px-4 py-3 text-sm border border-blue-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white/80 font-medium"
                            aria-label={`End time for range ${rangeIndex + 1}`}
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                          </svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTimeRange(windowIndex, rangeIndex)}
                        className="text-red-500 hover:text-red-700 focus:outline-none p-2 rounded-full hover:bg-red-50 transition-all duration-200 hover:scale-110"
                        title="Remove time range"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M15 9l-6 6"></path>
                          <path d="M9 9l6 6"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addTimeRange(windowIndex)}
                  className="mt-4 px-6 py-3 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-200 font-semibold flex items-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Time Range
                </button>
              </div>

              {/* Days Selection */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <label className="block text-base font-bold text-gray-800">Days</label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {dayOptions.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(windowIndex, day)}
                      className={`px-5 py-3 text-sm font-semibold rounded-xl border transition-all duration-200 transform hover:scale-105 ${
                        (timeWindow.days || []).includes(day)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
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

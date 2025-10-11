import React from 'react';
import { type Camera } from '../../api';
import { AddConfigDropdown } from '../activities';

interface CameraConfigurationProps {
  cameras: Camera[];
  camerasLoading: boolean;
  camerasError: boolean;
  selectedCamera: string;
  selectedActivity: string;
  currentZoneType: string;
  activities: Record<string, unknown>;
  onCameraChange: (cameraId: string) => void;
  onActivityChange: (activityId: string) => void;
  onZoneTypeChange: (zoneType: string) => void;
  onRefreshCameras: () => void;
  onOpenJsonEditor: () => void;
  onOpenAddActivity: () => void;
}

const CameraConfiguration: React.FC<CameraConfigurationProps> = ({
  cameras,
  camerasLoading,
  camerasError,
  selectedCamera,
  selectedActivity,
  currentZoneType,
  activities,
  onCameraChange,
  onActivityChange,
  onZoneTypeChange,
  onRefreshCameras,
  onOpenJsonEditor,
  onOpenAddActivity
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Camera Configuration</h3>
              <p className="text-sm text-gray-600 mt-1">Configure your monitoring setup in 3 simple steps</p>
            </div>
          </div>
          <AddConfigDropdown
            onOpenJsonEditor={onOpenJsonEditor}
            onOpenAddActivity={onOpenAddActivity}
            disabled={!selectedCamera}
          />
        </div>

        {/* Configuration Steps */}
        <div className="space-y-6">
          {/* Steps 1 & 2: Camera Selection and Activity Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Step 1: Camera Selection */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedCamera ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  }`}>
                    {selectedCamera ? '✓' : '1'}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Camera</h4>
                    <p className="text-sm text-gray-600">Choose the camera for monitoring</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {camerasLoading && (
                    <div className="w-full px-4 py-3 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading cameras...</span>
                    </div>
                  )}
                  
                  {camerasError && !camerasLoading && (
                    <div className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center justify-between">
                      <span>Error loading cameras</span>
                      <button
                        onClick={onRefreshCameras}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs transition-colors font-medium"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  
                  {!camerasLoading && !camerasError && (
                    <select 
                      value={selectedCamera || ''}
                      onChange={(e) => onCameraChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      title="Select a camera from the list"
                      aria-label="Select a camera from the list"
                    >
                      <option value="">Choose a camera...</option>
                      {cameras.map(camera => (
                        <option key={camera.id} value={camera.id}>
                          {camera.appName || camera.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {!camerasLoading && !camerasError && cameras.length === 0 && (
                    <div className="w-full px-4 py-3 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 text-sm text-center">
                      No cameras available
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Activity Selection */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedActivity ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  }`}>
                    {selectedActivity ? '✓' : '2'}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Monitoring Activity</h4>
                    <p className="text-sm text-gray-600">Choose what to monitor with this camera</p>
                  </div>
                </div>
                
                <div>
                  <select 
                    value={selectedActivity}
                    onChange={(e) => onActivityChange(e.target.value)}
                    disabled={!selectedCamera}
                    className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm ${
                      !selectedCamera 
                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                        : 'bg-white text-gray-800 border-gray-300'
                    }`}
                    title="Select a monitoring activity"
                    aria-label="Select a monitoring activity"
                  >
                    <option value="">Select an activity</option>
                    {Object.keys(activities)
                      .filter(activityName => {
                        const activity = activities[activityName] as { status?: string };
                        return activity && activity.status === 'ACTIVE';
                      })
                      .map(activityName => (
                        <option key={activityName} value={activityName}>
                          {activityName.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Zone Type Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-100 text-blue-700 border-2 border-blue-300">
                3
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Zone Type</h4>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { type: 'rectangle', name: 'Rectangle Zone', description: 'Simple rectangular areas', icon: '⬜', color: 'orange' },
                { type: 'rectangle-with-lanes', name: 'Rectangle + Lanes', description: 'Rectangles with traffic lanes', icon: '⬜', color: 'blue' },
                { type: 'polygon', name: 'Polygon Zone', description: 'Custom shaped areas', icon: '🔷', color: 'green' },
                { type: 'polygon-with-lanes', name: 'Polygon + Lanes', description: 'Custom shapes with lanes', icon: '🔷', color: 'emerald' }
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => onZoneTypeChange(option.type)}
                  disabled={!selectedCamera}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    currentZoneType === option.type
                      ? `border-${option.color}-400 bg-${option.color}-50 shadow-lg shadow-${option.color}-200/30`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  } ${!selectedCamera ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{option.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{option.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                    </div>
                    {currentZoneType === option.type && (
                      <div className={`w-5 h-5 bg-${option.color}-500 rounded-full flex items-center justify-center`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Summary & Quick Actions */}
        {selectedCamera && selectedActivity && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-green-800">Configuration Ready</span>
              </div>
              <div className="text-sm text-green-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>📹 <span className="font-medium">{cameras.find(c => c.id === selectedCamera)?.appName || 'Camera'}</span></div>
                  <div>🎯 <span className="font-medium">{selectedActivity.replace(/_/g, ' ').toUpperCase()}</span></div>
                  <div>📍 <span className="font-medium">{currentZoneType.replace('-', ' ').toUpperCase()}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraConfiguration;

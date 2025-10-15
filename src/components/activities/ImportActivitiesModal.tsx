import React, { useState, useRef, useEffect, useCallback } from 'react';
import { activityFieldConfigs } from '../../config/activityFieldConfigs';

interface ImportActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportActivities?: (jsonData: string) => Promise<{ success: boolean; message: string }>;
}

// Get all activities from the project configuration
const PROJECT_ACTIVITIES = Object.keys(activityFieldConfigs).map(activityKey => ({
  key: activityKey,
  displayName: activityKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}));

export const ImportActivitiesModal: React.FC<ImportActivitiesModalProps> = ({
  isOpen,
  onClose,
  onImportActivities
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('single');
  const [customActivityName, setCustomActivityName] = useState<string>('');
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setSelectedActivity('');
    setSelectedActivities([]);
    setSelectionMode('single');
    setCustomActivityName('');
    setJsonData('');
    setIsValidJson(true);
    onClose();
  }, [onClose]);

  // Click outside to close functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const handleActivitySelect = (activityKey: string) => {
    if (selectionMode === 'single') {
      setSelectedActivity(activityKey);
      setSelectedActivities([activityKey]);
      setCustomActivityName('');
      generateJsonForActivity(activityKey);
    } else {
      // Multiple selection mode
      setSelectedActivities(prev => {
        const isSelected = prev.includes(activityKey);
        if (isSelected) {
          // Remove from selection
          const newSelection = prev.filter(key => key !== activityKey);
          if (newSelection.length === 0) {
            setSelectedActivity('');
            setJsonData('');
          } else {
            setSelectedActivity(newSelection[0]); // Set first selected as primary
            generateJsonForMultipleActivities(newSelection);
          }
          return newSelection;
        } else {
          // Add to selection
          const newSelection = [...prev, activityKey];
          setSelectedActivity(activityKey); // Set newly selected as primary
          generateJsonForMultipleActivities(newSelection);
          return newSelection;
        }
      });
      setCustomActivityName('');
    }
  };

  const handleCustomActivityAdd = () => {
    if (customActivityName.trim()) {
      setSelectedActivity(customActivityName.trim());
      setCustomActivityName('');
      generateJsonForActivity(customActivityName.trim());
    }
  };

  // Helper function to generate sample data for different field types
  const generateSampleData = (field: { id: string; type: string; defaultValue?: unknown; min?: number }, activityKey: string): unknown => {
    // Only use defaultValue if it's not empty (not an empty array, empty object, or empty string)
    if (field.defaultValue !== undefined && 
        !(Array.isArray(field.defaultValue) && field.defaultValue.length === 0) &&
        !(typeof field.defaultValue === 'object' && field.defaultValue !== null && Object.keys(field.defaultValue).length === 0) &&
        field.defaultValue !== '') {
      return field.defaultValue;
    }

    // Generate realistic sample data based on field type and ID
    switch (field.type) {
      case 'number':
        return field.min || 0;
      
      case 'slider':
        return field.min || 0;
      
      case 'tags':
        // Generate appropriate tags based on field ID and activity
        if (field.id === 'subcategory_mapping') {
          switch (activityKey) {
            case 'ppe':
              return ['Helmet', 'Mask', 'Vest', 'Gloves', 'Shoes'];
            case 'person_violations':
              return ['unconscious', 'fallen', 'sitting'];
            case 'perimeter_monitoring':
            case 'climbing':
              return ['person'];
            case 'vehicle_interaction':
              return ['forklift', 'car', 'truck', 'bus'];
            case 'entry_exit_WLE_logs':
              return ['car', 'truck', 'person'];
            default:
              return ['person'];
          }
        } else if (field.id === 'acts') {
          return ['SITTING', 'FALLEN', 'UNCONSCIOUS', 'HELP'];
        } else if (field.id === 'vehicle_classes') {
          return ['forklift', 'car', 'truck', 'bus'];
        } else if (field.id === 'person_classes') {
          return ['person'];
        }
        return ['sample_tag'];
      
      case 'boolean':
        return true;
      
      case 'timeWindow':
        return [
          {
            time_start_end: [
              ['08:00', '18:00']
            ],
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        ];
      
      case 'scheduledTime':
        return [
          {
            time_start_end: [
              ['09:00', '17:00']
            ],
            days: ['Monday', 'Wednesday', 'Friday'],
            timezone: 'Asia/Kolkata'
          }
        ];
      
      case 'coordinates':
        if (field.id === 'SOURCE') {
          return [
            [52, 39],
            [1223, 45],
            [1245, 708],
            [36, 706]
          ];
        }
        return [
          [100, 100],
          [200, 200]
        ];
      
      case 'speedLimits':
        return {
          car: 20,
          truck: 15
        };
      
      case 'mapping':
        return {};
      
      case 'array':
        return [];
      
      case 'object':
        return {};
      
      default:
        return '';
    }
  };

  const generateJsonForActivity = (activityKey: string) => {
    // Get the activity configuration
    const activityConfig = activityFieldConfigs[activityKey];
    
    if (activityConfig) {
      // Generate parameters object with sample data
      const parameters: Record<string, unknown> = {};
      
      activityConfig.fields.forEach(field => {
        parameters[field.id] = generateSampleData(field, activityKey);
      });

      // Create the activity JSON with proper structure
      const activityJson = [
        {
          name: activityKey,
          status: "ACTIVE",
          parameters: parameters
        }
      ];
      
      setJsonData(JSON.stringify(activityJson, null, 2));
    } else {
      // Fallback for custom activities or unknown activities
      const activityJson = [
        {
          name: activityKey,
          status: "ACTIVE",
          parameters: {
            frame_accuracy: 10,
            time_window: [
              {
                time_start_end: [
                  ['08:00', '18:00']
                ],
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
              }
            ]
          }
        }
      ];
      setJsonData(JSON.stringify(activityJson, null, 2));
    }
  };

  const generateJsonForMultipleActivities = (activityKeys: string[]) => {
    const activitiesJson = activityKeys.map(activityKey => {
      const activityConfig = activityFieldConfigs[activityKey];
      
      if (activityConfig) {
        // Generate parameters object with sample data
        const parameters: Record<string, unknown> = {};
        
        activityConfig.fields.forEach(field => {
          parameters[field.id] = generateSampleData(field, activityKey);
        });

        return {
          name: activityKey,
          status: "ACTIVE",
          parameters: parameters
        };
      } else {
        // Fallback for custom activities or unknown activities
        return {
          name: activityKey,
          status: "ACTIVE",
          parameters: {
            frame_accuracy: 10,
            time_window: [
              {
                time_start_end: [
                  ['08:00', '18:00']
                ],
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
              }
            ]
          }
        };
      }
    });
    
    setJsonData(JSON.stringify(activitiesJson, null, 2));
  };

  const handleGenerateDummy = () => {
    if (selectionMode === 'single' && selectedActivity) {
      generateJsonForActivity(selectedActivity);
    } else if (selectionMode === 'multiple' && selectedActivities.length > 0) {
      generateJsonForMultipleActivities(selectedActivities);
    } else {
      // Generate a basic template if no activity is selected
      const basicJson = [
        {
          name: "sample_activity",
          status: "ACTIVE",
          parameters: {}
        }
      ];
      setJsonData(JSON.stringify(basicJson, null, 2));
    }
  };

  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(jsonData);
      setJsonData(JSON.stringify(parsed, null, 2));
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    try {
      JSON.parse(value);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleImportActivities = async () => {
    if (!jsonData.trim()) return;

    try {
      // Validate JSON first
      JSON.parse(jsonData);
      setIsLoading(true);
      
      if (onImportActivities) {
        const result = await onImportActivities(jsonData);
        if (result.success) {
          handleClose();
        }
      }
    } catch {
      setIsValidJson(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div 
        ref={modalRef}
        className="bg-white/95 backdrop-blur-sm rounded-xl max-w-4xl w-[90%] max-h-[90vh] border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
              </div>
              <div>
                <h5 className="text-xl font-bold text-gray-900">Import Activities from JSON</h5>
                <p className="text-sm text-gray-600">Select or define an activity and import it using JSON data</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:shadow-md"
              title="Close modal"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Choose Activity Type Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Choose Activity Type</h4>
            
            {/* Selection Mode */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectionMode('single');
                      setSelectedActivities([]);
                      setSelectedActivity('');
                      setJsonData('');
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectionMode === 'single'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Single Selection
                  </button>
                  <button 
                    onClick={() => {
                      setSelectionMode('multiple');
                      setSelectedActivity('');
                      setSelectedActivities([]);
                      setJsonData('');
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectionMode === 'multiple'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Multiple Selection
                  </button>
                </div>
                {(selectedActivity || selectedActivities.length > 0) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                    <span>✓ {selectionMode === 'single' ? '1' : selectedActivities.length} selected</span>
                    <button 
                      onClick={() => {
                        setSelectedActivity('');
                        setSelectedActivities([]);
                        setJsonData('');
                      }}
                      className="text-green-600 hover:text-green-800"
                      title="Clear selection"
                      aria-label="Clear selection"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {selectionMode === 'single' 
                  ? 'Click one activity to select it' 
                  : 'Click multiple activities to select them'
                }
              </p>
            </div>

            {/* Quick Select Activities */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Select Activities</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {PROJECT_ACTIVITIES.map((activity) => {
                  const isSelected = selectionMode === 'single' 
                    ? selectedActivity === activity.key
                    : selectedActivities.includes(activity.key);
                  
                  return (
                    <button
                      key={activity.key}
                      onClick={() => handleActivitySelect(activity.key)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium h-20 flex flex-col items-center justify-center text-center ${
                        isSelected
                          ? 'bg-green-100 border-green-500 text-green-700 shadow-md'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="flex items-center justify-center mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12"></polyline>
                          </svg>
                        </div>
                      )}
                      {activity.displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Activity */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Custom Activity</h5>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customActivityName}
                  onChange={(e) => setCustomActivityName(e.target.value)}
                  placeholder="Enter custom activity name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleCustomActivityAdd}
                  disabled={!customActivityName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setCustomActivityName('')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Import Button */}
            {(selectedActivity || selectedActivities.length > 0) && (
              <div className="text-center mb-6">
                <button
                  onClick={handleGenerateDummy}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {selectionMode === 'single' 
                    ? `Generate JSON for ${PROJECT_ACTIVITIES.find(a => a.key === selectedActivity)?.displayName || selectedActivity}`
                    : `Generate JSON for ${selectedActivities.length} activities`
                  }
                </button>
              </div>
            )}
          </div>

          {/* JSON Data Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-800">JSON Data</h4>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateDummy}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  Generate Dummy
                </button>
                <button
                  onClick={handlePrettifyJson}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Prettify JSON
                </button>
              </div>
            </div>
            
            <textarea
              value={jsonData}
              onChange={(e) => handleJsonChange(e.target.value)}
              className={`w-full h-64 p-4 border-2 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isValidJson ? 'border-gray-300' : 'border-red-300 bg-red-50'
              }`}
              placeholder="Enter JSON data here..."
            />
            
            {!isValidJson && (
              <p className="text-red-600 text-sm mt-2">Invalid JSON format</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImportActivities}
            disabled={!jsonData.trim() || !isValidJson || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Importing...' : 'Import Activities'}
          </button>
        </div>
      </div>
    </div>
  );
};

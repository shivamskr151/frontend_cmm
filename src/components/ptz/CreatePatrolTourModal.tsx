import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCameras } from '../../contexts/CameraContext';
import { usePresets } from '../../hooks/api/useOnvifPresets';
import { onvifPatrolApi } from '../../api/onvif';

interface CreatePatrolTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourCreated: (tourToken: string) => void;
}

const CreatePatrolTourModal: React.FC<CreatePatrolTourModalProps> = ({
  isOpen,
  onClose,
  onTourCreated
}) => {
  const { selectedCamera } = useCameras();
  const [tourName, setTourName] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [presetWaitTimes, setPresetWaitTimes] = useState<Record<string, number>>({});
  const [presetSpeeds, setPresetSpeeds] = useState<Record<string, number>>({});
  const [isLooping, setIsLooping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get presets for the selected camera
  const { data: presets, isLoading: presetsLoading, error: presetsError } = usePresets(
    selectedCamera || '',
    'Profile_1', // Use Profile_1 as specified in the API
    !!selectedCamera
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTourName('');
      setSelectedPresets([]);
      setPresetWaitTimes({});
      setPresetSpeeds({});
      setIsLooping(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key to close modal and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePresetToggle = (presetToken: string) => {
    setSelectedPresets(prev => {
      if (prev.includes(presetToken)) {
        // Remove preset and its wait time and speed
        setPresetWaitTimes(prevTimes => {
          const newTimes = { ...prevTimes };
          delete newTimes[presetToken];
          return newTimes;
        });
        setPresetSpeeds(prevSpeeds => {
          const newSpeeds = { ...prevSpeeds };
          delete newSpeeds[presetToken];
          return newSpeeds;
        });
        return prev.filter(token => token !== presetToken);
      } else {
        // Add preset with default wait time and speed
        setPresetWaitTimes(prevTimes => ({
          ...prevTimes,
          [presetToken]: 3 // Default wait time
        }));
        setPresetSpeeds(prevSpeeds => ({
          ...prevSpeeds,
          [presetToken]: 0.8 // Default speed
        }));
        return [...prev, presetToken];
      }
    });
  };

  const handleSelectAllPresets = () => {
    if (!presets) return;
    
    if (selectedPresets.length === presets.length) {
      setSelectedPresets([]);
      setPresetWaitTimes({});
      setPresetSpeeds({});
    } else {
      const allTokens = presets.map(p => p.preset_token || p.token).filter(Boolean) as string[];
      setSelectedPresets(allTokens);
      // Set default wait time and speed for all presets
      const defaultWaitTimes: Record<string, number> = {};
      const defaultSpeeds: Record<string, number> = {};
      allTokens.forEach(token => {
        defaultWaitTimes[token] = 3;
        defaultSpeeds[token] = 0.8;
      });
      setPresetWaitTimes(defaultWaitTimes);
      setPresetSpeeds(defaultSpeeds);
    }
  };

  const handleCreateTour = async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    if (!tourName.trim()) {
      setError('Please enter a tour name');
      return;
    }

    if (selectedPresets.length === 0) {
      setError('Please select at least one preset');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create steps with individual wait times and speeds for each preset
      const steps = selectedPresets.map(presetToken => ({
        presetToken,
        speed: presetSpeeds[presetToken] || 0.8,
        waitTime: presetWaitTimes[presetToken] || 3
      }));

      const tourToken = await onvifPatrolApi.createAdvancedPresetTour(
        selectedCamera,
        'Profile_1', // Use Profile_1 as specified in the API
        tourName.trim(),
        steps,
        false, // autoStart
        {
          recurringTime: isLooping ? 0 : -1, // -1 means no looping, 0 means infinite loop
          recurringDuration: "PT3S",
          randomPresetOrder: false
        }
      );

      console.log('✅ Tour created successfully:', tourToken);
      onTourCreated(tourToken);
      onClose();
    } catch (err) {
      console.error('❌ Error creating tour:', err);
      setError(err instanceof Error ? err.message : 'Failed to create tour');
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  console.log('🎯 CreatePatrolTourModal render:', { isOpen, selectedCamera });

  if (!isOpen) return null;

  // Render modal using portal to ensure it appears at the root level
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/20 bg-opacity-75 flex items-center justify-center z-[9999] p-2 sm:p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[95vh] sm:h-[85vh] max-h-[800px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Create Patrol Tour</h2>
                <p className="text-blue-100 text-sm">Configure your camera patrol sequence</p>
              </div>
            </div>
          <button
            onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Close modal"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0 bg-gray-50/30">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                </div>
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Tour Configuration */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tour Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Tour Name
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  placeholder="Enter a descriptive name for your patrol tour..."
                  className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                />
              </div>

              {/* Patrol Behavior */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.6 1.98L21 3"></path>
                      <path d="M21 3v6h-6"></path>
                    </svg>
                    Patrol Behavior
                  </span>
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={(e) => setIsLooping(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    title="Enable continuous looping"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      {isLooping ? 'Continuous Loop' : 'Single Run'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {isLooping ? 'Patrol will repeat indefinitely' : 'Patrol will run once and stop'}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isLooping ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Selection */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Camera Presets</h3>
              </div>
              <button
                onClick={handleSelectAllPresets}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 hover:border-blue-300"
                title="Select or deselect all presets"
              >
                {selectedPresets.length === presets?.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {presetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <polyline points="23,4 23,10 17,10"></polyline>
                      <polyline points="1,20 1,14 7,14"></polyline>
                      <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
                    </svg>
                    <span className="text-sm font-medium">Loading presets...</span>
                  </div>
                </div>
              ) : presetsError ? (
                <div className="text-center py-8 text-red-500 text-sm">
                  Failed to load presets
                </div>
              ) : !presets || presets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No presets available
                </div>
              ) : (
                presets.map((preset) => {
                  const presetToken = preset.preset_token || preset.token;
                  const presetName = preset.preset_name || preset.name || 'Unnamed Preset';
                  const isSelected = selectedPresets.includes(presetToken || '');
                  
                  return (
                    <div
                      key={presetToken}
                      className={`rounded-xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePresetToggle(presetToken || '')}
                            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                            title={`Select ${presetName}`}
                      />
                      <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{presetName}</div>
                            <div className="text-xs text-gray-500">Camera preset position</div>
                          </div>
                          {isSelected && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      
                      {/* Speed and Wait Time Inputs - only show when preset is selected */}
                      {isSelected && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Speed Control */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                  </svg>
                                  Movement Speed
                                </span>
                              </label>
                              <input
                                type="number"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={presetSpeeds[presetToken || ''] || 0.8}
                                onChange={(e) => {
                                  const newSpeed = parseFloat(e.target.value) || 0.1;
                                  setPresetSpeeds(prev => ({
                                    ...prev,
                                    [presetToken || '']: newSpeed
                                  }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                title={`Set speed for ${presetName} (0.1 to 1.0)`}
                              />
                            </div>
                            
                            {/* Wait Time Control */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                  </svg>
                                  Wait Time (seconds)
                                </span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={presetWaitTimes[presetToken || ''] || 3}
                                onChange={(e) => {
                                  const newTime = parseInt(e.target.value) || 1;
                                  setPresetWaitTimes(prev => ({
                                    ...prev,
                                    [presetToken || '']: newTime
                                  }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                title={`Set wait time for ${presetName}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Presets Summary */}
          {selectedPresets.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2H9m0-7V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-800">
                      {selectedPresets.length} preset{selectedPresets.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="text-xs text-blue-600">Patrol sequence configuration</div>
                  </div>
                </div>
                {isLooping && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.6 1.98L21 3"></path>
                      <path d="M21 3v6h-6"></path>
                    </svg>
                    Looping
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {selectedPresets.map((presetToken, index) => {
                  const preset = presets?.find(p => (p.preset_token || p.token) === presetToken);
                  const presetName = preset?.preset_name || preset?.name || 'Unnamed Preset';
                  const waitTime = presetWaitTimes[presetToken] || 3;
                  const speed = presetSpeeds[presetToken] || 0.8;
                  return (
                    <div key={presetToken} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{presetName}</div>
                        <div className="text-xs text-gray-500">Speed: {speed} • Wait: {waitTime}s</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
              className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTour}
            disabled={loading || !tourName.trim() || selectedPresets.length === 0}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <polyline points="23,4 23,10 17,10"></polyline>
                  <polyline points="1,20 1,14 7,14"></polyline>
                  <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
                </svg>
                  Creating Tour...
              </>
            ) : (
              <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                  Create Patrol Tour
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreatePatrolTourModal;

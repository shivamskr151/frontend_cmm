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
  const [speed, setSpeed] = useState(0.8);
  const [waitTime, setWaitTime] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get presets for the selected camera
  const { data: presets, isLoading: presetsLoading, error: presetsError } = usePresets(
    selectedCamera || '',
    '', // Profile token - commented out 'Profile_1' as it's optional in backend
    !!selectedCamera
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTourName('');
      setSelectedPresets([]);
      setSpeed(0.8);
      setWaitTime(3);
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
    setSelectedPresets(prev => 
      prev.includes(presetToken) 
        ? prev.filter(token => token !== presetToken)
        : [...prev, presetToken]
    );
  };

  const handleSelectAllPresets = () => {
    if (!presets) return;
    
    if (selectedPresets.length === presets.length) {
      setSelectedPresets([]);
    } else {
      const allTokens = presets.map(p => p.preset_token || p.token).filter(Boolean) as string[];
      setSelectedPresets(allTokens);
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
      const tourToken = await onvifPatrolApi.createPatrolFromPresets(
        selectedCamera,
        '', // Profile token - commented out 'Profile_1' as it's optional in backend
        tourName.trim(),
        selectedPresets,
        {
          speed,
          waitTime,
          autoStart: false,
          randomOrder: false
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
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-2xl h-[95vh] sm:h-[80vh] max-h-[700px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Create Patrol Tour</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Error Display */}
          {error && (
            <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 sm:w-4 sm:h-4">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span className="text-xs sm:text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Tour Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Tour Name *
            </label>
            <input
              type="text"
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
              placeholder="Enter tour name..."
              className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Speed and Wait Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Speed: <span className="text-blue-600 font-semibold">{speed}</span>
              </label>
              <div className="space-y-1">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Wait Time (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={waitTime}
                onChange={(e) => setWaitTime(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preset Selection */}
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Select Presets</h3>
              <button
                onClick={handleSelectAllPresets}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                {selectedPresets.length === presets?.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-1 sm:space-y-2 max-h-40 sm:max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 sm:p-3">
              {presetsLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin sm:w-4 sm:h-4">
                      <polyline points="23,4 23,10 17,10"></polyline>
                      <polyline points="1,20 1,14 7,14"></polyline>
                      <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
                    </svg>
                    <span className="text-xs sm:text-sm">Loading presets...</span>
                  </div>
                </div>
              ) : presetsError ? (
                <div className="text-center py-6 sm:py-8 text-red-500 text-xs sm:text-sm">
                  Failed to load presets
                </div>
              ) : !presets || presets.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
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
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handlePresetToggle(presetToken || '')}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePresetToggle(presetToken || '')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{presetName}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Presets Summary */}
          {selectedPresets.length > 0 && (
            <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs sm:text-sm text-blue-700">
                <strong>{selectedPresets.length}</strong> preset{selectedPresets.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTour}
            disabled={loading || !tourName.trim() || selectedPresets.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
          >
            {loading ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin sm:w-4 sm:h-4">
                  <polyline points="23,4 23,10 17,10"></polyline>
                  <polyline points="1,20 1,14 7,14"></polyline>
                  <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                Create Tour
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreatePatrolTourModal;

import React, { useState, useEffect } from 'react';
import { type PatrolPattern } from '../../hooks/ptz';
import { type PatrolTour } from '../../api/onvif/onvifPatrolApi';
import { usePresets } from '../../hooks/api/useOnvifPresets';
import { useCameras } from '../../contexts/CameraContext';

interface EditPatrolModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPatrolPattern: PatrolPattern | null;
  editingPatrolTour: PatrolTour | null;
  onSave: (updatedPattern: PatrolPattern, presetTokens: string[], options: {
    speed?: number;
    waitTime?: number;
    autoStart?: boolean;
    randomOrder?: boolean;
    presetSpeeds?: Record<string, number>;
    presetWaitTimes?: Record<string, number>;
  }) => Promise<void>;
}

const EditPatrolModal: React.FC<EditPatrolModalProps> = ({
  isOpen,
  onClose,
  editingPatrolPattern,
  editingPatrolTour,
  onSave
}) => {
  const { selectedCamera } = useCameras();
  const [showAddPresets, setShowAddPresets] = useState(false);
  const [selectedNewPresets, setSelectedNewPresets] = useState<string[]>([]);
  const [newPresetSpeeds, setNewPresetSpeeds] = useState<Record<string, number>>({});
  const [newPresetWaitTimes, setNewPresetWaitTimes] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get available presets for adding
  const { data: availablePresets, isLoading: presetsLoading } = usePresets(
    selectedCamera || '',
    'Profile_1',
    !!selectedCamera && showAddPresets
  );

  // Debug logging for available presets
  useEffect(() => {
    if (showAddPresets && availablePresets) {
      console.log('📋 Available presets loaded:', availablePresets);
      console.log('📋 Current selected new presets:', selectedNewPresets);
      console.log('📋 Current new preset speeds:', newPresetSpeeds);
      console.log('📋 Current new preset wait times:', newPresetWaitTimes);
    }
  }, [showAddPresets, availablePresets, selectedNewPresets, newPresetSpeeds, newPresetWaitTimes]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowAddPresets(false);
      setSelectedNewPresets([]);
      setNewPresetSpeeds({});
      setNewPresetWaitTimes({});
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen || !editingPatrolPattern || !editingPatrolTour) return null;

  const handleNewPresetToggle = (presetToken: string) => {
    console.log('🔄 Toggling preset:', presetToken);
    setSelectedNewPresets(prev => {
      const isCurrentlySelected = prev.includes(presetToken);
      console.log('  - Currently selected:', isCurrentlySelected);
      console.log('  - Current selection:', prev);
      
      if (isCurrentlySelected) {
        // Remove preset and its settings
        console.log('  - Removing preset:', presetToken);
        setNewPresetSpeeds(prevSpeeds => {
          const newSpeeds = { ...prevSpeeds };
          delete newSpeeds[presetToken];
          return newSpeeds;
        });
        setNewPresetWaitTimes(prevTimes => {
          const newTimes = { ...prevTimes };
          delete newTimes[presetToken];
          return newTimes;
        });
        const newSelection = prev.filter(token => token !== presetToken);
        console.log('  - New selection after removal:', newSelection);
        return newSelection;
      } else {
        // Add preset with default settings
        console.log('  - Adding preset:', presetToken);
        setNewPresetSpeeds(prevSpeeds => {
          const newSpeeds = { ...prevSpeeds, [presetToken]: 0.8 };
          return newSpeeds;
        });
        setNewPresetWaitTimes(prevTimes => {
          const newTimes = { ...prevTimes, [presetToken]: 3 };
          return newTimes;
        });
        const newSelection = [...prev, presetToken];
        console.log('  - New selection after addition:', newSelection);
        return newSelection;
      }
    });
  };

  const handleSave = async () => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      const updatedPattern: PatrolPattern = {
        ...editingPatrolPattern,
        name: formData.get('name') as string,
        pan: parseFloat(formData.get('pan') as string),
        tilt: parseFloat(formData.get('tilt') as string),
        zoom: parseInt(formData.get('zoom') as string)
      };
      
      // Combine existing preset tokens with new ones
      const existingTokens = editingPatrolTour.steps?.map(step => step.presetToken || step.preset_token).filter((token): token is string => !!token) || [];
      const allTokens = [...existingTokens, ...selectedNewPresets];
      
      // Combine existing and new preset settings
      const existingPresetSpeeds: Record<string, number> = {};
      const existingPresetWaitTimes: Record<string, number> = {};
      
      // Extract existing preset settings
      editingPatrolTour.steps?.forEach(step => {
        const presetToken = step.presetToken || step.preset_token;
        if (presetToken) {
          existingPresetSpeeds[presetToken] = step.speed || 0.9;
          existingPresetWaitTimes[presetToken] = step.waitTime || 4;
        }
      });
      
      // Combine with new preset settings
      const allPresetSpeeds = { ...existingPresetSpeeds, ...newPresetSpeeds };
      const allPresetWaitTimes = { ...existingPresetWaitTimes, ...newPresetWaitTimes };
      
      // Use existing tour settings
      const options = {
        speed: editingPatrolTour.steps?.[0]?.speed || 0.9,
        waitTime: editingPatrolTour.steps?.[0]?.waitTime || 4,
        autoStart: editingPatrolTour.autoStart || editingPatrolTour.auto_start || false,
        randomOrder: editingPatrolTour.startingCondition?.randomPresetOrder || editingPatrolTour.starting_condition?.randomPresetOrder || false,
        presetSpeeds: allPresetSpeeds,
        presetWaitTimes: allPresetWaitTimes
      };
      
      console.log('🔍 EditPatrolModal Save Debug:');
      console.log('  - Updated pattern:', updatedPattern);
      console.log('  - All tokens:', allTokens);
      console.log('  - Options:', options);
      console.log('  - Selected new presets:', selectedNewPresets);
      console.log('  - New preset speeds:', newPresetSpeeds);
      console.log('  - New preset wait times:', newPresetWaitTimes);
      
      try {
        setIsSaving(true);
        await onSave(updatedPattern, allTokens, options);
      } catch (error) {
        console.error('❌ Error saving patrol pattern:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-96 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700">Edit Patrol Pattern</h3>
              <p className="text-xs sm:text-sm text-gray-500">Modify pattern settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close edit modal"
            aria-label="Close edit modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}>
            {/* Pattern Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patrol Name</label>
              <input
                type="text"
                name="name"
                defaultValue={editingPatrolPattern.name}
                className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                title="Enter patrol name"
                required
              />
            </div>

            {/* Presets List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Configured Presets</label>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔘 Add Presets button clicked, current state:', showAddPresets);
                    setShowAddPresets(!showAddPresets);
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  title="Add more presets to this patrol"
                >
                  {showAddPresets ? 'Hide' : 'Add Presets'}
                  {selectedNewPresets.length > 0 && (
                    <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {selectedNewPresets.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-48 overflow-y-auto">
                {(editingPatrolTour.steps && editingPatrolTour.steps.length > 0) || selectedNewPresets.length > 0 ? (
                  <div className="space-y-2">
                    {/* Existing presets */}
                    {editingPatrolTour.steps?.map((step, index) => (
                      <div key={`existing-${index}`} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Preset Token: {step.presetToken || step.preset_token || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Speed: {step.speed || 0.9} • Wait: {step.waitTime || 4}s
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Step {index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {/* Newly selected presets */}
                    {selectedNewPresets.map((presetToken, index) => {
                      const presetIndex = (editingPatrolTour.steps?.length || 0) + index + 1;
                      const speed = newPresetSpeeds[presetToken] || 0.8;
                      const waitTime = newPresetWaitTimes[presetToken] || 3;
                      
                      return (
                        <div key={`new-${presetToken}`} className="flex items-center justify-between bg-green-50 rounded-lg border border-green-200 p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                              {presetIndex}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">
                                Preset Token: {presetToken}
                              </div>
                              <div className="text-xs text-gray-500">
                                Speed: {speed} • Wait: {waitTime}s
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            New
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                      <circle cx="12" cy="13" r="3"></circle>
                    </svg>
                    <p className="text-sm">No presets configured</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total presets: {(editingPatrolTour.steps?.length || 0) + selectedNewPresets.length}
              </p>
            </div>

            {/* Add Additional Presets */}
            {showAddPresets && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Additional Presets</label>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-48 overflow-y-auto">
                  {presetsLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Loading presets...</p>
                    </div>
                  ) : availablePresets && availablePresets.length > 0 ? (
                    <div className="space-y-2">
                      {availablePresets.map((preset) => {
                        const presetToken = preset.preset_token || preset.token || '';
                        const isSelected = selectedNewPresets.includes(presetToken);
                        const isAlreadyInTour = editingPatrolTour.steps?.some(step => (step.presetToken || step.preset_token) === presetToken);
                        
                        return (
                          <div key={presetToken} className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleNewPresetToggle(presetToken)}
                                disabled={isAlreadyInTour}
                                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                title={isAlreadyInTour ? 'Preset already in tour' : 'Add preset to patrol'}
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-700">
                                  {preset.preset_name || preset.name || `Preset ${presetToken}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Token: {presetToken}
                                  {isAlreadyInTour && <span className="text-orange-600 ml-2">(Already in tour)</span>}
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Speed Control */}
            <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Movement Speed
                                    </label>
              <input
                type="number"
                                      min="0.1"
                                      max="1.0"
                                      step="0.1"
                                      value={newPresetSpeeds[presetToken] || 0.8}
                                      onChange={(e) => {
                                        const newSpeed = parseFloat(e.target.value) || 0.1;
                                        setNewPresetSpeeds(prev => ({
                                          ...prev,
                                          [presetToken]: newSpeed
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      title={`Set speed for ${preset.preset_name || preset.name || presetToken} (0.1 to 1.0)`}
              />
            </div>

                                  {/* Wait Time Control */}
            <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Wait Time (seconds)
                                    </label>
              <input
                type="number"
                                      min="1"
                                      max="60"
                                      value={newPresetWaitTimes[presetToken] || 3}
                                      onChange={(e) => {
                                        const newTime = parseInt(e.target.value) || 1;
                                        setNewPresetWaitTimes(prev => ({
                                          ...prev,
                                          [presetToken]: newTime
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      title={`Set wait time for ${preset.preset_name || preset.name || presetToken}`}
              />
            </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                        <circle cx="12" cy="13" r="3"></circle>
                      </svg>
                      <p className="text-sm">No additional presets available</p>
                    </div>
                  )}
                </div>
                {selectedNewPresets.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedNewPresets.length} new preset{selectedNewPresets.length !== 1 ? 's' : ''} will be added
                  </p>
                )}
              </div>
            )}

            {/* Hidden fields for compatibility */}
            <input type="hidden" name="pan" value={editingPatrolPattern.pan || 0.5} />
            <input type="hidden" name="tilt" value={editingPatrolPattern.tilt || 0.5} />
            <input type="hidden" name="zoom" value={editingPatrolPattern.zoom || 50} />
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-300">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 sm:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatrolModal;

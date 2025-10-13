import React, { useState } from 'react';
import { usePresets } from '../../hooks/ptz';

interface PresetControlProps {
  speeds?: { Pan: number; Tilt: number };
  zoomLevel: number;
}

const PresetControl: React.FC<PresetControlProps> = ({ speeds, zoomLevel }) => {
  // Default speeds if not provided
  const defaultSpeeds = { Pan: 0.5, Tilt: 0.5 };
  const currentSpeeds = speeds || defaultSpeeds;
  const {
    selectedPresets,
    showCreatePresetModal,
    useCurrentPosition,
    presets,
    loading,
    error,
    isCreating,
    isGoingToPreset,
    isDeleting,
    isDeletingMultiple,
    createPreset,
    gotoPreset,
    deletePreset,
    refreshPresets,
    handlePresetSelect,
    handleSelectAllPresets,
    handleDeleteSelectedPresets,
    // handleEditPreset,
    setShowCreatePresetModal,
    setUseCurrentPosition
  } = usePresets();

  // Form state for creating new presets
  const [presetName, setPresetName] = useState('');
  const [manualPan, setManualPan] = useState(0.5);
  const [manualTilt, setManualTilt] = useState(0.5);
  const [manualZoom, setManualZoom] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle creating a new preset
  const handleCreatePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    try {
      const pan = useCurrentPosition ? currentSpeeds.Pan : manualPan;
      const tilt = useCurrentPosition ? currentSpeeds.Tilt : manualTilt;
      const zoom = useCurrentPosition ? zoomLevel : manualZoom;

      await createPreset(presetName.trim(), pan, tilt, zoom);
      
      // Show success message
      setSuccessMessage(`Preset "${presetName.trim()}" created successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form
      setPresetName('');
      setManualPan(0.5);
      setManualTilt(0.5);
      setManualZoom(50);
      setShowCreatePresetModal(false);
    } catch (err) {
      console.error('Failed to create preset:', err);
      alert('Failed to create preset. Please try again.');
    }
  };

  // Handle going to a preset
  const handleGotoPreset = async (preset: any) => {
    try {
      await gotoPreset(preset);
    } catch (err) {
      console.error('Failed to go to preset:', err);
      alert('Failed to go to preset. Please try again.');
    }
  };

  // Handle deleting a single preset
  const handleDeletePreset = async (preset: any) => {
    try {
      await deletePreset(preset);
      
      // Show success message
      setSuccessMessage(`Preset "${preset.name}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete preset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-200/20 flex flex-col h-[calc(80vh-80px)] sm:h-[calc(60vh-100px)] md:h-[calc(70vh-120px)] lg:h-[calc(81vh-80px)]">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-700">Preset Management</h3>
        </div>
        <button
          onClick={refreshPresets}
          disabled={loading}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh presets"
        >
          <svg 
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-4 flex-1 ">
        {/* Add New Preset Form */}
        <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              Create New Preset
            </h4>
            <button
              onClick={() => setShowCreatePresetModal(!showCreatePresetModal)}
              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-all duration-200 border border-blue-300"
            >
              {showCreatePresetModal ? 'Cancel' : 'Add'}
            </button>
          </div>

          {showCreatePresetModal && (
            <form className="space-y-3">
              {/* Preset Name */}
              <div>
                <input
                  type="text"
                  placeholder="Preset Name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                />
              </div>

              {/* Use Current Position Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCurrentPosition"
                  checked={useCurrentPosition}
                  onChange={(e) => setUseCurrentPosition(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="useCurrentPosition" className="text-xs text-gray-600 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                  </svg>
                  Use Current Camera Position
                </label>
              </div>

              {/* Position Inputs - Only show when checkbox is checked */}
              {useCurrentPosition && (
                <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-2">Current Position Values</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Pan</label>
                      <input
                        type="number"
                        value={currentSpeeds.Pan}
                        readOnly
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Tilt</label>
                      <input
                        type="number"
                        value={currentSpeeds.Tilt}
                        readOnly
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Zoom</label>
                      <input
                        type="number"
                        value={zoomLevel}
                        readOnly
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Position Inputs - Only show when checkbox is unchecked */}
              {!useCurrentPosition && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">Manual Position Values</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Pan</label>
                      <input
                        type="number"
                        placeholder="0.5"
                        min={0} max={1} step={0.01}
                        value={manualPan}
                        onChange={(e) => setManualPan(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Tilt</label>
                      <input
                        type="number"
                        placeholder="0.5"
                        min={0} max={1} step={0.01}
                        value={manualTilt}
                        onChange={(e) => setManualTilt(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Zoom</label>
                      <input
                        type="number"
                        placeholder="50"
                        min={0} max={100} step={1}
                        value={manualZoom}
                        onChange={(e) => setManualZoom(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCreatePreset}
                disabled={isCreating}
                className="w-full px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded border border-green-300 transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                )}
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </form>
          )}
        </div>

        {/* Preset Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
              </svg>
              Saved Presets
            </h4>
            
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPresets.length === presets.length && presets.length > 0}
                onChange={handleSelectAllPresets}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-xs text-gray-600">Select All</span>
            </div>
          </div>

          {/* Bulk Actions - Show when presets are selected */}
          {selectedPresets.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedPresets.length} preset{selectedPresets.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await handleDeleteSelectedPresets();
                        
                        // Show success message
                        setSuccessMessage(`${selectedPresets.length} preset${selectedPresets.length > 1 ? 's' : ''} deleted successfully!`);
                        setTimeout(() => setSuccessMessage(''), 3000);
                      } catch (err) {
                        console.error('Failed to delete selected presets:', err);
                        const errorMessage = err instanceof Error ? err.message : 'Failed to delete selected presets. Please try again.';
                        alert(errorMessage);
                      }
                    }}
                    disabled={isDeletingMultiple}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-all duration-200 border border-red-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingMultiple ? (
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    )}
                    {isDeletingMultiple ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading presets...
              </div>
            </div>
          )}

          <div className=" flex flex-col gap-2 h-full lg:h-[calc(74vh-200px)] overflow-y-auto custom-scrollbar py-4">
            {presets.length === 0 && !loading ? (
              <div className="col-span-2 p-4 text-center text-gray-500 ">
                <div className="text-sm">No presets found</div>
                <div className="text-xs mt-1">Create your first preset above</div>
              </div>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => !isGoingToPreset && handleGotoPreset(preset)}
                  className={`group relative flex items-center justify-between p-4 h-24 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-blue-200
                    ${selectedPresets.includes(preset.id) ? 'bg-gray-200 border-blue-300' : 'bg-gray-200'}
                    ${isGoingToPreset ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {/* Left side: Checkbox + Info */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedPresets.includes(preset.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handlePresetSelect(preset.id);
                      }}
                      className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                    />
            
                    {/* Preset Info */}
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-800">
                        {preset.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Pan: <span className="font-medium text-gray-700">{typeof preset.pan === 'number' ? preset.pan.toFixed(2) : 'N/A'}</span>,{' '}
                        Tilt: <span className="font-medium text-gray-700">{typeof preset.tilt === 'number' ? preset.tilt.toFixed(2) : 'N/A'}</span>,{' '}
                        Zoom: <span className="font-medium text-gray-700">{typeof preset.zoom === 'number' ? preset.zoom.toFixed(2) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
            
                  {/* Right side: Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset);
                    }}
                    disabled={isDeleting}
                    title="Delete Preset"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetControl;

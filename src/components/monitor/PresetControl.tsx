import React from 'react';
import { usePresets } from '../../hooks/monitor';

interface PresetControlProps {
  speeds: { Pan: number; Tilt: number };
  zoomLevel: number;
}

const PresetControl: React.FC<PresetControlProps> = ({ speeds, zoomLevel }) => {
  const {
    selectedPresets,
    showCreatePresetModal,
    useCurrentPosition,
    handlePresetSelect,
    handleSelectAllPresets,
    handleDeleteSelectedPresets,
    handleEditPreset,
    setShowCreatePresetModal,
    setUseCurrentPosition
  } = usePresets();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-200/20 flex flex-col h-[calc(80vh-80px)] sm:h-[calc(60vh-100px)] md:h-[calc(70vh-120px)] lg:h-[calc(81vh-80px)]">
      <div className="flex items-center space-x-2 p-3 sm:p-4 border-b border-gray-300">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-700">Preset Management</h3>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-4 flex-1 overflow-y-auto">
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
                        value={speeds.Pan}
                        readOnly
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Tilt</label>
                      <input
                        type="number"
                        value={speeds.Tilt}
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
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Tilt</label>
                      <input
                        type="number"
                        placeholder="0.5"
                        min={0} max={1} step={0.01}
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Zoom</label>
                      <input
                        type="number"
                        placeholder="50"
                        min={0} max={100} step={1}
                        className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="w-full px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded border border-green-300 transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Create
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
                checked={selectedPresets.length === 12 && 12 > 0}
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
                    onClick={handleDeleteSelectedPresets}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-all duration-200 border border-red-300 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-full lg:h-[calc(74vh-200px)] overflow-y-auto custom-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((preset) => (
              <div
                key={preset}
                className={`group relative px-2 sm:px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                  selectedPresets.includes(preset) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedPresets.includes(preset)}
                    onChange={() => handlePresetSelect(preset)}
                    className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                  />
                  
                  {/* Preset Info */}
                  <div className="flex-1 flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-xs font-medium">P{preset}</div>
                      <div className="text-xs text-gray-500">0.5, 0.3</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => handleEditPreset({ id: preset, name: `P${preset}`, pan: 0.5, tilt: 0.3, zoom: 50 })}
                          className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-all duration-200"
                          title="Edit Preset"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete preset P${preset}?`)) {
                              console.log("Deleting preset:", preset);
                            }
                          }}
                          className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-all duration-200"
                          title="Delete Preset"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetControl;

import React from 'react';

interface SectionToggleProps {
  sectionName: string;
  onSectionChange: (section: 'Joystick' | 'Preset' | 'Patrol') => void;
  cameras: any[];
  selectedCamera: string;
  onCameraModalOpen: () => void;
}

const SectionToggle: React.FC<SectionToggleProps> = ({
  sectionName,
  onSectionChange,
  cameras,
  selectedCamera,
  onCameraModalOpen
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-2 shadow-lg shadow-gray-200/20 overflow-visible">
      {/* Header and Camera Selection - Hidden on small screens */}
      <div className="hidden sm:flex flex-row items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-700">PTZ Control Panel</h3>
        </div>
        
        {/* Camera Selection Dropdown */}
        <div className="relative z-10 w-auto">
          <button
            onClick={onCameraModalOpen}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-xs transition-colors flex items-center justify-start gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span className="truncate">{cameras.find(cam => cam.id === selectedCamera)?.appName || 'Select Camera'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown - Always visible on small screens */}
      <div className="sm:hidden space-y-2">
        {/* Camera Selection Button */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Camera
          </h3>
          <button
            onClick={onCameraModalOpen}
            className="flex-1 max-w-32 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs transition-colors flex items-center justify-between gap-1 border border-gray-300"
          >
            <span className="truncate text-left">
              {cameras.find(cam => cam.id === selectedCamera)?.appName || 'Select Camera'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
        </div>

        {/* Control Type Selection */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
            Controls
          </h3>
          <div className="relative flex-1 max-w-32">
            <select
              value={sectionName}
              onChange={(e) => {
                onSectionChange(e.target.value as 'Joystick' | 'Preset' | 'Patrol');
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition-colors"
              title="Select control type"
              aria-label="Select control type"
            >
              <option value="Joystick">🎮 Joystick</option>
              <option value="Preset">📋 Preset</option>
              <option value="Patrol">🛡️ Patrol</option>
            </select>
            
            {/* Custom Dropdown Arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Section Toggle - Only show on larger screens */}
      <div className="hidden sm:grid grid-cols-3 gap-2">
        <button
          onClick={() => onSectionChange('Joystick')}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${sectionName === 'Joystick'
              ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-lg shadow-blue-200/50'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent hover:border-gray-300'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
          </svg>
          Joystick
        </button>

        <button
          onClick={() => onSectionChange('Preset')}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${sectionName === 'Preset'
              ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-lg shadow-blue-200/50'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent hover:border-gray-300'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
          </svg>
          Preset
        </button>

        <button
          onClick={() => onSectionChange('Patrol')}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${sectionName === 'Patrol'
              ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-lg shadow-blue-200/50'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent hover:border-gray-300'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          Patrol
        </button>
      </div>
    </div>
  );
};

export default SectionToggle;

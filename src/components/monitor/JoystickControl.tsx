import React, { useRef, useEffect } from 'react';
import { useJoystick } from '../../hooks/monitor';

interface JoystickControlProps {
  onMovement: (speeds: { Pan: number; Tilt: number }) => void;
  onZoomChange: (zoom: number) => void;
  zoomLevel: number;
}

const JoystickControl: React.FC<JoystickControlProps> = ({
  onMovement,
  onZoomChange,
  zoomLevel
}) => {
  const zoomLevelRef = useRef<number>(50);

  // Keep ref in sync with state
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  const handleJoystickMove = (newSpeeds: { Pan: number; Tilt: number }) => {
    onMovement(newSpeeds);
  };

  const handleJoystickEnd = () => {
    const stopSpeeds = { Pan: 0.5, Tilt: 0.5 };
    onMovement(stopSpeeds);
  };

  const { joystickRef } = useJoystick({
    isActive: true,
    onMove: handleJoystickMove,
    onEnd: handleJoystickEnd
  });

  return (
    <div className="bg-white/80 h-[calc(50vh-80px)] md:h-[calc(81vh-80px)] backdrop-blur-sm rounded-xl border border-gray-200/50 p-3 sm:p-6 shadow-lg shadow-gray-200/20 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h3 className="text-xs md:text-sm font-semibold text-gray-700">Joystick Control</h3>
      </div>

      {/* Joystick Container */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52 bg-gray-100 rounded-full border-2 border-gray-300 shadow-inner backdrop-blur-sm">
          <div ref={joystickRef} className="absolute inset-0 rounded-full cursor-pointer"></div>

          {/* Center indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded-full border border-gray-400"></div>
          </div>

          {/* Direction indicators */}
          <div className="absolute top-2 sm:top-3 left-1/2 transform -translate-x-1/2 text-gray-600 text-xs sm:text-sm font-medium pointer-events-none">↑</div>
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 text-gray-600 text-xs sm:text-sm font-medium pointer-events-none">↓</div>
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-xs sm:text-sm font-medium pointer-events-none">←</div>
          <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-xs sm:text-sm font-medium pointer-events-none">→</div>

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Zoom Control */}
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-gray-100 rounded-lg p-3 sm:p-4 border border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              Zoom Level
            </span>
            <div className="px-1 bg-gray-200 rounded-lg text-xs sm:text-sm font-mono text-gray-700 border border-gray-400">
              {zoomLevel}%
            </div>
          </div>

          {/* Enhanced Zoom Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={zoomLevel}
              onChange={(e) => onZoomChange(parseInt(e.target.value))}
              className="w-full h-1 md:h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider border border-gray-400"
              title="Zoom level control"
              aria-label="Camera zoom level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={zoomLevel}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${zoomLevel}%, #d1d5db ${zoomLevel}%, #d1d5db 100%)`
              }}
            />

            {/* Zoom Labels */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Quick Zoom Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onZoomChange(0)}
            className="px-1 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            Reset
          </button>
          <button
            onClick={() => onZoomChange(25)}
            className="px-1 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            25%
          </button>
          <button
            onClick={() => onZoomChange(50)}
            className="px-1 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            50%
          </button>
          <button
            onClick={() => onZoomChange(100)}
            className="px-1 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            100%
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoystickControl;

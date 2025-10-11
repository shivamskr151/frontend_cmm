import React from 'react';

interface SpeedControlsProps {
  speeds: { Pan: number; Tilt: number };
}

const SpeedControls: React.FC<SpeedControlsProps> = ({ speeds }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-2 sm:p-4 shadow-lg shadow-gray-200/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          {/* <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${connectionStatus === 'connected'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
              }`}></div>
            {connectionStatus === 'connected' ? 'Connected' :
              connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </div> */}
        </div>
      </div>

      {/* Speed Controls */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {Object.keys(speeds).map((label, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                {label}
              </label>
              <div className="px-1.5 sm:px-2 bg-gray-100 rounded text-xs font-mono text-gray-700 border border-gray-300">
                {speeds[label as keyof typeof speeds].toFixed(1)}
              </div>
            </div>

            {/* Speed Bar - Hidden on small screens */}
            <div className="hidden sm:block relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${speeds[label as keyof typeof speeds] * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeedControls;

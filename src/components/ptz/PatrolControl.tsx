import React from 'react';
import { usePatrol } from '../../hooks/ptz';

interface PatrolControlProps {
  sendPatrolCommand: (action: string, patternId?: number, pattern?: any) => void;
}

const PatrolControl: React.FC<PatrolControlProps> = ({ sendPatrolCommand }) => {
  const {
    patrolStatus,
    selectedPatrolPatterns,
    patrolPatterns,
    startPatrol,
    stopPatrol,
    pausePatrol,
    resumePatrol,
    handlePatrolPatternSelect,
    handleSelectAllPatrolPatterns,
    handleEditPatrolPattern
  } = usePatrol(sendPatrolCommand);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-200/20 h-[calc(80vh-80px)] lg:h-[calc(82vh-80px)]">
      <div className="flex sm:flex-row items-start sm:items-center justify-between p-2 border-b border-gray-300 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-700">Patrol System</h3>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${patrolStatus === 'running'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : patrolStatus === 'paused'
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}>
          <div className={`w-2 h-2 rounded-full ${patrolStatus === 'running' ? 'bg-green-500 animate-pulse' :
              patrolStatus === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}></div>
          {patrolStatus === 'running' ? 'Active' :
            patrolStatus === 'paused' ? 'Paused' : 'Standby'}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-[calc(100%-40px)]">
        {/* Patrol Patterns Section */}
        <div className="flex-1 py-0.5 px-0.5 overflow-hidden">
          <div className="flex items-center justify-end">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 p-3">
              <input
                type="checkbox"
                checked={selectedPatrolPatterns.length === patrolPatterns.length && patrolPatterns.length > 0}
                onChange={handleSelectAllPatrolPatterns}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-xs text-gray-600">Select All</span>
            </div>
          </div>

          <div className="space-y-2 h-[calc(100%-60px)] overflow-y-auto custom-scrollbar">
            {patrolPatterns.slice(0, 12).map((pattern) => (
              <div
                key={pattern.id}
                className={`w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md group ${
                  selectedPatrolPatterns.includes(pattern.id) ? ' bg-blue-50' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2">
                  {/* Checkbox */}
                  <div className="flex gap-2 justify-center items-center">
                    <input
                      type="checkbox"
                      checked={selectedPatrolPatterns.includes(pattern.id)}
                      onChange={() => handlePatrolPatternSelect(pattern.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    
                    {/* Pattern Info */}
                    <div className="flex-1 flex sm:flex-row justify-between items-start sm:items-center w-full">
                      <div className="text-left">
                        <div className="text-sm font-medium">{pattern.name}</div>
                        <div className="text-xs text-gray-500">
                          Pan: {pattern.pan} • Tilt: {pattern.tilt} • Zoom: {pattern.zoom}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-start">
                    <button
                      onClick={() => startPatrol(pattern.id)}
                      disabled={patrolStatus === 'running'}
                      className="p-1.5 sm:p-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-green-700 disabled:text-gray-400 rounded transition-all duration-200"
                      title="Start Patrol"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5,3 19,12 5,21"></polygon>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditPatrolPattern(pattern)}
                      className="p-1.5 sm:p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-all duration-200"
                      title="Edit Pattern"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete patrol pattern "${pattern.name}"?`)) {
                          console.log("Deleting patrol pattern:", pattern);
                          // Here you would typically make an API call to delete the pattern
                        }
                      }}
                      className="p-1.5 sm:p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-all duration-200"
                      title="Delete Pattern"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Control Buttons - Always visible at bottom */}
        <div className="p-2 border-t border-gray-200/50 bg-gray-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 w-full">
            {patrolStatus === 'idle' ? (
              <button
                onClick={() => startPatrol(1)}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded-lg border border-green-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
                Start Patrol
              </button>
            ) : patrolStatus === 'running' ? (
              <>
                <button
                  onClick={pausePatrol}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700 rounded-lg border border-yellow-300 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-200/50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Pause
                </button>
                <button
                  onClick={stopPatrol}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 rounded-lg border border-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12"></rect>
                  </svg>
                  Stop
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={resumePatrol}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded-lg border border-green-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>
                  Resume
                </button>
                <button
                  onClick={stopPatrol}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 rounded-lg border border-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12"></rect>
                  </svg>
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatrolControl;

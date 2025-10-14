import React, { useState } from 'react';
import CreatePatrolTourModal from './CreatePatrolTourModal';
import { type PatrolPattern } from '../../hooks/ptz';
import { type PatrolTour } from '../../api/onvif/onvifPatrolApi';


interface PatrolControlProps {
  // Patrol data and functions from parent component
  patrolStatus: 'idle' | 'running' | 'paused' | 'loading' | 'error';
  patrolPatterns: PatrolPattern[];
  patrolTours: PatrolTour[];
  loading: boolean;
  error: string | null;
  startPatrol: (patternId: number) => void;
  stopPatrol: () => void;
  stopIndividualPatrol: (patternId: number) => void;
  pausePatrol: () => void;
  resumePatrol: () => void;
  loadPatrolTours: () => void;
  clearError: () => void;
  handleEditPatrolPattern: (pattern: PatrolPattern, tour: PatrolTour) => void;
  deletePatrolPattern: (patternId: number) => void;
}

const PatrolControl: React.FC<PatrolControlProps> = ({ 
  patrolStatus,
  patrolPatterns,
  patrolTours,
  loading,
  error,
  startPatrol,
  stopPatrol,
  stopIndividualPatrol,
  pausePatrol,
  resumePatrol,
  loadPatrolTours,
  clearError,
  handleEditPatrolPattern,
  deletePatrolPattern
}) => {
  const [showCreateTourModal, setShowCreateTourModal] = useState(false);

  const handleTourCreated = (tourToken: string) => {
    console.log('✅ Tour created successfully:', tourToken);
    // Reload patrol tours to show the new one
    loadPatrolTours();
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-200/20 h-[calc(80vh-80px)] lg:h-[calc(82vh-80px)]">
      <div className="flex sm:flex-row items-start sm:items-center justify-between p-2 border-b border-gray-300 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-700">Patrol System</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${patrolStatus === 'running'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : patrolStatus === 'paused'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : patrolStatus === 'loading'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : patrolStatus === 'error'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}>
            <div className={`w-2 h-2 rounded-full ${patrolStatus === 'running' ? 'bg-green-500 animate-pulse' :
                patrolStatus === 'paused' ? 'bg-yellow-500' : 
                patrolStatus === 'loading' ? 'bg-blue-500 animate-spin' :
                patrolStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
            {patrolStatus === 'running' ? 'Active' :
              patrolStatus === 'paused' ? 'Paused' : 
              patrolStatus === 'loading' ? 'Loading...' :
              patrolStatus === 'error' ? 'Error' : 'Standby'}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Create Tour Button */}
            <button
              onClick={() => {
                console.log('🔵 Create Tour button clicked, opening modal...');
                setShowCreateTourModal(true);
              }}
              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-all duration-200"
              title="Create New Patrol Tour"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                <circle cx="12" cy="13" r="3"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={loadPatrolTours}
              disabled={loading}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-600 disabled:text-gray-400 rounded transition-all duration-200"
              title="Refresh Patrol Tours"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
                <polyline points="23,4 23,10 17,10"></polyline>
                <polyline points="1,20 1,14 7,14"></polyline>
                <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-[calc(100%-40px)]">
        {/* Error Display */}
        {error && (
          <div className="mx-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span className="text-sm text-red-700 font-medium">Error: {error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Dismiss error"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Patrol Patterns Section */}
        <div className="flex-1 py-0.5 px-0.5 overflow-hidden">
          <div className="space-y-2 h-full overflow-y-auto custom-scrollbar">
            {/* Loading State */}
            {loading && patrolPatterns.length === 0 && (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <polyline points="23,4 23,10 17,10"></polyline>
                    <polyline points="1,20 1,14 7,14"></polyline>
                    <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
                  </svg>
                  <span className="text-sm">Loading patrol tours...</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && patrolPatterns.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                <span className="text-sm font-medium">No patrol tours found</span>
                <span className="text-xs text-gray-400 mt-1 mb-3">Create your first patrol tour</span>
                <button
                  onClick={() => setShowCreateTourModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Tour
                </button>
              </div>
            )}

            {/* Patrol Patterns List */}
          
            {patrolPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 p-2">
                  {/* Pattern Info */}
                  <div className="flex-1 flex sm:flex-row justify-between items-start sm:items-center w-full">
                    <div className="text-left">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {pattern.name}
                        {pattern.isRunning && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></div>
                            Running
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* Token: {pattern.presetToken || 'N/A'} */}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-start">
                    <button
                      onClick={() => startPatrol(pattern.id)}
                      disabled={patrolStatus === 'running' || patrolStatus === 'loading' || !pattern.presetToken}
                      className="p-1.5 sm:p-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-green-700 disabled:text-gray-400 rounded transition-all duration-200"
                      title={!pattern.presetToken ? "No preset token available" : "Start Patrol"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5,3 19,12 5,21"></polygon>
                      </svg>
                    </button>
                    <button
                      onClick={() => stopIndividualPatrol(pattern.id)}
                      disabled={!pattern.presetToken || loading}
                      className="p-1.5 sm:p-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-red-700 disabled:text-gray-400 rounded transition-all duration-200"
                      title={!pattern.presetToken ? "No preset token available" : "Stop Patrol"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="6" width="12" height="12"></rect>
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        // Find the corresponding patrol tour for this pattern
                        const patrolTour = patrolTours.find((_, index) => index + 1 === pattern.id);
                        if (patrolTour) {
                          handleEditPatrolPattern(pattern, patrolTour);
                        }
                      }}
                      disabled={!pattern.presetToken || loading}
                      className="p-1.5 sm:p-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-blue-700 disabled:text-gray-400 rounded transition-all duration-200"
                      title={!pattern.presetToken ? "No preset token available" : "Edit Patrol"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => deletePatrolPattern(pattern.id)}
                      disabled={!pattern.presetToken || loading}
                      className="p-1.5 sm:p-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-red-700 disabled:text-gray-400 rounded transition-all duration-200"
                      title={!pattern.presetToken ? "No preset token available" : "Delete Patrol"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
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
                onClick={() => patrolPatterns.length > 0 ? startPatrol(patrolPatterns[0].id) : null}
                disabled={patrolPatterns.length === 0 || loading}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 disabled:from-gray-100 disabled:to-gray-200 text-green-700 disabled:text-gray-400 rounded-lg border border-green-300 disabled:border-gray-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 disabled:shadow-none text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
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
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 disabled:from-gray-100 disabled:to-gray-200 text-yellow-700 disabled:text-gray-400 rounded-lg border border-yellow-300 disabled:border-gray-300 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-200/50 disabled:shadow-none text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Pause
                </button>
                <button
                  onClick={stopPatrol}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 disabled:from-gray-100 disabled:to-gray-200 text-red-700 disabled:text-gray-400 rounded-lg border border-red-300 disabled:border-gray-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 disabled:shadow-none text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
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
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 disabled:from-gray-100 disabled:to-gray-200 text-green-700 disabled:text-gray-400 rounded-lg border border-green-300 disabled:border-gray-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 disabled:shadow-none text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>
                  Resume
                </button>
                <button
                  onClick={stopPatrol}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 disabled:from-gray-100 disabled:to-gray-200 text-red-700 disabled:text-gray-400 rounded-lg border border-red-300 disabled:border-gray-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 disabled:shadow-none text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
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

      {/* Create Tour Modal */}
      <CreatePatrolTourModal
        isOpen={showCreateTourModal}
        onClose={() => setShowCreateTourModal(false)}
        onTourCreated={handleTourCreated}
      />
    </div>
  );
};

export default PatrolControl;

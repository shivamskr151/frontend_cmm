import React from 'react';

interface ZoneDrawingSectionProps {
  currentZoneType: string;
  selectedCamera: string;
  isLoading: boolean;
  hasSnapshot: boolean;
  snapshotUrl: string;
  onTakeSnapshot: () => void;
  onDrawZone: () => void;
  onDrawLane: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  snapshotImageRef: React.RefObject<HTMLImageElement>;
  zoneCanvasRef: React.RefObject<HTMLCanvasElement>;
}

const ZoneDrawingSection: React.FC<ZoneDrawingSectionProps> = ({
  currentZoneType,
  selectedCamera,
  isLoading,
  hasSnapshot,
  snapshotUrl,
  onTakeSnapshot,
  onDrawZone,
  onDrawLane,
  onUndo,
  onRedo,
  onClearAll,
  snapshotImageRef,
  zoneCanvasRef
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Zone Drawing & Snapshot</h3>
              <p className="text-sm text-gray-600 mt-1">Capture camera view and draw monitoring zones</p>
            </div>
          </div>
          
          <button 
            onClick={onTakeSnapshot}
            disabled={!selectedCamera || isLoading}
            className={`px-4 sm:px-6 py-3 rounded-xl font-medium flex items-center gap-2 sm:gap-3 transition-all duration-200 text-sm sm:text-base shadow-lg ${
              isLoading || !selectedCamera 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 shadow-gray-200/50' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50 transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            )}
            <span className="hidden sm:inline">{isLoading ? 'Capturing...' : 'Take Snapshot'}</span>
            <span className="sm:hidden">{isLoading ? 'Capture' : '📸'}</span>
          </button>
        </div>

        {/* Zone Drawing Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 mb-6 shadow-lg shadow-gray-200/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Current Mode Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">
                  Mode: <span className="font-bold text-blue-800">
                    {currentZoneType === 'rectangle' ? 'Rectangle Zone' : 
                      currentZoneType === 'rectangle-with-lanes' ? 'Rectangle + Lanes' :
                      currentZoneType === 'polygon' ? 'Polygon Zone' :
                      currentZoneType === 'polygon-with-lanes' ? 'Polygon + Lanes' : 'Unknown'}
                  </span>
                </span>
              </div>
            </div>
            
            {/* Drawing Tools */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button 
                onClick={onDrawZone}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 font-medium flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                </svg>
                <span className="hidden sm:inline">Draw Zone</span>
                <span className="sm:hidden">Zone</span>
              </button>
              
              <button 
                onClick={onDrawLane}
                className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md font-medium flex items-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="hidden sm:inline">Draw Lane</span>
                <span className="sm:hidden">Lane</span>
              </button>
              
              <button 
                onClick={onUndo}
                className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md font-medium flex items-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14L4 9l5-5"></path>
                  <path d="M4 9h16a2 2 0 0 1 2 2v4"></path>
                </svg>
                <span className="hidden sm:inline">Undo</span>
                <span className="sm:hidden">↶</span>
              </button>
              
              <button 
                onClick={onRedo}
                className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md font-medium flex items-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9l5 5-5 5"></path>
                  <path d="M20 14H4a2 2 0 0 1-2-2V8"></path>
                </svg>
                <span className="hidden sm:inline">Redo</span>
                <span className="sm:hidden">↷</span>
              </button>
              
              <button 
                onClick={onClearAll}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 font-medium flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M15 9l-6 6"></path>
                  <path d="M9 9l6 6"></path>
                </svg>
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Snapshot Container */}
        <div className="relative w-full overflow-hidden min-h-[300px] sm:min-h-[400px] md:min-h-[450px] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl shadow-inner">
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px]">
            <img 
              ref={snapshotImageRef}
              src={hasSnapshot ? (snapshotUrl || '/api/snapshot/placeholder') : 'https://picsum.photos/800/400?random=1'} 
              alt="Zone Snapshot" 
              className="w-full h-full object-cover block border border-gray-300 rounded-xl relative z-10 shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://picsum.photos/800/400?random=1';
              }}
            />
            
            <canvas 
              ref={zoneCanvasRef}
              className="absolute top-0 left-0 w-full h-full z-20 touch-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneDrawingSection;

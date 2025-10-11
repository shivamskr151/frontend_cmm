import React from 'react';

interface CameraSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: any[];
  selectedCamera: string;
  onCameraSelect: (cameraId: string) => void;
}

const CameraSelectionModal: React.FC<CameraSelectionModalProps> = ({
  isOpen,
  onClose,
  cameras,
  selectedCamera,
  onCameraSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-96 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700">Select Camera</h3>
              <p className="text-xs sm:text-sm text-gray-500">Choose a camera to switch to</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close camera selection modal"
            aria-label="Close camera selection modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="space-y-2 sm:space-y-3">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => onCameraSelect(camera.id)}
                className={`w-full p-3 sm:p-4 rounded-lg border transition-all duration-200 flex items-center gap-3 sm:gap-4 ${
                  camera.id === selectedCamera
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:border-gray-400'
                }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                  camera.id === selectedCamera
                    ? 'bg-blue-200'
                    : 'bg-gray-200'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm sm:text-base font-medium">{camera.appName || camera.name}</div>
                  <div className="text-xs sm:text-sm opacity-75">
                    {camera.id === selectedCamera ? 'Currently Selected' : 'Available'}
                  </div>
                </div>
                {camera.id === selectedCamera && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-300">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraSelectionModal;

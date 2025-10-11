import React from 'react';
import type { ModalType, ToastType } from '../../types/dashboard';

interface ModalsProps {
  // Zone Type Modal
  showZoneTypeModal: boolean;
  onCloseZoneTypeModal: () => void;
  onZoneTypeChange: (zoneType: string) => void;
  
  // Message Modal
  showMessageModal: boolean;
  modalMessage: string;
  modalTitle: string;
  modalType: ModalType;
  onCloseMessageModal: () => void;
  
  // Toast
  showToast: boolean;
  toastMessage: string;
  toastType: ToastType;
  onCloseToast: () => void;
}

const Modals: React.FC<ModalsProps> = ({
  showZoneTypeModal,
  onCloseZoneTypeModal,
  onZoneTypeChange,
  showMessageModal,
  modalMessage,
  modalTitle,
  modalType,
  onCloseMessageModal,
  showToast,
  toastMessage,
  toastType,
  onCloseToast
}) => {
  return (
    <>
      {/* Zone Type Selection Modal */}
      {showZoneTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/60 shadow-2xl">
            <div className="flex items-center mb-4 sm:mb-5">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <h5 className="text-base sm:text-lg font-semibold text-gray-800">Select Zone Type</h5>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 sm:mb-6">
              Choose the type of zone you want to draw:
            </p>
            
            <div className="grid gap-3 sm:gap-4">
              {[
                { type: 'rectangle', name: 'Rectangle Zone', description: 'Draw simple rectangle zones for basic area detection', color: 'orange' },
                { type: 'rectangle-with-lanes', name: 'Rectangle Zone with Lanes', description: 'Draw rectangular zones with lanes for traffic analysis', color: 'blue' },
                { type: 'polygon', name: 'Polygon Zone', description: 'Draw custom polygon zones for complex area analysis', color: 'green' },
                { type: 'polygon-with-lanes', name: 'Polygon Zone with Lanes', description: 'Draw polygon zones with lanes for traffic analysis', color: 'emerald' }
              ].map((option) => (
                <div 
                  key={option.type}
                  onClick={() => onZoneTypeChange(option.type)}
                  className="border-2 border-gray-300 rounded-xl p-3 sm:p-4 md:p-5 cursor-pointer transition-all duration-200 bg-gray-50 hover:border-blue-400 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-200/50"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-8 sm:w-16 sm:h-10 border-2 border-blue-400 rounded bg-blue-400/20 relative flex-shrink-0">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 sm:w-8 bg-blue-400"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h6 className="text-gray-800 font-semibold mb-1 text-sm sm:text-base">{option.name}</h6>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{option.description}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5 flex-shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-right">
              <button 
                onClick={onCloseZoneTypeModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-md w-full border border-gray-200/60 shadow-2xl">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                modalType === 'success' ? 'bg-green-100' : 
                modalType === 'error' ? 'bg-red-100' : 
                modalType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={
                  modalType === 'success' ? '#10b981' : 
                  modalType === 'error' ? '#ef4444' : 
                  modalType === 'warning' ? '#f59e0b' : '#3b82f6'
                } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                  {modalType === 'success' ? (
                    <path d="M9 12l2 2 4-4"></path>
                  ) : modalType === 'error' ? (
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  ) : modalType === 'warning' ? (
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  ) : (
                    <circle cx="12" cy="12" r="10"></circle>
                  )}
                </svg>
              </div>
              <h5 className="text-base sm:text-lg font-semibold text-gray-800">{modalTitle}</h5>
            </div>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{modalMessage}</p>
            
            <div className="text-right">
              <button 
                onClick={onCloseMessageModal}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-lg hover:shadow-blue-200/50 font-medium text-sm sm:text-base"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-right-full duration-300">
          <div className={`max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
            toastType === 'success' ? 'border-green-500' : 
            toastType === 'error' ? 'border-red-500' : 
            toastType === 'warning' ? 'border-yellow-500' : 'border-blue-500'
          }`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  toastType === 'success' ? 'bg-green-100' : 
                  toastType === 'error' ? 'bg-red-100' : 
                  toastType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={
                    toastType === 'success' ? '#10b981' : 
                    toastType === 'error' ? '#ef4444' : 
                    toastType === 'warning' ? '#f59e0b' : '#3b82f6'
                  } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {toastType === 'success' ? (
                      <path d="M9 12l2 2 4-4"></path>
                    ) : toastType === 'error' ? (
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    ) : toastType === 'warning' ? (
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    ) : (
                      <circle cx="12" cy="12" r="10"></circle>
                    )}
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    toastType === 'success' ? 'text-green-800' : 
                    toastType === 'error' ? 'text-red-800' : 
                    toastType === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {toastMessage}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={onCloseToast}
                    title="Close notification"
                    aria-label="Close notification"
                    className={`inline-flex rounded-md p-1.5 ${
                      toastType === 'success' ? 'text-green-500 hover:bg-green-100' : 
                      toastType === 'error' ? 'text-red-500 hover:bg-red-100' : 
                      toastType === 'warning' ? 'text-yellow-500 hover:bg-yellow-100' : 'text-blue-500 hover:bg-blue-100'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;

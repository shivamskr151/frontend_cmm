import React, { useState, useRef, useEffect, useCallback } from 'react';
import { JsonEditor } from './JsonEditor';
import { configurationApi } from '../../api';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivities: (jsonData: string) => Promise<{ success: boolean; message: string }>;
  cameraId?: string;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  onAddActivities,
  cameraId
}) => {
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const [, setValidationErrors] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const loadedCameraIdRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    setJsonData('');
    setIsValidJson(true);
    setValidationErrors([]);
    loadedCameraIdRef.current = null;
    onClose();
  }, [onClose]);

  // Click outside to close functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jsonData.trim()) {
      return;
    }

    if (!isValidJson) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await onAddActivities(jsonData);
      if (result.success) {
        setJsonData('');
        setIsValidJson(true);
        setValidationErrors([]);
        onClose();
      }
      // Handle error display (you might want to add a toast notification system)
      console.log(result.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonValidation = (isValid: boolean, errors: string[]) => {
    setIsValidJson(isValid);
    setValidationErrors(errors);
  };

  // Load configuration when modal opens and cameraId is available
  useEffect(() => {
    const loadConfiguration = async () => {
      if (!isOpen || !cameraId) return;

      // Don't reload if we already loaded configuration for this camera
      if (loadedCameraIdRef.current === cameraId) {
        console.log('📋 Configuration already loaded for camera:', cameraId);
        return;
      }

      setIsLoadingConfig(true);
      try {
        console.log('🔄 Loading configuration for camera:', cameraId);
        
        // First, let's try a direct API call to see the raw response
        const directResponse = await fetch(`http://localhost:4200/configuration/search?cameraId=${encodeURIComponent(cameraId)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('bearer_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Direct API response status:', directResponse.status);
        
        if (directResponse.ok) {
          const rawResponse = await directResponse.json();
          console.log('📡 Direct API raw response:', rawResponse);
          
          // Try to use the raw response directly
          const configJson = JSON.stringify(rawResponse, null, 2);
          console.log('📝 Direct configuration JSON:', configJson);
          
          setJsonData(configJson);
          setIsValidJson(true);
          setValidationErrors([]);
          loadedCameraIdRef.current = cameraId;
          
          console.log('✅ Configuration loaded directly for camera:', cameraId);
        } else {
          throw new Error(`Direct API call failed: ${directResponse.status} ${directResponse.statusText}`);
        }
      } catch (error) {
        console.error('❌ Error loading configuration:', error);
        console.error('❌ Error details:', error);
        
        // Try the configuration API as fallback
        try {
          console.log('🔄 Trying configuration API as fallback...');
          const configData = await configurationApi.getConfiguration(cameraId);
          
          console.log('📋 Fallback configuration data received:', configData);
          
          // Handle different response formats
          let configToDisplay;
          if (configData.configuration) {
            configToDisplay = configData.configuration;
          } else if (configData) {
            configToDisplay = configData;
          } else {
            configToDisplay = {};
          }
          
          const configJson = JSON.stringify(configToDisplay, null, 2);
          console.log('📝 Fallback configuration JSON:', configJson);
          
          setJsonData(configJson);
          setIsValidJson(true);
          setValidationErrors([]);
          loadedCameraIdRef.current = cameraId;
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          // Set empty JSON object as final fallback
          setJsonData('{}');
          setIsValidJson(true);
          setValidationErrors([]);
        }
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfiguration();
  }, [isOpen, cameraId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-white/98 backdrop-blur-sm rounded-2xl p-0 max-w-4xl w-full max-h-[90vh] border border-gray-200/60 shadow-2xl shadow-gray-900/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden"
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
              </div>
              <div>
                <h5 className="text-xl font-bold text-gray-900">JSON Editor</h5>
                <p className="text-sm text-gray-600">Import activities from JSON configuration</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:shadow-md"
              title="Close modal"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form id="json-editor-form" onSubmit={handleSubmit} className="space-y-6">
            {/* JSON Editor Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                  JSON Configuration
                </label>
                <div className="flex items-center gap-2">
                  {!isValidJson && jsonData.trim() && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                      Invalid JSON
                    </span>
                  )}
                  {isValidJson && jsonData.trim() && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                      Valid JSON
                    </span>
                  )}
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                {isLoadingConfig && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex items-center gap-3 text-blue-600">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium">Loading camera configuration...</span>
                    </div>
                  </div>
                )}
                <JsonEditor
                  value={jsonData}
                  onChange={setJsonData}
                  height="350px"
                  placeholder={cameraId ? "Loading camera configuration..." : "Enter your JSON data here..."}
                  onValidate={handleJsonValidation}
                />
              </div>
            </div>

            {/* Format Instructions Section */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-5 border border-blue-200/60">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h6 className="text-sm font-semibold text-gray-800">Format Guidelines</h6>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">
                Enter JSON object with activity names as keys. Each activity should have:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <code className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs font-mono">"status"</code>
                  <span className="text-gray-600">"ACTIVE" or "INACTIVE"</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <code className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs font-mono">"parameters"</code>
                  <span className="text-gray-600">Activity-specific settings</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <code className="text-purple-700 bg-purple-100 px-2 py-1 rounded text-xs font-mono">"zones"</code>
                  <span className="text-gray-600">(Optional) Zone coordinates</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <code className="text-orange-700 bg-orange-100 px-2 py-1 rounded text-xs font-mono">"lanes"</code>
                  <span className="text-gray-600">(Optional) Lane coordinates</span>
                </div>
              </div>
              
              <details className="group">
                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 font-medium flex items-center gap-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90">
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                  Show example format
                </summary>
                <div className="mt-3 p-4 bg-white/80 rounded-lg border border-gray-200">
                  <pre className="text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed">
{`{
  "my_activity": {
    "status": "ACTIVE",
    "parameters": {
      "frame_accuracy": 10,
      "time_window": [{
        "time_start_end": [["08:00", "18:00"]],
        "days": ["Monday", "Tuesday"]
      }]
    }
  }
}`}
                  </pre>
                </div>
              </details>
              
              <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  You can paste the full activities configuration or just the activities_data section.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gray-50/80 border-t border-gray-200/60 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Click outside the modal to close</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-white text-gray-700 rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="json-editor-form"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:-translate-y-0.5"
                disabled={isLoading || !isValidJson || !jsonData.trim()}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Activities...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    Add Activities
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

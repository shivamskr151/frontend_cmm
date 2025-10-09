import React, { useState } from 'react';
import { JsonEditor } from './JsonEditor';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivities: (jsonData: string) => Promise<{ success: boolean; message: string }>;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  onAddActivities
}) => {
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const [, setValidationErrors] = useState<string[]>([]);

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

  const handleClose = () => {
    setJsonData('');
    setIsValidJson(true);
    setValidationErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 max-w-2xl w-[90%] border border-slate-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-lg font-semibold text-white">JSON Editor</h5>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <JsonEditor
              value={jsonData}
              onChange={setJsonData}
              height="300px"
              placeholder="Enter your JSON data here..."
              onValidate={handleJsonValidation}
            />
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-300 mb-2">
              <strong>Format:</strong> Enter JSON object with activity names as keys. Each activity should have:
            </p>
            <ul className="text-xs text-slate-400 ml-4 space-y-1">
              <li>• <code className="text-blue-300">"status"</code>: "ACTIVE" or "INACTIVE"</li>
              <li>• <code className="text-blue-300">"parameters"</code>: Object with activity-specific settings</li>
              <li>• <code className="text-blue-300">"zones"</code>: (Optional) Zone coordinates</li>
              <li>• <code className="text-blue-300">"lanes"</code>: (Optional) Lane coordinates</li>
            </ul>
            <details className="mt-3">
              <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                Show example format
              </summary>
              <pre className="text-xs text-slate-400 mt-2 p-2 bg-slate-800/50 rounded overflow-x-auto">
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
            </details>
            <p className="text-xs text-slate-400 mt-2">
              You can paste the full configuration.json or just the activities_data section.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading || !isValidJson || !jsonData.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Activities'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

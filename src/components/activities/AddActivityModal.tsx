import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NewActivityFormData } from '../../types/activity';
import { JsonEditor } from './JsonEditor';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (formData: NewActivityFormData) => Promise<{ success: boolean; message: string }>;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onAddActivity
}) => {
  const [formData, setFormData] = useState<NewActivityFormData>({
    name: '',
    status: 'ACTIVE',
    data: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      status: 'ACTIVE',
      data: ''
    });
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
    
    if (!formData.name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await onAddActivity(formData);
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          status: 'ACTIVE',
          data: ''
        });
        onClose();
      }
      // Handle error display
      console.log(result.message);
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div 
        ref={modalRef}
        className="bg-white/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-[90%] border border-gray-200 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-lg font-semibold text-gray-900">Create New Activity</h5>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-800"
            title="Close modal"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Name*
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter activity name"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status*
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
              className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              title="Select activity status"
              aria-label="Select activity status"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Activity Data (JSON) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Data (JSON) <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <JsonEditor
              value={formData.data}
              onChange={(value) => setFormData(prev => ({ ...prev, data: value }))}
              height="150px"
              placeholder="Enter activity parameters as JSON (optional)..."
              onValidate={(isValid) => setIsValidJson(isValid)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading || !isValidJson}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Activity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

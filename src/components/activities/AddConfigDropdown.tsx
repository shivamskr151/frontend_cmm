import React, { useState, useEffect } from 'react';

interface AddConfigDropdownProps {
  onOpenJsonEditor: () => void;
  onOpenImportActivities: () => void;
  disabled?: boolean;
}

export const AddConfigDropdown: React.FC<AddConfigDropdownProps> = ({
  onOpenJsonEditor,
  onOpenImportActivities,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = target.closest('[data-dropdown="add-config"]');
      
      if (isOpen && !dropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleJsonEditorClick = () => {
    onOpenJsonEditor();
    setIsOpen(false);
  };

  const handleImportActivitiesClick = () => {
    onOpenImportActivities();
    setIsOpen(false);
  };

  return (
    <div className="relative" data-dropdown="add-config">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-4 py-2.5 rounded-xl border transition-all duration-200 font-medium flex items-center gap-2 text-sm shadow-lg ${
          disabled 
            ? 'bg-gray-200/50 text-gray-400 border-gray-300/50 cursor-not-allowed shadow-gray-200/50' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-500/30 shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span className="hidden sm:inline">Add Configuration</span>
        <span className="sm:hidden">Add</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-2xl shadow-gray-200/20 z-50 overflow-hidden">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-200/60">
              <h6 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quick Actions</h6>
            </div>
            <button
              onClick={handleJsonEditorClick}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex items-center gap-3 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
              </div>
              <div>
                <div className="font-medium">JSON Editor</div>
                <div className="text-xs text-gray-500">Import activities from JSON</div>
              </div>
            </button>
            <button
              onClick={handleImportActivitiesClick}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 flex items-center gap-3 group"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div>
                <div className="font-medium">Import Activities</div>
                <div className="text-xs text-gray-500">Import activities from JSON with selection</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

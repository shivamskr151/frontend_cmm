import React, { useState, useEffect } from 'react';

interface AddConfigDropdownProps {
  onOpenJsonEditor: () => void;
  onOpenAddActivity: () => void;
}

export const AddConfigDropdown: React.FC<AddConfigDropdownProps> = ({
  onOpenJsonEditor,
  onOpenAddActivity
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

  const handleAddActivityClick = () => {
    onOpenAddActivity();
    setIsOpen(false);
  };

  return (
    <div className="relative" data-dropdown="add-config">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 font-medium flex items-center gap-2 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Config
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-xl z-50">
          <div className="py-2">
            <button
              onClick={handleJsonEditorClick}
              className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              JSON Editor
            </button>
            <button
              onClick={handleAddActivityClick}
              className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              Add Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { type PatrolPattern } from '../../hooks/monitor';

interface EditPatrolModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPatrolPattern: PatrolPattern | null;
  onSave: (updatedPattern: PatrolPattern) => void;
}

const EditPatrolModal: React.FC<EditPatrolModalProps> = ({
  isOpen,
  onClose,
  editingPatrolPattern,
  onSave
}) => {
  if (!isOpen || !editingPatrolPattern) return null;

  const handleSave = () => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      const updatedPattern: PatrolPattern = {
        ...editingPatrolPattern,
        name: formData.get('name') as string,
        pan: parseFloat(formData.get('pan') as string),
        tilt: parseFloat(formData.get('tilt') as string),
        zoom: parseInt(formData.get('zoom') as string)
      };
      onSave(updatedPattern);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-96 max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700">Edit Patrol Pattern</h3>
              <p className="text-xs sm:text-sm text-gray-500">Modify pattern settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close edit modal"
            aria-label="Close edit modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}>
            {/* Pattern Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pattern Name</label>
              <input
                type="text"
                name="name"
                defaultValue={editingPatrolPattern.name}
                className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Pan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pan</label>
              <input
                type="number"
                name="pan"
                defaultValue={editingPatrolPattern.pan || 0.5}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Tilt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tilt</label>
              <input
                type="number"
                name="tilt"
                defaultValue={editingPatrolPattern.tilt || 0.5}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Zoom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
              <input
                type="number"
                name="zoom"
                defaultValue={editingPatrolPattern.zoom || 50}
                min="0"
                max="100"
                step="1"
                className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-300">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatrolModal;

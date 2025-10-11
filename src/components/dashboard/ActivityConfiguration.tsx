import React from 'react';
import { DynamicActivityForm } from '../activities/DynamicActivityForm';
import { ErrorBoundary } from '../ErrorBoundary';

interface ActivityConfigurationProps {
  selectedActivity: string;
  activities: Record<string, unknown>;
  activityParameters: Record<string, unknown>;
  isSaving: boolean;
  onActivityParametersChange: (parameters: Record<string, unknown>) => void;
  onSaveActivityParameters: () => void;
}

const ActivityConfiguration: React.FC<ActivityConfigurationProps> = ({
  selectedActivity,
  activities,
  isSaving,
  onActivityParametersChange,
  onSaveActivityParameters
}) => {
  if (!selectedActivity) {
    return null;
  }

  return (
    <div className="mb-6 sm:mb-8">
      <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
        {/* Header Section */}
        <div className="flex items-center space-x-3 mb-6 sm:mb-8">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Activity Configuration</h3>
            <p className="text-sm text-gray-600 mt-1">Configure parameters for {selectedActivity.replace(/_/g, ' ').toUpperCase()}</p>
          </div>
        </div>

        <ErrorBoundary>
          <DynamicActivityForm
            selectedActivity={selectedActivity}
            initialValues={(activities[selectedActivity] as { parameters?: Record<string, unknown> })?.parameters || {}}
            onChange={onActivityParametersChange}
          />
        </ErrorBoundary>
        
        {/* Enhanced Save Section */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg shadow-gray-200/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17,21 17,13 7,13 7,21"></polyline>
                  <polyline points="7,3 7,8 15,8"></polyline>
                </svg>
              </div>
              <div>
                <h6 className="text-gray-800 font-bold text-base sm:text-lg">Save Configuration</h6>
                <p className="text-xs sm:text-sm text-gray-600">Save your activity parameters</p>
              </div>
            </div>
            
            <button
              onClick={onSaveActivityParameters}
              disabled={isSaving || !selectedActivity}
              className={`px-6 sm:px-8 py-3 rounded-xl font-medium flex items-center gap-2 sm:gap-3 transition-all duration-200 text-sm sm:text-base shadow-lg ${
                isSaving || !selectedActivity
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 shadow-gray-200/50'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50 transform hover:-translate-y-0.5'
              }`}
            >
              {isSaving ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <span className="hidden sm:inline">Saving Configuration...</span>
                  <span className="sm:hidden">Saving...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17,21 17,13 7,13 7,21"></polyline>
                    <polyline points="7,3 7,8 15,8"></polyline>
                  </svg>
                  <span className="hidden sm:inline">Save Configuration</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityConfiguration;

import { useState, useCallback, useEffect } from 'react';
import { useCameras } from '../../contexts/CameraContext';
import { onvifPatrolApi, type PatrolTour } from '../../api/onvif/onvifPatrolApi';

export interface PatrolPattern {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
  presetToken?: string; // Add preset token for API integration
  isRunning?: boolean; // Add running status from backend
}

export type PatrolStatus = 'idle' | 'running' | 'paused' | 'loading' | 'error';

export const usePatrol = (sendPatrolCommand: (action: string, patternId?: number, pattern?: any) => void) => {
  const { selectedCamera } = useCameras();
  const [patrolStatus, setPatrolStatus] = useState<PatrolStatus>('idle');
  const [currentPatrolStep, setCurrentPatrolStep] = useState(0);
  const [patrolProgress, setPatrolProgress] = useState(0);
  const [selectedPatrolPatterns, setSelectedPatrolPatterns] = useState<number[]>([]);
  const [showEditPatrolModal, setShowEditPatrolModal] = useState(false);
  const [editingPatrolPattern, setEditingPatrolPattern] = useState<PatrolPattern | null>(null);
  const [patrolTours, setPatrolTours] = useState<PatrolTour[]>([]);
  const [currentTourToken, setCurrentTourToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Get profile token from selected camera
  const getProfileToken = useCallback((): string => {
    // For now, use a default profile token since Camera interface doesn't include it
    // In a real implementation, this would come from the camera's profile data
    // return 'Profile_1'; // Default fallback - commented out as optional in backend
    return ''; // Empty string as fallback since Profile_1 is optional
  }, []);

  // Load patrol tours from API
  const loadPatrolTours = useCallback(async () => {
    if (!selectedCamera) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading patrol tours for camera:', selectedCamera);
      const profileToken = getProfileToken();
      const tours = await onvifPatrolApi.getPresetTours(selectedCamera, profileToken);
      setPatrolTours(tours);
      console.log('✅ Loaded patrol tours:', tours.length);
    } catch (err) {
      console.error('❌ Error loading patrol tours:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patrol tours');
    } finally {
      setLoading(false);
    }
  }, [selectedCamera, getProfileToken]);

  // Load patrol tours when camera changes
  useEffect(() => {
    if (selectedCamera) {
      loadPatrolTours();
    }
  }, [selectedCamera, loadPatrolTours]);

  // Convert patrol tours to patrol patterns for UI compatibility
  const patrolPatterns: PatrolPattern[] = patrolTours.map((tour, index) => ({
    id: index + 1,
    name: tour.tour_name || tour.name || `Tour ${index + 1}`,
    pan: 0.5, // Default values since tours don't have direct pan/tilt/zoom
    tilt: 0.3,
    zoom: 50,
    presetToken: tour.tour_token || tour.token,
    isRunning: tour.is_running || false // Map the running status from backend
  }));

  const startPatrol = useCallback(async (patternId: number) => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    const pattern = patrolPatterns.find(p => p.id === patternId);
    if (!pattern || !pattern.presetToken) {
      setError('Invalid patrol pattern or missing preset token');
      return;
    }

    setPatrolStatus('loading');
    setError(null);

    try {
      const profileToken = getProfileToken();
      const tourToken = pattern.presetToken;
      
      console.log("🚀 Starting patrol tour:", tourToken, "Looping:", isLooping);
      await onvifPatrolApi.startPresetTour(selectedCamera, profileToken, tourToken);
      
      setPatrolStatus('running');
      setCurrentTourToken(tourToken);
      setCurrentPatrolStep(0);
      setPatrolProgress(0);
      
      // Also send the legacy command for backward compatibility
      sendPatrolCommand("start_patrol", patternId, pattern);
      
      console.log("✅ Successfully started patrol tour", isLooping ? "(Looping enabled)" : "(Single run)");
    } catch (err) {
      console.error("❌ Error starting patrol:", err);
      setError(err instanceof Error ? err.message : 'Failed to start patrol');
      setPatrolStatus('error');
    }
  }, [patrolPatterns, selectedCamera, getProfileToken, sendPatrolCommand, isLooping]);

  const stopPatrol = useCallback(async () => {
    if (!selectedCamera || !currentTourToken) {
      setError('No active patrol to stop');
      return;
    }

    setPatrolStatus('loading');
    setError(null);

    try {
      const profileToken = getProfileToken();
      
      console.log("🛑 Stopping patrol tour:", currentTourToken);
      await onvifPatrolApi.stopPresetTour(selectedCamera, profileToken, currentTourToken);
      
      setPatrolStatus('idle');
      setCurrentTourToken(null);
      setCurrentPatrolStep(0);
      setPatrolProgress(0);
      
      // Also send the legacy command for backward compatibility
      sendPatrolCommand("stop_patrol");
      
      console.log("✅ Successfully stopped patrol tour");
    } catch (err) {
      console.error("❌ Error stopping patrol:", err);
      setError(err instanceof Error ? err.message : 'Failed to stop patrol');
      setPatrolStatus('error');
    }
  }, [selectedCamera, currentTourToken, getProfileToken, sendPatrolCommand]);

  const pausePatrol = useCallback(async () => {
    if (!selectedCamera || !currentTourToken) {
      setError('No active patrol to pause');
      return;
    }

    setPatrolStatus('loading');
    setError(null);

    try {
      const profileToken = getProfileToken();
      
      console.log("⏸️ Pausing patrol tour:", currentTourToken);
      await onvifPatrolApi.pausePresetTour(selectedCamera, profileToken, currentTourToken);
      
      setPatrolStatus('paused');
      
      // Also send the legacy command for backward compatibility
      sendPatrolCommand("pause_patrol");
      
      console.log("✅ Successfully paused patrol tour");
    } catch (err) {
      console.error("❌ Error pausing patrol:", err);
      setError(err instanceof Error ? err.message : 'Failed to pause patrol');
      setPatrolStatus('error');
    }
  }, [selectedCamera, currentTourToken, getProfileToken, sendPatrolCommand]);

  const resumePatrol = useCallback(async () => {
    if (!selectedCamera || !currentTourToken) {
      setError('No active patrol to resume');
      return;
    }

    setPatrolStatus('loading');
    setError(null);

    try {
      const profileToken = getProfileToken();
      
      console.log("▶️ Resuming patrol tour:", currentTourToken);
      await onvifPatrolApi.resumePresetTour(selectedCamera, profileToken, currentTourToken);
      
      setPatrolStatus('running');
      
      // Also send the legacy command for backward compatibility
      sendPatrolCommand("resume_patrol");
      
      console.log("✅ Successfully resumed patrol tour");
    } catch (err) {
      console.error("❌ Error resuming patrol:", err);
      setError(err instanceof Error ? err.message : 'Failed to resume patrol');
      setPatrolStatus('error');
    }
  }, [selectedCamera, currentTourToken, getProfileToken, sendPatrolCommand]);

  // Patrol Pattern Management Functions
  const handlePatrolPatternSelect = useCallback((patternId: number) => {
    setSelectedPatrolPatterns(prev => 
      prev.includes(patternId) 
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
  }, []);

  const handleSelectAllPatrolPatterns = useCallback(() => {
    if (selectedPatrolPatterns.length === patrolPatterns.length) {
      setSelectedPatrolPatterns([]);
    } else {
      setSelectedPatrolPatterns(patrolPatterns.map(p => p.id));
    }
  }, [selectedPatrolPatterns.length, patrolPatterns]);

  const handleDeleteSelectedPatrolPatterns = useCallback(() => {
    if (selectedPatrolPatterns.length === 0) return;
    
    // Here you would typically make an API call to delete the patterns
    console.log("Deleting patrol patterns:", selectedPatrolPatterns);
    
    // For now, just clear the selection
    setSelectedPatrolPatterns([]);
  }, [selectedPatrolPatterns]);

  const handleEditPatrolPattern = useCallback((pattern: PatrolPattern) => {
    setEditingPatrolPattern(pattern);
    setShowEditPatrolModal(true);
  }, []);

  const handleSavePatrolPattern = useCallback((updatedPattern: PatrolPattern) => {
    // Here you would typically make an API call to update the pattern
    console.log("Saving patrol pattern:", updatedPattern);
    
    setShowEditPatrolModal(false);
    setEditingPatrolPattern(null);
  }, []);

  // Create a new patrol tour from selected presets
  const createPatrolFromPresets = useCallback(async (
    tourName: string,
    presetTokens: string[],
    options: {
      speed?: number;
      waitTime?: number;
      autoStart?: boolean;
      randomOrder?: boolean;
    } = {}
  ) => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileToken = getProfileToken();
      
      // Include looping in the options
      const optionsWithLooping = {
        ...options,
        isLooping
      };
      
      const tourToken = await onvifPatrolApi.createPatrolFromPresets(
        selectedCamera,
        profileToken,
        tourName,
        presetTokens,
        optionsWithLooping
      );

      console.log('✅ Created patrol tour:', tourToken, isLooping ? '(Looping enabled)' : '(Single run)');
      
      // Reload patrol tours to include the new one
      await loadPatrolTours();
      
      return tourToken;
    } catch (err) {
      console.error('❌ Error creating patrol tour:', err);
      setError(err instanceof Error ? err.message : 'Failed to create patrol tour');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCamera, getProfileToken, loadPatrolTours, isLooping]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle looping toggle
  const handleLoopingToggle = useCallback(() => {
    setIsLooping(prev => !prev);
  }, []);

  return {
    // State
    patrolStatus,
    currentPatrolStep,
    patrolProgress,
    selectedPatrolPatterns,
    showEditPatrolModal,
    editingPatrolPattern,
    patrolPatterns,
    patrolTours,
    currentTourToken,
    loading,
    error,
    
    // Actions
    startPatrol,
    stopPatrol,
    pausePatrol,
    resumePatrol,
    handlePatrolPatternSelect,
    handleSelectAllPatrolPatterns,
    handleDeleteSelectedPatrolPatterns,
    handleEditPatrolPattern,
    handleSavePatrolPattern,
    setShowEditPatrolModal,
    
    // API functions
    loadPatrolTours,
    createPatrolFromPresets,
    clearError,
    
    // Looping functionality
    isLooping,
    handleLoopingToggle
  };
};

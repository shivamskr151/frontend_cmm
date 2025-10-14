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

export const usePatrol = (sendPatrolCommand: (action: string, patternId?: number, pattern?: PatrolPattern) => void) => {
  const { selectedCamera } = useCameras();
  const [patrolStatus, setPatrolStatus] = useState<PatrolStatus>('idle');
  const [currentPatrolStep, setCurrentPatrolStep] = useState(0);
  const [patrolProgress, setPatrolProgress] = useState(0);
  const [selectedPatrolPatterns, setSelectedPatrolPatterns] = useState<number[]>([]);
  const [showEditPatrolModal, setShowEditPatrolModal] = useState(false);
  const [editingPatrolPattern, setEditingPatrolPattern] = useState<PatrolPattern | null>(null);
  const [editingPatrolTour, setEditingPatrolTour] = useState<PatrolTour | null>(null);
  const [patrolTours, setPatrolTours] = useState<PatrolTour[]>([]);

  // Debug logging for patrolTours state changes
  useEffect(() => {
    console.log('🔄 patrolTours state changed:', {
      count: patrolTours.length,
      tours: patrolTours.map((tour, index) => ({
        index: index + 1,
        token: tour.tour_token || tour.token,
        name: tour.tour_name || tour.name,
        stepCount: tour.steps?.length || 0,
        steps: tour.steps
      }))
    });
  }, [patrolTours]);
  const [currentTourToken, setCurrentTourToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Get profile token from selected camera
  const getProfileToken = useCallback((): string => {
    // Use default profile token until camera profiles are wired through
    return 'Profile_1';
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
      console.log('📋 Raw patrol tours from API:', tours);
      
      // Log each tour's steps in detail
      tours.forEach((tour, index) => {
        console.log(`  Tour ${index + 1} (${tour.tour_name || tour.name}):`, {
          token: tour.tour_token || tour.token,
          steps: tour.steps,
          stepCount: tour.steps?.length || 0
        });
      });
      
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

  // Stop any running tours on component mount to ensure clean state
  useEffect(() => {
    const stopAllRunningTours = async () => {
      if (!selectedCamera || patrolTours.length === 0) return;
      
      const profileToken = getProfileToken();
      const runningTours = patrolTours.filter(tour => tour.is_running || tour.status === 'running');
      
      if (runningTours.length > 0) {
        console.log("🛑 Found running tours on load, stopping them:", runningTours.map(t => t.tour_token || t.token));
        
        for (const tour of runningTours) {
          const tourToken = tour.tour_token || tour.token;
          if (tourToken) {
            try {
              await onvifPatrolApi.stopPresetTour(selectedCamera, profileToken, tourToken);
              console.log("✅ Stopped tour:", tourToken);
            } catch (err) {
              console.warn("⚠️ Could not stop tour:", tourToken, err);
            }
          }
        }
        
        // Reload tours to get updated status
        await loadPatrolTours();
      }
    };

    if (selectedCamera && patrolTours.length > 0) {
      stopAllRunningTours();
    }
  }, [selectedCamera, patrolTours, getProfileToken, loadPatrolTours]);

  // Convert patrol tours to patrol patterns for UI compatibility
  const patrolPatterns: PatrolPattern[] = patrolTours.map((tour, index) => {
    const pattern = {
      id: index + 1,
      name: tour.tour_name || tour.name || `Tour ${index + 1}`,
      pan: 0.5, // Default values since tours don't have direct pan/tilt/zoom
      tilt: 0.3,
      zoom: 50,
      presetToken: tour.tour_token || tour.token,
      // Only show running when this session has explicitly started the tour
      isRunning:
        patrolStatus === 'running' &&
        !!currentTourToken &&
        (tour.tour_token === currentTourToken || tour.token === currentTourToken)
    };
    
    console.log(`🔄 Converting tour ${index + 1} to pattern:`, {
      tour: tour,
      pattern: pattern,
      stepCount: tour.steps?.length || 0
    });
    
    return pattern;
  });

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
      
      // First, stop any currently running tours to prevent conflicts
      if (currentTourToken && currentTourToken !== tourToken) {
        console.log("🛑 Stopping current tour before starting new one:", currentTourToken);
        try {
          await onvifPatrolApi.stopPresetTour(selectedCamera, profileToken, currentTourToken);
        } catch (stopErr) {
          console.warn("⚠️ Warning: Could not stop current tour:", stopErr);
          // Continue anyway, the backend might handle this
        }
      }
      
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
  }, [patrolPatterns, selectedCamera, getProfileToken, sendPatrolCommand, isLooping, currentTourToken]);

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

  const stopIndividualPatrol = useCallback(async (patternId: number) => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    const pattern = patrolPatterns.find(p => p.id === patternId);
    if (!pattern || !pattern.presetToken) {
      setError('Invalid patrol pattern or missing preset token');
      return;
    }

    setError(null);

    try {
      const profileToken = getProfileToken();
      const tourToken = pattern.presetToken;
      
      console.log("🛑 Stopping individual patrol tour:", tourToken);
      await onvifPatrolApi.operatePresetTour(selectedCamera, profileToken, tourToken, 'stop');
      
      // If this was the currently running tour, reset the status
      if (currentTourToken === tourToken) {
        setPatrolStatus('idle');
        setCurrentTourToken(null);
        setCurrentPatrolStep(0);
        setPatrolProgress(0);
      }
      
      // Reload patrol tours to get updated status
      await loadPatrolTours();
      
      console.log("✅ Successfully stopped individual patrol tour");
    } catch (err) {
      console.error("❌ Error stopping individual patrol:", err);
      setError(err instanceof Error ? err.message : 'Failed to stop patrol');
    }
  }, [selectedCamera, patrolPatterns, currentTourToken, getProfileToken, loadPatrolTours]);

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

  const deletePatrolPattern = useCallback(async (patternId: number) => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    const pattern = patrolPatterns.find(p => p.id === patternId);
    if (!pattern || !pattern.presetToken) {
      setError('Invalid patrol pattern or missing preset token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileToken = getProfileToken();
      const tourToken = pattern.presetToken;
      
      console.log("🗑️ Deleting patrol tour:", tourToken);
      await onvifPatrolApi.deletePresetTour(selectedCamera, profileToken, tourToken);
      
      // Reload patrol tours to reflect the deletion
      await loadPatrolTours();
      
      console.log("✅ Successfully deleted patrol tour");
    } catch (err) {
      console.error("❌ Error deleting patrol:", err);
      setError(err instanceof Error ? err.message : 'Failed to delete patrol');
    } finally {
      setLoading(false);
    }
  }, [selectedCamera, patrolPatterns, getProfileToken, loadPatrolTours]);

  // Modify an existing patrol tour
  const modifyPatrol = useCallback(async (
    patternId: number,
    presetTokens: string[],
    options: {
      speed?: number;
      waitTime?: number;
      autoStart?: boolean;
      randomOrder?: boolean;
      presetSpeeds?: Record<string, number>;
      presetWaitTimes?: Record<string, number>;
    } = {}
  ) => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    const pattern = patrolPatterns.find(p => p.id === patternId);
    console.log('🔍 Finding pattern for ID:', patternId, 'Found pattern:', pattern);
    
    if (!pattern || !pattern.presetToken) {
      console.error('❌ Invalid patrol pattern or missing preset token:', { pattern, patternId });
      setError('Invalid patrol pattern or missing preset token');
      return;
    }
    
    console.log('✅ Using tour token:', pattern.presetToken);

    setLoading(true);
    setError(null);

    try {
      const profileToken = getProfileToken();
      
      console.log('🔧 usePatrol modifyPatrol Debug:');
      console.log('  - Pattern ID:', patternId);
      console.log('  - Pattern preset token:', pattern.presetToken);
      console.log('  - Preset tokens:', presetTokens);
      console.log('  - Options:', options);
      console.log('  - Profile token:', profileToken);
      console.log('  - Camera ID:', selectedCamera);
      
      await onvifPatrolApi.modifyPatrolFromPresets(
        selectedCamera,
        profileToken,
        pattern.presetToken,
        presetTokens,
        options
      );
      
      console.log('✅ API call completed, reloading patrol tours...');
      
      // Add a delay to ensure backend has processed the modification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload patrol tours to show the updated one
      console.log('🔄 Reloading patrol tours after modification...');
      await loadPatrolTours();
      console.log('✅ Modified patrol tour:', pattern.presetToken);
      console.log('🔄 Patrol tours after reload:', patrolTours);
    } catch (err) {
      console.error('❌ Error modifying patrol tour:', err);
      setError(err instanceof Error ? err.message : 'Failed to modify patrol tour');
    } finally {
      setLoading(false);
    }
  }, [selectedCamera, patrolPatterns, getProfileToken, loadPatrolTours]);

  const handleEditPatrolPattern = useCallback((pattern: PatrolPattern, tour: PatrolTour) => {
    setEditingPatrolPattern(pattern);
    setEditingPatrolTour(tour);
    setShowEditPatrolModal(true);
  }, []);

  const handleSavePatrolPattern = useCallback(async (updatedPattern: PatrolPattern, presetTokens: string[], options: {
    speed?: number;
    waitTime?: number;
    autoStart?: boolean;
    randomOrder?: boolean;
    presetSpeeds?: Record<string, number>;
    presetWaitTimes?: Record<string, number>;
  }) => {
    try {
      // Call modifyPatrol with the new data and wait for it to complete
      await modifyPatrol(updatedPattern.id, presetTokens, options);
      
      // Only close the modal after the modification is complete
      setShowEditPatrolModal(false);
      setEditingPatrolPattern(null);
      setEditingPatrolTour(null);
    } catch (error) {
      console.error('❌ Error in handleSavePatrolPattern:', error);
      // Don't close the modal if there was an error
    }
  }, [modifyPatrol]);

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
    editingPatrolTour,
    patrolPatterns,
    patrolTours,
    currentTourToken,
    loading,
    error,
    
    // Actions
    startPatrol,
    stopPatrol,
    stopIndividualPatrol,
    pausePatrol,
    resumePatrol,
    handlePatrolPatternSelect,
    handleSelectAllPatrolPatterns,
    handleDeleteSelectedPatrolPatterns,
    handleEditPatrolPattern,
    handleSavePatrolPattern,
    setShowEditPatrolModal,
    deletePatrolPattern,
    
    // API functions
    loadPatrolTours,
    createPatrolFromPresets,
    modifyPatrol,
    clearError,
    
    // Looping functionality
    isLooping,
    handleLoopingToggle
  };
};

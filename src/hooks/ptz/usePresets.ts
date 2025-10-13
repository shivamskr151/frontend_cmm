import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCameras } from '../../contexts/CameraContext';
import {
  usePresets as usePresetsQuery,
  useCreatePreset,
  useGotoPreset,
  useDeletePreset,
  useDeleteMultiplePresets,
} from '../api/useOnvifPresets';
import { useLoadPresets } from '../api/useOnvifPresetsManual';
import { queryKeys } from '../../lib/react-query';

export interface Preset {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
  preset_token?: string;
}

export const usePresets = () => {
  const { selectedCamera } = useCameras();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  const [showEditPresetModal, setShowEditPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [showCreatePresetModal, setShowCreatePresetModal] = useState(false);
  const [useCurrentPosition, setUseCurrentPosition] = useState(false);
  
  // Default profile token - this should ideally come from camera configuration
  // const defaultProfileToken = "Profile_1"; // Commented out as optional in backend
  const defaultProfileToken = ""; // Empty string as fallback since Profile_1 is optional
  
  // React Query hooks - enabled when camera is selected
  const {
    data: onvifPresets = [],
    isLoading: loading,
    error: queryError,
  } = usePresetsQuery(selectedCamera || '', defaultProfileToken, !!selectedCamera); // Enabled when camera is selected
  
  const createPresetMutation = useCreatePreset();
  const gotoPresetMutation = useGotoPreset();
  const deletePresetMutation = useDeletePreset();
  const deleteMultiplePresetsMutation = useDeleteMultiplePresets();
  
  // Manual loading hook
  const loadPresetsManual = useLoadPresets();
  
  // Convert ONVIF presets to our internal format
  const presets = useMemo(() => {
    console.log('🔄 Converting ONVIF presets:', onvifPresets);
    return onvifPresets.map((preset, index) => {
      // Extract pan/tilt from pan_tilt object structure
      const panValue = preset.pan_tilt?.position?.x ?? preset.pan ?? 0;
      const tiltValue = preset.pan_tilt?.position?.y ?? preset.tilt ?? 0;
      const zoomValue = preset.zoom?.position?.x ?? 0;

      const convertedPreset: Preset = {
        id: index + 1,
        name: preset.preset_name || preset.name || `Preset ${index + 1}`,
        pan: panValue,
        tilt: tiltValue,
        zoom: zoomValue,
        preset_token: preset.preset_token || preset.token
      };
      
      console.log(`📋 Converted preset ${index + 1}:`, {
        original: preset,
        converted: convertedPreset,
        extractedValues: { panValue, tiltValue, zoomValue }
      });
      return convertedPreset;
    });
  }, [onvifPresets]);
  
  // Extract error message
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load presets') : null;

  // Refresh presets function (invalidates cache and refetches)
  const refreshPresets = useCallback(async () => {
    if (!selectedCamera) {
      console.log('No camera selected, skipping preset refresh');
      return;
    }
    
    console.log('🔄 Refreshing presets for camera:', selectedCamera);
    try {
      // Invalidate the cache to force a fresh fetch
      await queryClient.invalidateQueries({
        queryKey: queryKeys.presets.list(selectedCamera, defaultProfileToken),
      });
      console.log('✅ Presets refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh presets:', error);
    }
  }, [selectedCamera, defaultProfileToken, queryClient]);

  // Create a new preset using React Query mutation
  const createPreset = useCallback(async (presetName: string, pan?: number, tilt?: number, zoom?: number) => {
    if (!selectedCamera) {
      throw new Error('No camera selected');
    }

    try {
      console.log('💾 Creating preset:', presetName, 'with position:', { pan, tilt, zoom });
      const presetToken = await createPresetMutation.mutateAsync({
        cameraId: selectedCamera,
        profileToken: defaultProfileToken,
        presetName,
        pan,
        tilt,
        zoom,
      });
      
      console.log('✅ Created preset with token:', presetToken);
      
      // Refresh presets to show the new one immediately
      await refreshPresets();
      
      // Return a temporary preset object (the real one will be fetched via React Query)
      return {
        id: presets.length + 1,
        name: presetName,
        pan: pan || 0.5,
        tilt: tilt || 0.5,
        zoom: zoom || 50,
        preset_token: presetToken
      };
    } catch (err) {
      console.error('❌ Error creating preset:', err);
      throw err;
    }
  }, [selectedCamera, defaultProfileToken, presets.length, createPresetMutation, refreshPresets]);

  // Go to a preset using React Query mutation
  const gotoPreset = useCallback(async (preset: Preset) => {
    if (!selectedCamera || !preset.preset_token) {
      throw new Error('No camera selected or preset token missing');
    }

    try {
      console.log('🎯 Going to preset:', preset.name);
      await gotoPresetMutation.mutateAsync({
        cameraId: selectedCamera,
        profileToken: defaultProfileToken,
        presetToken: preset.preset_token,
      });
      console.log('✅ Successfully moved to preset:', preset.name);
    } catch (err) {
      console.error('❌ Error going to preset:', err);
      throw err;
    }
  }, [selectedCamera, defaultProfileToken, gotoPresetMutation]);

  // Delete a preset using React Query mutation
  const deletePreset = useCallback(async (preset: Preset) => {
    if (!selectedCamera) {
      throw new Error('No camera selected');
    }
    
    if (!preset.preset_token) {
      console.warn(`⚠️ Preset "${preset.name}" missing token. Attempting to refresh presets...`);
      
      // Try to refresh presets to get the latest data with tokens
      try {
        await loadPresetsManual(selectedCamera, defaultProfileToken);
        // After refresh, the preset should have a token if it exists
        const refreshedPresets = presets;
        const refreshedPreset = refreshedPresets.find(p => p.id === preset.id);
        
        if (refreshedPreset && refreshedPreset.preset_token) {
          console.log(`✅ Found token for preset "${preset.name}" after refresh:`, refreshedPreset.preset_token);
          // Retry deletion with the refreshed preset
          return deletePreset(refreshedPreset);
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh presets:', refreshError);
      }
      
      throw new Error(`Preset "${preset.name}" does not have a valid token. Cannot delete. Please try refreshing the presets.`);
    }

    try {
      console.log('🗑️ Deleting preset:', preset.name, 'with token:', preset.preset_token);
      await deletePresetMutation.mutateAsync({
        cameraId: selectedCamera,
        profileToken: defaultProfileToken,
        presetToken: preset.preset_token,
      });
      console.log('✅ Successfully deleted preset:', preset.name);
      
      // Refresh presets to remove the deleted one immediately
      await refreshPresets();
    } catch (err) {
      console.error('❌ Error deleting preset:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Authentication failed')) {
          throw new Error('Authentication failed. Please login again.');
        } else if (err.message.includes('Access denied')) {
          throw new Error('You do not have permission to delete presets.');
        } else if (err.message.includes('not found') || err.message.includes('already deleted')) {
          throw new Error(`Preset "${preset.name}" was not found or has already been deleted.`);
        } else if (err.message.includes('Server error')) {
          throw new Error('Server error occurred while deleting preset. Please try again.');
        } else {
          throw new Error(`Failed to delete preset "${preset.name}": ${err.message}`);
        }
      } else {
        throw new Error(`Failed to delete preset "${preset.name}". Please try again.`);
      }
    }
  }, [selectedCamera, defaultProfileToken, deletePresetMutation, presets, loadPresetsManual, refreshPresets]);

  // Load presets function (manually triggers the API call)
  const loadPresets = useCallback(async () => {
    if (!selectedCamera) {
      console.log('No camera selected, skipping preset load');
      return;
    }
    
    console.log('🔄 Manually loading presets for camera:', selectedCamera);
    try {
      await loadPresetsManual(selectedCamera, defaultProfileToken);
      console.log('✅ Presets loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load presets:', error);
    }
  }, [selectedCamera, defaultProfileToken, loadPresetsManual]);

  // Preset Management Functions
  const handlePresetSelect = useCallback((presetId: number) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  }, []);

  const handleSelectAllPresets = useCallback(() => {
    const allPresets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (selectedPresets.length === allPresets.length) {
      setSelectedPresets([]);
    } else {
      setSelectedPresets(allPresets);
    }
  }, [selectedPresets.length]);

  const handleDeleteSelectedPresets = useCallback(async () => {
    if (selectedPresets.length === 0 || !selectedCamera) return;
    
    try {
      // Get the presets to delete
      const presetsToDelete = presets.filter(preset => selectedPresets.includes(preset.id));
      const presetTokens = presetsToDelete
        .map(preset => preset.preset_token)
        .filter((token): token is string => !!token);
      
      if (presetTokens.length === 0) {
        throw new Error('No valid preset tokens found for deletion. Some presets may be missing tokens.');
      }
      
      console.log('🗑️ Deleting multiple presets:', presetTokens.length, 'tokens:', presetTokens);
      
      // Use the bulk delete mutation
      await deleteMultiplePresetsMutation.mutateAsync({
        cameraId: selectedCamera,
        profileToken: defaultProfileToken,
        presetTokens,
      });
      
      // Clear the selection
      setSelectedPresets([]);
      
      // Refresh presets to remove the deleted ones immediately
      await refreshPresets();
      
      console.log("✅ Successfully deleted selected presets");
    } catch (err) {
      console.error("❌ Error deleting selected presets:", err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Authentication failed')) {
          throw new Error('Authentication failed. Please login again.');
        } else if (err.message.includes('Access denied')) {
          throw new Error('You do not have permission to delete presets.');
        } else if (err.message.includes('No valid preset tokens')) {
          throw new Error('Some selected presets cannot be deleted because they are missing valid tokens.');
        } else {
          throw new Error(`Failed to delete selected presets: ${err.message}`);
        }
      } else {
        throw new Error('Failed to delete selected presets. Please try again.');
      }
      // Don't clear selection on error so user can retry
    }
  }, [selectedPresets, presets, selectedCamera, defaultProfileToken, deleteMultiplePresetsMutation, refreshPresets]);

  const handleEditPreset = useCallback((preset: Preset) => {
    setEditingPreset(preset);
    setShowEditPresetModal(true);
  }, []);

  const handleSavePreset = useCallback(async (updatedPreset: Preset) => {
    try {
      // For now, we'll just update the local state
      // In a real implementation, you might need to call a separate update API
      // Note: With React Query, the data will be refetched automatically
      // so we don't need to manually update the state
      
      console.log("✅ Saved preset:", updatedPreset.name);
      setShowEditPresetModal(false);
      setEditingPreset(null);
    } catch (err) {
      console.error("❌ Error saving preset:", err);
    }
  }, []);

  return {
    // State
    selectedPresets,
    showEditPresetModal,
    editingPreset,
    showCreatePresetModal,
    useCurrentPosition,
    presets,
    loading,
    error,
    
    // Mutation states
    isCreating: createPresetMutation.isPending,
    isGoingToPreset: gotoPresetMutation.isPending,
    isDeleting: deletePresetMutation.isPending,
    isDeletingMultiple: deleteMultiplePresetsMutation.isPending,
    
    // API functions
    loadPresets,
    refreshPresets,
    createPreset,
    gotoPreset,
    deletePreset,
    
    // UI handlers
    handlePresetSelect,
    handleSelectAllPresets,
    handleDeleteSelectedPresets,
    handleEditPreset,
    handleSavePreset,
    setShowCreatePresetModal,
    setUseCurrentPosition,
    setShowEditPresetModal
  };
};

/**
 * Manual React Query hooks for ONVIF Preset API
 * Provides manual trigger hooks for preset operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onvifPresetApi } from '../../api/onvif/onvifPresetApi';
import type { OnvifPreset } from '../../api/onvif/onvifPresetApi';
import { queryKeys } from '../../lib/react-query';

// =================================================================
// Manual Query Hook
// =================================================================

/**
 * Hook to manually fetch presets for a camera
 * This hook is disabled by default and only runs when manually triggered
 */
export const usePresetsManual = (cameraId: string, profileToken: string) => {
  return useQuery({
    queryKey: queryKeys.presets.list(cameraId, profileToken),
    queryFn: () => onvifPresetApi.getPresets(cameraId, profileToken),
    enabled: false, // Always disabled, only runs when manually triggered
    staleTime: 2 * 60 * 1000, // 2 minutes - presets don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
  });
};

/**
 * Hook to manually trigger preset loading
 * Returns a function that can be called to load presets
 */
export const useLoadPresets = () => {
  const queryClient = useQueryClient();

  return (cameraId: string, profileToken: string) => {
    console.log('🎯 Manually loading presets for camera:', cameraId);
    
    // Trigger the query manually
    return queryClient.fetchQuery({
      queryKey: queryKeys.presets.list(cameraId, profileToken),
      queryFn: () => onvifPresetApi.getPresets(cameraId, profileToken),
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });
  };
};

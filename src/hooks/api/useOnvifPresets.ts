/**
 * React Query hooks for ONVIF Preset API
 * Provides query and mutation hooks for preset operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onvifPresetApi } from '../../api/onvif/onvifPresetApi';
import type { OnvifPreset } from '../../api/onvif/onvifPresetApi';
import { queryKeys } from '../../lib/react-query';

// =================================================================
// Query Hooks
// =================================================================

/**
 * Hook to fetch presets for a camera
 */
export const usePresets = (cameraId: string, profileToken: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.presets.list(cameraId, profileToken),
    queryFn: () => onvifPresetApi.getPresets(cameraId, profileToken),
    enabled: enabled && !!cameraId && !!profileToken,
    staleTime: 2 * 60 * 1000, // 2 minutes - presets don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
  });
};

// =================================================================
// Mutation Hooks
// =================================================================

/**
 * Hook to create a new preset
 */
export const useCreatePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cameraId, profileToken, presetName }: {
      cameraId: string;
      profileToken: string;
      presetName: string;
    }) => onvifPresetApi.setPreset(cameraId, profileToken, presetName),
    
    onSuccess: (presetToken, variables) => {
      // Invalidate and refetch presets for this camera
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets.list(variables.cameraId, variables.profileToken),
      });
      
      console.log('✅ Preset created successfully:', presetToken);
    },
    
    onError: (error) => {
      console.error('❌ Failed to create preset:', error);
    },
  });
};

/**
 * Hook to go to a preset
 */
export const useGotoPreset = () => {
  return useMutation({
    mutationFn: ({ cameraId, profileToken, presetToken }: {
      cameraId: string;
      profileToken: string;
      presetToken: string;
    }) => onvifPresetApi.gotoPreset(cameraId, profileToken, presetToken),
    
    onSuccess: (_, variables) => {
      console.log('✅ Successfully moved to preset:', variables.presetToken);
    },
    
    onError: (error) => {
      console.error('❌ Failed to go to preset:', error);
    },
  });
};

/**
 * Hook to delete a preset
 */
export const useDeletePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cameraId, profileToken, presetToken }: {
      cameraId: string;
      profileToken: string;
      presetToken: string;
    }) => onvifPresetApi.removePreset(cameraId, profileToken, presetToken),
    
    onSuccess: (_, variables) => {
      // Invalidate and refetch presets for this camera
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets.list(variables.cameraId, variables.profileToken),
      });
      
      console.log('✅ Preset deleted successfully');
    },
    
    onError: (error) => {
      console.error('❌ Failed to delete preset:', error);
    },
  });
};

/**
 * Hook to delete multiple presets
 */
export const useDeleteMultiplePresets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cameraId, profileToken, presetTokens }: {
      cameraId: string;
      profileToken: string;
      presetTokens: string[];
    }) => onvifPresetApi.removeMultiplePresets(cameraId, profileToken, presetTokens),
    
    onSuccess: (_, variables) => {
      // Invalidate and refetch presets for this camera
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets.list(variables.cameraId, variables.profileToken),
      });
      
      console.log('✅ Multiple presets deleted successfully');
    },
    
    onError: (error) => {
      console.error('❌ Failed to delete multiple presets:', error);
    },
  });
};

// =================================================================
// Utility Hooks
// =================================================================

/**
 * Hook to prefetch presets for a camera
 */
export const usePrefetchPresets = () => {
  const queryClient = useQueryClient();

  return (cameraId: string, profileToken: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.presets.list(cameraId, profileToken),
      queryFn: () => onvifPresetApi.getPresets(cameraId, profileToken),
      staleTime: 2 * 60 * 1000,
    });
  };
};

/**
 * Hook to get preset by token from cache
 */
export const useGetPresetFromCache = () => {
  const queryClient = useQueryClient();

  return (cameraId: string, profileToken: string, presetToken: string) => {
    const queryKey = queryKeys.presets.list(cameraId, profileToken);
    const data = queryClient.getQueryData<OnvifPreset[]>(queryKey);
    return data?.find(preset => preset.preset_token === presetToken);
  };
};

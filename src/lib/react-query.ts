/**
 * React Query Configuration
 * Centralized configuration for TanStack Query
 */

import { QueryClient } from '@tanstack/react-query';

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: how long data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // ONVIF Preset queries
  presets: {
    all: ['presets'] as const,
    lists: () => [...queryKeys.presets.all, 'list'] as const,
    list: (cameraId: string, profileToken: string) => 
      [...queryKeys.presets.lists(), cameraId, profileToken] as const,
  },
  
  // Camera queries
  cameras: {
    all: ['cameras'] as const,
    lists: () => [...queryKeys.cameras.all, 'list'] as const,
    details: () => [...queryKeys.cameras.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cameras.details(), id] as const,
    status: (id: string) => [...queryKeys.cameras.details(), id, 'status'] as const,
  },
  
  // PTZ Status queries
  ptz: {
    all: ['ptz'] as const,
    status: (cameraId: string) => [...queryKeys.ptz.all, 'status', cameraId] as const,
  },
} as const;

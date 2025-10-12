/**
 * API Configuration
 * Centralized configuration for all API services
 */

export const API_CONFIG = {
  // Base URL for all API calls
  BASE_URL: 'http://localhost:4200',
  
  // Request timeouts
  TIMEOUTS: {
    DEFAULT: 10000, // 10 seconds
    CAMERA: 10000,  // 10 seconds
    LOGIN: 10000,   // 10 seconds
    STATUS: 5000,   // 5 seconds
  },
  
  // Cache durations
  CACHE: {
    CAMERA: 5 * 60 * 1000, // 5 minutes
    DEFAULT: 2 * 60 * 1000, // 2 minutes
  },
  
  // Token management
  TOKEN: {
    LIFETIME: 60 * 60 * 1000, // 1 hour
    STORAGE_KEY: 'access_token',
    CLIENT_DATA_KEY: 'client_data',
    LOGIN_TIMESTAMP_KEY: 'login_timestamp',
  },
  
  // API endpoints
  ENDPOINTS: {
    LOGIN: '/client/login',
    CAMERA: '/camera',
    CAMERA_STATUS: (id: string) => `/camera/${id}/status`,
    // ONVIF endpoints
    ONVIF_PRESETS: '/onvif/presets',
    ONVIF_PRESETS_SET: '/onvif/presets/set',
    ONVIF_PRESETS_GOTO: '/onvif/presets/goto',
    ONVIF_PRESETS_REMOVE: '/onvif/presets/remove',
  },
  
  // Headers
  HEADERS: {
    JSON: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    NO_CACHE: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
} as const;

export type ApiConfig = typeof API_CONFIG;

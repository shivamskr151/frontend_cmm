/**
 * Frontend Configuration Utility
 * Loads and provides access to environment variables
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  },

  // WebSocket Configuration
  websocket: {
    url: import.meta.env.VITE_WEBSOCKET_BASE_URL || 'ws://localhost:4200/ws/joystick',
    reconnectAttempts: Number(import.meta.env.VITE_WEBSOCKET_RECONNECT_ATTEMPTS) || 5,
    reconnectDelay: Number(import.meta.env.VITE_WEBSOCKET_RECONNECT_DELAY) || 3000,
    connectionTimeout: Number(import.meta.env.VITE_WEBSOCKET_CONNECTION_TIMEOUT) || 10000,
  },

  // PTZ Configuration
  ptz: {
    movementThreshold: Number(import.meta.env.VITE_PTZ_MOVEMENT_THRESHOLD) || 0.01,
    debounceDelay: Number(import.meta.env.VITE_PTZ_DEBOUNCE_DELAY) || 150,
  },

  // NippleJS Joystick Configuration
  joystick: {
    size: Number(import.meta.env.VITE_JOYSTICK_SIZE) || 120,
    threshold: Number(import.meta.env.VITE_JOYSTICK_THRESHOLD) || 0.1,
    fadeTime: Number(import.meta.env.VITE_JOYSTICK_FADE_TIME) || 250,
    restOpacity: Number(import.meta.env.VITE_JOYSTICK_REST_OPACITY) || 0.5,
    catchDistance: Number(import.meta.env.VITE_JOYSTICK_CATCH_DISTANCE) || 200,
  },

  // UI Configuration
  ui: {
    appName: import.meta.env.VITE_APP_NAME || 'Variphi CMM',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    defaultPageSize: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10,
  },

  // Camera Configuration
  camera: {
    defaultTimeout: Number(import.meta.env.VITE_DEFAULT_CAMERA_TIMEOUT) || 30000,
    statusRefreshInterval: Number(import.meta.env.VITE_CAMERA_STATUS_REFRESH_INTERVAL) || 5000,
  },

  // Streaming Configuration
  streaming: {
    aspectRatio: import.meta.env.VITE_STREAM_ASPECT_RATIO || '16/9',
    quality: import.meta.env.VITE_STREAM_QUALITY || 'high',
  },

  // Development Configuration
  dev: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
};

// Helper function to get WebSocket URL for specific camera
export const getWebSocketUrl = (cameraId: string): string => {
  return `${config.websocket.url}/ws/ptz/${cameraId}`;
};

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Helper function to check if debug mode is enabled
export const isDebugMode = (): boolean => {
  return config.dev.debugMode;
};

// Helper function to log debug messages
export const debugLog = (message: string, data?: any): void => {
  if (isDebugMode()) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

export default config;

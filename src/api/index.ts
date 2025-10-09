/**
 * Centralized API exports
 * This file provides a single entry point for all API services
 */

// Authentication APIs
export { loginApi, LoginApiService } from './auth/loginApi';
export type { 
  Client, 
  LoginResponse, 
  LoginRequest, 
  LoginError 
} from './auth/loginApi';

// Camera APIs
export { cameraApi } from './camera/cameraApi';
export type { 
  Camera, 
  CameraApiResponse 
} from './camera/cameraApi';

// Activity APIs
export { ActivityService } from './activities/activityService';
export type { 
  Activity, 
  ActivitiesData, 
  ConfigurationData, 
  NewActivityFormData, 
  ActivityValidationResult 
} from './activities/activityService';

// Base API configuration
export { API_CONFIG } from './config';
export type { ApiConfig } from './config';

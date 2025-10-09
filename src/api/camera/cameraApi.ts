/**
 * Camera API Service
 * Handles all camera-related API calls with caching and error handling
 */

import { API_CONFIG } from '../config';
import { loginApi } from '../auth/loginApi';

export interface Camera {
  id: string;
  name: string;
  appName?: string;
  status?: 'online' | 'offline' | 'unknown';
  ip?: string;
  port?: number;
  location?: string;
  type?: string;
}

interface CameraApiResponse {
  cameras?: Camera[];
  data?: Camera[];
  success?: boolean;
  message?: string;
}

class CameraApiService {
  private cache: Camera[] | null = null;
  private cacheTimestamp: number = 0;
  private pendingRequest: Promise<Camera[]> | null = null;

  /**
   * Get authorization headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = loginApi.getAccessToken();
    if (!token) {
      throw new Error('No authentication token available. Please login first.');
    }
    
    console.log('🔐 Using token for camera API:', token.substring(0, 20) + '...');
    
    return {
      'Authorization': `Bearer ${token}`,
      ...API_CONFIG.HEADERS.JSON,
      ...API_CONFIG.HEADERS.NO_CACHE,
    };
  }

  /**
   * Fetch cameras from the API with caching and request deduplication
   */
  async getCameras(forceRefresh: boolean = false): Promise<Camera[]> {
    console.log('🔍 getCameras called with forceRefresh:', forceRefresh);
    console.log('📦 Cache status - exists:', !!this.cache, 'valid:', this.isCacheValid());
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      console.log('📦 Returning cached camera data');
      return this.cache;
    }

    // If there's already a pending request, return it instead of making a new one
    if (this.pendingRequest && !forceRefresh) {
      console.log('🔄 Reusing pending request to prevent duplicate API calls');
      return this.pendingRequest;
    }

    // Create the request promise and store it to prevent concurrent calls
    this.pendingRequest = this.fetchCamerasFromAPI(forceRefresh);
    
    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      // Clear the pending request when done
      this.pendingRequest = null;
    }
  }

  /**
   * Internal method to fetch cameras from API
   */
  private async fetchCamerasFromAPI(_forceRefresh: boolean = false): Promise<Camera[]> {
    try {
      console.log('🌐 Fetching cameras from API...');
      console.log('🌐 API URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMERA}`);
      
      const authHeaders = this.getAuthHeaders();
      console.log('🔐 Auth headers:', authHeaders);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMERA}`, {
        method: 'GET',
        headers: authHeaders,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.CAMERA),
      });
      
      console.log('📡 API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 304) {
          // Force a fresh request by clearing cache and retrying
          console.log('🔄 Received 304, forcing fresh request...');
          this.cache = null;
          this.cacheTimestamp = 0;
          return this.fetchCamerasFromAPI(true); // Force refresh
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view cameras.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: CameraApiResponse = await response.json();
      
      // Handle different response formats
      let cameras: Camera[] = [];
      if (Array.isArray(data)) {
        cameras = data;
      } else if (data.cameras && Array.isArray(data.cameras)) {
        cameras = data.cameras;
      } else if (data.data && Array.isArray(data.data)) {
        cameras = data.data;
      } else {
        console.warn('⚠️ Unexpected API response format:', data);
        cameras = [];
      }

      // Validate and normalize camera data
      cameras = cameras.map(camera => ({
        id: camera.id || `camera_${Math.random().toString(36).substr(2, 9)}`,
        name: camera.name || `Camera ${camera.id}`,
        appName: camera.appName || camera.name || `Camera ${camera.id}`,
        status: camera.status || 'unknown',
        ip: camera.ip,
        port: camera.port,
        location: camera.location,
        type: camera.type,
      }));

      // Update cache
      this.cache = cameras;
      this.cacheTimestamp = Date.now();
      
      console.log(`✅ Successfully fetched ${cameras.length} cameras`);
      return cameras;

    } catch (error) {
      console.error('❌ Error fetching cameras:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return cached data if available, even if expired
      if (this.cache) {
        console.log('📦 Returning stale cached data due to API error');
        return this.cache;
      }
      
      // Return fallback data if no cache available
      console.log('🔄 Returning fallback camera data');
      return this.getFallbackCameras();
    }
  }

  /**
   * Get a specific camera by ID
   */
  async getCameraById(id: string): Promise<Camera | null> {
    try {
      const cameras = await this.getCameras();
      return cameras.find(camera => camera.id === id) || null;
    } catch (error) {
      console.error('❌ Error fetching camera by ID:', error);
      return null;
    }
  }

  /**
   * Refresh camera data (force API call)
   */
  async refreshCameras(): Promise<Camera[]> {
    return this.getCameras(true);
  }

  /**
   * Clear the cache and cancel any pending requests
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    this.pendingRequest = null;
    console.log('🗑️ Camera cache cleared and pending requests cancelled');
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < API_CONFIG.CACHE.CAMERA;
  }

  /**
   * Get fallback camera data when API fails
   */
  private getFallbackCameras(): Camera[] {
    return [
      { id: 'fallback_1', name: 'Camera 1 - Main Entrance', appName: 'Main Entrance Cam', status: 'unknown' },
      { id: 'fallback_2', name: 'Camera 2 - Parking Lot', appName: 'Parking Lot Cam', status: 'unknown' },
      { id: 'fallback_3', name: 'Camera 3 - Office Area', appName: 'Office Area Cam', status: 'unknown' },
      { id: 'fallback_4', name: 'Camera 4 - Reception', appName: 'Reception Cam', status: 'unknown' },
    ];
  }

  /**
   * Get camera status (online/offline)
   */
  async getCameraStatus(cameraId: string): Promise<'online' | 'offline' | 'unknown'> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMERA_STATUS(cameraId)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.STATUS),
      });

      if (!response.ok) {
        if (response.status === 304) {
          // Force a fresh request by adding cache-busting parameter
          console.log('🔄 Received 304 for camera status, retrying with fresh request...');
          const freshResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMERA_STATUS(cameraId)}?t=${Date.now()}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.STATUS),
          });
          if (!freshResponse.ok) {
            return 'offline';
          }
          const freshData = await freshResponse.json();
          return freshData.status || 'unknown';
        }
        return 'offline';
      }

      const data = await response.json();
      return data.status || 'unknown';
    } catch (error) {
      console.error('❌ Error checking camera status:', error);
      return 'unknown';
    }
  }
}

// Export singleton instance
export const cameraApi = new CameraApiService();

// Export types for use in components
export type { CameraApiResponse };

/**
 * Camera API Service
 * Handles all camera-related API calls with caching and error handling
 */

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
  private baseUrl = 'http://localhost:4200';
  private cache: Camera[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get authorization headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No authentication token available. Please login first.');
    }
    
    console.log('🔐 Using token for camera API:', token.substring(0, 20) + '...');
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Get stored access token
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Fetch cameras from the API with caching
   */
  async getCameras(forceRefresh: boolean = false): Promise<Camera[]> {
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      console.log('📦 Returning cached camera data');
      return this.cache;
    }

    try {
      console.log('🌐 Fetching cameras from API...');
      const response = await fetch(`${this.baseUrl}/camera`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
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
   * Clear the cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ Camera cache cleared');
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
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
      const response = await fetch(`${this.baseUrl}/camera/${cameraId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
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

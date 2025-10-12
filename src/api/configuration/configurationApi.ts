/**
 * Configuration API Service
 * Handles all configuration-related API calls with caching and error handling
 */

import { API_CONFIG } from '../config';
import { auth } from '../../utils/auth';

export interface ConfigurationData {
  cameraId: string;
  configuration: Record<string, unknown>;
  timestamp?: string;
  version?: string;
}


class ConfigurationApiService {
  private cache: Map<string, ConfigurationData> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = auth.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    return {
      ...API_CONFIG.HEADERS.JSON,
      ...API_CONFIG.HEADERS.NO_CACHE,
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Get configuration for a specific camera
   */
  async getConfiguration(cameraId: string, forceRefresh: boolean = false): Promise<ConfigurationData> {
    if (!cameraId) {
      throw new Error('Camera ID is required');
    }

    // Check cache first
    if (!forceRefresh && this.isCacheValid(cameraId)) {
      const cachedData = this.cache.get(cameraId);
      if (cachedData) {
        console.log('📋 Using cached configuration for camera:', cameraId);
        return cachedData;
      }
    }

    try {
      console.log('🌐 Fetching configuration for camera:', cameraId);
      const configurationData = await this.fetchConfigurationFromAPI(cameraId);
      
      // Cache the result
      this.cache.set(cameraId, configurationData);
      this.cacheTimestamps.set(cameraId, Date.now());
      
      console.log('✅ Configuration loaded successfully for camera:', cameraId);
      return configurationData;
    } catch (error) {
      console.error('❌ Error loading configuration for camera:', cameraId, error);
      throw error;
    }
  }

  /**
   * Internal method to fetch configuration from API
   */
  private async fetchConfigurationFromAPI(cameraId: string): Promise<ConfigurationData> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIGURATION}?cameraId=${encodeURIComponent(cameraId)}`;
      console.log('🌐 Configuration API URL:', url);
      
      const authHeaders = this.getAuthHeaders();
      console.log('🔐 Auth headers:', authHeaders);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: authHeaders,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });
      
      console.log('📡 Configuration API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view configuration.');
        } else if (response.status === 404) {
          throw new Error(`No configuration found for camera: ${cameraId}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const rawData = await response.json();
      console.log('📡 Raw API response:', rawData);
      
      // Handle different response formats
      let configurationData: ConfigurationData;
      
      if (rawData.success !== undefined) {
        // Expected format: { success: true, data: { ... } }
        if (!rawData.success) {
          throw new Error(rawData.message || rawData.error || 'Failed to load configuration');
        }
        
        if (!rawData.data) {
          throw new Error('No configuration data received from server');
        }
        
        configurationData = {
          cameraId: rawData.data.cameraId || cameraId,
          configuration: rawData.data.configuration || rawData.data || {},
          timestamp: rawData.data.timestamp || new Date().toISOString(),
          version: rawData.data.version || '1.0.0'
        };
      } else if (rawData.configuration !== undefined) {
        // Direct format: { configuration: { ... } }
        configurationData = {
          cameraId: rawData.cameraId || cameraId,
          configuration: rawData.configuration || {},
          timestamp: rawData.timestamp || new Date().toISOString(),
          version: rawData.version || '1.0.0'
        };
      } else if (Array.isArray(rawData) || typeof rawData === 'object') {
        // The entire response is the configuration
        configurationData = {
          cameraId: cameraId,
          configuration: rawData,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
      } else {
        throw new Error('Unexpected response format from configuration API');
      }

      console.log('📋 Processed configuration data:', configurationData);
      return configurationData;
    } catch (error) {
      console.error('❌ Error fetching configuration from API:', error);
      throw error;
    }
  }

  /**
   * Check if cache is valid for a camera
   */
  private isCacheValid(cameraId: string): boolean {
    const timestamp = this.cacheTimestamps.get(cameraId);
    if (!timestamp) return false;
    
    const now = Date.now();
    const cacheAge = now - timestamp;
    return cacheAge < API_CONFIG.CACHE.DEFAULT;
  }

  /**
   * Clear cache for a specific camera
   */
  clearCache(cameraId?: string): void {
    if (cameraId) {
      this.cache.delete(cameraId);
      this.cacheTimestamps.delete(cameraId);
      console.log('🗑️ Cleared configuration cache for camera:', cameraId);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
      console.log('🗑️ Cleared all configuration cache');
    }
  }

  /**
   * Refresh configuration for a specific camera
   */
  async refreshConfiguration(cameraId: string): Promise<ConfigurationData> {
    console.log('🔄 Refreshing configuration for camera:', cameraId);
    this.clearCache(cameraId);
    return this.getConfiguration(cameraId, true);
  }
}

// Export singleton instance
export const configurationApi = new ConfigurationApiService();

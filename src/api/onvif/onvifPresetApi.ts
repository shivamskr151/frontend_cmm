/**
 * ONVIF Preset API Service
 * Handles all ONVIF preset-related API calls based on the Postman collection
 */

import { API_CONFIG } from '../config';
import { loginApi } from '../auth/loginApi';

export interface OnvifPreset {
  preset_token?: string;
  token?: string; // Backend might return 'token' instead of 'preset_token'
  preset_name?: string;
  name?: string; // Backend might return 'name' instead of 'preset_name'
  pan?: number;
  tilt?: number;
  zoom?: number;
}

export interface OnvifPresetRequest {
  cameraId: string;
  profileToken: string;
  presetName?: string;
  presetToken?: string;
}

export interface OnvifPresetResponse {
  success?: boolean;
  message?: string;
  preset_token?: string;
  presets?: OnvifPreset[];
}

class OnvifPresetApiService {
  /**
   * Get authorization headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = loginApi.getAccessToken();
    if (!token) {
      throw new Error('No authentication token available. Please login first.');
    }
    
    console.log('🔐 Using token for ONVIF preset API:', token.substring(0, 20) + '...');
    
    return {
      'Authorization': `Bearer ${token}`,
      ...API_CONFIG.HEADERS.JSON,
      ...API_CONFIG.HEADERS.NO_CACHE,
    };
  }

  /**
   * Get all presets for a camera
   * POST /onvif/presets
   */
  async getPresets(cameraId: string, profileToken: string): Promise<OnvifPreset[]> {
    try {
      console.log('🔍 Getting presets for camera:', cameraId, 'profile:', profileToken);
      
      const requestBody: OnvifPresetRequest = {
        cameraId,
        profileToken
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/presets`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Get Presets API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view presets.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: OnvifPresetResponse = await response.json();
      
      // Handle different response formats
      let presets: OnvifPreset[] = [];
      if (Array.isArray(data)) {
        presets = data;
      } else if (data.presets && Array.isArray(data.presets)) {
        presets = data.presets;
      } else {
        console.warn('⚠️ Unexpected API response format for presets:', data);
        presets = [];
      }

      console.log(`✅ Successfully fetched ${presets.length} presets`);
      console.log('📋 Raw presets data:', presets);
      return presets;

    } catch (error) {
      console.error('❌ Error fetching presets:', error);
      throw error;
    }
  }

  /**
   * Set/Create a new preset
   * POST /onvif/presets/set
   */
  async setPreset(cameraId: string, profileToken: string, presetName: string): Promise<string> {
    try {
      console.log('💾 Setting preset:', presetName, 'for camera:', cameraId);
      
      const requestBody: OnvifPresetRequest = {
        cameraId,
        profileToken,
        presetName
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/presets/set`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Set Preset API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to set presets.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: OnvifPresetResponse = await response.json();
      
      if (!data.preset_token) {
        throw new Error('No preset token returned from server');
      }

      console.log('✅ Successfully set preset with token:', data.preset_token);
      return data.preset_token;

    } catch (error) {
      console.error('❌ Error setting preset:', error);
      throw error;
    }
  }

  /**
   * Go to a specific preset
   * POST /onvif/presets/goto
   */
  async gotoPreset(cameraId: string, profileToken: string, presetToken: string): Promise<void> {
    try {
      console.log('🎯 Going to preset:', presetToken, 'for camera:', cameraId);
      
      const requestBody: OnvifPresetRequest = {
        cameraId,
        profileToken,
        presetToken
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/presets/goto`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Goto Preset API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to control presets.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      await response.json();
      console.log('✅ Successfully moved to preset');

    } catch (error) {
      console.error('❌ Error going to preset:', error);
      throw error;
    }
  }

  /**
   * Remove/Delete a preset
   * POST /onvif/presets/remove
   */
  async removePreset(cameraId: string, profileToken: string, presetToken: string): Promise<void> {
    try {
      console.log('🗑️ Removing preset:', presetToken, 'for camera:', cameraId);
      
      const requestBody: OnvifPresetRequest = {
        cameraId,
        profileToken,
        presetToken
      };

      console.log('📤 Remove Preset Request Body:', requestBody);

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/presets/remove`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Remove Preset API Response status:', response.status, response.statusText);

      if (!response.ok) {
        // Try to get the error response body for more details
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('📄 Error response body:', errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.warn('Could not parse error response body:', parseError);
        }

        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to remove presets.');
        } else if (response.status === 404) {
          throw new Error('Preset not found or already deleted.');
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorMessage}`);
        } else {
          throw new Error(errorMessage);
        }
      }

      const responseData = await response.json();
      console.log('📄 Remove Preset Response:', responseData);
      
      // Check if the response indicates success
      if (responseData.success === false) {
        throw new Error(responseData.message || 'Failed to remove preset');
      }
      
      console.log('✅ Successfully removed preset');

    } catch (error) {
      console.error('❌ Error removing preset:', error);
      throw error;
    }
  }

  /**
   * Remove multiple presets
   */
  async removeMultiplePresets(cameraId: string, profileToken: string, presetTokens: string[]): Promise<void> {
    try {
      console.log('🗑️ Removing multiple presets:', presetTokens.length, 'for camera:', cameraId);
      
      // Execute all remove operations in parallel
      const removePromises = presetTokens.map(presetToken => 
        this.removePreset(cameraId, profileToken, presetToken)
      );

      await Promise.all(removePromises);
      console.log('✅ Successfully removed all selected presets');

    } catch (error) {
      console.error('❌ Error removing multiple presets:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const onvifPresetApi = new OnvifPresetApiService();


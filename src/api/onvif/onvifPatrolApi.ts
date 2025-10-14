/**
 * ONVIF Patrol/Preset Tour API Service
 * Handles all ONVIF preset tour-related API calls based on the Postman collection
 */

import { API_CONFIG } from '../config';
import { loginApi } from '../auth/loginApi';

export interface PatrolTourStep {
  presetToken?: string;
  preset_token?: string; // Backend might return 'preset_token' instead of 'presetToken'
  speed: number;
  waitTime: number;
}

export interface PatrolStartingCondition {
  recurringTime: number;
  recurringDuration: string;
  randomPresetOrder: boolean;
}

export interface PatrolTourRequest {
  cameraId: string;
  profileToken: string;
  tourName?: string;
  tourToken?: string;
  autoStart?: boolean;
  isLooping?: boolean;
  startingCondition?: PatrolStartingCondition;
  steps?: PatrolTourStep[];
  operation?: 'start' | 'stop' | 'pause' | 'resume';
}

export interface PatrolTour {
  tour_token?: string;
  token?: string;
  tour_name?: string;
  name?: string;
  auto_start?: boolean;
  autoStart?: boolean;
  is_looping?: boolean;
  isLooping?: boolean;
  is_running?: boolean; // Add running status from backend
  starting_condition?: PatrolStartingCondition;
  startingCondition?: PatrolStartingCondition;
  steps?: PatrolTourStep[];
  status?: 'idle' | 'running' | 'paused' | 'stopped';
}

export interface PatrolTourResponse {
  success?: boolean;
  message?: string;
  tour_token?: string;
  token?: string;
  tours?: PatrolTour[];
  tour?: PatrolTour;
}

class OnvifPatrolApiService {
  /**
   * Get authorization headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = loginApi.getAccessToken();
    if (!token) {
      throw new Error('No authentication token available. Please login first.');
    }
    
    console.log('🔐 Using token for ONVIF patrol API:', token.substring(0, 20) + '...');
    
    return {
      'Authorization': `Bearer ${token}`,
      ...API_CONFIG.HEADERS.JSON,
      ...API_CONFIG.HEADERS.NO_CACHE,
    };
  }

  /**
   * Get all preset tours for a camera
   * POST /onvif/preset-tours
   */
  async getPresetTours(cameraId: string, profileToken: string): Promise<PatrolTour[]> {
    try {
      console.log('🔍 Getting preset tours for camera:', cameraId, 'profile:', profileToken);
      
      const requestBody: PatrolTourRequest = {
        cameraId,
        profileToken
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/preset-tours`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Get Preset Tours API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view preset tours.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: PatrolTourResponse = await response.json();
      console.log('📄 Raw API response data:', data);
      
      // Handle different response formats
      let tours: PatrolTour[] = [];
      if (Array.isArray(data)) {
        tours = data;
      } else if (data.tours && Array.isArray(data.tours)) {
        tours = data.tours;
      } else {
        console.warn('⚠️ Unexpected API response format for preset tours:', data);
        tours = [];
      }

      console.log(`✅ Successfully fetched ${tours.length} preset tours`);
      console.log('📋 Processed patrol tours data:', tours);
      
      // Log each tour's steps in detail
      tours.forEach((tour, index) => {
        console.log(`  📋 Tour ${index + 1}:`, {
          token: tour.tour_token || tour.token,
          name: tour.tour_name || tour.name,
          steps: tour.steps,
          stepCount: tour.steps?.length || 0,
          stepDetails: tour.steps?.map((step, stepIndex) => ({
            index: stepIndex,
            presetToken: step.presetToken,
            preset_token: step.preset_token,
            speed: step.speed,
            waitTime: step.waitTime,
            rawStep: step // Log the raw step object to see all fields
          }))
        });
      });
      
      return tours;

    } catch (error) {
      console.error('❌ Error fetching preset tours:', error);
      throw error;
    }
  }

  /**
   * Create a simple preset tour
   * POST /onvif/preset-tours/create
   */
  async createSimplePresetTour(
    cameraId: string, 
    profileToken: string, 
    tourName: string
  ): Promise<string> {
    try {
      console.log('🎬 Creating simple preset tour:', tourName, 'for camera:', cameraId);
      
      const requestBody: PatrolTourRequest = {
        cameraId,
        profileToken,
        tourName
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/preset-tours/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Create Simple Preset Tour API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to create preset tours.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: PatrolTourResponse = await response.json();
      
      const tourToken = data.tour_token || data.token;
      if (!tourToken) {
        throw new Error('No tour token returned from server');
      }

      console.log('✅ Successfully created simple preset tour with token:', tourToken);
      return tourToken;

    } catch (error) {
      console.error('❌ Error creating simple preset tour:', error);
      throw error;
    }
  }

  /**
   * Create an advanced preset tour with steps and conditions
   * POST /onvif/preset-tours/create
   */
  async createAdvancedPresetTour(
    cameraId: string,
    profileToken: string,
    tourName: string,
    steps: PatrolTourStep[],
    autoStart: boolean = false,
    startingCondition?: PatrolStartingCondition,
    // isLooping: boolean = false
  ): Promise<string> {
    try {
      console.log('🎬 Creating advanced preset tour:', tourName, 'for camera:', cameraId);
      console.log('📋 Tour steps:', steps);
      console.log('⚙️ Auto start:', autoStart);
      console.log('🔄 Starting condition:', startingCondition);
      // console.log('🔁 Looping:', isLooping);
      
      const requestBody: PatrolTourRequest = {
        cameraId,
        profileToken,
        tourName,
        autoStart,
        // isLooping,
        startingCondition,
        steps
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/preset-tours/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Create Advanced Preset Tour API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to create preset tours.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: PatrolTourResponse = await response.json();
      
      const tourToken = data.tour_token || data.token;
      if (!tourToken) {
        throw new Error('No tour token returned from server');
      }

      console.log('✅ Successfully created advanced preset tour with token:', tourToken);
      return tourToken;

    } catch (error) {
      console.error('❌ Error creating advanced preset tour:', error);
      throw error;
    }
  }

  /**
   * Modify an existing preset tour
   * POST /onvif/preset-tours/modify
   */
  async modifyPresetTour(
    cameraId: string,
    profileToken: string,
    tourToken: string,
    steps: PatrolTourStep[],
    autoStart: boolean = false,
    startingCondition?: PatrolStartingCondition
  ): Promise<void> {
    try {
      console.log('✏️ Modifying preset tour:', tourToken, 'for camera:', cameraId);
      console.log('📋 New tour steps:', steps);
      console.log('⚙️ Auto start:', autoStart);
      console.log('🔄 Starting condition:', startingCondition);
      
      const requestBody: PatrolTourRequest = {
        cameraId,
        profileToken,
        tourToken,
        autoStart,
        startingCondition,
        steps
      };

      console.log('📤 Sending modify request to backend:', {
        url: `${API_CONFIG.BASE_URL}/onvif/preset-tours/modify`,
        method: 'POST',
        body: requestBody,
        steps: requestBody.steps?.map(step => ({
          presetToken: step.presetToken,
          preset_token: step.preset_token,
          speed: step.speed,
          waitTime: step.waitTime
        }))
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/preset-tours/modify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Modify Preset Tour API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to modify preset tours.');
        } else if (response.status === 404) {
          throw new Error('Preset tour not found.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: PatrolTourResponse = await response.json();
      console.log('📄 Modify Preset Tour Response:', data);
      console.log('📄 Response status:', response.status);
      console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if the response indicates success
      if (data.success === false) {
        throw new Error(data.message || 'Failed to modify preset tour');
      }
      
      console.log('✅ Successfully modified preset tour');

    } catch (error) {
      console.error('❌ Error modifying preset tour:', error);
      throw error;
    }
  }

  /**
   * Operate a preset tour (start, stop, pause, resume)
   * POST /onvif/preset-tours/operate
   */
  async operatePresetTour(
    cameraId: string,
    profileToken: string,
    tourToken: string,
    operation: 'start' | 'stop' | 'pause' | 'resume'
  ): Promise<void> {
    try {
      console.log(`🎮 Operating preset tour: ${operation}`, tourToken, 'for camera:', cameraId);
      
      const requestBody: PatrolTourRequest = {
        cameraId,
        profileToken,
        tourToken,
        operation
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/preset-tours/operate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log(`📡 Operate Preset Tour (${operation}) API Response status:`, response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to operate preset tours.');
        } else if (response.status === 404) {
          throw new Error('Preset tour not found.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data: PatrolTourResponse = await response.json();
      console.log(`📄 Operate Preset Tour (${operation}) Response:`, data);
      
      // Check if the response indicates success
      if (data.success === false) {
        throw new Error(data.message || `Failed to ${operation} preset tour`);
      }
      
      console.log(`✅ Successfully ${operation}ed preset tour`);

    } catch (error) {
      console.error(`❌ Error ${operation}ing preset tour:`, error);
      throw error;
    }
  }

  /**
   * Start a preset tour
   */
  async startPresetTour(cameraId: string, profileToken: string, tourToken: string): Promise<void> {
    return this.operatePresetTour(cameraId, profileToken, tourToken, 'start');
  }

  /**
   * Stop a preset tour
   */
  async stopPresetTour(cameraId: string, profileToken: string, tourToken: string): Promise<void> {
    return this.operatePresetTour(cameraId, profileToken, tourToken, 'stop');
  }

  /**
   * Pause a preset tour
   */
  async pausePresetTour(cameraId: string, profileToken: string, tourToken: string): Promise<void> {
    return this.operatePresetTour(cameraId, profileToken, tourToken, 'pause');
  }

  /**
   * Resume a preset tour
   */
  async resumePresetTour(cameraId: string, profileToken: string, tourToken: string): Promise<void> {
    return this.operatePresetTour(cameraId, profileToken, tourToken, 'resume');
  }

  /**
   * Delete a preset tour
   * DELETE /onvif/preset-tours/delete
   */
  async deletePresetTour(
    cameraId: string,
    profileToken: string,
    tourToken: string
  ): Promise<void> {
    try {
      console.log('🗑️ Deleting preset tour:', tourToken, 'for camera:', cameraId);
      
      const requestBody = {
        cameraId,
        profileToken,
        presetTourToken: tourToken
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/onvif/preset-tours/delete`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log('📡 Delete Preset Tour API Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to delete preset tours.');
        } else if (response.status === 404) {
          throw new Error('Preset tour not found.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('📄 Delete Preset Tour Response:', data);
      
      console.log('✅ Successfully deleted preset tour');

    } catch (error) {
      console.error('❌ Error deleting preset tour:', error);
      throw error;
    }
  }


  /**
   * Create a patrol tour from preset patterns
   * This is a convenience method that creates a tour with multiple presets
   */
  async createPatrolFromPresets(
    cameraId: string,
    profileToken: string,
    tourName: string,
    presetTokens: string[],
    options: {
      speed?: number;
      waitTime?: number;
      autoStart?: boolean;
      randomOrder?: boolean;
      isLooping?: boolean;
    } = {}
  ): Promise<string> {
    const { speed = 0.8, waitTime = 3, autoStart = false, randomOrder = false } = options;

    const steps: PatrolTourStep[] = presetTokens.map(presetToken => ({
      presetToken,
      speed,
      waitTime
    }));

    const startingCondition: PatrolStartingCondition = {
      recurringTime: 0,
      recurringDuration: "PT5S",
      randomPresetOrder: randomOrder
    };

    return this.createAdvancedPresetTour(
      cameraId,
      profileToken,
      tourName,
      steps,
      autoStart,
      startingCondition,
      // isLooping
    );
  }

  /**
   * Modify an existing patrol tour from preset patterns
   * This is a convenience method that modifies a tour with multiple presets
   */
  async modifyPatrolFromPresets(
    cameraId: string,
    profileToken: string,
    tourToken: string,
    presetTokens: string[],
    options: {
      speed?: number;
      waitTime?: number;
      autoStart?: boolean;
      randomOrder?: boolean;
      presetSpeeds?: Record<string, number>;
      presetWaitTimes?: Record<string, number>;
    } = {}
  ): Promise<void> {
    const { speed = 0.8, waitTime = 3, autoStart = false, randomOrder = false, presetSpeeds = {}, presetWaitTimes = {} } = options;

    console.log('🔧 modifyPatrolFromPresets Debug:');
    console.log('  - Camera ID:', cameraId);
    console.log('  - Profile Token:', profileToken);
    console.log('  - Tour Token:', tourToken);
    console.log('  - Preset Tokens:', presetTokens);
    console.log('  - Options:', options);
    console.log('  - Preset Speeds:', presetSpeeds);
    console.log('  - Preset Wait Times:', presetWaitTimes);

    const steps: PatrolTourStep[] = presetTokens.map(presetToken => ({
      presetToken,
      preset_token: presetToken, // Also include preset_token for backend compatibility
      speed: presetSpeeds[presetToken] || speed,
      waitTime: presetWaitTimes[presetToken] || waitTime
    }));

    console.log('  - Generated Steps:', steps);

    const startingCondition: PatrolStartingCondition = {
      recurringTime: 0,
      recurringDuration: "PT3S",
      randomPresetOrder: randomOrder
    };

    return this.modifyPresetTour(
      cameraId,
      profileToken,
      tourToken,
      steps,
      autoStart,
      startingCondition
    );
  }
}

// Export singleton instance
export const onvifPatrolApi = new OnvifPatrolApiService();

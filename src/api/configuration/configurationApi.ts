/**
 * Configuration API Service
 * Handles all configuration-related API calls with caching and error handling
 */

import { API_CONFIG } from "../config";
import { auth } from "../../utils/auth";

export interface ConfigurationData {
  cameraId: string;
  configuration: Record<string, unknown>;
  timestamp?: string;
  version?: string;
  is_config_added?: boolean;
  id?: string;
  _id?: string;
  sensorId?: string;
  activityData?: Record<string, unknown>;
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
      throw new Error("No authentication token available");
    }

    return {
      ...API_CONFIG.HEADERS.JSON,
      ...API_CONFIG.HEADERS.NO_CACHE,
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get configuration for a specific camera
   */
  async getConfiguration(
    cameraId: string,
    forceRefresh: boolean = false
  ): Promise<ConfigurationData> {
    if (!cameraId) {
      throw new Error("Camera ID is required");
    }

    // Check cache first
    if (!forceRefresh && this.isCacheValid(cameraId)) {
      const cachedData = this.cache.get(cameraId);
      if (cachedData) {
        console.log("📋 Using cached configuration for camera:", cameraId);
        return cachedData;
      }
    }

    try {
      console.log("🌐 Fetching configuration for camera:", cameraId);
      const configurationData = await this.fetchConfigurationFromAPI(cameraId);

      // Cache the result
      this.cache.set(cameraId, configurationData);
      this.cacheTimestamps.set(cameraId, Date.now());

      console.log("✅ Configuration loaded successfully for camera:", cameraId);
      return configurationData;
    } catch (error) {
      console.error(
        "❌ Error loading configuration for camera:",
        cameraId,
        error
      );
      throw error;
    }
  }

  /**
   * Internal method to fetch configuration from API
   */
  private async fetchConfigurationFromAPI(
    cameraId: string
  ): Promise<ConfigurationData> {
    try {
      const url = `${API_CONFIG.BASE_URL}${
        API_CONFIG.ENDPOINTS.CONFIGURATION
      }?cameraId=${encodeURIComponent(cameraId)}`;
      console.log("🌐 Configuration API URL:", url);

      const authHeaders = this.getAuthHeaders();
      console.log("🔐 Auth headers:", authHeaders);

      const response = await fetch(url, {
        method: "GET",
        headers: authHeaders,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
      });

      console.log(
        "📡 Configuration API Response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You do not have permission to view configuration."
          );
        } else if (response.status === 404) {
          throw new Error(`No configuration found for camera: ${cameraId}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const rawData = await response.json();
      console.log("📡 Raw API response:", rawData);

      // Handle different response formats
      let configurationData: ConfigurationData;

      if (rawData.success !== undefined) {
        // Expected format: { success: true, data: { ... } }
        if (!rawData.success) {
          throw new Error(
            rawData.message || rawData.error || "Failed to load configuration"
          );
        }

        if (!rawData.data) {
          throw new Error("No configuration data received from server");
        }

        configurationData = {
          cameraId: rawData.data.cameraId || cameraId,
          configuration:
            rawData.data.configuration ||
            rawData.data.activityData ||
            rawData.data ||
            {},
          timestamp: rawData.data.timestamp || new Date().toISOString(),
          version: rawData.data.version || "1.0.0",
          id: rawData.data.id,
          _id: rawData.data._id,
          is_config_added: rawData.data.is_config_added,
          sensorId: rawData.data.sensorId,
          activityData: rawData.data.activityData,
        };
      } else if (
        rawData.configuration !== undefined ||
        rawData.activityData !== undefined
      ) {
        // Direct format: { configuration: { ... } } or { activityData: { ... } }
        configurationData = {
          cameraId: rawData.cameraId || cameraId,
          configuration: rawData.configuration || rawData.activityData || {},
          timestamp: rawData.timestamp || new Date().toISOString(),
          version: rawData.version || "1.0.0",
          id: rawData.id,
          _id: rawData._id,
          is_config_added: rawData.is_config_added,
          sensorId: rawData.sensorId,
          activityData: rawData.activityData,
        };
      } else if (Array.isArray(rawData) || typeof rawData === "object") {
        // The entire response is the configuration
        configurationData = {
          cameraId: cameraId,
          configuration: rawData,
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          id: (rawData as { id?: string }).id,
          _id: (rawData as { _id?: string })._id,
          is_config_added: (rawData as { is_config_added?: boolean })
            .is_config_added,
        };
      } else {
        throw new Error("Unexpected response format from configuration API");
      }

      console.log("📋 Processed configuration data:", configurationData);
      return configurationData;
    } catch (error) {
      console.error("❌ Error fetching configuration from API:", error);
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
      console.log("🗑️ Cleared configuration cache for camera:", cameraId);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
      console.log("🗑️ Cleared all configuration cache");
    }
  }

  /**
   * Create new configuration
   */
  async createConfiguration(
    configurationData: Record<string, unknown>
  ): Promise<{
    success: boolean;
    message: string;
    data?: unknown;
    conflict?: boolean;
  }> {
    try {
      console.log("🌐 Creating new configuration:", configurationData);

      const authHeaders = this.getAuthHeaders();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIGURATION_CREATE}`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(configurationData),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
        }
      );

      console.log("📡 Create configuration response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You do not have permission to create configuration."
          );
        } else if (response.status === 409) {
          // Configuration already exists - this is expected behavior
          const result = await response.json();
          console.log("⚠️ Configuration already exists (409):", result);

          // Extract existing configuration ID from response if available
          const existingConfigId =
            result?.id || result?._id || result?.existingConfigurationId;

          return {
            success: false,
            message:
              "Configuration already exists for this camera/sensor combination",
            data: {
              ...result,
              existingConfigurationId: existingConfigId,
            },
            conflict: true,
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log("✅ Configuration created successfully:", result);

      return {
        success: true,
        message: "Configuration created successfully!",
        data: result,
      };
    } catch (error) {
      console.error("❌ Error creating configuration:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create configuration",
      };
    }
  }

  /**
   * Update existing configuration
   */
  async updateConfiguration(
    configId: string,
    configurationData: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      console.log("🌐 Updating configuration:", configId, configurationData);

      const authHeaders = this.getAuthHeaders();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIGURATION_UPDATE(
          configId
        )}`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(configurationData),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
        }
      );

      console.log("📡 Update configuration response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You do not have permission to update configuration."
          );
        } else if (response.status === 404) {
          throw new Error(`Configuration with ID ${configId} not found.`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log("✅ Configuration updated successfully:", result);

      return {
        success: true,
        message: "Configuration updated successfully!",
        data: result,
      };
    } catch (error) {
      console.error("❌ Error updating configuration:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update configuration",
      };
    }
  }

  /**
   * Update only activity data for a configuration
   */
  async updateActivityData(
    configId: string,
    payload: { activityName: string; activityData: Record<string, unknown> }
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      console.log("🌐 Updating activity data for config:", configId);
      console.log("📤 Payload being sent:", JSON.stringify(payload, null, 2));

      const authHeaders = this.getAuthHeaders();
      const response = await fetch(
        `${
          API_CONFIG.BASE_URL
        }${API_CONFIG.ENDPOINTS.CONFIGURATION_UPDATE_ACTIVITY_DATA(configId)}`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUTS.DEFAULT),
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          // Try to get detailed error message from response body
          try {
            const errorData = await response.json();
            throw new Error(
              errorData.message ||
                errorData.error ||
                "Bad Request: Invalid payload format"
            );
          } catch {
            throw new Error(
              "Bad Request: Invalid payload format or missing required fields"
            );
          }
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You do not have permission to update activity data."
          );
        } else if (response.status === 404) {
          throw new Error(`Configuration with ID ${configId} not found.`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();
      return {
        success: true,
        message: "Activity data updated successfully!",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update activity data",
      };
    }
  }

  /**
   * Search for existing configuration by cameraId and sensorId
   */
  async findExistingConfiguration(
    cameraId: string,
    sensorId?: string
  ): Promise<{ id?: string; found: boolean }> {
    try {
      console.log("🔍 Searching for existing configuration:", {
        cameraId,
        sensorId,
      });

      // Try to get configuration using the search endpoint
      const configData = await this.getConfiguration(cameraId, true);

      if (configData.id || configData._id) {
        const configId = configData.id || configData._id;
        console.log("✅ Found existing configuration ID:", configId);
        return { id: configId, found: true };
      }

      console.log("❌ No existing configuration found");
      return { found: false };
    } catch (error) {
      console.error("❌ Error searching for existing configuration:", error);
      return { found: false };
    }
  }

  /**
   * Create or update configuration - handles conflicts automatically
   */
  async createOrUpdateConfiguration(
    configurationData: Record<string, unknown>,
    is_config_added: boolean
  ): Promise<{
    success: boolean;
    message: string;
    data?: unknown;
    wasUpdated?: boolean;
  }> {
    try {
      if (is_config_added) {
        const {
          id, ...rest
        } = configurationData;

        if (typeof id !== "string") {
          throw new Error("Invalid or missing configuration id for update");
        }

        return this.updateConfiguration(id, rest);
      } else {
        return this.createConfiguration(configurationData);
      }
    } catch (error) {
      console.error("❌ Error creating or updating configuration:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create or update configuration",
      };
    }
  }

  /**
   * Refresh configuration for a specific camera
   */
  async refreshConfiguration(cameraId: string): Promise<ConfigurationData> {
    console.log("🔄 Refreshing configuration for camera:", cameraId);
    this.clearCache(cameraId);
    return this.getConfiguration(cameraId, true);
  }
}

// Export singleton instance
export const configurationApi = new ConfigurationApiService();

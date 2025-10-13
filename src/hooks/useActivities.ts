import { useState, useCallback } from 'react';
import type { 
  ActivitiesData, 
  NewActivityFormData, 
  ActivityValidationResult 
} from '../types/activity';
import { ActivityService, configurationApi } from '../api';

export interface UseActivitiesReturn {
  activities: ActivitiesData;
  setActivities: (activities: ActivitiesData) => void;
  addActivity: (formData: NewActivityFormData) => Promise<{ success: boolean; message: string }>;
  addActivitiesFromJson: (jsonData: string) => Promise<{ success: boolean; message: string }>;
  loadActivitiesFromConfig: (cameraId: string) => Promise<{ success: boolean; message: string }>;
  validateActivityJson: (jsonData: string) => ActivityValidationResult;
  getActivityStats: () => {
    total: number;
    active: number;
    inactive: number;
    activePercentage: number;
  };
  exportActivities: (sensorId?: string) => string;
}

export const useActivities = (initialActivities: ActivitiesData = {}): UseActivitiesReturn => {
  const [activities, setActivities] = useState<ActivitiesData>(initialActivities);

  const addActivity = useCallback(async (formData: NewActivityFormData) => {
    try {
      // Check for duplicate names
      if (activities[formData.name]) {
        return {
          success: false,
          message: 'Activity with this name already exists.'
        };
      }

      // Create activity from form data
      const newActivity = ActivityService.createActivityFromForm(formData);
      
      // Validate the activity
      const validation = ActivityService.validateActivity(newActivity, formData.name);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Add to activities
      const updatedActivities = {
        ...activities,
        [formData.name]: newActivity
      };
      
      setActivities(updatedActivities);
      
      return {
        success: true,
        message: 'Activity added successfully!'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add activity'
      };
    }
  }, [activities]);

  const addActivitiesFromJson = useCallback(async (jsonData: string) => {
    try {
      // Validate JSON
      const validation = ActivityService.validateActivityJson(jsonData);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Parse activities
      const newActivities = ActivityService.parseActivityJson(jsonData);
      
      // Check for duplicates
      const duplicates = ActivityService.checkForDuplicates(activities, newActivities);
      if (duplicates.length > 0) {
        return {
          success: false,
          message: `Activities with these names already exist: ${duplicates.join(', ')}`
        };
      }

      // Merge activities
      const updatedActivities = ActivityService.mergeActivities(activities, newActivities);
      setActivities(updatedActivities);
      
      return {
        success: true,
        message: 'Activities added successfully from JSON!'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add activities from JSON'
      };
    }
  }, [activities]);

  const loadActivitiesFromConfig = useCallback(async (cameraId: string) => {
    try {
      console.log('🔄 Loading activities from configuration for camera:', cameraId);
      
      // Load configuration from API
      const configData = await configurationApi.getConfiguration(cameraId);
      
      // Extract activities from the configuration
      let activitiesData: ActivitiesData = {};
      
      if (configData.activityData) {
        // If activityData exists, use it directly
        activitiesData = configData.activityData as ActivitiesData;
      } else if (configData.configuration) {
        // If configuration exists, use it
        activitiesData = configData.configuration as ActivitiesData;
      }
      
      console.log('📋 Loaded activities from config:', activitiesData);
      
      // Update the activities state
      setActivities(activitiesData);
      
      return {
        success: true,
        message: `Loaded ${Object.keys(activitiesData).length} activities from configuration`
      };
    } catch (error) {
      console.error('❌ Error loading activities from config:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load activities from configuration'
      };
    }
  }, []);

  const validateActivityJson = useCallback((jsonData: string) => {
    return ActivityService.validateActivityJson(jsonData);
  }, []);

  const getActivityStats = useCallback(() => {
    return ActivityService.getActivityStats(activities);
  }, [activities]);

  const exportActivities = useCallback((sensorId?: string) => {
    const config = ActivityService.exportToConfiguration(activities, sensorId);
    return JSON.stringify(config, null, 2);
  }, [activities]);

  return {
    activities,
    setActivities,
    addActivity,
    addActivitiesFromJson,
    loadActivitiesFromConfig,
    validateActivityJson,
    getActivityStats,
    exportActivities
  };
};

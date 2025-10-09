import { useState, useCallback } from 'react';
import type { 
  ActivitiesData, 
  NewActivityFormData, 
  ActivityValidationResult 
} from '../types/activity';
import { ActivityService } from '../services/ActivityService';

export interface UseActivitiesReturn {
  activities: ActivitiesData;
  setActivities: (activities: ActivitiesData) => void;
  addActivity: (formData: NewActivityFormData) => Promise<{ success: boolean; message: string }>;
  addActivitiesFromJson: (jsonData: string) => Promise<{ success: boolean; message: string }>;
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
    validateActivityJson,
    getActivityStats,
    exportActivities
  };
};

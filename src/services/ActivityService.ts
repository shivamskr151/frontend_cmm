import type { 
  Activity, 
  ActivitiesData, 
  ConfigurationData, 
  NewActivityFormData, 
  ActivityValidationResult 
} from '../types/activity';

export class ActivityService {
  /**
   * Validates JSON data for activities
   */
  static validateActivityJson(jsonData: string): ActivityValidationResult {
    const result: ActivityValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    if (!jsonData.trim()) {
      result.errors.push('JSON data is required');
      return result;
    }

    try {
      const parsed = JSON.parse(jsonData);
      
      if (typeof parsed !== 'object' || parsed === null) {
        result.errors.push('JSON must be an object');
        return result;
      }

      // Check if it's the full configuration format or just activities
      let activitiesData = parsed;
      if (parsed.activities_data) {
        activitiesData = parsed.activities_data;
      }

      // Validate each activity
      for (const [activityName, activity] of Object.entries(activitiesData)) {
        const activityValidation = this.validateActivity(activity as Activity, activityName);
        result.errors.push(...activityValidation.errors);
        result.warnings.push(...activityValidation.warnings);
      }

      result.isValid = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push('Invalid JSON format');
      return result;
    }
  }

  /**
   * Validates a single activity
   */
  static validateActivity(activity: Activity, activityName: string): ActivityValidationResult {
    const result: ActivityValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    if (!activity.status || !['ACTIVE', 'INACTIVE'].includes(activity.status)) {
      result.errors.push(`Activity "${activityName}" must have a valid status (ACTIVE or INACTIVE)`);
    }

    if (!activity.parameters || typeof activity.parameters !== 'object') {
      result.errors.push(`Activity "${activityName}" must have parameters object`);
    }

    // Check for common required parameters
    if (activity.parameters?.time_window && !Array.isArray(activity.parameters.time_window)) {
      result.warnings.push(`Activity "${activityName}" has non-array time_window`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Parses JSON data and extracts activities
   */
  static parseActivityJson(jsonData: string): ActivitiesData {
    const parsed = JSON.parse(jsonData);
    
    // Handle both full configuration and activities-only formats
    if (parsed.activities_data) {
      return parsed.activities_data;
    }
    
    return parsed;
  }

  /**
   * Creates a new activity from form data
   */
  static createActivityFromForm(formData: NewActivityFormData): Activity {
    let parameters = {};
    
    if (formData.data.trim()) {
      try {
        parameters = JSON.parse(formData.data);
      } catch (error) {
        throw new Error('Invalid JSON format in Activity Data field');
      }
    }

    return {
      status: formData.status,
      parameters,
      zones: (parameters as any).zones || {
        "zone1": [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100]
        ]
      }
    };
  }

  /**
   * Checks for duplicate activity names
   */
  static checkForDuplicates(
    existingActivities: ActivitiesData, 
    newActivities: ActivitiesData
  ): string[] {
    const existingNames = Object.keys(existingActivities);
    const newNames = Object.keys(newActivities);
    return newNames.filter(name => existingNames.includes(name));
  }

  /**
   * Merges activities with existing ones
   */
  static mergeActivities(
    existing: ActivitiesData, 
    newActivities: ActivitiesData
  ): ActivitiesData {
    return { ...existing, ...newActivities };
  }

  /**
   * Generates a sample activity template
   */
  static generateSampleActivity(_activityName: string): Activity {
    return {
      status: 'ACTIVE',
      parameters: {
        frame_accuracy: 10,
        time_window: [
          {
            time_start_end: [["08:00", "18:00"]],
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ]
      },
      zones: {
        "zone1": [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100]
        ]
      }
    };
  }

  /**
   * Formats activity data for display
   */
  static formatActivityForDisplay(activity: Activity): string {
    return JSON.stringify(activity, null, 2);
  }

  /**
   * Gets activity statistics
   */
  static getActivityStats(activities: ActivitiesData) {
    const total = Object.keys(activities).length;
    const active = Object.values(activities).filter(a => a.status === 'ACTIVE').length;
    const inactive = total - active;
    
    return {
      total,
      active,
      inactive,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }

  /**
   * Exports activities to configuration format
   */
  static exportToConfiguration(activities: ActivitiesData, sensorId?: string): ConfigurationData {
    return {
      activities_data: activities,
      ...(sensorId && { sensor_id: sensorId })
    };
  }
}

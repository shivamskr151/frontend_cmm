import type { FieldConfig } from '../types/activityFields';

export class FieldTypeDetector {
  private static parameterDescriptions: Record<string, string> = {
    'frame_accuracy': 'Number of frames to process for accuracy',
    'subcategory_mapping': 'Mapping of detection categories',
    'speed_limit': 'Speed limits for different vehicle types',
    'calibration': 'Calibration factor for measurements',
    'real_distance': 'Real-world distance in meters',
    'frame_to_track': 'Number of frames to track objects',
    'person_limit': 'Maximum number of people allowed',
    'last_time': 'Time threshold in seconds',
    'motion_thr': 'Motion detection threshold',
    'collision_angel_threshold': 'Collision angle threshold in degrees',
    'iou': 'Intersection over Union threshold',
    'conf': 'Confidence threshold',
    'FALL_ANGLE_THRESHOLD': 'Angle threshold for fall detection',
    'UNCONSCIOUS_TIME_THRESHOLD': 'Time threshold for unconscious detection',
    'FALL_CONFIRMATION_FRAMES': 'Number of frames to confirm fall',
    'SEATED_RATIO_THRESHOLD': 'Ratio threshold for seated detection',
    'SITTING_TORSO_ANGLE_THRESHOLD': 'Torso angle threshold for sitting',
    'wrong_lane': 'Enable wrong lane detection',
    'entry_exit': 'Enable entry/exit detection',
    'frame_send_sec': 'Frame send interval in seconds',
    'last_frame_time': 'Last frame processing time',
    'time_stamp': 'Timestamp for tracking',
    'capacity': 'Maximum capacity for areas',
    'scheduled_time': 'Scheduled monitoring times',
    'time_window': 'Time windows for activity monitoring with specific days and timezone',
    'timezone': 'Timezone for scheduling',
    'vehicle_classes': 'Types of vehicles to detect',
    'person_classes': 'Types of persons to detect',
    'acts': 'Actions to monitor',
    'lines': 'Detection lines for traffic monitoring',
    'SOURCE': 'Source area coordinates',
    'TARGET_WIDTH': 'Target width for detection',
    'TARGET_HEIGHT': 'Target height for detection'
  };

  /**
   * Automatically generate field configurations from activity parameters
   */
  static generateFieldConfigs(_activityName: string, parameters: Record<string, any>): FieldConfig[] {
    const fields: FieldConfig[] = [];
    
    Object.entries(parameters).forEach(([paramName, paramValue]) => {
      const fieldConfig = this.createFieldConfig(paramName, paramValue);
      if (fieldConfig) {
        fields.push(fieldConfig);
      }
    });

    return fields;
  }

  /**
   * Create a field configuration for a parameter
   */
  private static createFieldConfig(paramName: string, paramValue: any): FieldConfig | null {
    const fieldType = this.determineFieldType(paramName, paramValue);
    const label = this.formatParameterName(paramName);
    const description = this.parameterDescriptions[paramName] || 'Parameter configuration';

    const baseConfig: FieldConfig = {
      id: paramName,
      label,
      type: fieldType,
      defaultValue: paramValue,
      description,
      category: this.determineCategory(paramName)
    };

    // Add type-specific configurations
    switch (fieldType) {
      case 'number':
        return {
          ...baseConfig,
          min: this.getNumberMin(paramName),
          max: this.getNumberMax(paramName),
          step: this.getNumberStep(paramValue)
        };

      case 'slider':
        return {
          ...baseConfig,
          min: this.getNumberMin(paramName),
          max: this.getNumberMax(paramName),
          step: this.getNumberStep(paramValue)
        };

      case 'timeWindow':
        return {
          ...baseConfig,
          defaultValue: this.normalizeTimeWindowValue(paramValue)
        };

      case 'scheduledTime':
        return {
          ...baseConfig,
          defaultValue: this.normalizeScheduledTimeValue(paramValue)
        };

      case 'mapping':
        return {
          ...baseConfig,
          isMapping: true,
          defaultValue: typeof paramValue === 'object' ? paramValue : {}
        };

      case 'array':
        return {
          ...baseConfig,
          defaultValue: Array.isArray(paramValue) ? paramValue : []
        };

      case 'speedLimits':
        return {
          ...baseConfig,
          defaultValue: this.normalizeSpeedLimitsValue(paramValue)
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Determine field type based on parameter name and value
   */
  private static determineFieldType(paramName: string, paramValue: any): FieldConfig['type'] {
    // Special handling for time_window parameter (must be checked first)
    if (paramName === 'time_window') {
      return 'timeWindow';
    }

    // Special handling for scheduled_time
    if (paramName === 'scheduled_time') {
      return 'scheduledTime';
    }

    // First check the actual value type
    if (typeof paramValue === 'number') {
      // Check if it should be a slider
      if (this.shouldBeSlider(paramName, paramValue)) {
        return 'slider';
      }
      return 'number';
    }

    if (typeof paramValue === 'boolean') return 'boolean';
    
    if (Array.isArray(paramValue)) {
      // Check if it's a coordinate array
      if (this.isCoordinateArray(paramValue)) {
        return 'coordinates';
      }
      // Check if it's a time window array (must be checked before generic array)
      if (paramName === 'time_window') {
        return 'timeWindow';
      }
      return 'array';
    }

    if (typeof paramValue === 'object' && paramValue !== null) {
      // Check if it's a speed limit object
      if (paramName === 'speed_limit') {
        return 'speedLimits';
      }
      
      // Check if it's a mapping object
      if (this.isMappingObject(paramValue)) {
        return 'mapping';
      }
      
      return 'object';
    }

    // Check parameter name patterns for default values
    if (this.isNumberParameter(paramName)) {
      return this.shouldBeSlider(paramName, paramValue) ? 'slider' : 'number';
    }

    if (this.isBooleanParameter(paramName)) {
      return 'boolean';
    }

    if (this.isArrayParameter(paramName)) {
      return 'array';
    }

    return 'text';
  }

  /**
   * Check if parameter should be a slider
   */
  private static shouldBeSlider(paramName: string, paramValue: any): boolean {
    const sliderParams = [
      'iou', 'conf', 'percentage', 'ratio', 'threshold',
      'FALL_ANGLE_THRESHOLD', 'SEATED_RATIO_THRESHOLD', 
      'SITTING_TORSO_ANGLE_THRESHOLD', 'collision_angel_threshold',
      'vv_hor_interaction_percentage', 'vv_ver_interaction_percentage',
      'hor_interaction_percentage', 'ver_interaction_percentage'
    ];

    return sliderParams.some(param => paramName.toLowerCase().includes(param.toLowerCase())) &&
           typeof paramValue === 'number' && paramValue >= 0 && paramValue <= 1;
  }

  /**
   * Check if parameter is a number type
   */
  private static isNumberParameter(paramName: string): boolean {
    const numberParams = [
      'threshold', 'accuracy', 'interval', 'time', 'distance', 
      'calibration', 'frame', 'percentage', 'ratio', 'angle',
      'limit', 'width', 'height', 'motion_thr', 'count', 'number'
    ];

    return numberParams.some(param => paramName.toLowerCase().includes(param.toLowerCase()));
  }

  /**
   * Check if parameter is a boolean type
   */
  private static isBooleanParameter(paramName: string): boolean {
    const booleanParams = ['enabled', 'wrong_lane', 'entry_exit', 'active', 'enable'];
    return booleanParams.some(param => paramName.toLowerCase().includes(param.toLowerCase()));
  }

  /**
   * Check if parameter is an array type
   */
  private static isArrayParameter(paramName: string): boolean {
    const arrayParams = ['mapping', 'classes', 'acts', 'items', 'list'];
    return arrayParams.some(param => paramName.toLowerCase().includes(param.toLowerCase()));
  }

  /**
   * Check if array contains coordinates
   */
  private static isCoordinateArray(value: any[]): boolean {
    return value.length > 0 && 
           Array.isArray(value[0]) && 
           value[0].length === 2 && 
           typeof value[0][0] === 'number' && 
           typeof value[0][1] === 'number';
  }

  /**
   * Check if object is a mapping (all values are primitives)
   */
  private static isMappingObject(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    return Object.values(obj).every(v => ['string', 'number', 'boolean'].includes(typeof v));
  }

  /**
   * Determine category for parameter
   */
  private static determineCategory(paramName: string): string {
    if (paramName.includes('threshold') || paramName.includes('accuracy') || paramName.includes('conf')) {
      return 'Detection';
    }
    if (paramName.includes('time') || paramName.includes('schedule')) {
      return 'Time Settings';
    }
    if (paramName.includes('speed') || paramName.includes('limit')) {
      return 'Speed Limits';
    }
    if (paramName.includes('calibration') || paramName.includes('distance')) {
      return 'Calibration';
    }
    if (paramName.includes('mapping') || paramName.includes('classes') || paramName.includes('acts')) {
      return 'Detection';
    }
    return 'General';
  }

  /**
   * Format parameter name for display
   */
  private static formatParameterName(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get number input step value
   */
  private static getNumberStep(value: any): number {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return 1;
      if (value % 0.1 === 0) return 0.1;
      if (value % 0.01 === 0) return 0.01;
    }
    return 0.1;
  }

  /**
   * Get number input minimum value
   */
  private static getNumberMin(paramName: string): number {
    if (paramName.includes('accuracy') || paramName.includes('percentage') || 
        paramName.includes('ratio') || paramName.includes('iou') || 
        paramName.includes('conf')) {
      return 0;
    }
    if (paramName.includes('angle')) {
      return -180;
    }
    return 0;
  }

  /**
   * Get number input maximum value
   */
  private static getNumberMax(paramName: string): number {
    if (paramName.includes('accuracy') || paramName.includes('percentage') || 
        paramName.includes('ratio') || paramName.includes('iou') || 
        paramName.includes('conf')) {
      return 1;
    }
    if (paramName.includes('angle')) {
      return 180;
    }
    return 1000;
  }

  /**
   * Normalize time window value to array format
   */
  private static normalizeTimeWindowValue(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Convert object format to array format
      const normalized = {
        time_start_end: [[value.start || '08:00', value.end || '18:00']],
        days: this.normalizeDays(value.days || []),
        timezone: value.timezone || 'Asia/Kolkata'
      };
      return [normalized];
    }
    
    return [];
  }

  /**
   * Normalize days array to full day names
   */
  private static normalizeDays(days: string[]): string[] {
    const dayMapping: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday', 
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    };
    
    return days.map(day => dayMapping[day.toLowerCase()] || day);
  }

  /**
   * Normalize speed limits value to array format
   */
  private static normalizeSpeedLimitsValue(value: any): any {
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Convert object format {car: 20, truck: 60} to array format
      return Object.entries(value).map(([vehicleType, speed]) => ({
        vehicleType,
        speed: typeof speed === 'number' ? speed : parseInt(String(speed)) || 0
      }));
    }
    
    return [];
  }

  /**
   * Normalize scheduled time value to array format
   */
  private static normalizeScheduledTimeValue(value: any): any {
    try {
      if (Array.isArray(value)) {
        return value.map(item => {
          // Convert time_start_end to timeRanges format
          if (item && item.time_start_end && !item.timeRanges) {
            return {
              ...item,
              timeRanges: item.time_start_end.map(([start, end]) => ({ start, end }))
            };
          }
          return item;
        });
      }
      
      if (typeof value === 'object' && value !== null) {
        // Convert single object to array format
        if (value.time_start_end && !value.timeRanges) {
          return [{
            ...value,
            timeRanges: value.time_start_end.map(([start, end]) => ({ start, end }))
          }];
        }
        return [value];
      }
      
      return [];
    } catch (error) {
      console.error('Error normalizing scheduled time value:', error, value);
      return [];
    }
  }
}

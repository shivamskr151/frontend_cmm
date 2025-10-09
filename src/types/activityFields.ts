export interface FieldConfig {
  id: string;
  label: string;
  type: 'number' | 'text' | 'slider' | 'tags' | 'timeRange' | 'select' | 'boolean' | 'coordinates' | 'speedLimits' | 'scheduledTime' | 'timeWindow' | 'mapping' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
  description?: string;
  category?: string;
  isMapping?: boolean;
}

export interface ActivityFieldConfig {
  [activityName: string]: {
    fields: FieldConfig[];
    categories?: string[];
  };
}

export interface FieldValue {
  [key: string]: any;
}

export interface TagItem {
  value: string;
  label: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface SpeedLimit {
  vehicleType: string;
  speed: number;
}

export interface ScheduledTime {
  timeRanges: TimeRange[];
  days: string[];
  timezone?: string;
}

export interface Coordinates {
  x: number;
  y: number;
}

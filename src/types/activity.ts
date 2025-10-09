export interface ActivityParameters {
  frame_accuracy?: number;
  last_frame_check?: number;
  alert_interval?: number;
  subcategory_mapping?: string[] | Record<string, string>;
  acts?: string[];
  iou?: number;
  conf?: number;
  FALL_ANGLE_THRESHOLD?: number;
  UNCONSCIOUS_TIME_THRESHOLD?: number;
  FALL_CONFIRMATION_FRAMES?: number;
  SEATED_RATIO_THRESHOLD?: number;
  SITTING_TORSO_ANGLE_THRESHOLD?: number;
  person_limit?: number;
  last_time?: number;
  confidence?: number;
  motion_thr?: number;
  collision_angel_threshold?: number;
  vv_hor_interaction_percentage?: number;
  vv_ver_interaction_percentage?: number;
  hor_interaction_percentage?: number;
  ver_interaction_percentage?: number;
  vehicle_classes?: string[];
  person_classes?: string[];
  real_distance?: number;
  calibration?: number;
  frame_to_track?: number;
  speed_limit?: Record<string, number>;
  SOURCE?: number[][];
  TARGET_WIDTH?: number;
  TARGET_HEIGHT?: number;
  wrong_lane?: string;
  entry_exit?: string;
  frame_send_sec?: number;
  last_frame_time?: number;
  time_stamp?: number;
  scheduled_time?: Array<{
    time_start_end: string[][];
    days: string[];
    timezone?: string;
  }>;
  last_check_time?: number;
  time_window?: Array<{
    time_start_end: string[][];
    days: string[];
  }> | {
    start: string;
    end: string;
    days: string[];
  };
  [key: string]: any;
}

export interface ActivityZones {
  [zoneName: string]: number[][];
}

export interface ActivityLanes {
  [laneName: string]: number[][];
}

export interface ActivityPolygons {
  points: number[][];
}

export interface Activity {
  status: 'ACTIVE' | 'INACTIVE';
  parameters: ActivityParameters;
  zones?: ActivityZones | number[][];
  lanes?: ActivityLanes;
  polygons?: ActivityPolygons[];
  zone_mode?: 'rectangle' | 'polygon' | 'rectangular';
  capacity?: Record<string, number>;
}

export interface ActivitiesData {
  [activityName: string]: Activity;
}

export interface ConfigurationData {
  activities_data: ActivitiesData;
  sensor_id?: string;
}

export interface NewActivityFormData {
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  data: string; // JSON string
}

export interface ActivityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

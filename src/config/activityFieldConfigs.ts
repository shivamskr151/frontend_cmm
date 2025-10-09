import type { ActivityFieldConfig } from '../types/activityFields';

export const activityFieldConfigs: ActivityFieldConfig = {
  ppe: {
    categories: ['Detection', 'Time Settings'],
    fields: [
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 0,
        category: 'Detection',
        description: 'Number of frames to process for accuracy'
      },
      {
        id: 'subcategory_mapping',
        label: 'PPE Categories',
        type: 'tags',
        defaultValue: [],
        category: 'Detection',
        description: 'Personal Protective Equipment categories to monitor'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings',
        description: 'Active monitoring time periods'
      }
    ]
  },

  fire_and_smoke: {
    categories: ['Detection', 'Alert Settings', 'Time Settings'],
    fields: [
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 20,
        category: 'Detection'
      },
      {
        id: 'last_frame_check',
        label: 'Last Frame Check',
        type: 'number',
        min: 0,
        max: 1000,
        defaultValue: 29,
        category: 'Detection'
      },
      {
        id: 'alert_interval',
        label: 'Alert Interval (seconds)',
        type: 'number',
        min: 1,
        max: 3600,
        defaultValue: 86,
        category: 'Alert Settings'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  person_violations: {
    categories: ['Detection', 'Thresholds', 'Time Settings'],
    fields: [
      {
        id: 'subcategory_mapping',
        label: 'Violation Types',
        type: 'tags',
        defaultValue: [],
        category: 'Detection',
        description: 'Types of person violations to detect'
      },
      {
        id: 'acts',
        label: 'Actions',
        type: 'tags',
        defaultValue: [],
        category: 'Detection',
        description: 'Actions to monitor'
      },
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 5,
        category: 'Detection'
      },
      {
        id: 'iou',
        label: 'IoU Threshold',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.8,
        category: 'Thresholds'
      },
      {
        id: 'conf',
        label: 'Confidence Threshold',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.4,
        category: 'Thresholds'
      },
      {
        id: 'FALL_ANGLE_THRESHOLD',
        label: 'Fall Angle Threshold',
        type: 'slider',
        min: 0,
        max: 90,
        step: 5,
        defaultValue: 45,
        category: 'Thresholds'
      },
      {
        id: 'UNCONSCIOUS_TIME_THRESHOLD',
        label: 'Unconscious Time Threshold',
        type: 'number',
        min: 1,
        max: 300,
        defaultValue: 20,
        category: 'Thresholds'
      },
      {
        id: 'FALL_CONFIRMATION_FRAMES',
        label: 'Fall Confirmation Frames',
        type: 'number',
        min: 1,
        max: 10,
        defaultValue: 2,
        category: 'Thresholds'
      },
      {
        id: 'SEATED_RATIO_THRESHOLD',
        label: 'Seated Ratio Threshold',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.5,
        category: 'Thresholds'
      },
      {
        id: 'SITTING_TORSO_ANGLE_THRESHOLD',
        label: 'Sitting Torso Angle Threshold',
        type: 'slider',
        min: 0,
        max: 90,
        step: 5,
        defaultValue: 55,
        category: 'Thresholds'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  perimeter_monitoring: {
    categories: ['Detection', 'Time Settings'],
    fields: [
      {
        id: 'subcategory_mapping',
        label: 'Detection Categories',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      },
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 1,
        category: 'Detection'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  climbing: {
    categories: ['Detection', 'Time Settings'],
    fields: [
      {
        id: 'subcategory_mapping',
        label: 'Detection Categories',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      },
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 20,
        category: 'Detection'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  time_based_unauthorized_access: {
    categories: ['Detection', 'Scheduling', 'Time Settings'],
    fields: [
      {
        id: 'subcategory_mapping',
        label: 'Detection Categories',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      },
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 20,
        category: 'Detection'
      },
      {
        id: 'scheduled_time',
        label: 'Scheduled Times',
        type: 'scheduledTime',
        defaultValue: [],
        category: 'Scheduling'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      },
      {
        id: 'last_check_time',
        label: 'Last Check Time',
        type: 'number',
        min: 0,
        defaultValue: 0,
        category: 'Detection'
      }
    ]
  },

  traffic_overspeeding: {
    categories: ['Detection', 'Speed Limits', 'Calibration', 'Time Settings'],
    fields: [
      {
        id: 'SOURCE',
        label: 'Source Coordinates',
        type: 'coordinates',
        defaultValue: [],
        category: 'Detection',
        description: 'Source points for speed calculation'
      },
      {
        id: 'TARGET_WIDTH',
        label: 'Target Width',
        type: 'number',
        min: 1,
        max: 1000,
        defaultValue: 25,
        category: 'Calibration'
      },
      {
        id: 'TARGET_HEIGHT',
        label: 'Target Height',
        type: 'number',
        min: 1,
        max: 1000,
        defaultValue: 250,
        category: 'Calibration'
      },
      {
        id: 'speed_limit',
        label: 'Speed Limits',
        type: 'speedLimits',
        defaultValue: [],
        category: 'Speed Limits'
      },
      {
        id: 'calibration',
        label: 'Calibration Factor',
        type: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 1,
        category: 'Calibration'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  traffic_overspeeding_distancewise: {
    categories: ['Detection', 'Speed Limits', 'Calibration', 'Time Settings'],
    fields: [
      {
        id: 'real_distance',
        label: 'Real Distance (meters)',
        type: 'number',
        min: 1,
        max: 10000,
        defaultValue: 500,
        category: 'Calibration'
      },
      {
        id: 'calibration',
        label: 'Calibration Factor',
        type: 'number',
        min: 0.1,
        max: 10000,
        step: 0.1,
        defaultValue: 1999.6,
        category: 'Calibration'
      },
      {
        id: 'frame_to_track',
        label: 'Frames to Track',
        type: 'number',
        min: 1,
        max: 1000,
        defaultValue: 295,
        category: 'Detection'
      },
      {
        id: 'speed_limit',
        label: 'Speed Limits',
        type: 'speedLimits',
        defaultValue: [],
        category: 'Speed Limits'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  vehicle_interaction: {
    categories: ['Detection', 'Thresholds', 'Time Settings'],
    fields: [
      {
        id: 'vehicle_classes',
        label: 'Vehicle Classes',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      },
      {
        id: 'person_classes',
        label: 'Person Classes',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      },
      {
        id: 'motion_thr',
        label: 'Motion Threshold',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 5,
        category: 'Thresholds'
      },
      {
        id: 'collision_angel_threshold',
        label: 'Collision Angle Threshold',
        type: 'slider',
        min: 0,
        max: 90,
        step: 5,
        defaultValue: 30,
        category: 'Thresholds'
      },
      {
        id: 'vv_hor_interaction_percentage',
        label: 'Vehicle-Vehicle Horizontal Interaction %',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.5,
        category: 'Thresholds'
      },
      {
        id: 'vv_ver_interaction_percentage',
        label: 'Vehicle-Vehicle Vertical Interaction %',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.7,
        category: 'Thresholds'
      },
      {
        id: 'hor_interaction_percentage',
        label: 'Horizontal Interaction %',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.5,
        category: 'Thresholds'
      },
      {
        id: 'ver_interaction_percentage',
        label: 'Vertical Interaction %',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.7,
        category: 'Thresholds'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  workforce_efficiency: {
    categories: ['Time Settings'],
    fields: [
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  desk_occupancy: {
    categories: ['Time Settings'],
    fields: [
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  entry_exit_WLE_logs: {
    categories: ['Detection', 'Settings', 'Time Settings'],
    fields: [
      {
        id: 'wrong_lane',
        label: 'Wrong Lane Detection',
        type: 'boolean',
        defaultValue: true,
        category: 'Settings'
      },
      {
        id: 'entry_exit',
        label: 'Entry/Exit Detection',
        type: 'boolean',
        defaultValue: true,
        category: 'Settings'
      },
      {
        id: 'subcategory_mapping',
        label: 'Detection Categories',
        type: 'tags',
        defaultValue: [],
        category: 'Detection'
      },
      {
        id: 'frame_send_sec',
        label: 'Frame Send Interval (seconds)',
        type: 'number',
        min: 1,
        max: 3600,
        defaultValue: 120,
        category: 'Settings'
      },
      {
        id: 'last_frame_time',
        label: 'Last Frame Time',
        type: 'number',
        min: 0,
        defaultValue: 0,
        category: 'Settings'
      },
      {
        id: 'time_stamp',
        label: 'Time Stamp',
        type: 'number',
        min: 0,
        defaultValue: 0,
        category: 'Settings'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  resource_utilization: {
    categories: ['Time Settings'],
    fields: [
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  people_gathering: {
    categories: ['Detection', 'Thresholds', 'Time Settings'],
    fields: [
      {
        id: 'person_limit',
        label: 'Person Limit',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 2,
        category: 'Thresholds'
      },
      {
        id: 'last_time',
        label: 'Last Time (seconds)',
        type: 'number',
        min: 1,
        max: 3600,
        defaultValue: 30,
        category: 'Thresholds'
      },
      {
        id: 'frame_accuracy',
        label: 'Frame Accuracy',
        type: 'number',
        min: 0,
        max: 1000,
        defaultValue: 300,
        category: 'Detection'
      },
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  workplace_area_occupancy: {
    categories: ['Time Settings'],
    fields: [
      {
        id: 'time_window',
        label: 'Time Windows',
        type: 'timeWindow',
        defaultValue: [],
        category: 'Time Settings'
      }
    ]
  },

  person_detection: {
    categories: ['Detection'],
    fields: [
      {
        id: 'confidence',
        label: 'Confidence Threshold',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.5,
        category: 'Detection'
      }
    ]
  }
};

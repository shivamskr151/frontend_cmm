export const sampleActivitiesData = {
  "activities_data": {
    "ppe": {
      "status": "ACTIVE",
      "parameters": {
        "frame_accuracy": 0,
        "subcategory_mapping": {
          "head": "Helmet",
          "face": "Mask",
          "no-vest": "Vest",
          "hands": "Gloves",
          "foot": "Shoes"
        },
        "time_window": [
          {
            "time_start_end": [
              [
                "06:00",
                "22:00"
              ]
            ],
            "days": [
              "Wednesday",
              "Thursday"
            ]
          }
        ]
      },
      "zone_mode": "rectangle",
      "zones": [
        [
          [
            186,
            210
          ],
          [
            371,
            408
          ]
        ]
      ],
      "lanes": {
        "L1": [
          [
            200,
            204
          ],
          [
            292,
            133
          ]
        ]
      },
      "polygons": [
        {
          "points": [
            [
              13.165714285714285,
              422.1142857142857
            ],
            [
              720.4571428571429,
              365.7942857142857
            ],
            [
              1267.5657142857142,
              304.3542857142857
            ],
            [
              1272.6857142857143,
              715.4171428571428
            ],
            [
              964.0228571428571,
              651.7828571428571
            ],
            [
              741.6685714285715,
              669.3371428571429
            ],
            [
              569.7828571428571,
              707.3714285714286
            ],
            [
              104.59428571428572,
              704.4457142857143
            ]
          ]
        }
      ]
    },
    "fire_and_smoke": {
      "status": "ACTIVE",
      "parameters": {
        "frame_accuracy": 20,
        "last_frame_check": 29,
        "alert_interval": 86,
        "time_window": [
          {
            "time_start_end": [
              [
                "00:00",
                "23:59"
              ]
            ],
            "days": [
              "Monday"
            ]
          }
        ]
      },
      "zone_mode": "rectangle",
      "zones": [
        [
          0,
          0
        ],
        [
          1080,
          0
        ],
        [
          1080,
          720
        ],
        [
          0,
          720
        ]
      ]
    },
    "person_violations": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            0,
            0
          ],
          [
            848,
            0
          ],
          [
            848,
            480
          ],
          [
            0,
            480
          ]
        ]
      },
      "parameters": {
        "subcategory_mapping": [
          "unconscious",
          "fallen",
          "sitting"
        ],
        "acts": [
          "SITTING",
          "FALLEN",
          "UNCONSCIOUS",
          "HELP"
        ],
        "frame_accuracy": 5,
        "iou": 0.8,
        "conf": 0.4,
        "FALL_ANGLE_THRESHOLD": 45,
        "UNCONSCIOUS_TIME_THRESHOLD": 20,
        "FALL_CONFIRMATION_FRAMES": 2,
        "SEATED_RATIO_THRESHOLD": 0.5,
        "SITTING_TORSO_ANGLE_THRESHOLD": 55,
        "time_window": [
          {
            "time_start_end": [
              [
                "08:00",
                "20:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      }
    },
    "perimeter_monitoring": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            99,
            128
          ],
          [
            757,
            125
          ],
          [
            1134,
            321
          ],
          [
            1189,
            496
          ],
          [
            1188,
            651
          ],
          [
            102,
            658
          ]
        ]
      },
      "parameters": {
        "subcategory_mapping": [
          "person"
        ],
        "frame_accuracy": 1,
        "time_window": [
          {
            "time_start_end": [
              [
                "08:00",
                "18:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ]
          }
        ]
      }
    },
    "climbing": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            0,
            0
          ],
          [
            1080,
            0
          ],
          [
            1080,
            720
          ],
          [
            0,
            720
          ]
        ]
      },
      "parameters": {
        "subcategory_mapping": [
          "person"
        ],
        "frame_accuracy": 20,
        "time_window": [
          {
            "time_start_end": [
              [
                "09:00",
                "17:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      }
    },
    "time_based_unauthorized_access": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            0,
            0
          ],
          [
            1080,
            0
          ],
          [
            1080,
            720
          ],
          [
            0,
            720
          ]
        ]
      },
      "parameters": {
        "subcategory_mapping": [
          "person"
        ],
        "frame_accuracy": 20,
        "scheduled_time": [
          {
            "time_start_end": [
              [
                "03:00",
                "17:00"
              ],
              [
                "18:00",
                "18:30"
              ]
            ],
            "days": [
              "Monday",
              "Wednesday",
              "Friday"
            ],
            "timezone": "Asia/Kolkata"
          }
        ],
        "time_window": [
          {
            "time_start_end": [
              [
                "07:30",
                "19:15"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ],
        "last_check_time": 0
      }
    },
    "traffic_overspeeding": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            99,
            128
          ],
          [
            757,
            125
          ],
          [
            1134,
            321
          ],
          [
            1189,
            496
          ],
          [
            1188,
            651
          ],
          [
            102,
            658
          ]
        ]
      },
      "parameters": {
        "SOURCE": [
          [
            52,
            39
          ],
          [
            1223,
            45
          ],
          [
            1245,
            708
          ],
          [
            36,
            706
          ]
        ],
        "TARGET_WIDTH": 25,
        "TARGET_HEIGHT": 250,
        "speed_limit": {
          "car": 20
        },
        "calibration": 1,
        "time_window": [
          {
            "time_start_end": [
              [
                "06:00",
                "22:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ]
          }
        ]
      }
    },
    "traffic_overspeeding_distancewise": {
      "status": "ACTIVE",
      "zones": [
        [
          305.5,
          142.015625
        ],
        [
          714.5,
          142.015625
        ],
        [
          714.5,
          461.015625
        ],
        [
          305.5,
          461.015625
        ]
      ],
      "lanes": {
        "L1": [
          [
            407.5,
            286.015625
          ],
          [
            686.5,
            250.015625
          ]
        ]
      },
      "parameters": {
        "real_distance": 500,
        "calibration": 1999.6,
        "frame_to_track": 295,
        "speed_limit": {
          "truck": 60
        },
        "time_window": [
          {
            "time_start_end": [
              [
                "06:00",
                "22:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ]
          }
        ]
      }
    },
    "vehicle_interaction": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            0,
            0
          ],
          [
            640,
            0
          ],
          [
            640,
            340
          ],
          [
            0,
            340
          ]
        ]
      },
      "parameters": {
        "vehicle_classes": [
          "forklift",
          "car",
          "truck",
          "bus"
        ],
        "person_classes": [
          "person"
        ],
        "motion_thr": 5,
        "collision_angel_threshold": 30,
        "vv_hor_interaction_percentage": 0.5,
        "vv_ver_interaction_percentage": 0.7,
        "hor_interaction_percentage": 0.5,
        "ver_interaction_percentage": 0.7,
        "time_window": [
          {
            "time_start_end": [
              [
                "07:00",
                "19:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      }
    },
    "workforce_efficiency": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            99,
            128
          ],
          [
            757,
            125
          ],
          [
            1134,
            321
          ],
          [
            1189,
            496
          ],
          [
            1188,
            651
          ],
          [
            102,
            658
          ]
        ]
      },
      "parameters": {
        "time_window": [
          {
            "time_start_end": [
              [
                "08:00",
                "18:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      },
      "zone_mode": "polygon",
      "polygons": [
        {
          "points": [
            [
              2.9257142857142857,
              0.8114285714285714
            ],
            [
              1276.3428571428572,
              1.542857142857143
            ],
            [
              1279.2685714285715,
              718.3428571428572
            ],
            [
              1.4628571428571429,
              718.3428571428572
            ]
          ]
        }
      ]
    },
    "desk_occupancy": {
      "status": "ACTIVE",
      "zones": {
        "desk1": [
          [
            396,
            201
          ],
          [
            526,
            200
          ],
          [
            614,
            276
          ],
          [
            610,
            318
          ],
          [
            535,
            343
          ],
          [
            534,
            413
          ],
          [
            402,
            422
          ]
        ],
        "desk2": [
          [
            629,
            223
          ],
          [
            615,
            325
          ],
          [
            538,
            345
          ],
          [
            536,
            427
          ],
          [
            458,
            451
          ],
          [
            558,
            592
          ],
          [
            638,
            570
          ],
          [
            660,
            471
          ],
          [
            758,
            447
          ],
          [
            773,
            331
          ]
        ],
        "desk3": [
          [
            866,
            262
          ],
          [
            855,
            293
          ],
          [
            814,
            297
          ],
          [
            788,
            365
          ],
          [
            878,
            442
          ],
          [
            939,
            380
          ],
          [
            967,
            363
          ],
          [
            975,
            323
          ]
        ],
        "desk4": [
          [
            773,
            208
          ],
          [
            771,
            232
          ],
          [
            716,
            235
          ],
          [
            710,
            313
          ],
          [
            748,
            351
          ],
          [
            812,
            299
          ],
          [
            832,
            278
          ],
          [
            840,
            240
          ]
        ]
      },
      "parameters": {
        "time_window": [
          {
            "time_start_end": [
              [
                "08:00",
                "18:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      }
    },
    "entry_exit_WLE_logs": {
      "status": "ACTIVE",
      "zones": {
        "gate1": [
          [
            [
              687,
              103
            ],
            [
              562,
              231
            ],
            [
              673,
              261
            ],
            [
              776,
              122
            ]
          ],
          [
            [
              831,
              285
            ],
            [
              933,
              141
            ],
            [
              1072,
              151
            ],
            [
              981,
              319
            ]
          ]
        ]
      },
      "parameters": {
        "wrong_lane": "True",
        "entry_exit": "True",
        "subcategory_mapping": [
          "car",
          "truck",
          "person"
        ],
        "frame_send_sec": 120,
        "last_frame_time": 0,
        "time_stamp": 0,
        "time_window": [
          {
            "time_start_end": [
              [
                "06:00",
                "22:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ]
          }
        ]
      },
      "zone_mode": "rectangular",
      "lanes": {
        "L1": [
          [
            163,
            372
          ],
          [
            747,
            350
          ]
        ],
        "L2": [
          [
            447,
            304
          ],
          [
            487,
            405
          ]
        ]
      }
    },
    "resource_utilization": {
      "status": "ACTIVE",
      "zones": {
        "coffe_machine": [
          [
            52,
            39
          ],
          [
            1223,
            45
          ],
          [
            1245,
            708
          ],
          [
            36,
            706
          ]
        ],
        "Printer": [
          [
            52,
            39
          ],
          [
            1223,
            45
          ],
          [
            1245,
            708
          ],
          [
            36,
            706
          ]
        ]
      },
      "parameters": {
        "time_window": [
          {
            "time_start_end": [
              [
                "08:00",
                "18:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      }
    },
    "people_gathering": {
      "status": "ACTIVE",
      "zones": {
        "Area1": [
          [
            0,
            0
          ],
          [
            1080,
            0
          ],
          [
            1080,
            720
          ],
          [
            0,
            720
          ]
        ]
      },
      "parameters": {
        "person_limit": 2,
        "last_time": 30,
        "frame_accuracy": 300,
        "time_window": [
          {
            "time_start_end": [
              [
                "08:00",
                "18:00"
              ]
            ],
            "days": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ]
          }
        ]
      }
    },
    "workplace_area_occupancy": {
      "status": "ACTIVE",
      "zones": {
        "office_room": [
          [
            99,
            128
          ],
          [
            757,
            125
          ],
          [
            1134,
            321
          ],
          [
            1189,
            496
          ],
          [
            1188,
            651
          ],
          [
            102,
            658
          ]
        ]
      },
      "capacity": {
        "office_room": 20
      },
      "parameters": {
        "time_window": {
          "start": "08:00:00",
          "end": "18:00:00",
          "days": [
            "mon",
            "tue",
            "wed",
            "thu",
            "fri"
          ]
        }
      }
    },
    "person_detection": {
      "status": "ACTIVE",
      "zones": {
        "zone1": [
          [
            0,
            0
          ],
          [
            100,
            0
          ],
          [
            100,
            100
          ],
          [
            0,
            100
          ]
        ]
      },
      "parameters": {
        "confidence": 0.5
      }
    }
  }
};

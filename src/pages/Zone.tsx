import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { type Camera } from '../api';
import { useActivities } from '../hooks/useActivities';
import { configurationApi } from '../api';
import { AddActivityModal, JsonEditorModal } from '../components/activities';
import { useCameras } from '../contexts/CameraContext';
import { useZoneDrawing } from '../hooks/useZoneDrawing';
import type { ModalType, ToastType, SpeedLimit } from '../types/dashboard';
import {
  CameraConfiguration,
  ZoneDrawingSection,
  ZoneCoordinates,
  LaneCoordinates,
  ZoneStatistics,
  ActivityConfiguration,
  Modals
} from '../components/zone';
import { ErrorBoundary } from '../components/ErrorBoundary';



// Remove the old Activity interface as we're now using the one from types/activity

const Zone: React.FC = () => {
  const [, setCameraName] = useState('Unknown');
  const [, setCameraStatus] = useState('Disconnected');
  const [selectedActivity, setSelectedActivity] = useState('');
  // const [username, setUsername] = useState('Loading...');
  // Use shared camera context instead of local state
  const { cameras, camerasLoading, camerasError, loadCameras, refreshCameras, selectedCamera, setSelectedCamera, getSelectedCameraData } = useCameras();
  const [showZoneTypeModal, setShowZoneTypeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>('info');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [showActivityParams] = useState(false);
  const [realDistance, setRealDistance] = useState(10);
  const [calibration, setCalibration] = useState(1);
  const [frameToTrack, setFrameToTrack] = useState(10);
  const [speedLimits, setSpeedLimits] = useState<SpeedLimit[]>([]);
  const [newVehicleType, setNewVehicleType] = useState('');
  const [newSpeedValue, setNewSpeedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showJsonEditorModal, setShowJsonEditorModal] = useState(false);
  const [activityParameters, setActivityParameters] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [userSelectedZoneType, setUserSelectedZoneType] = useState(false);

  // Use the zone drawing hook
  const {
    currentZoneType,
    zoneCoordinates,
    setZoneCoordinates,
    zoneCanvasRef,
    snapshotImageRef,
    zoneDrawerRef,
    handleZoneTypeChange,
    handleDrawZone,
    handleDrawLane,
    handleUndo,
    handleRedo,
    handleClearAll,
    initializeZoneDrawer
  } = useZoneDrawing();

  const handleZoneTypeChangeRef = useRef(handleZoneTypeChange);
  
  // Update ref when function changes
  useEffect(() => {
    handleZoneTypeChangeRef.current = handleZoneTypeChange;
  }, [handleZoneTypeChange]);

  // Use the new activity system
  const {
    activities,
    addActivity,
    loadActivitiesFromConfig
  } = useActivities();

  // Handle refreshing activities after configuration changes
  const handleRefreshActivities = useCallback(async () => {
    if (selectedCamera) {
      console.log('🔄 Refreshing activities for camera:', selectedCamera);
      const result = await loadActivitiesFromConfig(selectedCamera);
      if (result.success) {
        console.log('✅ Activities refreshed successfully:', result.message);
      } else {
        console.error('❌ Failed to refresh activities:', result.message);
      }
    }
  }, [selectedCamera, loadActivitiesFromConfig]);

  // Clear selected activity if it becomes inactive
  useEffect(() => {
    if (selectedActivity && activities[selectedActivity] && activities[selectedActivity].status !== 'ACTIVE') {
      setSelectedActivity('');
    }
  }, [activities, selectedActivity]);

  // Load zone coordinates when activity is selected
  useEffect(() => {
    if (selectedActivity && activities[selectedActivity]) {
      const activity = activities[selectedActivity] as unknown as Record<string, unknown>;
      console.log('🔄 Loading zone coordinates for activity:', selectedActivity, activity);
      
      // Extract zone coordinates from the activity
      if (activity.zones || activity.polygons || activity.lanes) {
        const coordinates = {
          zones: (activity.zones as { x: number; y: number; width: number; height: number; }[]) || [],
          polygons: (activity.polygons as Array<Array<{ x: number; y: number }>>) || [],
          lanes: activity.lanes ? Object.values(activity.lanes as Record<string, unknown>).map((lane: unknown) => {
            const laneData = lane as number[][];
            return {
              x1: laneData[0][0],
              y1: laneData[0][1], 
              x2: laneData[1][0],
              y2: laneData[1][1],
              color: '#10b981'
            };
          }) : []
        };
        
        console.log('📍 Restoring zone coordinates:', coordinates);
        
        // Update zone coordinates state
        setZoneCoordinates(coordinates);
        
        // Only set zone type based on activity data if user hasn't manually selected one
        // This allows users to manually select a different zone type after activity selection
        if (!userSelectedZoneType) {
          if (activity.zone_mode === 'rectangle' || activity.zones) {
            handleZoneTypeChangeRef.current('rectangle');
          } else if (activity.zone_mode === 'polygon' || activity.polygons) {
            handleZoneTypeChangeRef.current('polygon');
          }
        }
      }
    }
  }, [selectedActivity, activities, setZoneCoordinates, userSelectedZoneType]);

  // Load activities when camera changes
  useEffect(() => {
    if (selectedCamera) {
      console.log('🔄 Loading activities for camera:', selectedCamera);
      handleRefreshActivities();
    }
  }, [selectedCamera, handleRefreshActivities]);
  
  const navigate = useNavigate();

  // API Helper Functions
  const makeApiRequest = async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
    const token = auth.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 304) {
        // Force a fresh request by adding cache-busting parameter
        console.log('🔄 Received 304, retrying with fresh request...');
        const freshUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
        const freshResponse = await fetch(freshUrl, {
          ...options,
          headers,
          credentials: 'include'
        });
        if (!freshResponse.ok) {
          const errorData = await freshResponse.json().catch(() => ({}));
          const errorMessage = errorData.detail || errorData.message || `HTTP ${freshResponse.status}: ${freshResponse.statusText}`;
          throw new Error(errorMessage);
        }
        return freshResponse.json();
      }
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  // Camera loading and refreshing is now handled by the shared CameraContext

  // Additional API functions can be added here as needed
  // Examples: getCameraById, addCamera, updateCameraConfig, etc.

  const refreshSnapshot = async (cameraId?: string): Promise<unknown> => {
    const targetCameraId = cameraId || selectedCamera;
    if (!targetCameraId) {
      throw new Error('No camera selected');
    }
    
    try {
      return await makeApiRequest(`/api/cameras/${encodeURIComponent(targetCameraId)}/refresh_snapshot`, {
        method: 'POST'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('504')) {
        throw new Error('Camera snapshot timed out. Please check camera connection and try again.');
      }
      throw error;
    }
  };


  // User API Functions
  // const getUserProfile = async (): Promise<any> => {
  //   return makeApiRequest('/api/profile');
  // };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load cameras only
      await loadCameras(); // This will handle its own loading state
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Don't show warning modal - let individual components handle their own errors
      // The camera loading already has proper error handling with retry options
    } finally {
      setIsLoading(false);
    }
  }, [loadCameras]);

  // Check authentication on component mount
  useEffect(() => {
    console.log('Zone: Checking authentication...');
    const isAuth = auth.isAuthenticated();
    console.log('Zone: isAuthenticated =', isAuth);
    if (!isAuth) {
      console.log('Zone: Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    console.log('Zone: Authenticated, proceeding with Zone');
    console.log('User is authenticated, loading data...');
    loadInitialData();
  }, [navigate, loadInitialData]);

  // Debug activities state changes
  useEffect(() => {
    console.log('Activities state updated:', activities);
    console.log('Activities keys:', Object.keys(activities));
  }, [activities]);

  // Define showMessage function first
  const showMessage = useCallback((message: string, title: string, type: 'success' | 'error' | 'warning' | 'info') => {
    if (type === 'success') {
      // Use toast for success messages
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } else {
      // Use modal for error, warning, and info messages
      setModalMessage(message);
      setModalTitle(title);
      setModalType(type);
      setShowMessageModal(true);
    }
  }, []);


  // Initialize zone drawer for dummy image when component mounts
  useEffect(() => {
    const initializeDummyImageZoneDrawer = () => {
      if (snapshotImageRef.current && zoneCanvasRef.current && !hasSnapshot) {
        console.log('Initializing zone drawer for dummy image');
        setTimeout(() => {
          initializeZoneDrawer(currentZoneType);
        }, 100);
      }
    };

    // Initialize immediately if image is already loaded
    initializeDummyImageZoneDrawer();

    // Also initialize when image loads
    const imageElement = snapshotImageRef.current;
    if (imageElement) {
      if (imageElement.complete) {
        initializeDummyImageZoneDrawer();
      } else {
        imageElement.addEventListener('load', initializeDummyImageZoneDrawer);
        return () => {
          imageElement.removeEventListener('load', initializeDummyImageZoneDrawer);
        };
      }
    }
  }, [hasSnapshot, currentZoneType, initializeZoneDrawer, snapshotImageRef, zoneCanvasRef]);

  const handleZoneTypeChangeWithModal = (zoneType: string) => {
    handleZoneTypeChange(zoneType);
    setShowZoneTypeModal(false);
  };

  // Wrapper function to track user zone type selection
  const handleUserZoneTypeChange = (zoneType: string) => {
    setUserSelectedZoneType(true);
    handleZoneTypeChange(zoneType);
  };

  const handleCameraChange = useCallback(async (cameraId: string) => {
    setSelectedCamera(cameraId);
    const camera = cameras.find((c: Camera) => c.id === cameraId);
    if (camera) {
      setCameraName(camera.appName || camera.name);
      setCameraStatus(camera.status === 'online' ? 'Active' : 'Inactive');
    } else {
      setCameraName('Unknown');
      setCameraStatus('Disconnected');
    }
    setUserSelectedZoneType(false); // Reset user zone type selection when camera changes
  }, [cameras, setSelectedCamera]);

  // Debug cameras state changes and update camera info when selected camera changes
  useEffect(() => {
    console.log('Cameras state updated:', cameras);
    console.log('Selected camera:', selectedCamera);
    
    // Update camera info when selected camera changes
    if (selectedCamera && cameras.length > 0) {
      const camera = cameras.find((c: Camera) => c.id === selectedCamera);
      if (camera) {
        setCameraName(camera.appName || camera.name);
        setCameraStatus(camera.status === 'online' ? 'Active' : 'Inactive');
      } else {
        setCameraName('Unknown');
        setCameraStatus('Disconnected');
      }
    }
  }, [cameras, selectedCamera]);

  // Auto-load camera data when camera is restored from storage
  useEffect(() => {
    if (selectedCamera && cameras.length > 0 && !camerasLoading) {
      const cameraData = getSelectedCameraData();
      if (cameraData) {
        console.log('🔄 Auto-loading data for restored camera:', cameraData);
        // Here you can add any camera-specific data loading logic
        // For example, loading camera settings, zones, activities, etc.
        
        // Example: Load camera snapshot if needed
        // loadCameraSnapshot(cameraData.id);
        
        // Example: Load camera-specific activities
        // loadCameraActivities(cameraData.id);
        
        console.log('✅ Camera data auto-loaded successfully');
      }
    }
  }, [selectedCamera, cameras, camerasLoading, getSelectedCameraData]);

  const handleTakeSnapshot = async () => {
    if (!selectedCamera) {
      showMessage('Please select a camera first.', 'Warning', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      const snapshotData = await refreshSnapshot();
      
      if (snapshotData && (snapshotData as { snapshot_url?: string }).snapshot_url) {
        setSnapshotUrl((snapshotData as { snapshot_url: string }).snapshot_url);
        setHasSnapshot(true);
        showMessage('Snapshot taken successfully!', 'Success', 'success');
        
        // Initialize zone drawer after snapshot is loaded
        setTimeout(() => {
          if (snapshotImageRef.current && zoneCanvasRef.current) {
            initializeZoneDrawer(currentZoneType);
          }
        }, 100);
      } else {
        throw new Error('No snapshot data received');
      }
    } catch (error) {
      console.error('Error taking snapshot:', error);
      showMessage('Failed to take snapshot. Please check camera connection.', 'Error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Zone Drawing Control Functions with enhanced error handling
  const handleDrawZoneWithMessage = () => {
    try {
            handleDrawZone();
    } catch {
            showMessage('Failed to initialize zone drawing. Please refresh the page.', 'Error', 'error');
    }
  };

  const handleDrawLaneWithMessage = () => {
    const result = handleDrawLane();
    if (result && !result.success && result.message) {
      showMessage(result.message, 'Warning', 'warning');
    }
  };

  const handleClearAllWithMessage = () => {
    handleClearAll();
      showMessage('All zones and lanes cleared.', 'Success', 'success');
  };


  const handleSaveActivityParameters = async () => {
    if (!selectedActivity || Object.keys(activityParameters).length === 0) {
      setModalMessage('No parameters to save');
      setModalTitle('Warning');
      setModalType('warning');
      setShowMessageModal(true);
      return;
    }

    setIsSaving(true);
    try {
      if (!selectedCamera) {
        throw new Error('Please select a camera before saving.');
      }

      console.log('🔍 Searching for configuration for camera:', selectedCamera);
      console.log('📋 Activity parameters to save:', activityParameters);
      console.log('📍 Zone coordinates to save:', zoneCoordinates);
      console.log('🎯 Current zone type:', currentZoneType);

      // Build payload without hardcoding anything
      const payload = {
        sensorId: selectedCamera, // Use cameraId as sensorId for now
        cameraId: selectedCamera,
        activityData: {
          [selectedActivity]: {
            status: "ACTIVE", // Add required status field
            parameters: activityParameters,
            // Include zone coordinates based on current zone type
            ...(currentZoneType === 'rectangle' || currentZoneType === 'rectangle-with-lanes' ? {
              zone_mode: "rectangle",
              zones: zoneCoordinates.zones
            } : {}),
            ...(currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes' ? {
              zone_mode: "polygon", 
              polygons: zoneCoordinates.polygons
            } : {}),
            // Include lanes if they exist
            ...(zoneCoordinates.lanes.length > 0 ? {
              lanes: zoneCoordinates.lanes.reduce((acc, lane, index) => {
                acc[`L${index + 1}`] = [[lane.x1, lane.y1], [lane.x2, lane.y2]];
                return acc;
              }, {} as Record<string, number[][]>)
            } : {})
          }
        }
      } as { sensorId: string; cameraId: string; activityData: Record<string, unknown> };

      console.log('📤 Sending payload to API:', payload);

      // Try to find existing configuration first
      const existing = await configurationApi.findExistingConfiguration(selectedCamera);
      console.log('🔍 Configuration search result:', existing);
      
      let result;
      
      if (existing.found && existing.id) {
        // Update existing configuration using updateActivityData method
        console.log('🔄 Updating existing configuration with ID:', existing.id);
        result = await configurationApi.updateActivityData(existing.id, {
          activityName: selectedActivity,
          activityData: {
            ...activities[selectedActivity],
            parameters: activityParameters
          }
        });
      } else {
        // Try to create new configuration first
        console.log('➕ Creating new configuration');
        result = await configurationApi.createConfiguration(payload);
        
        // If creation fails due to conflict (409), try to get existing ID and update
        if (!result.success && 'conflict' in result && result.conflict) {
          console.log('🔍 Configuration already exists, attempting to get existing configuration ID...');
          console.log('🔍 Conflict response data:', result.data);
          
          // Clear cache to ensure fresh data
          configurationApi.clearCache(selectedCamera);
          
          // Try to get the existing configuration ID from the response first
          const conflictData = result.data as { id?: string; _id?: string; existingConfigurationId?: string };
          const existingConfigId = conflictData?.id || conflictData?._id || conflictData?.existingConfigurationId;
          
          if (existingConfigId) {
            console.log('🔄 Found existing configuration ID from conflict response:', existingConfigId);
            result = await configurationApi.updateActivityData(existingConfigId, {
              activityName: selectedActivity,
              activityData: {
                ...activities[selectedActivity],
                parameters: activityParameters
              }
            });
          } else {
            // No configuration ID found in response, try to search for it
            console.log('🔍 No configuration ID in response, searching for existing configuration...');
            const retryExisting = await configurationApi.findExistingConfiguration(selectedCamera);
            if (retryExisting.found && retryExisting.id) {
              console.log('🔄 Found existing configuration ID via search:', retryExisting.id);
              result = await configurationApi.updateActivityData(retryExisting.id, {
                activityName: selectedActivity,
                activityData: {
                  ...activities[selectedActivity],
                  parameters: activityParameters
                }
              });
            } else {
              throw new Error('Configuration exists but could not be found for update. Please try refreshing the page and try again.');
            }
          }
        }
      }
      
      console.log('📡 API response:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Clear cache to ensure fresh data is loaded
      configurationApi.clearCache(selectedCamera);
      
      // Refresh activities so UI reflects latest values
      await handleRefreshActivities();

      setModalMessage(`Parameters saved successfully for ${selectedActivity}`);
      setModalTitle('Success');
      setModalType('success');
      setShowMessageModal(true);
    } catch (error) {
      console.error('❌ Error saving parameters:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save parameters';
      setModalMessage(errorMessage);
      setModalTitle('Error');
      setModalType('error');
      setShowMessageModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSpeedLimit = () => {
    if (!newVehicleType || !newSpeedValue) {
      showMessage('Please enter both vehicle type and speed limit value.', 'Warning', 'warning');
      return;
    }
    
    setSpeedLimits([...speedLimits, { 
      vehicleType: newVehicleType, 
      speed: parseInt(newSpeedValue, 10) 
    }]);
    setNewVehicleType('');
    setNewSpeedValue('');
  };

  const handleSaveActivityParams = () => {
    showMessage('Activity parameters saved successfully!', 'Success', 'success');
  };


  // Handle adding new activity using the new system
  const handleAddActivity = async (formData: unknown) => {
    const result = await addActivity(formData as Parameters<typeof addActivity>[0]);
    showMessage(result.message, result.success ? 'Success' : 'Error', result.success ? 'success' : 'error');
    return result;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-8 overflow-x-hidden">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Custom breakpoint for extra small screens */
          @media (min-width: 475px) {
            .xs\\:inline {
              display: inline;
            }
            .xs\\:hidden {
              display: none;
            }
          }
          
          @media (max-width: 474px) {
            .xs\\:inline {
              display: none;
            }
            .xs\\:hidden {
              display: inline;
            }
          }
          
          /* Mobile-specific improvements */
          @media (max-width: 768px) {
            /* Improve touch targets */
            button {
              min-height: 44px;
            }
            
            /* Prevent zoom on input focus */
            input, select, textarea {
              font-size: 16px;
            }
            
            /* Improve scrolling */
            .overflow-x-auto {
              -webkit-overflow-scrolling: touch;
            }
            
            /* Ensure proper spacing on mobile */
            .space-y-4 > * + * {
              margin-top: 1rem;
            }
            
            .space-y-6 > * + * {
              margin-top: 1.5rem;
            }
            
            /* Fix any potential overflow issues */
            .grid {
              grid-template-columns: 1fr;
            }
            
            /* Ensure buttons don't overflow */
            .flex-wrap {
              flex-wrap: wrap;
            }
          }
        `}
      </style>
      
      {/* Navbar */}
    
  

      {/* Main Content */}
      <div className="pt-16 p-3 sm:p-4 md:p-6">
        {/* Enhanced Camera Configuration */}
        <CameraConfiguration
          cameras={cameras}
          camerasLoading={camerasLoading}
          camerasError={!!camerasError}
          selectedCamera={selectedCamera || ''}
          selectedActivity={selectedActivity}
          currentZoneType={currentZoneType}
          activities={activities}
          onCameraChange={handleCameraChange}
          onActivityChange={setSelectedActivity}
          onZoneTypeChange={handleUserZoneTypeChange}
          onRefreshCameras={refreshCameras}
                onOpenJsonEditor={() => setShowJsonEditorModal(true)}
                onOpenAddActivity={() => setShowAddActivityModal(true)}
        />


        {/* Enhanced Snapshot & Zone Drawing Section */}
        <ZoneDrawingSection
          currentZoneType={currentZoneType}
          selectedCamera={selectedCamera || ''}
          isLoading={isLoading}
          hasSnapshot={hasSnapshot}
          snapshotUrl={snapshotUrl}
          onTakeSnapshot={handleTakeSnapshot}
          onDrawZone={handleDrawZoneWithMessage}
          onDrawLane={handleDrawLaneWithMessage}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearAll={handleClearAllWithMessage}
          snapshotImageRef={snapshotImageRef as React.RefObject<HTMLImageElement>}
          zoneCanvasRef={zoneCanvasRef as React.RefObject<HTMLCanvasElement>}
        />


        {/* Enhanced Coordinates & Analytics */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
            {/* Header Section */}
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Zone Coordinates & Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">View and export your drawn zones and lanes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Zone Coordinates Card */}
              <ErrorBoundary>
                <ZoneCoordinates
                  currentZoneType={currentZoneType}
                  zoneCoordinates={zoneCoordinates}
                />
              </ErrorBoundary>
              
              {/* Lane Coordinates Card - Only show when zone type includes lanes */}
              <ErrorBoundary>
                <LaneCoordinates
                  currentZoneType={currentZoneType}
                  zoneCoordinates={zoneCoordinates}
                  zoneDrawerRef={zoneDrawerRef}
                />
              </ErrorBoundary>

              {/* Zone Statistics Card */}
              <ErrorBoundary>
                <ZoneStatistics
                  currentZoneType={currentZoneType}
                  zoneCoordinates={zoneCoordinates}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* Enhanced Dynamic Activity Parameters */}
        <ActivityConfiguration
                  selectedActivity={selectedActivity}
          activities={activities}
          activityParameters={activityParameters}
          isSaving={isSaving}
          onActivityParametersChange={setActivityParameters}
          onSaveActivityParameters={handleSaveActivityParameters}
        />

        {/* Activity Parameters Section */}
        {showActivityParams && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-3 sm:p-4 md:p-6 shadow-lg shadow-blue-200/30">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Traffic Overspeeding Distancewise Parameters</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Real Distance (meters)
                </label>
                <input 
                  type="number" 
                  value={realDistance}
                  onChange={(e) => setRealDistance(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="0" 
                  step="0.1"
                  title="Enter real distance in meters"
                  aria-label="Real distance in meters"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calibration
                </label>
                <input 
                  type="number" 
                  value={calibration}
                  onChange={(e) => setCalibration(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="0" 
                  step="0.1"
                  title="Enter calibration value"
                  aria-label="Calibration value"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frame to Track
                </label>
                <input 
                  type="number" 
                  value={frameToTrack}
                  onChange={(e) => setFrameToTrack(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="1" 
                  step="1"
                  title="Enter number of frames to track"
                  aria-label="Number of frames to track"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speed Limits
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-3">
                  {speedLimits.map((limit, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <span className="text-gray-700">{limit.vehicleType}: {limit.speed} km/h</span>
                      <button 
                        onClick={() => setSpeedLimits(speedLimits.filter((_, i) => i !== index))}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors border border-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {speedLimits.length === 0 && (
                    <div className="text-gray-500 italic text-sm">No speed limits added</div>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Vehicle Type
                    </label>
                    <input 
                      type="text" 
                      value={newVehicleType}
                      onChange={(e) => setNewVehicleType(e.target.value)}
                      placeholder="e.g. car, truck"
                      title="Enter vehicle type"
                      aria-label="Enter vehicle type"
                      className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Speed Limit
                    </label>
                    <input 
                      type="number" 
                      value={newSpeedValue}
                      onChange={(e) => setNewSpeedValue(e.target.value)}
                      placeholder="km/h"
                      title="Enter speed limit in km/h"
                      aria-label="Enter speed limit in km/h"
                      className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      min="1"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleAddSpeedLimit}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-lg hover:shadow-blue-200/50 font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <button 
                  onClick={handleSaveActivityParams}
                  className="px-6 py-3 bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 font-medium"
                >
                  Save All Activities
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modals
        showZoneTypeModal={showZoneTypeModal}
        onCloseZoneTypeModal={() => setShowZoneTypeModal(false)}
        onZoneTypeChange={handleZoneTypeChangeWithModal}
        showMessageModal={showMessageModal}
        modalMessage={modalMessage}
        modalTitle={modalTitle}
        modalType={modalType}
        onCloseMessageModal={() => setShowMessageModal(false)}
        showToast={showToast}
        toastMessage={toastMessage}
        toastType={toastType}
        onCloseToast={() => setShowToast(false)}
      />
      </div>

      {/* Activity Modals */}
      <AddActivityModal
        isOpen={showAddActivityModal}
        onClose={() => setShowAddActivityModal(false)}
        onAddActivity={handleAddActivity}
      />

      <JsonEditorModal
        isOpen={showJsonEditorModal}
        onClose={() => setShowJsonEditorModal(false)}
        cameraId={selectedCamera || undefined}
        sensorId={selectedCamera || undefined}
        onActivitiesRefreshed={handleRefreshActivities}
      />
    </>
  );
};

export default Zone;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { type Camera } from '../api';
import { RectangleZoneDrawer } from '../utils/rectangle-Zone';
import { ZoneDrawer as RectangleZoneWithLanesDrawer } from '../utils/rectangle-lanes';
import { PolygonZoneDrawer } from '../utils/polygon-Zone';
import { PolygonZoneDrawerWithLanes } from '../utils/polygon-lanes';
import { useActivities } from '../hooks/useActivities';
import { AddConfigDropdown, AddActivityModal, JsonEditorModal } from '../components/activities';
import { DynamicActivityForm } from '../components/activities/DynamicActivityForm';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useCameras } from '../contexts/CameraContext';



// Remove the old Activity interface as we're now using the one from types/activity

interface ZoneCoordinates {
  zones: Array<{ x: number; y: number; width: number; height: number }>;
  lanes: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>;
  polygons: Array<Array<{ x: number; y: number }>>;
}

const Dashboard: React.FC = () => {
  const [, setCameraName] = useState('Unknown');
  const [, setCameraStatus] = useState('Disconnected');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [currentZoneType, setCurrentZoneType] = useState('rectangle');
  // const [username, setUsername] = useState('Loading...');
  // Use shared camera context instead of local state
  const { cameras, camerasLoading, camerasError, loadCameras, refreshCameras, selectedCamera, setSelectedCamera, getSelectedCameraData } = useCameras();
  const [showZoneTypeModal, setShowZoneTypeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [zoneCoordinates, setZoneCoordinates] = useState<ZoneCoordinates>({ zones: [], lanes: [], polygons: [] });
  const [showActivityParams] = useState(false);
  const [realDistance, setRealDistance] = useState(10);
  const [calibration, setCalibration] = useState(1);
  const [frameToTrack, setFrameToTrack] = useState(10);
  const [speedLimits, setSpeedLimits] = useState<Array<{ vehicleType: string; speed: number }>>([]);
  const [newVehicleType, setNewVehicleType] = useState('');
  const [newSpeedValue, setNewSpeedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showJsonEditorModal, setShowJsonEditorModal] = useState(false);
  const [activityParameters, setActivityParameters] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Use the new activity system
  const {
    activities,
    addActivity,
    addActivitiesFromJson
  } = useActivities();
  
  const navigate = useNavigate();
  const zoneCanvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotImageRef = useRef<HTMLImageElement>(null);
  const zoneDrawerRef = useRef<RectangleZoneDrawer | RectangleZoneWithLanesDrawer | PolygonZoneDrawer | PolygonZoneDrawerWithLanes | null>(null);

  // API Helper Functions
  const makeApiRequest = async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
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

  const refreshSnapshot = async (cameraId?: string): Promise<any> => {
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
    console.log('Dashboard: Checking authentication...');
    const isAuth = auth.isAuthenticated();
    console.log('Dashboard: isAuthenticated =', isAuth);
    if (!isAuth) {
      console.log('Dashboard: Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    console.log('Dashboard: Authenticated, proceeding with Dashboard');
    console.log('User is authenticated, loading data...');
    loadInitialData();
  }, [navigate, loadInitialData]);

  // Debug activities state changes
  useEffect(() => {
    console.log('Activities state updated:', activities);
    console.log('Activities keys:', Object.keys(activities));
  }, [activities]);

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
  }, [hasSnapshot, currentZoneType]);

  // Cleanup zone drawer on component unmount
  useEffect(() => {
    return () => {
      if (zoneDrawerRef.current) {
        (zoneDrawerRef.current as any).destroy();
      }
    };
  }, []);

  const handleZoneTypeSelect = () => {
    setShowZoneTypeModal(true);
  };

  const handleZoneTypeChange = (zoneType: string) => {
    console.log('Changing zone type to:', zoneType);
    console.log('Current zone type before change:', currentZoneType);
    setCurrentZoneType(zoneType);
    setShowZoneTypeModal(false);
    
    // Reinitialize zone drawer when zone type is selected
    if (zoneCanvasRef.current && snapshotImageRef.current && hasSnapshot) {
      // Clean up existing drawer first
      if (zoneDrawerRef.current) {
        console.log('Destroying existing drawer');
        (zoneDrawerRef.current as any).destroy();
        zoneDrawerRef.current = null;
      }
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        console.log('Initializing new drawer for type:', zoneType);
        console.log('Current zone type in timeout:', zoneType);
        initializeZoneDrawer(zoneType);
      }, 100);
    }
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

  const initializeZoneDrawer = (zoneType?: string) => {
    const typeToUse = zoneType || currentZoneType;
    console.log('initializeZoneDrawer called with zoneType:', zoneType, 'currentZoneType:', currentZoneType, 'typeToUse:', typeToUse);
    if (zoneCanvasRef.current && snapshotImageRef.current) {
      try {
        console.log('Initializing zone drawer for type:', typeToUse);
        
        // Clean up existing drawer
        if (zoneDrawerRef.current) {
          (zoneDrawerRef.current as any).destroy();
        }
        
        // Create appropriate drawer based on zone type
        if (typeToUse === 'rectangle') {
          console.log('Creating RectangleZoneDrawer');
          zoneDrawerRef.current = new RectangleZoneDrawer(zoneCanvasRef.current, snapshotImageRef.current);
          
          // Set up callbacks for rectangle drawer
          zoneDrawerRef.current.onRectangleCreated = (rectangle: any) => {
            console.log('Rectangle zone created:', rectangle);
            // Update zone coordinates state
            setZoneCoordinates(prev => ({
              ...prev,
              zones: [...prev.zones, {
                x: rectangle.x1,
                y: rectangle.y1,
                width: rectangle.x2 - rectangle.x1,
                height: rectangle.y2 - rectangle.y1
              }]
            }));
          };
          
        } else if (typeToUse === 'rectangle-with-lanes') {
          console.log('Creating RectangleZoneWithLanesDrawer');
          zoneDrawerRef.current = new RectangleZoneWithLanesDrawer(zoneCanvasRef.current, snapshotImageRef.current);
          console.log('RectangleZoneWithLanesDrawer created:', zoneDrawerRef.current.constructor.name);
          
          // Set up callbacks for rectangle with lanes drawer
          zoneDrawerRef.current.onZoneCreated = (zone: any) => {
            console.log('Rectangle zone with lanes created:', zone);
            // Update zone coordinates state
            setZoneCoordinates(prev => ({
              ...prev,
              zones: [...prev.zones, {
                x: zone.rectangle.x1,
                y: zone.rectangle.y1,
                width: zone.rectangle.x2 - zone.rectangle.x1,
                height: zone.rectangle.y2 - zone.rectangle.y1
              }]
            }));
          };
          
          zoneDrawerRef.current.onLaneCreated = (lane: any, zoneIndex: number) => {
            console.log('Lane created:', lane, 'in zone:', zoneIndex);
            // Update lane coordinates state
            setZoneCoordinates(prev => ({
              ...prev,
              lanes: [...prev.lanes, {
                x1: lane.start.x,
                y1: lane.start.y,
                x2: lane.end.x,
                y2: lane.end.y,
                color: lane.color
              }]
            }));
          };
          
        } else if (typeToUse === 'polygon') {
          console.log('Creating PolygonZoneDrawer');
          zoneDrawerRef.current = new PolygonZoneDrawer(zoneCanvasRef.current, snapshotImageRef.current);
          
          // Set up callbacks for polygon drawer
          zoneDrawerRef.current.onPolygonCreated = (polygon: any) => {
            console.log('Polygon zone created:', polygon);
            // Update polygon coordinates state
            setZoneCoordinates(prev => ({
              ...prev,
              polygons: [...prev.polygons, polygon]
            }));
          };
          
        } else if (typeToUse === 'polygon-with-lanes') {
          console.log('Creating PolygonZoneDrawerWithLanes');
          zoneDrawerRef.current = new PolygonZoneDrawerWithLanes(zoneCanvasRef.current, snapshotImageRef.current);
          
          // Set up callbacks for polygon with lanes drawer
          zoneDrawerRef.current.onPolygonCreated = (polygon: any) => {
            console.log('Polygon zone with lanes created:', polygon);
            // Update polygon coordinates state
            setZoneCoordinates(prev => ({
              ...prev,
              polygons: [...prev.polygons, polygon]
            }));
          };
          
          zoneDrawerRef.current.onLaneCreated = (lane: any) => {
            console.log('Lane created in polygon zone:', lane);
            // Update lane coordinates state
            setZoneCoordinates(prev => ({
              ...prev,
              lanes: [...prev.lanes, {
                x1: lane.x1,
                y1: lane.y1,
                x2: lane.x2,
                y2: lane.y2,
                color: '#00cc00' // Default green color for lanes
              }]
            }));
          };
          
        } else {
          console.log('Zone type not yet implemented:', typeToUse);
          showMessage(`Zone type "${typeToUse}" is not yet implemented.`, 'Warning', 'warning');
        }
        
        console.log('Zone drawer initialized successfully for type:', typeToUse);
      } catch (error) {
        console.error('Error initializing zone drawer:', error);
        showMessage('Failed to initialize zone drawing functionality', 'Error', 'error');
      }
    }
  };

  const handleTakeSnapshot = async () => {
    if (!selectedCamera) {
      showMessage('Please select a camera first.', 'Warning', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      const snapshotData = await refreshSnapshot();
      
      if (snapshotData && snapshotData.snapshot_url) {
        setSnapshotUrl(snapshotData.snapshot_url);
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

  // Zone Drawing Control Functions
  const handleDrawZone = () => {
    console.log('Draw Zone clicked, current zone type:', currentZoneType);
    console.log('Zone drawer ref:', zoneDrawerRef.current);
    console.log('Zone drawer type:', zoneDrawerRef.current?.constructor.name);
    
    if (zoneDrawerRef.current) {
      if (currentZoneType === 'rectangle') {
        console.log('Using RectangleZoneDrawer - starting zone drawing');
        showMessage('Rectangle zone drawing mode activated. Click and drag to draw a zone.', 'Info', 'info');
      } else if (currentZoneType === 'rectangle-with-lanes') {
        console.log('Using RectangleZoneWithLanesDrawer - setting draw mode to zone');
        (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).setDrawMode('zone');
        showMessage('Rectangle zone drawing mode activated. Click and drag to draw a zone.', 'Info', 'info');
      } else if (currentZoneType === 'polygon') {
        console.log('Using PolygonZoneDrawer - starting polygon drawing');
        (zoneDrawerRef.current as PolygonZoneDrawer).startDrawing();
        showMessage('Polygon zone drawing mode activated. Click to add points, double-click to complete polygon.', 'Info', 'info');
      } else if (currentZoneType === 'polygon-with-lanes') {
        console.log('Using PolygonZoneDrawerWithLanes - setting draw mode to polygon');
        (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).setDrawMode('polygon');
        showMessage('Polygon zone drawing mode activated. Click to add points, double-click to complete polygon.', 'Info', 'info');
      } else {
        showMessage(`Zone type "${currentZoneType}" is not yet implemented.`, 'Warning', 'warning');
      }
    } else {
      // Try to initialize the zone drawer if it's not already initialized
      if (snapshotImageRef.current && zoneCanvasRef.current) {
        console.log('Zone drawer not initialized, attempting to initialize...');
        initializeZoneDrawer(currentZoneType);
        // Try again after a short delay
        setTimeout(() => {
          if (zoneDrawerRef.current) {
            handleDrawZone();
          } else {
            showMessage('Failed to initialize zone drawing. Please refresh the page.', 'Error', 'error');
          }
        }, 200);
      } else {
        showMessage('Please wait for the image to load before drawing zones.', 'Warning', 'warning');
      }
    }
  };

  const handleDrawLane = () => {
    if (zoneDrawerRef.current) {
      if (currentZoneType === 'rectangle-with-lanes') {
        console.log('Dashboard: Draw Lane clicked');
        console.log('Dashboard: Zone drawer type:', zoneDrawerRef.current.constructor.name);
        
        // Check if the drawer has the hasZones method (RectangleZoneWithLanesDrawer)
        if (typeof (zoneDrawerRef.current as any).hasZones === 'function') {
          const hasZones = (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).hasZones();
          console.log('Dashboard: Has zones:', hasZones);
          if (!hasZones) {
            showMessage('Please create a zone first before drawing lanes. Use "Draw Zone" to create a rectangle zone.', 'Warning', 'warning');
            return;
          }
          
          console.log('Dashboard: Setting draw mode to lane');
          (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).setDrawMode('lane');
          const activeZoneIndex = (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).getActiveZoneIndex();
          console.log('Dashboard: Active zone index:', activeZoneIndex);
          if (activeZoneIndex !== -1) {
            showMessage('Lane drawing mode activated. Click and drag to draw a lane within the selected zone.', 'Info', 'info');
          } else {
            showMessage('Lane drawing mode activated. Click and drag within any zone to draw a lane.', 'Info', 'info');
          }
        } else {
          console.error('Dashboard: Zone drawer does not support lanes. Current type:', zoneDrawerRef.current.constructor.name);
          console.log('Dashboard: Reinitializing with correct drawer type...');
          // Force reinitialize with the correct drawer type
          initializeZoneDrawer('rectangle-with-lanes');
          // Try again after a short delay
          setTimeout(() => {
            if (zoneDrawerRef.current && typeof (zoneDrawerRef.current as any).hasZones === 'function') {
              handleDrawLane();
            } else {
              showMessage('Failed to initialize lane drawing. Please refresh the page.', 'Error', 'error');
            }
          }, 100);
        }
      } else if (currentZoneType === 'polygon-with-lanes') {
        console.log('Dashboard: Draw Lane clicked for polygon with lanes');
        console.log('Dashboard: Zone drawer type:', zoneDrawerRef.current.constructor.name);
        
        // Check if the drawer has the hasZones method (PolygonZoneDrawerWithLanes)
        if (typeof (zoneDrawerRef.current as any).hasZones === 'function') {
          const hasZones = (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).hasZones();
          console.log('Dashboard: Has zones:', hasZones);
          if (!hasZones) {
            showMessage('Please create a polygon zone first before drawing lanes. Use "Draw Zone" to create a polygon zone.', 'Warning', 'warning');
            return;
          }
          
          console.log('Dashboard: Setting draw mode to lane');
          (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).setDrawMode('lane');
          showMessage('Lane drawing mode activated. Click and drag to draw a lane within the polygon zone.', 'Info', 'info');
        } else {
          console.error('Dashboard: Zone drawer does not support lanes. Current type:', zoneDrawerRef.current.constructor.name);
          console.log('Dashboard: Reinitializing with correct drawer type...');
          // Force reinitialize with the correct drawer type
          initializeZoneDrawer('polygon-with-lanes');
          // Try again after a short delay
          setTimeout(() => {
            if (zoneDrawerRef.current && typeof (zoneDrawerRef.current as any).hasZones === 'function') {
              handleDrawLane();
            } else {
              showMessage('Failed to initialize lane drawing. Please refresh the page.', 'Error', 'error');
            }
          }, 100);
        }
      } else {
        showMessage('Lane drawing is only available for zone types with lanes. Rectangle Zone and Polygon Zone do not support lanes.', 'Warning', 'warning');
      }
    } else {
      // Try to initialize the zone drawer if it's not already initialized
      if (snapshotImageRef.current && zoneCanvasRef.current) {
        console.log('Zone drawer not initialized, attempting to initialize...');
        initializeZoneDrawer(currentZoneType);
        // Try again after a short delay
        setTimeout(() => {
          if (zoneDrawerRef.current) {
            handleDrawLane();
          } else {
            showMessage('Failed to initialize zone drawing. Please refresh the page.', 'Error', 'error');
          }
        }, 200);
      } else {
        showMessage('Please wait for the image to load before drawing lanes.', 'Warning', 'warning');
      }
    }
  };

  const handleUndo = () => {
    if (zoneDrawerRef.current) {
      zoneDrawerRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (zoneDrawerRef.current) {
      zoneDrawerRef.current.redo();
    }
  };

  const handleClearAll = () => {
    if (zoneDrawerRef.current) {
      // Call the appropriate clear method based on the drawer type
      if (currentZoneType === 'rectangle') {
        (zoneDrawerRef.current as RectangleZoneDrawer).clearAllRectangles();
      } else if (currentZoneType === 'rectangle-with-lanes') {
        (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).resetZones();
      } else if (currentZoneType === 'polygon') {
        (zoneDrawerRef.current as PolygonZoneDrawer).clearAllPolygons();
      } else if (currentZoneType === 'polygon-with-lanes') {
        (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).resetZones();
      } else {
        showMessage(`Clear functionality not yet implemented for zone type "${currentZoneType}".`, 'Warning', 'warning');
      }
      setZoneCoordinates({ zones: [], lanes: [], polygons: [] });
      showMessage('All zones and lanes cleared.', 'Success', 'success');
    }
  };

  const showMessage = (message: string, title: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModalMessage(message);
    setModalTitle(title);
    setModalType(type);
    setShowMessageModal(true);
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
      // Here you would typically save to your backend
      // For now, we'll just show a success message
      console.log('Saving parameters for activity:', selectedActivity, activityParameters);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setModalMessage(`Parameters saved successfully for ${selectedActivity}`);
      setModalTitle('Success');
      setModalType('success');
      setShowMessageModal(true);
    } catch (error) {
      setModalMessage('Failed to save parameters');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Copied to clipboard!', 'Success', 'success');
  };

  // Handle adding new activity using the new system
  const handleAddActivity = async (formData: any) => {
    const result = await addActivity(formData);
    showMessage(result.message, result.success ? 'Success' : 'Error', result.success ? 'success' : 'error');
    return result;
  };

  // Handle adding activities from JSON editor using the new system
  const handleAddFromJsonEditor = async (jsonData: string) => {
    const result = await addActivitiesFromJson(jsonData);
    showMessage(result.message, result.success ? 'Success' : 'Error', result.success ? 'success' : 'error');
    return result;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-8">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {isLoading && (
      <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <span style={{ color: '#374151', fontWeight: '500' }}>Loading...</span>
            </div>
              </div>
            )}
      {/* Navbar */}
    
  

      {/* Main Content */}
      <div className="pt-16 p-6">
        {/* Camera Configuration - Full Width */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-6 shadow-lg shadow-blue-200/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-800">Camera Configuration</h3>
              </div>
              <AddConfigDropdown
                onOpenJsonEditor={() => setShowJsonEditorModal(true)}
                onOpenAddActivity={() => setShowAddActivityModal(true)}
                disabled={!selectedCamera}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Camera Selection */}
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Camera
                  </label>
                </div>
                
                {camerasLoading && (
                  <div className="w-full px-3 py-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading cameras...
                  </div>
                )}
                
                {camerasError && !camerasLoading && (
                  <div className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center justify-between">
                    <span>Error loading cameras</span>
                    <button
                      onClick={refreshCameras}
                      className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
                
                {!camerasLoading && !camerasError && (
                  <select 
                    value={selectedCamera || ''}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    title="Select a camera from the list"
                    aria-label="Select a camera from the list"
                  >
                    <option value="">Select a camera</option>
                    {cameras.map(camera => (
                      <option key={camera.id} value={camera.id}>
                        {camera.appName || camera.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {!camerasLoading && !camerasError && cameras.length === 0 && (
                  <div className="w-full px-3 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 text-sm text-center">
                    No cameras available
                  </div>
                )}
              </div>
              
              {/* Activity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Monitoring Activity
                </label>
                <select 
                  value={selectedActivity}
                  onChange={(e) => {
                    console.log('Activity selection changed to:', e.target.value);
                    console.log('Available activities:', Object.keys(activities));
                    console.log('Selected activity data:', activities[e.target.value]);
                    setSelectedActivity(e.target.value);
                  }}
                  disabled={!selectedCamera}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !selectedCamera 
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                  title="Select a monitoring activity"
                  aria-label="Select a monitoring activity"
                >
                  <option value="">Select an activity</option>
                  {Object.keys(activities).map(activityName => (
                    <option key={activityName} value={activityName}>
                      {activityName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Zone Type
                </label>
                <button 
                  onClick={handleZoneTypeSelect}
                  disabled={!selectedCamera}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between ${
                    !selectedCamera 
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                      <line x1="8" y1="2" x2="8" y2="18"></line>
                      <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                    <span className="capitalize">{currentZoneType.replace('-', ' ')}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Snapshot Section - Full Width */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-6 shadow-lg shadow-blue-200/30">
            <div className="flex justify-between items-center mb-6 p-4 bg-white/80 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-800">Latest Snapshot</h3>
              </div>
              <button 
                onClick={handleTakeSnapshot}
                disabled={!selectedCamera || isLoading}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
                  isLoading || !selectedCamera 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                    : 'bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border border-green-200 hover:shadow-lg hover:shadow-green-200/50'
                }`}
              >
                {isLoading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                )}
                {isLoading ? 'Taking Snapshot...' : 'Take Snapshot'}
              </button>
            </div>
            
            {/* Snapshot Container */}
            <div className="relative w-full overflow-hidden min-h-[400px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="relative w-full h-[400px]">
                <img 
                  ref={snapshotImageRef}
                  src={hasSnapshot ? (snapshotUrl || '/api/snapshot/placeholder') : 'https://picsum.photos/800/400?random=1'} 
                  alt="Zone Snapshot" 
                  className="w-full h-auto block border border-gray-300 rounded-lg relative z-10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://picsum.photos/800/400?random=1';
                  }}
                />
                
                <canvas 
                  ref={zoneCanvasRef}
                  className="absolute top-0 left-0 w-full h-full z-20"
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Zone Drawing Tools - Full Width */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-6 shadow-lg shadow-blue-200/30">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-base font-semibold text-gray-800">Zone Drawing Tools</h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Current Zone Type Indicator */}
              <div className="lg:col-span-1">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">
                    Current Mode: <span className="font-semibold text-blue-800">
                      {currentZoneType === 'rectangle' ? 'Rectangle Zone' : 
                        currentZoneType === 'rectangle-with-lanes' ? 'Rectangle Zone with Lanes' :
                        currentZoneType === 'polygon' ? 'Polygon Zone' :
                        currentZoneType === 'polygon-with-lanes' ? 'Polygon Zone with Lanes' : 'Unknown'}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Drawing Tools */}
              <div className="lg:col-span-3">
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleDrawZone}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 font-medium flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    </svg>
                    Draw Zone
                  </button>
                  
                  <button 
                    onClick={handleDrawLane}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Draw Lane
                  </button>
                  
                  <button 
                    onClick={handleUndo}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 14L4 9l5-5"></path>
                      <path d="M4 9h16a2 2 0 0 1 2 2v4"></path>
                    </svg>
                    Undo
                  </button>
                  
                  <button 
                    onClick={handleRedo}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9l5 5-5 5"></path>
                      <path d="M20 14H4a2 2 0 0 1-2-2V8"></path>
                    </svg>
                    Redo
                  </button>
                  
                  <button 
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10 font-medium flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M15 9l-6 6"></path>
                      <path d="M9 9l6 6"></path>
                    </svg>
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Activity Parameters - Full Width */}
        {selectedActivity && (
          <div className="mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-6 shadow-lg shadow-blue-200/30">
              <ErrorBoundary>
                <DynamicActivityForm
                  selectedActivity={selectedActivity}
                  initialValues={activities[selectedActivity]?.parameters || {}}
                  onChange={setActivityParameters}
                />
              </ErrorBoundary>
              
              {/* Save Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveActivityParameters}
                  disabled={isSaving || !selectedActivity}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
                    isSaving || !selectedActivity
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border border-green-200 hover:shadow-lg hover:shadow-green-200/50'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17,21 17,13 7,13 7,21"></polyline>
                        <polyline points="7,3 7,8 15,8"></polyline>
                      </svg>
                      Save Parameters
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coordinates & Analytics - Full Width */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-6 shadow-lg shadow-blue-200/30">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h5 className="text-lg font-semibold text-gray-800">Coordinates & Analytics</h5>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zone Coordinates */}
            <div className="bg-white/90 rounded-xl p-5 mb-5 border border-blue-200/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-lg shadow-blue-500/30"></div>
                  <h6 className="text-gray-800 font-semibold">Zone Coordinates</h6>
                </div>
                <button 
                  onClick={() => {
                    const dataToCopy = (currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes') 
                      ? zoneCoordinates.polygons 
                      : zoneCoordinates.zones;
                    copyToClipboard(JSON.stringify(dataToCopy));
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-300"
                >
                  Copy
                </button>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-gray-700 font-mono text-sm leading-relaxed">
                  {(() => {
                    if (currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes') {
                      return zoneCoordinates.polygons.length > 0 ? JSON.stringify(zoneCoordinates.polygons, null, 2) : 'No polygons drawn';
                    } else {
                      return zoneCoordinates.zones.length > 0 ? JSON.stringify(zoneCoordinates.zones, null, 2) : 'No zones drawn';
                    }
                  })()}
                </div>
              </div>
            </div>
            
            {/* Lane Coordinates - Only show when zone type includes lanes */}
            {(currentZoneType === 'rectangle-with-lanes' || currentZoneType === 'polygon-with-lanes') && (
              <div className="bg-white/90 rounded-xl p-5 mb-5 border border-blue-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-lg shadow-blue-500/30"></div>
                    <h6 className="text-gray-800 font-semibold">Lane Coordinates</h6>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(zoneCoordinates.lanes))}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-700 font-mono text-sm leading-relaxed">
                    {zoneCoordinates.lanes.length > 0 ? JSON.stringify(zoneCoordinates.lanes, null, 2) : 'No lanes drawn'}
                  </div>
                </div>
              </div>
            )}
            
            </div>
          </div>
        </div>

        {/* Activity Parameters Section */}
        {showActivityParams && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-blue-200/70 p-6 shadow-lg shadow-blue-200/30">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-800">Traffic Overspeeding Distancewise Parameters</h3>
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

      {/* Zone Type Selection Modal */}
      {showZoneTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 max-w-2xl w-[90%] border border-gray-200/60 shadow-2xl">
            <div className="flex items-center mb-5">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <h5 className="text-lg font-semibold text-gray-800">Select Zone Type</h5>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Choose the type of zone you want to draw:
            </p>
            
            <div className="grid gap-4">
              {[
                { type: 'rectangle', name: 'Rectangle Zone', description: 'Draw simple rectangle zones for basic area detection', color: 'orange' },
                { type: 'rectangle-with-lanes', name: 'Rectangle Zone with Lanes', description: 'Draw rectangular zones with lanes for traffic analysis', color: 'blue' },
                { type: 'polygon', name: 'Polygon Zone', description: 'Draw custom polygon zones for complex area analysis', color: 'green' },
                { type: 'polygon-with-lanes', name: 'Polygon Zone with Lanes', description: 'Draw polygon zones with lanes for traffic analysis', color: 'emerald' }
              ].map((option) => (
                <div 
                  key={option.type}
                  onClick={() => handleZoneTypeChange(option.type)}
                  className="border-2 border-gray-300 rounded-xl p-5 cursor-pointer transition-all duration-200 bg-gray-50 hover:border-blue-400 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-200/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-10 border-2 border-blue-400 rounded bg-blue-400/20 relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-blue-400"></div>
                    </div>
                    <div className="flex-1">
                      <h6 className="text-gray-800 font-semibold mb-1">{option.name}</h6>
                      <p className="text-gray-600 text-sm">{option.description}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-right">
              <button 
                onClick={() => setShowZoneTypeModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-[90%] border border-gray-200/60 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                modalType === 'success' ? 'bg-green-100' : 
                modalType === 'error' ? 'bg-red-100' : 
                modalType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={
                  modalType === 'success' ? '#10b981' : 
                  modalType === 'error' ? '#ef4444' : 
                  modalType === 'warning' ? '#f59e0b' : '#3b82f6'
                } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {modalType === 'success' ? (
                    <path d="M9 12l2 2 4-4"></path>
                  ) : modalType === 'error' ? (
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  ) : modalType === 'warning' ? (
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  ) : (
                    <circle cx="12" cy="12" r="10"></circle>
                  )}
                </svg>
              </div>
              <h5 className="text-lg font-semibold text-gray-800">{modalTitle}</h5>
            </div>
            
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            
            <div className="text-right">
              <button 
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-lg hover:shadow-blue-200/50 font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modals */}
      <AddActivityModal
        isOpen={showAddActivityModal}
        onClose={() => setShowAddActivityModal(false)}
        onAddActivity={handleAddActivity}
      />

      <JsonEditorModal
        isOpen={showJsonEditorModal}
        onClose={() => setShowJsonEditorModal(false)}
        onAddActivities={handleAddFromJsonEditor}
      />
    </>
  );
};

export default Dashboard;

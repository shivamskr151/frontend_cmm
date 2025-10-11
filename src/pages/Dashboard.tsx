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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
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

  // Clear selected activity if it becomes inactive
  useEffect(() => {
    if (selectedActivity && activities[selectedActivity] && activities[selectedActivity].status !== 'ACTIVE') {
      setSelectedActivity('');
    }
  }, [activities, selectedActivity]);
  
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

  // Define initializeZoneDrawer function
  const initializeZoneDrawer = useCallback((zoneType?: string) => {
    const typeToUse = zoneType || currentZoneType;
    console.log('initializeZoneDrawer called with zoneType:', zoneType, 'currentZoneType:', currentZoneType, 'typeToUse:', typeToUse);
    if (zoneCanvasRef.current && snapshotImageRef.current) {
      try {
        console.log('Initializing zone drawer for type:', typeToUse);
        
        // Clean up existing drawer and reset coordinates to prevent duplicates
        if (zoneDrawerRef.current) {
          (zoneDrawerRef.current as any).destroy();
          zoneDrawerRef.current = null;
        }
        
        // Reset zone coordinates to prevent duplicates from previous drawer
        setZoneCoordinates({ zones: [], lanes: [], polygons: [] });
        
        // Create appropriate drawer based on zone type
        if (typeToUse === 'rectangle') {
          console.log('Creating RectangleZoneDrawer');
          zoneDrawerRef.current = new RectangleZoneDrawer(zoneCanvasRef.current, snapshotImageRef.current);
          
          // Set up callbacks for rectangle drawer
          zoneDrawerRef.current.onRectangleCreated = (rectangle: any) => {
            console.log('Rectangle zone created:', rectangle);
            // Update zone coordinates state with duplicate prevention
            setZoneCoordinates(prev => {
              const newZone = {
                x: rectangle.x1,
                y: rectangle.y1,
                width: rectangle.x2 - rectangle.x1,
                height: rectangle.y2 - rectangle.y1
              };
              
              // Check if this zone already exists to prevent duplicates
              const zoneExists = prev.zones.some(zone => 
                Math.abs(zone.x - newZone.x) < 1 && 
                Math.abs(zone.y - newZone.y) < 1 && 
                Math.abs(zone.width - newZone.width) < 1 && 
                Math.abs(zone.height - newZone.height) < 1
              );
              
              if (zoneExists) {
                console.log('Zone already exists, skipping duplicate');
                return prev;
              }
              
              return {
                ...prev,
                zones: [...prev.zones, newZone]
              };
            });
          };
          
        } else if (typeToUse === 'rectangle-with-lanes') {
          console.log('Creating RectangleZoneWithLanesDrawer');
          zoneDrawerRef.current = new RectangleZoneWithLanesDrawer(zoneCanvasRef.current, snapshotImageRef.current);
          console.log('RectangleZoneWithLanesDrawer created:', zoneDrawerRef.current.constructor.name);
          
          // Set up callbacks for rectangle with lanes drawer
          zoneDrawerRef.current.onZoneCreated = (zone: any) => {
            console.log('Rectangle zone with lanes created:', zone);
            // Update zone coordinates state with duplicate prevention
            setZoneCoordinates(prev => {
              const newZone = {
                x: zone.rectangle.x1,
                y: zone.rectangle.y1,
                width: zone.rectangle.x2 - zone.rectangle.x1,
                height: zone.rectangle.y2 - zone.rectangle.y1
              };
              
              // Check if this zone already exists to prevent duplicates
              const zoneExists = prev.zones.some(existingZone => 
                Math.abs(existingZone.x - newZone.x) < 1 && 
                Math.abs(existingZone.y - newZone.y) < 1 && 
                Math.abs(existingZone.width - newZone.width) < 1 && 
                Math.abs(existingZone.height - newZone.height) < 1
              );
              
              if (zoneExists) {
                console.log('Zone already exists, skipping duplicate');
                return prev;
              }
              
              return {
                ...prev,
                zones: [...prev.zones, newZone]
              };
            });
          };
          
          zoneDrawerRef.current.onLaneCreated = (lane: any, zoneIndex: number) => {
            console.log('Lane created:', lane, 'in zone:', zoneIndex);
            // Update lane coordinates state with duplicate prevention
            setZoneCoordinates(prev => {
              const newLane = {
                x1: lane.start.x,
                y1: lane.start.y,
                x2: lane.end.x,
                y2: lane.end.y,
                color: lane.color
              };
              
              // Check if this lane already exists to prevent duplicates
              const laneExists = prev.lanes.some(existingLane => 
                Math.abs(existingLane.x1 - newLane.x1) < 1 && 
                Math.abs(existingLane.y1 - newLane.y1) < 1 && 
                Math.abs(existingLane.x2 - newLane.x2) < 1 && 
                Math.abs(existingLane.y2 - newLane.y2) < 1
              );
              
              if (laneExists) {
                console.log('Lane already exists, skipping duplicate');
                return prev;
              }
              
              return {
                ...prev,
                lanes: [...prev.lanes, newLane]
              };
            });
          };
          
        } else if (typeToUse === 'polygon') {
          console.log('Creating PolygonZoneDrawer');
          zoneDrawerRef.current = new PolygonZoneDrawer(zoneCanvasRef.current, snapshotImageRef.current);
          
          // Set up callbacks for polygon drawer
          zoneDrawerRef.current.onPolygonCreated = (polygon: any) => {
            console.log('Polygon zone created:', polygon);
            // Update polygon coordinates state with duplicate prevention
            setZoneCoordinates(prev => {
              // Check if this polygon already exists to prevent duplicates
              const polygonExists = prev.polygons.some(existingPolygon => {
                if (existingPolygon.length !== polygon.length) return false;
                return existingPolygon.every((point, index) => 
                  Math.abs(point.x - polygon[index].x) < 1 && 
                  Math.abs(point.y - polygon[index].y) < 1
                );
              });
              
              if (polygonExists) {
                console.log('Polygon already exists, skipping duplicate');
                return prev;
              }
              
              return {
                ...prev,
                polygons: [...prev.polygons, polygon]
              };
            });
          };
          
        } else if (typeToUse === 'polygon-with-lanes') {
          console.log('Creating PolygonZoneDrawerWithLanes');
          zoneDrawerRef.current = new PolygonZoneDrawerWithLanes(zoneCanvasRef.current, snapshotImageRef.current);
          
          // Set up callbacks for polygon with lanes drawer
          zoneDrawerRef.current.onPolygonCreated = (polygon: any) => {
            console.log('Polygon zone with lanes created:', polygon);
            // Update polygon coordinates state with duplicate prevention
            setZoneCoordinates(prev => {
              // Check if this polygon already exists to prevent duplicates
              const polygonExists = prev.polygons.some(existingPolygon => {
                if (existingPolygon.length !== polygon.length) return false;
                return existingPolygon.every((point, index) => 
                  Math.abs(point.x - polygon[index].x) < 1 && 
                  Math.abs(point.y - polygon[index].y) < 1
                );
              });
              
              if (polygonExists) {
                console.log('Polygon already exists, skipping duplicate');
                return prev;
              }
              
              return {
                ...prev,
                polygons: [...prev.polygons, polygon]
              };
            });
          };
          
          zoneDrawerRef.current.onLaneCreated = (lane: any) => {
            console.log('Lane created in polygon zone:', lane);
            // Update lane coordinates state with duplicate prevention
            setZoneCoordinates(prev => {
              const newLane = {
                x1: lane.x1,
                y1: lane.y1,
                x2: lane.x2,
                y2: lane.y2,
                color: '#00cc00' // Default green color for lanes
              };
              
              // Check if this lane already exists to prevent duplicates
              const laneExists = prev.lanes.some(existingLane => 
                Math.abs(existingLane.x1 - newLane.x1) < 1 && 
                Math.abs(existingLane.y1 - newLane.y1) < 1 && 
                Math.abs(existingLane.x2 - newLane.x2) < 1 && 
                Math.abs(existingLane.y2 - newLane.y2) < 1
              );
              
              if (laneExists) {
                console.log('Lane already exists, skipping duplicate');
                return prev;
              }
              
              return {
                ...prev,
                lanes: [...prev.lanes, newLane]
              };
            });
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
  }, [currentZoneType, showMessage]);

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
  }, [hasSnapshot, currentZoneType, initializeZoneDrawer]);

  // Cleanup zone drawer on component unmount
  useEffect(() => {
    return () => {
      if (zoneDrawerRef.current) {
        (zoneDrawerRef.current as any).destroy();
      }
    };
  }, []);

  // Removed handleZoneTypeSelect as zone type selection is now inline

  const handleZoneTypeChange = (zoneType: string) => {
    console.log('Changing zone type to:', zoneType);
    console.log('Current zone type before change:', currentZoneType);
    setCurrentZoneType(zoneType);
    setShowZoneTypeModal(false);
    
    // Reset zone coordinates when changing zone type to prevent duplicates
    setZoneCoordinates({ zones: [], lanes: [], polygons: [] });
    
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
      console.error('Error saving parameters:', error);
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
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Camera Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure your monitoring setup in 3 simple steps</p>
                </div>
              </div>
              <AddConfigDropdown
                onOpenJsonEditor={() => setShowJsonEditorModal(true)}
                onOpenAddActivity={() => setShowAddActivityModal(true)}
                disabled={!selectedCamera}
              />
            </div>

            {/* Configuration Steps */}
            <div className="space-y-6">
              {/* Steps 1 & 2: Camera Selection and Activity Selection */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Step 1: Camera Selection */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedCamera ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      }`}>
                        {selectedCamera ? '✓' : '1'}
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Camera</h4>
                        <p className="text-sm text-gray-600">Choose the camera for monitoring</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {camerasLoading && (
                        <div className="w-full px-4 py-3 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm flex items-center gap-3">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading cameras...</span>
                        </div>
                      )}
                      
                      {camerasError && !camerasLoading && (
                        <div className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center justify-between">
                          <span>Error loading cameras</span>
                          <button
                            onClick={refreshCameras}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs transition-colors font-medium"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      
                      {!camerasLoading && !camerasError && (
                        <select 
                          value={selectedCamera || ''}
                          onChange={(e) => handleCameraChange(e.target.value)}
                          className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          title="Select a camera from the list"
                          aria-label="Select a camera from the list"
                        >
                          <option value="">Choose a camera...</option>
                          {cameras.map(camera => (
                            <option key={camera.id} value={camera.id}>
                              {camera.appName || camera.name}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {!camerasLoading && !camerasError && cameras.length === 0 && (
                        <div className="w-full px-4 py-3 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 text-sm text-center">
                          No cameras available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Activity Selection */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedActivity ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      }`}>
                        {selectedActivity ? '✓' : '2'}
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Monitoring Activity</h4>
                        <p className="text-sm text-gray-600">Choose what to monitor with this camera</p>
                      </div>
                    </div>
                    
                    <div>
                      <select 
                        value={selectedActivity}
                        onChange={(e) => {
                          console.log('Activity selection changed to:', e.target.value);
                          console.log('Available activities:', Object.keys(activities));
                          console.log('Selected activity data:', activities[e.target.value]);
                          setSelectedActivity(e.target.value);
                        }}
                        disabled={!selectedCamera}
                        className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm ${
                          !selectedCamera 
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                            : 'bg-white text-gray-800 border-gray-300'
                        }`}
                        title="Select a monitoring activity"
                        aria-label="Select a monitoring activity"
                      >
                        <option value="">Select an activity</option>
                        {Object.keys(activities)
                          .filter(activityName => {
                            const activity = activities[activityName];
                            return activity && activity.status === 'ACTIVE';
                          })
                          .map(activityName => (
                            <option key={activityName} value={activityName}>
                              {activityName.replace(/_/g, ' ').toUpperCase()}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Zone Type Selection */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-100 text-blue-700 border-2 border-blue-300">
                    3
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Zone Type</h4>
                    <p className="text-sm text-gray-600">Choose how to define monitoring areas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { type: 'rectangle', name: 'Rectangle Zone', description: 'Simple rectangular areas', icon: '⬜', color: 'orange' },
                    { type: 'rectangle-with-lanes', name: 'Rectangle + Lanes', description: 'Rectangles with traffic lanes', icon: '⬜', color: 'blue' },
                    { type: 'polygon', name: 'Polygon Zone', description: 'Custom shaped areas', icon: '🔷', color: 'green' },
                    { type: 'polygon-with-lanes', name: 'Polygon + Lanes', description: 'Custom shapes with lanes', icon: '🔷', color: 'emerald' }
                  ].map((option) => (
                    <button
                      key={option.type}
                      onClick={() => handleZoneTypeChange(option.type)}
                      disabled={!selectedCamera}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        currentZoneType === option.type
                          ? `border-${option.color}-400 bg-${option.color}-50 shadow-lg shadow-${option.color}-200/30`
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      } ${!selectedCamera ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{option.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{option.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                        </div>
                        {currentZoneType === option.type && (
                          <div className={`w-5 h-5 bg-${option.color}-500 rounded-full flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Summary & Quick Actions */}
            {selectedCamera && selectedActivity && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-green-800">Configuration Ready</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>📹 <span className="font-medium">{cameras.find(c => c.id === selectedCamera)?.appName || 'Camera'}</span></div>
                      <div>🎯 <span className="font-medium">{selectedActivity.replace(/_/g, ' ').toUpperCase()}</span></div>
                      <div>📍 <span className="font-medium">{currentZoneType.replace('-', ' ').toUpperCase()}</span></div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>


        {/* Enhanced Snapshot & Zone Drawing Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Zone Drawing & Snapshot</h3>
                  <p className="text-sm text-gray-600 mt-1">Capture camera view and draw monitoring zones</p>
                </div>
              </div>
              
              <button 
                onClick={handleTakeSnapshot}
                disabled={!selectedCamera || isLoading}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium flex items-center gap-2 sm:gap-3 transition-all duration-200 text-sm sm:text-base shadow-lg ${
                  isLoading || !selectedCamera 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 shadow-gray-200/50' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50 transform hover:-translate-y-0.5'
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
                <span className="hidden sm:inline">{isLoading ? 'Capturing...' : 'Take Snapshot'}</span>
                <span className="sm:hidden">{isLoading ? 'Capture' : '📸'}</span>
              </button>
            </div>

            {/* Zone Drawing Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 mb-6 shadow-lg shadow-gray-200/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Current Mode Display */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Mode: <span className="font-bold text-blue-800">
                        {currentZoneType === 'rectangle' ? 'Rectangle Zone' : 
                          currentZoneType === 'rectangle-with-lanes' ? 'Rectangle + Lanes' :
                          currentZoneType === 'polygon' ? 'Polygon Zone' :
                          currentZoneType === 'polygon-with-lanes' ? 'Polygon + Lanes' : 'Unknown'}
                      </span>
                    </span>
                  </div>
                </div>
                
                {/* Drawing Tools */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button 
                    onClick={handleDrawZone}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 font-medium flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    </svg>
                    <span className="hidden sm:inline">Draw Zone</span>
                    <span className="sm:hidden">Zone</span>
                  </button>
                  
                  <button 
                    onClick={handleDrawLane}
                    className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md font-medium flex items-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span className="hidden sm:inline">Draw Lane</span>
                    <span className="sm:hidden">Lane</span>
                  </button>
                  
                  <button 
                    onClick={handleUndo}
                    className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md font-medium flex items-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 14L4 9l5-5"></path>
                      <path d="M4 9h16a2 2 0 0 1 2 2v4"></path>
                    </svg>
                    <span className="hidden sm:inline">Undo</span>
                    <span className="sm:hidden">↶</span>
                  </button>
                  
                  <button 
                    onClick={handleRedo}
                    className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md font-medium flex items-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9l5 5-5 5"></path>
                      <path d="M20 14H4a2 2 0 0 1-2-2V8"></path>
                    </svg>
                    <span className="hidden sm:inline">Redo</span>
                    <span className="sm:hidden">↷</span>
                  </button>
                  
                  <button 
                    onClick={handleClearAll}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 font-medium flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M15 9l-6 6"></path>
                      <path d="M9 9l6 6"></path>
                    </svg>
                    <span className="hidden sm:inline">Clear All</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Snapshot Container */}
            <div className="relative w-full overflow-hidden min-h-[300px] sm:min-h-[400px] md:min-h-[450px] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl shadow-inner">
              <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px]">
                <img 
                  ref={snapshotImageRef}
                  src={hasSnapshot ? (snapshotUrl || '/api/snapshot/placeholder') : 'https://picsum.photos/800/400?random=1'} 
                  alt="Zone Snapshot" 
                  className="w-full h-full object-contain block border border-gray-300 rounded-xl relative z-10 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://picsum.photos/800/400?random=1';
                  }}
                />
                
                <canvas 
                  ref={zoneCanvasRef}
                  className="absolute top-0 left-0 w-full h-full z-20 touch-none"
                />
                
              </div>
            </div>
          </div>
        </div>


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
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                        <line x1="8" y1="2" x2="8" y2="18"></line>
                        <line x1="16" y1="6" x2="16" y2="22"></line>
                      </svg>
                    </div>
                    <div>
                      <h6 className="text-gray-800 font-bold text-base sm:text-lg">Zone Coordinates</h6>
                      <p className="text-xs sm:text-sm text-gray-600">Drawn monitoring areas</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const dataToCopy = (currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes') 
                        ? zoneCoordinates.polygons 
                        : zoneCoordinates.zones;
                      copyToClipboard(JSON.stringify(dataToCopy));
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-700 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-48">
                    {(() => {
                      if (currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes') {
                        return zoneCoordinates.polygons.length > 0 ? JSON.stringify(zoneCoordinates.polygons, null, 2) : (
                          <div className="text-center py-8 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                              <line x1="8" y1="2" x2="8" y2="18"></line>
                              <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                            <p>No polygons drawn yet</p>
                            <p className="text-xs mt-1">Use the drawing tools above to create zones</p>
                          </div>
                        );
                      } else {
                        return zoneCoordinates.zones.length > 0 ? JSON.stringify(zoneCoordinates.zones, null, 2) : (
                          <div className="text-center py-8 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            </svg>
                            <p>No zones drawn yet</p>
                            <p className="text-xs mt-1">Use the drawing tools above to create zones</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Lane Coordinates Card - Only show when zone type includes lanes */}
              {(currentZoneType === 'rectangle-with-lanes' || currentZoneType === 'polygon-with-lanes') && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </div>
                      <div>
                        <h6 className="text-gray-800 font-bold text-base sm:text-lg">Lane Coordinates</h6>
                        <p className="text-xs sm:text-sm text-gray-600">Traffic flow lanes</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(zoneCoordinates.lanes))}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-gray-700 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-48">
                      {zoneCoordinates.lanes.length > 0 ? JSON.stringify(zoneCoordinates.lanes, null, 2) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          <p>No lanes drawn yet</p>
                          <p className="text-xs mt-1">Use the "Draw Lane" tool to create traffic lanes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Zone Statistics Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-gray-200/10 w-full">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18"></path>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h6 className="text-gray-800 font-bold text-base sm:text-lg">Zone Statistics</h6>
                    <p className="text-xs sm:text-sm text-gray-600">Current configuration summary</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200 min-h-[60px]">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">Zones Created</span>
                      <span className="text-xs text-blue-600 mt-1">Monitoring areas</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-900">
                      {currentZoneType === 'polygon' || currentZoneType === 'polygon-with-lanes' 
                        ? zoneCoordinates.polygons.length 
                        : zoneCoordinates.zones.length}
                    </span>
                  </div>
                  
                  {(currentZoneType === 'rectangle-with-lanes' || currentZoneType === 'polygon-with-lanes') && (
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200 min-h-[60px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-800">Lanes Created</span>
                        <span className="text-xs text-green-600 mt-1">Traffic flow lines</span>
                      </div>
                      <span className="text-2xl font-bold text-green-900">{zoneCoordinates.lanes.length}</span>
                    </div>
                  )}
                  
                  <div className={`flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px] ${(currentZoneType === 'rectangle-with-lanes' || currentZoneType === 'polygon-with-lanes') ? 'sm:col-span-2' : 'sm:col-span-2'}`}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">Zone Type</span>
                      <span className="text-xs text-gray-600 mt-1">Current drawing mode</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 capitalize text-right">
                      {currentZoneType.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Dynamic Activity Parameters */}
        {selectedActivity && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm rounded-2xl border border-blue-200/70 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-200/20">
              {/* Header Section */}
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/30"></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Activity Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure parameters for {selectedActivity.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
              </div>

              <ErrorBoundary>
                <DynamicActivityForm
                  selectedActivity={selectedActivity}
                  initialValues={activities[selectedActivity]?.parameters || {}}
                  onChange={setActivityParameters}
                />
              </ErrorBoundary>
              
              {/* Enhanced Save Section */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg shadow-gray-200/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17,21 17,13 7,13 7,21"></polyline>
                        <polyline points="7,3 7,8 15,8"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h6 className="text-gray-800 font-bold text-base sm:text-lg">Save Configuration</h6>
                      <p className="text-xs sm:text-sm text-gray-600">Save your activity parameters</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveActivityParameters}
                    disabled={isSaving || !selectedActivity}
                    className={`px-6 sm:px-8 py-3 rounded-xl font-medium flex items-center gap-2 sm:gap-3 transition-all duration-200 text-sm sm:text-base shadow-lg ${
                      isSaving || !selectedActivity
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 shadow-gray-200/50'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50 transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 6v6l4 2"></path>
                        </svg>
                        <span className="hidden sm:inline">Saving Configuration...</span>
                        <span className="sm:hidden">Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17,21 17,13 7,13 7,21"></polyline>
                          <polyline points="7,3 7,8 15,8"></polyline>
                        </svg>
                        <span className="hidden sm:inline">Save Configuration</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Zone Type Selection Modal */}
      {showZoneTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/60 shadow-2xl">
            <div className="flex items-center mb-4 sm:mb-5">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <h5 className="text-base sm:text-lg font-semibold text-gray-800">Select Zone Type</h5>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 sm:mb-6">
              Choose the type of zone you want to draw:
            </p>
            
            <div className="grid gap-3 sm:gap-4">
              {[
                { type: 'rectangle', name: 'Rectangle Zone', description: 'Draw simple rectangle zones for basic area detection', color: 'orange' },
                { type: 'rectangle-with-lanes', name: 'Rectangle Zone with Lanes', description: 'Draw rectangular zones with lanes for traffic analysis', color: 'blue' },
                { type: 'polygon', name: 'Polygon Zone', description: 'Draw custom polygon zones for complex area analysis', color: 'green' },
                { type: 'polygon-with-lanes', name: 'Polygon Zone with Lanes', description: 'Draw polygon zones with lanes for traffic analysis', color: 'emerald' }
              ].map((option) => (
                <div 
                  key={option.type}
                  onClick={() => handleZoneTypeChange(option.type)}
                  className="border-2 border-gray-300 rounded-xl p-3 sm:p-4 md:p-5 cursor-pointer transition-all duration-200 bg-gray-50 hover:border-blue-400 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-200/50"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-8 sm:w-16 sm:h-10 border-2 border-blue-400 rounded bg-blue-400/20 relative flex-shrink-0">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 sm:w-8 bg-blue-400"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h6 className="text-gray-800 font-semibold mb-1 text-sm sm:text-base">{option.name}</h6>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{option.description}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5 flex-shrink-0">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-md w-full border border-gray-200/60 shadow-2xl">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                modalType === 'success' ? 'bg-green-100' : 
                modalType === 'error' ? 'bg-red-100' : 
                modalType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={
                  modalType === 'success' ? '#10b981' : 
                  modalType === 'error' ? '#ef4444' : 
                  modalType === 'warning' ? '#f59e0b' : '#3b82f6'
                } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
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
              <h5 className="text-base sm:text-lg font-semibold text-gray-800">{modalTitle}</h5>
            </div>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{modalMessage}</p>
            
            <div className="text-right">
              <button 
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-lg hover:shadow-blue-200/50 font-medium text-sm sm:text-base"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
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
        onAddActivities={handleAddFromJsonEditor}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-right-full duration-300">
          <div className={`max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
            toastType === 'success' ? 'border-green-500' : 
            toastType === 'error' ? 'border-red-500' : 
            toastType === 'warning' ? 'border-yellow-500' : 'border-blue-500'
          }`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  toastType === 'success' ? 'bg-green-100' : 
                  toastType === 'error' ? 'bg-red-100' : 
                  toastType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={
                    toastType === 'success' ? '#10b981' : 
                    toastType === 'error' ? '#ef4444' : 
                    toastType === 'warning' ? '#f59e0b' : '#3b82f6'
                  } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {toastType === 'success' ? (
                      <path d="M9 12l2 2 4-4"></path>
                    ) : toastType === 'error' ? (
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    ) : toastType === 'warning' ? (
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    ) : (
                      <circle cx="12" cy="12" r="10"></circle>
                    )}
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    toastType === 'success' ? 'text-green-800' : 
                    toastType === 'error' ? 'text-red-800' : 
                    toastType === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {toastMessage}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setShowToast(false)}
                    className={`inline-flex rounded-md p-1.5 ${
                      toastType === 'success' ? 'text-green-500 hover:bg-green-100' : 
                      toastType === 'error' ? 'text-red-500 hover:bg-red-100' : 
                      toastType === 'warning' ? 'text-yellow-500 hover:bg-yellow-100' : 'text-blue-500 hover:bg-blue-100'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;

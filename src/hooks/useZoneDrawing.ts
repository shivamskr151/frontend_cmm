import { useState, useRef, useCallback, useEffect } from 'react';
import { RectangleZoneDrawer } from '../utils/rectangle-Zone';
import { ZoneDrawer as RectangleZoneWithLanesDrawer } from '../utils/rectangle-lanes';
import { PolygonZoneDrawer } from '../utils/polygon-Zone';
import { PolygonZoneDrawerWithLanes } from '../utils/polygon-lanes';
import type { ZoneCoordinates } from '../types/dashboard';

export const useZoneDrawing = () => {
  const [currentZoneType, setCurrentZoneType] = useState('');
  const [zoneCoordinates, setZoneCoordinates] = useState<ZoneCoordinates>({ zones: [], lanes: [], polygons: [] });
  
  const zoneCanvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotImageRef = useRef<HTMLImageElement>(null);
  const zoneDrawerRef = useRef<RectangleZoneDrawer | RectangleZoneWithLanesDrawer | PolygonZoneDrawer | PolygonZoneDrawerWithLanes | null>(null);

  // Initialize zone drawer
  const initializeZoneDrawer = useCallback((zoneType?: string) => {
    const typeToUse = zoneType || currentZoneType;
    console.log('initializeZoneDrawer called with zoneType:', zoneType, 'currentZoneType:', currentZoneType, 'typeToUse:', typeToUse);
    
    // If no zone type is selected, don't initialize anything
    if (!typeToUse || typeToUse.trim() === '') {
      console.log('No zone type selected, skipping initialization');
      return;
    }
    
    if (zoneCanvasRef.current && snapshotImageRef.current) {
      try {
        console.log('Initializing zone drawer for type:', typeToUse);
        
        // Only reinitialize if we're switching to a different zone type or if no drawer exists
        if (currentZoneType !== typeToUse || !zoneDrawerRef.current) {
          // Clean up existing drawer
          if (zoneDrawerRef.current) {
            (zoneDrawerRef.current as any).destroy();
            zoneDrawerRef.current = null;
          }
          
          // Reset zone coordinates only when switching zone types
          if (currentZoneType !== typeToUse) {
            setZoneCoordinates({ zones: [], lanes: [], polygons: [] });
          }
        } else {
          // If we're reinitializing the same zone type and drawer exists, just return
          console.log('Drawer already exists for zone type:', typeToUse, 'skipping reinitialization');
          return;
        }
        
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
        }
        
        console.log('Zone drawer initialized successfully for type:', typeToUse);
      } catch (error) {
        console.error('Error initializing zone drawer:', error);
      }
    }
  }, [currentZoneType]);

  // Handle zone type change
  const handleZoneTypeChange = useCallback((zoneType: string) => {
    console.log('Changing zone type to:', zoneType);
    console.log('Current zone type before change:', currentZoneType);
    setCurrentZoneType(zoneType);
    
    // Reset zone coordinates when changing zone type to prevent duplicates
    setZoneCoordinates({ zones: [], lanes: [], polygons: [] });
    
    // Reinitialize zone drawer when zone type is selected
    if (zoneCanvasRef.current && snapshotImageRef.current) {
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
  }, [currentZoneType, initializeZoneDrawer]);

  // Zone drawing control functions
  const handleDrawZone = useCallback(() => {
    console.log('Draw Zone clicked, current zone type:', currentZoneType);
    console.log('Zone drawer ref:', zoneDrawerRef.current);
    console.log('Zone drawer type:', zoneDrawerRef.current?.constructor.name);
    
    if (zoneDrawerRef.current) {
      if (currentZoneType === 'rectangle') {
        console.log('Using RectangleZoneDrawer - starting zone drawing');
      } else if (currentZoneType === 'rectangle-with-lanes') {
        console.log('Using RectangleZoneWithLanesDrawer - setting draw mode to zone');
        (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).setDrawMode('zone');
      } else if (currentZoneType === 'polygon') {
        console.log('Using PolygonZoneDrawer - starting polygon drawing');
        (zoneDrawerRef.current as PolygonZoneDrawer).startDrawing();
      } else if (currentZoneType === 'polygon-with-lanes') {
        console.log('Using PolygonZoneDrawerWithLanes - setting draw mode to polygon');
        (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).setDrawMode('polygon');
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
          }
        }, 200);
      }
    }
  }, [currentZoneType, initializeZoneDrawer]);

  const handleDrawLane = useCallback(() => {
    if (zoneDrawerRef.current) {
      if (currentZoneType === 'rectangle-with-lanes') {
        console.log('Zone: Draw Lane clicked');
        console.log('Zone: Zone drawer type:', zoneDrawerRef.current.constructor.name);
        
        // Check if the drawer has the hasZones method (RectangleZoneWithLanesDrawer)
        if (typeof (zoneDrawerRef.current as any).hasZones === 'function') {
          const hasZones = (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).hasZones();
          console.log('Zone: Has zones:', hasZones);
          if (!hasZones) {
            return { success: false, message: 'Please create a zone first before drawing lanes. Use "Draw Zone" to create a rectangle zone.' };
          }
          
          console.log('Zone: Setting draw mode to lane');
          (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).setDrawMode('lane');
          const activeZoneIndex = (zoneDrawerRef.current as RectangleZoneWithLanesDrawer).getActiveZoneIndex();
          console.log('Zone: Active zone index:', activeZoneIndex);
        } else {
          console.error('Zone: Zone drawer does not support lanes. Current type:', zoneDrawerRef.current.constructor.name);
          return { success: false, message: 'Current zone type does not support lane drawing. Please select "Rectangle Zone with Lanes" from the zone type dropdown.' };
        }
      } else if (currentZoneType === 'polygon-with-lanes') {
        console.log('Zone: Draw Lane clicked for polygon with lanes');
        console.log('Zone: Zone drawer type:', zoneDrawerRef.current.constructor.name);
        
        // Check if the drawer has the hasZones method (PolygonZoneDrawerWithLanes)
        if (typeof (zoneDrawerRef.current as any).hasZones === 'function') {
          const hasZones = (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).hasZones();
          console.log('Zone: Has zones:', hasZones);
          if (!hasZones) {
            return { success: false, message: 'Please create a polygon zone first before drawing lanes. Use "Draw Zone" to create a polygon zone.' };
          }
          
          console.log('Zone: Setting draw mode to lane');
          (zoneDrawerRef.current as PolygonZoneDrawerWithLanes).setDrawMode('lane');
        } else {
          console.error('Zone: Zone drawer does not support lanes. Current type:', zoneDrawerRef.current.constructor.name);
          return { success: false, message: 'Current zone type does not support lane drawing. Please select "Polygon Zone with Lanes" from the zone type dropdown.' };
        }
      } else {
        return { success: false, message: 'Lane drawing is only available for zone types with lanes. Rectangle Zone and Polygon Zone do not support lanes.' };
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
          }
        }, 200);
      }
    }
    return { success: true };
  }, [currentZoneType, initializeZoneDrawer]);

  const handleUndo = useCallback(() => {
    if (zoneDrawerRef.current) {
      zoneDrawerRef.current.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (zoneDrawerRef.current) {
      zoneDrawerRef.current.redo();
    }
  }, []);

  const handleClearAll = useCallback(() => {
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
      }
      setZoneCoordinates({ zones: [], lanes: [], polygons: [] });
    }
  }, [currentZoneType]);

  // Cleanup zone drawer on component unmount
  useEffect(() => {
    return () => {
      if (zoneDrawerRef.current) {
        (zoneDrawerRef.current as any).destroy();
      }
    };
  }, []);

  return {
    currentZoneType,
    zoneCoordinates,
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
  };
};

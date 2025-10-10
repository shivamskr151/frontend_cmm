import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { cameraApi, type Camera } from '../api';

interface CameraContextType {
  cameras: Camera[];
  camerasLoading: boolean;
  camerasError: string | null;
  selectedCamera: string | null;
  loadCameras: () => Promise<void>;
  refreshCameras: () => Promise<void>;
  clearCameraError: () => void;
  setSelectedCamera: (cameraId: string) => void;
  loadSelectedCameraFromStorage: () => string | null;
  getSelectedCameraData: () => Camera | null;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

interface CameraProviderProps {
  children: ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCameraState] = useState<string | null>(null);

  const loadCameras = useCallback(async () => {
    setCamerasLoading(true);
    setCamerasError(null);
    
    try {
      console.log('🌐 Loading cameras from API (shared context)...');
      const cameraData = await cameraApi.getCameras();
      setCameras(cameraData);
      console.log('✅ Cameras loaded successfully:', cameraData.length);
    } catch (error) {
      console.error('❌ Error loading cameras:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cameras';
      setCamerasError(errorMessage);
    } finally {
      setCamerasLoading(false);
    }
  }, []);

  const refreshCameras = useCallback(async () => {
    setCamerasLoading(true);
    setCamerasError(null);
    
    try {
      console.log('🔄 Refreshing cameras from API (shared context)...');
      const cameraData = await cameraApi.refreshCameras();
      setCameras(cameraData);
      console.log('✅ Cameras refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing cameras:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh cameras';
      setCamerasError(errorMessage);
    } finally {
      setCamerasLoading(false);
    }
  }, []);

  const clearCameraError = useCallback(() => {
    setCamerasError(null);
  }, []);

  // Local storage functions for camera persistence
  const CAMERA_STORAGE_KEY = 'selectedCameraId';

  const saveSelectedCameraToStorage = useCallback((cameraId: string) => {
    try {
      localStorage.setItem(CAMERA_STORAGE_KEY, cameraId);
      console.log('💾 Saved camera ID to localStorage:', cameraId);
    } catch (error) {
      console.error('❌ Error saving camera ID to localStorage:', error);
    }
  }, []);

  const loadSelectedCameraFromStorage = useCallback((): string | null => {
    try {
      const storedCameraId = localStorage.getItem(CAMERA_STORAGE_KEY);
      console.log('📖 Loaded camera ID from localStorage:', storedCameraId);
      return storedCameraId;
    } catch (error) {
      console.error('❌ Error loading camera ID from localStorage:', error);
      return null;
    }
  }, []);

  const setSelectedCamera = useCallback((cameraId: string) => {
    setSelectedCameraState(cameraId);
    saveSelectedCameraToStorage(cameraId);
    console.log('🎯 Camera selected and saved:', cameraId);
  }, [saveSelectedCameraToStorage]);

  const getSelectedCameraData = useCallback((): Camera | null => {
    if (!selectedCamera) return null;
    return cameras.find(camera => camera.id === selectedCamera) || null;
  }, [selectedCamera, cameras]);

  // Load cameras on mount
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  // Load selected camera from storage when cameras are loaded
  useEffect(() => {
    if (cameras.length > 0 && !selectedCamera) {
      const storedCameraId = loadSelectedCameraFromStorage();
      
      if (storedCameraId) {
        // Verify the stored camera ID exists in the current cameras list
        const cameraExists = cameras.some(camera => camera.id === storedCameraId);
        if (cameraExists) {
          console.log('🔄 Restoring camera from storage:', storedCameraId);
          setSelectedCameraState(storedCameraId);
        } else {
          console.log('⚠️ Stored camera ID not found in current cameras, selecting first available');
          setSelectedCamera(cameras[0].id);
        }
      } else {
        // No stored camera, select the first one
        console.log('🔄 No stored camera found, selecting first available');
        setSelectedCamera(cameras[0].id);
      }
    }
  }, [cameras, selectedCamera, loadSelectedCameraFromStorage, setSelectedCamera]);

  const value: CameraContextType = {
    cameras,
    camerasLoading,
    camerasError,
    selectedCamera,
    loadCameras,
    refreshCameras,
    clearCameraError,
    setSelectedCamera,
    loadSelectedCameraFromStorage,
    getSelectedCameraData,
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCameras = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameras must be used within a CameraProvider');
  }
  return context;
};

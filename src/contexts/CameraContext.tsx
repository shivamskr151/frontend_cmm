import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { cameraApi, type Camera } from '../api';

interface CameraContextType {
  cameras: Camera[];
  camerasLoading: boolean;
  camerasError: string | null;
  loadCameras: () => Promise<void>;
  refreshCameras: () => Promise<void>;
  clearCameraError: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

interface CameraProviderProps {
  children: ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [camerasError, setCamerasError] = useState<string | null>(null);

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

  // Load cameras on mount
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  const value: CameraContextType = {
    cameras,
    camerasLoading,
    camerasError,
    loadCameras,
    refreshCameras,
    clearCameraError,
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

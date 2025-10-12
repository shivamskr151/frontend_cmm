
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCameras } from "../contexts/CameraContext";
import { useUser } from "../contexts/UserContext";
import { useWebSocket, usePatrol, usePresets } from "../hooks/ptz";
import {
  JoystickControl,
  PresetControl,
  PatrolControl,
  VideoStream,
  SpeedControls,
  CameraSelectionModal,
  EditPatrolModal,
  EditPresetModal,
  SectionToggle
} from "../components/ptz";

function PTZ() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useUser();
  
  // State for Pan/Tilt
  const [speeds, setSpeeds] = useState({ Pan: 0.5, Tilt: 0.5 });
  const [zoomLevel, setZoomLevel] = useState(50); // Zoom percentage (0-100) - Display only
  const [sectionName, setSectionName] = useState<'Joystick' | 'Preset' | 'Patrol'>('Joystick');
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Use shared camera context instead of local state
  const { cameras, loadCameras, selectedCamera, setSelectedCamera, getSelectedCameraData } = useCameras();
  
  // Camera ID - can be made dynamic later
  const cameraId = selectedCamera || "CAM001";
  
  // Custom hooks
  const { connectionStatus, sendMovement, sendZoom, sendPatrolCommand, getPTZStatus } = useWebSocket(cameraId);
  const patrolHook = usePatrol(sendPatrolCommand);
  const presetsHook = usePresets();

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('PTZ: User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Camera loading is now handled by the shared CameraContext
  const handleCameraSelect = useCallback((cameraId: string) => {
    setSelectedCamera(cameraId);
    setShowCameraModal(false);
    
    // Get PTZ status for the newly selected camera
    console.log('📊 Getting PTZ status for camera:', cameraId);
    getPTZStatus();
  }, [setSelectedCamera, getPTZStatus]);

  // Load cameras on component mount
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  // Auto-load camera data when camera is restored from storage
  useEffect(() => {
    if (selectedCamera && cameras.length > 0) {
      const cameraData = getSelectedCameraData();
      if (cameraData) {
        console.log('🔄 Auto-loading data for restored camera in PTZ:', cameraData);
        // Here you can add any camera-specific data loading logic
        // For example, loading camera presets, patrol patterns, etc.
        
        // Example: Load camera presets
        // loadCameraPresets(cameraData.id);
        
        // Example: Load camera patrol patterns
        // loadCameraPatrolPatterns(cameraData.id);
        
        console.log('✅ Camera data auto-loaded successfully in PTZ');
      }
    }
  }, [selectedCamera, cameras, getSelectedCameraData]);

  // Get PTZ status when camera changes
  useEffect(() => {
    if (selectedCamera && connectionStatus === 'connected') {
      console.log('📊 Auto-getting PTZ status for camera:', selectedCamera);
      getPTZStatus();
    }
  }, [selectedCamera, connectionStatus, getPTZStatus]);

  // Load presets when Preset tab is opened
  useEffect(() => {
    if (sectionName === 'Preset' && selectedCamera) {
      console.log('🎯 Preset tab opened, loading presets for camera:', selectedCamera);
      presetsHook.loadPresets();
    }
  }, [sectionName, selectedCamera, presetsHook]);

  // Handle zoom change (send immediately)
  const handleZoomChange = (value: number) => {
    setZoomLevel(value);
    sendZoom(value);
  };

  // Handle joystick movement
  const handleJoystickMove = useCallback((newSpeeds: { Pan: number; Tilt: number }) => {
    console.log("🎮 PTZ received joystick movement:", newSpeeds);
    setSpeeds(newSpeeds);
    sendMovement(newSpeeds, zoomLevel);
  }, [sendMovement, zoomLevel]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Main Content */}
      <div className="pt-14 p-2 sm:p-4 lg:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 sm:gap-4 lg:gap-6 min-h-[calc(100vh-140px)]">
          {/* Video Stream Section */}
          <div className="lg:col-span-2 space-y-2 pt-2 order-1 lg:order-1">
            <SpeedControls speeds={speeds} />
            <VideoStream />
          </div>

          {/* Control Panel */}
          <div className="space-y-2 pt-2 overflow-visible order-2 lg:order-2">
            <SectionToggle
              sectionName={sectionName}
              onSectionChange={setSectionName}
              cameras={cameras}
              selectedCamera={selectedCamera || ''}
              onCameraModalOpen={() => setShowCameraModal(true)}
            />

         

            {/* WebSocket Debug Component - Remove this after debugging */}
            {/* <WebSocketDebug cameraId={cameraId} /> */}

            {/* Conditional rendering based on section */}
            {sectionName === 'Joystick' && (
              <JoystickControl
                onMovement={handleJoystickMove}
                onZoomChange={handleZoomChange}
                zoomLevel={zoomLevel}
              />
            )}

            {sectionName === 'Preset' && (
              <PresetControl
                speeds={speeds}
                zoomLevel={zoomLevel}
              />
            )}

            {sectionName === 'Patrol' && (
              <PatrolControl
                sendPatrolCommand={sendPatrolCommand}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CameraSelectionModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        cameras={cameras}
        selectedCamera={selectedCamera || ''}
        onCameraSelect={handleCameraSelect}
      />

      <EditPatrolModal
        isOpen={patrolHook.showEditPatrolModal}
        onClose={() => patrolHook.setShowEditPatrolModal(false)}
        editingPatrolPattern={patrolHook.editingPatrolPattern}
        onSave={patrolHook.handleSavePatrolPattern}
      />

      <EditPresetModal
        isOpen={presetsHook.showEditPresetModal}
        onClose={() => presetsHook.setShowEditPresetModal(false)}
        editingPreset={presetsHook.editingPreset}
        onSave={presetsHook.handleSavePreset}
      />
    </div>
  );
}

export default PTZ;



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
  const { cameras, loadCameras, selectedCamera, setSelectedCamera, getSelectedCameraData } = useCameras();

  const cameraId = selectedCamera || '';
  const { sendMovement, sendZoom, sendPatrolCommand, getPTZStatus, ptzStatus, sendStop } = useWebSocket(cameraId);

  
  // State for zoom level and joystick movement
  const [zoomLevel, setZoomLevel] = useState(50); // Zoom percentage (0-100) - Display only
  const [currentSpeeds, setCurrentSpeeds] = useState({ Pan: 0, Tilt: 0}); // Current joystick movement speeds
  const [sectionName, setSectionName] = useState<'Joystick' | 'Preset' | 'Patrol'>('Joystick');
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Use shared camera context instead of local state
  
  // Camera ID - can be made dynamic later

  
  // Custom hooks
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
     
        
        console.log('✅ Camera data auto-loaded successfully in PTZ');
      }
    }
  }, [selectedCamera, cameras, getSelectedCameraData]);

  // Note: PTZ status is now only requested when user manually selects a camera
  // This prevents automatic calls when camera changes due to other reasons

  // Update zoom level and current speeds when PTZ status is received
  useEffect(() => {
    if (ptzStatus && ptzStatus.success) {
      console.log('📊 Updating UI with PTZ status:', ptzStatus);
      
      // Update zoom level based on current zoom position
      // Convert zoom position (-1 to 1) to percentage (0 to 100)
      const zoomPosition = ptzStatus.zoom?.position?.x !== null ? 
        Math.max(0, Math.min(100, (ptzStatus.zoom.position.x + 1) * 50)) : 50;
      
      setZoomLevel(zoomPosition);
      
      // Update current speeds based on PTZ position data
      if (ptzStatus.pan && ptzStatus.tilt) {
        setCurrentSpeeds({
          Pan: ptzStatus.pan.position.x || 0,
          Tilt: ptzStatus.tilt.position.y || 0
        });
      }
    }
  }, [ptzStatus]);

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
    setCurrentSpeeds(newSpeeds); // Store current joystick speeds
    sendMovement(newSpeeds, zoomLevel);
  }, [sendMovement, zoomLevel]);

  // Handle joystick end -> send STOP to camera
  const handleJoystickEnd = useCallback(() => {
    sendStop();
  }, [sendStop]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Main Content */}
      <div className="pt-14 p-2 sm:p-4 lg:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 sm:gap-4 lg:gap-6 min-h-[calc(100vh-140px)]">
          {/* Video Stream Section */}
          <div className="lg:col-span-2 space-y-2 pt-2 order-1 lg:order-1">
            <SpeedControls speeds={currentSpeeds} />
            <VideoStream camera={getSelectedCameraData()} />
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

            {/* PTZ Status Display */}
            {/* {ptzStatus && (
              <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                    📊 PTZ Status Data
                  </summary>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">
                      <strong>Success:</strong> {ptzStatus.success ? '✅' : '❌'}
                    </div>
                    {ptzStatus.pan && ptzStatus.pan.position && (
                      <div className="text-xs text-gray-500">
                        <strong>Pan:</strong> {ptzStatus.pan.position.x?.toFixed(3)} (speed: {ptzStatus.pan.speed?.x?.toFixed(3)})
                      </div>
                    )}
                    {ptzStatus.tilt && ptzStatus.tilt.position && (
                      <div className="text-xs text-gray-500">
                        <strong>Tilt:</strong> {ptzStatus.tilt.position.y?.toFixed(3)} (speed: {ptzStatus.tilt.speed?.y?.toFixed(3)})
                      </div>
                    )}
                    {ptzStatus.zoom && ptzStatus.zoom.position && (
                      <div className="text-xs text-gray-500">
                        <strong>Zoom:</strong> {ptzStatus.zoom.position.x?.toFixed(3)} (speed: {ptzStatus.zoom.speed?.x?.toFixed(3)})
                      </div>
                    )}
                    {ptzStatus.error && (
                      <div className="text-xs text-red-500">
                        <strong>Error:</strong> {ptzStatus.error}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )} */}

            {/* Conditional rendering based on section */}
            {sectionName === 'Joystick' && (
              <JoystickControl
                onMovement={handleJoystickMove}
                onEnd={handleJoystickEnd}
                onZoomChange={handleZoomChange}
                zoomLevel={zoomLevel}
              />
            )}

            {sectionName === 'Preset' && (
              <PresetControl
                zoomLevel={zoomLevel}
              />
            )}

            {sectionName === 'Patrol' && (
              <PatrolControl
                patrolStatus={patrolHook.patrolStatus}
                patrolPatterns={patrolHook.patrolPatterns}
                patrolTours={patrolHook.patrolTours}
                loading={patrolHook.loading}
                error={patrolHook.error}
                startPatrol={patrolHook.startPatrol}
                stopPatrol={patrolHook.stopPatrol}
                stopIndividualPatrol={patrolHook.stopIndividualPatrol}
                pausePatrol={patrolHook.pausePatrol}
                resumePatrol={patrolHook.resumePatrol}
                loadPatrolTours={patrolHook.loadPatrolTours}
                clearError={patrolHook.clearError}
                handleEditPatrolPattern={patrolHook.handleEditPatrolPattern}
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
        editingPatrolTour={patrolHook.editingPatrolTour}
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


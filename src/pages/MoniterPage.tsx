


import { useEffect, useRef, useState, useCallback } from "react";
import nipplejs from "nipplejs";
// Camera type is now imported through the context
import { useCameras } from "../contexts/CameraContext";

function MoniterPage() {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // State for Pan/Tilt
  const [speeds, setSpeeds] = useState({ Pan: 0.5, Tilt: 0.5 });
  const [zoomLevel, setZoomLevel] = useState(50); // Zoom percentage (0-100) - Display only
  const [, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [patrolStatus, setPatrolStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [currentPatrolStep, setCurrentPatrolStep] = useState(0);
  const [patrolProgress, setPatrolProgress] = useState(0);
  const [selectedPatrolPatterns, setSelectedPatrolPatterns] = useState<number[]>([]);
  const [showEditPatrolModal, setShowEditPatrolModal] = useState(false);
  const [editingPatrolPattern, setEditingPatrolPattern] = useState<any>(null);
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  const [showEditPresetModal, setShowEditPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<any>(null);
  const cameraId = "CAM001"; // Example camera ID, aap dynamic bhi kar sakte ho
  const zoomLevelRef = useRef<number>(50);
  const [showCreatePresetModal, setShowCreatePresetModal] = useState(false);
  const [useCurrentPosition, setUseCurrentPosition] = useState(false);
  const [SectionName, setSectionName] = useState('Joystick');
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  // Use shared camera context instead of local state
  const { cameras, loadCameras, selectedCamera, setSelectedCamera, getSelectedCameraData } = useCameras();
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Camera loading is now handled by the shared CameraContext


  const handleCameraSelect = useCallback((cameraId: string) => {
    setSelectedCamera(cameraId);
    setShowCameraDropdown(false);
    setShowCameraModal(false);
  }, [setSelectedCamera]);

  // Removed handleCameraButtonClick as it's no longer needed

  // Load cameras on component mount
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  // Auto-load camera data when camera is restored from storage
  useEffect(() => {
    if (selectedCamera && cameras.length > 0) {
      const cameraData = getSelectedCameraData();
      if (cameraData) {
        console.log('🔄 Auto-loading data for restored camera in MoniterPage:', cameraData);
        // Here you can add any camera-specific data loading logic
        // For example, loading camera presets, patrol patterns, etc.
        
        // Example: Load camera presets
        // loadCameraPresets(cameraData.id);
        
        // Example: Load camera patrol patterns
        // loadCameraPatrolPatterns(cameraData.id);
        
        console.log('✅ Camera data auto-loaded successfully in MoniterPage');
      }
    }
  }, [selectedCamera, cameras, getSelectedCameraData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCameraDropdown(false);
      }
    };

    if (showCameraDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCameraDropdown]);

  // Persistent WebSocket
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket("ws://localhost:5000");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnectionStatus('connected');
    };
    socket.onmessage = (event) => console.log("📩 Server:", event.data);
    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setConnectionStatus('disconnected');
    };
    socket.onclose = () => {
      console.log("⚠️ WebSocket disconnected");
      setConnectionStatus('disconnected');
    };

    return () => socket.close();
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Send Pan, Tilt, Zoom and cameraId
  const sendMovement = useCallback((newSpeeds: typeof speeds, zoom: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      action: "move",
      cameraId,
      Pan: newSpeeds.Pan,
      Tilt: newSpeeds.Tilt,
      Zoom: zoom
    };
    socketRef.current.send(JSON.stringify(message));
    console.log("🎮 Sent:", message);
  }, [cameraId]);

  // Handle zoom change (send immediately)
  const handleZoomChange = (value: number) => {
    setZoomLevel(value);
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const message = { action: "zoom", cameraId, Zoom: value };
    socketRef.current.send(JSON.stringify(message));
    console.log("🔎 Sent:", message);
  };

  // Map joystick movement to Pan/Tilt
  const handleJoystickMove = useCallback((data: { vector?: { x: number; y: number }; distance?: number }) => {
    if (!data || !data.vector) return;

    const x = data.vector.x; // left-right (-1 to 1)
    const y = data.vector.y; // up-down (-1 to 1)
    const distance = Math.min((data.distance || 0) / 50, 1); // normalize

    const newSpeeds = {
      Pan: parseFloat((0.5 + x * distance).toFixed(2)),
      Tilt: parseFloat((0.5 - y * distance).toFixed(2)),
    };

    setSpeeds(newSpeeds);
    // Always use ref to avoid stale state when sending along with joystick movement
    sendMovement(newSpeeds, zoomLevelRef.current);
  }, [sendMovement]);

  // Patrol Functions
  const patrolPatterns = [
    { id: 1, name: "Standard Patrol", pan: 0.5, tilt: 0.3, zoom: 50 },
    { id: 2, name: "Quick Scan", pan: 0.8, tilt: 0.7, zoom: 75 },
    { id: 3, name: "Detailed Survey", pan: 0.2, tilt: 0.4, zoom: 90 },
    { id: 4, name: "Perimeter Check", pan: 0.9, tilt: 0.1, zoom: 25 },
    { id: 5, name: "Entrance Monitor", pan: 0.1, tilt: 0.8, zoom: 60 },
    { id: 6, name: "Parking Lot View", pan: 0.7, tilt: 0.6, zoom: 40 },
    { id: 7, name: "Building Corner", pan: 0.3, tilt: 0.2, zoom: 80 },
    { id: 8, name: "Main Gate", pan: 0.6, tilt: 0.9, zoom: 35 }
  ];

  const startPatrol = (patternId: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const pattern = patrolPatterns.find(p => p.id === patternId);
    if (!pattern) return;

    const message = {
      action: "start_patrol",
      cameraId,
      patternId,
      pattern: pattern.name,
      pan: pattern.pan,
      tilt: pattern.tilt,
      zoom: pattern.zoom
    };

    socketRef.current.send(JSON.stringify(message));
    setPatrolStatus('running');
    setCurrentPatrolStep(0);
    setPatrolProgress(0);
    console.log("🚀 Started patrol:", message);
  };

  const stopPatrol = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      action: "stop_patrol",
      cameraId
    };

    socketRef.current.send(JSON.stringify(message));
    setPatrolStatus('idle');
    setCurrentPatrolStep(0);
    setPatrolProgress(0);
    console.log("🛑 Stopped patrol");
  };

  const pausePatrol = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      action: "pause_patrol",
      cameraId
    };

    socketRef.current.send(JSON.stringify(message));
    setPatrolStatus('paused');
    console.log("⏸️ Paused patrol");
  };

  const resumePatrol = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      action: "resume_patrol",
      cameraId
    };

    socketRef.current.send(JSON.stringify(message));
    setPatrolStatus('running');
    console.log("▶️ Resumed patrol");
  };

  // Patrol Pattern Management Functions
  const handlePatrolPatternSelect = (patternId: number) => {
    setSelectedPatrolPatterns(prev => 
      prev.includes(patternId) 
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
  };

  const handleSelectAllPatrolPatterns = () => {
    if (selectedPatrolPatterns.length === patrolPatterns.length) {
      setSelectedPatrolPatterns([]);
    } else {
      setSelectedPatrolPatterns(patrolPatterns.map(p => p.id));
    }
  };

  const handleDeleteSelectedPatrolPatterns = () => {
    if (selectedPatrolPatterns.length === 0) return;
    
    // Here you would typically make an API call to delete the patterns
    console.log("Deleting patrol patterns:", selectedPatrolPatterns);
    
    // For now, just clear the selection
    setSelectedPatrolPatterns([]);
  };

  const handleEditPatrolPattern = (pattern: any) => {
    setEditingPatrolPattern(pattern);
    setShowEditPatrolModal(true);
  };

  const handleSavePatrolPattern = (updatedPattern: any) => {
    // Here you would typically make an API call to update the pattern
    console.log("Saving patrol pattern:", updatedPattern);
    
    setShowEditPatrolModal(false);
    setEditingPatrolPattern(null);
  };

  // Preset Management Functions
  const handlePresetSelect = (presetId: number) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  const handleSelectAllPresets = () => {
    const allPresets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (selectedPresets.length === allPresets.length) {
      setSelectedPresets([]);
    } else {
      setSelectedPresets(allPresets);
    }
  };

  const handleDeleteSelectedPresets = () => {
    if (selectedPresets.length === 0) return;
    
    // Here you would typically make an API call to delete the presets
    console.log("Deleting presets:", selectedPresets);
    
    // For now, just clear the selection
    setSelectedPresets([]);
  };

  const handleEditPreset = (preset: any) => {
    setEditingPreset(preset);
    setShowEditPresetModal(true);
  };

  const handleSavePreset = (updatedPreset: any) => {
    // Here you would typically make an API call to update the preset
    console.log("Saving preset:", updatedPreset);
    
    setShowEditPresetModal(false);
    setEditingPreset(null);
  };

  // Setup Joystick
  useEffect(() => {
    if (SectionName !== "Joystick") return;
    if (!joystickRef.current) return;

    const manager = nipplejs.create({
      zone: joystickRef.current,
      mode: "static",
      position: { left: "50%", top: "50%" },
      color: "#3b82f6",
      size: 120,
    });

    manager.on("move", (_evt, data) => handleJoystickMove(data));

    manager.on("end", () => {
      const stopSpeeds = { Pan: 0.5, Tilt: 0.5 };
      setSpeeds(stopSpeeds);
      sendMovement(stopSpeeds, zoomLevelRef.current);
      console.log("🛑 Joystick released");
    });

    // Enhanced joystick styling
    const style = document.createElement("style");
    style.innerHTML = `
      .nipple {
        box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3) !important;
        border: 2px solid rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px) !important;
      }
      .nipple .back {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9)) !important;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4) !important;
      }
    `;
    document.head.appendChild(style);
    // return () => {
    //   manager.destroy();
    //   joystickRef.current!.innerHTML = ""; // clear leftover elements
    // };
  }, [SectionName, selectedCamera, handleJoystickMove, sendMovement]);

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="min-h-screen fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Main Content */}
      <div className="pt-16 p-6">
        <div className={`grid grid-cols-3 gap-6 min-h-[calc(100vh-140px)]`}>

          {/* Video Stream Section */}
          <div className="lg:col-span-2 space-y-2 pt-2   ">
            {/* Connection Status & Speed Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-lg shadow-gray-200/20">
             
           
                <>
                  <div className="flex items-center justify-between mb-2">
                    {/* <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-white">Live Stream</h3>
                    </div> */}
                    <div className="flex items-center gap-3">
                      {/* Camera Name - Clickable */}
                      {/* <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={handleCameraButtonClick}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-xs transition-colors flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                          {cameras.find(cam => cam.id === selectedCamera)?.name}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6,9 12,15 18,9"></polyline>
                          </svg>
                        </button>

                      </div> */}

                      {/* Connection Status */}
                      {/* <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${connectionStatus === 'connected'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : connectionStatus === 'connecting'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                              'bg-red-500'
                          }`}></div>
                        {connectionStatus === 'connected' ? 'Connected' :
                          connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                      </div> */}
                    </div>
                  </div>

                  {/* Speed Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(speeds).map((label, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            {label} Speed
                          </label>
                          <div className="px-2 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 border border-gray-300">
                            {speeds[label as keyof typeof speeds].toFixed(1)}
                          </div>
                        </div>

                        {/* Enhanced Speed Bar */}
                        <div className="relative">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 rounded-full transition-all duration-300 shadow-sm"
                              style={{ width: `${speeds[label as keyof typeof speeds] * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.0</span>
                            <span>0.5</span>
                            <span>1.0</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
         
            </div>

            {/* Video Player - Only show when camera is selected */}
           
              <div className="bg-white/80 backdrop-blur-sm h-[calc(92vh-140px)] rounded-xl border border-gray-200/50 shadow-2xl shadow-gray-200/20">
                <div className="aspect-video h-full w-full bg-gray-100 relative overflow-hidden rounded-xl">
                  <video
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    controls
                    className="w-full h-full object-cover"
                  />
                  {/* Video Overlay Info */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-300 z-10 shadow-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">1080p</span>
                    </div>
                  </div>
                </div>
              </div>
          
          </div>

          {/* Control Panel - Only show when camera is selected */}
        
            <div className="space-y-2 pt-2 overflow-visible">
              {/* Section Toggle */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-2 shadow-lg shadow-gray-200/20 overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-700">PTZ Control Panel</h3>
                  </div>
                  
                  {/* Camera Selection Dropdown */}
                  <div className="relative z-10" ref={dropdownRef}>
                    <button
                      onClick={() => setShowCameraModal(true)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-xs transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      {cameras.find(cam => cam.id === selectedCamera)?.appName || 'Select Camera'}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>

                    {/* Camera Dropdown Menu */}
                    {/* {showCameraDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl shadow-gray-200/20 z-[9999] overflow-hidden">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Available Cameras</div>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {cameras.map((camera) => (
                              <button
                                key={camera.id}
                                onClick={() => handleCameraSelect(camera.id)}
                                className={`w-full p-2 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                                  camera.id === selectedCamera
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  camera.id === selectedCamera ? 'bg-blue-200' : 'bg-gray-200'
                                }`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{camera.appName || camera.name}</div>
                                  <div className="text-xs opacity-75">
                                    {camera.id === selectedCamera ? 'Currently Selected' : 'Available'}
                                  </div>
                                </div>
                                {camera.id === selectedCamera && (
                                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSectionName('Joystick')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${SectionName === 'Joystick'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-lg shadow-blue-200/50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent hover:border-gray-300'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                    Joystick
                  </button>

                  <button
                    onClick={() => setSectionName('Preset')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${SectionName === 'Preset'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-lg shadow-blue-200/50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent hover:border-gray-300'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                    </svg>
                    Preset
                  </button>

                  <button
                    onClick={() => setSectionName('Patrol')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${SectionName === 'Patrol'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-lg shadow-blue-200/50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent hover:border-gray-300'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    Patrol
                  </button>
                </div>
              </div>

              {/* PTZ Control */}
              {SectionName == "Joystick" && <div className="bg-white/80 h-[calc(93vh-140px)] backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-lg shadow-gray-200/20">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-700">Joystick Control</h3>
                </div>

                {/* Joystick Container */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-52 h-52 bg-gray-100 rounded-full border-2 border-gray-300 shadow-inner backdrop-blur-sm">
                    <div ref={joystickRef} className="absolute inset-0 rounded-full"></div>

                    {/* Center indicator */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-4 h-4 bg-gray-300 rounded-full border border-gray-400"></div>
                    </div>

                    {/* Direction indicators */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-gray-600 text-sm font-medium">↑</div>
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-gray-600 text-sm font-medium">↓</div>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm font-medium">←</div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm font-medium">→</div>

                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
                    </div>
                  </div>
                </div>

                {/* Zoom Control */}
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        Zoom Level
                      </span>
                      <div className="px-2 bg-gray-200 rounded-lg text-sm font-mono text-gray-700 border border-gray-400">
                        {zoomLevel}%
                      </div>
                    </div>

                    {/* Enhanced Zoom Slider */}
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={zoomLevel}
                        onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider border border-gray-400"
                        title="Zoom level control"
                        aria-label="Camera zoom level"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={zoomLevel}
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${zoomLevel}%, #d1d5db ${zoomLevel}%, #d1d5db 100%)`
                        }}
                      />

                      {/* Zoom Labels */}
                      <div className="flex justify-between text-xs text-gray-500 ">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Zoom Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleZoomChange(0)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleZoomChange(25)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => handleZoomChange(50)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => handleZoomChange(100)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
                    >
                      100%
                    </button>
                  </div>
                </div>
              </div>}


              {/* Preset Controls */}
              {SectionName == "Preset" && <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-200/20 flex flex-col h-[calc(93vh-140px)]">
                <div className="flex items-center space-x-2 p-4 border-b border-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-700">Preset Management</h3>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* Add New Preset Form */}
                  <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Create New Preset
                      </h4>
                      <button
                        onClick={() => setShowCreatePresetModal(!showCreatePresetModal)}
                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-all duration-200 border border-blue-300"
                      >
                        {showCreatePresetModal ? 'Cancel' : 'Add'}
                      </button>
                    </div>

                    {showCreatePresetModal && (
                      <form className="space-y-3">
                        {/* Preset Name */}
                        <div>
                          <input
                            type="text"
                            placeholder="Preset Name"
                            className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                          />
                        </div>

                        {/* Use Current Position Checkbox */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="useCurrentPosition"
                            checked={useCurrentPosition}
                            onChange={(e) => setUseCurrentPosition(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor="useCurrentPosition" className="text-xs text-gray-600 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                            </svg>
                            Use Current Camera Position
                          </label>
                        </div>

                        {/* Position Inputs - Only show when checkbox is checked */}
                        {useCurrentPosition && (
                          <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs font-medium text-blue-700 mb-2">Current Position Values</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Pan</label>
                                <input
                                  type="number"
                                  value={speeds.Pan}
                                  readOnly
                                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Tilt</label>
                                <input
                                  type="number"
                                  value={speeds.Tilt}
                                  readOnly
                                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Zoom</label>
                                <input
                                  type="number"
                                  value={zoomLevel}
                                  readOnly
                                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Manual Position Inputs - Only show when checkbox is unchecked */}
                        {!useCurrentPosition && (
                          <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">Manual Position Values</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Pan</label>
                                <input
                                  type="number"
                                  placeholder="0.5"
                                  min={0} max={1} step={0.01}
                                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Tilt</label>
                                <input
                                  type="number"
                                  placeholder="0.5"
                                  min={0} max={1} step={0.01}
                                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Zoom</label>
                                <input
                                  type="number"
                                  placeholder="50"
                                  min={0} max={100} step={1}
                                  className="w-full px-2 py-1.5 bg-white text-gray-700 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          className="w-full px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded border border-green-300 transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14"></path>
                          </svg>
                          Create
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Preset Grid */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                        </svg>
                        Saved Presets
                      </h4>
                      
                      {/* Select All Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPresets.length === 12 && 12 > 0}
                          onChange={handleSelectAllPresets}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-xs text-gray-600">Select All</span>
                      </div>
                    </div>

                    {/* Bulk Actions - Show when presets are selected */}
                    {selectedPresets.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            {selectedPresets.length} preset{selectedPresets.length > 1 ? 's' : ''} selected
                          </span>
                          <div className="flex items-center gap-2">
                           
                            <button
                              onClick={handleDeleteSelectedPresets}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-all duration-200 border border-red-300 flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 h-[calc(74vh-200px)] overflow-y-auto custom-scrollbar">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((preset) => (
                        <div
                          key={preset}
                          className={`group relative px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                            selectedPresets.includes(preset) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedPresets.includes(preset)}
                              onChange={() => handlePresetSelect(preset)}
                              className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                            />
                            
                            {/* Preset Info */}
                            <div className="flex-1 flex items-center justify-between">
                              <div className="text-left">
                                <div className="text-xs font-medium">P{preset}</div>
                                <div className="text-xs text-gray-500">0.5, 0.3</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditPreset({ id: preset, name: `P${preset}`, pan: 0.5, tilt: 0.3, zoom: 50 })}
                                    className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-all duration-200"
                                    title="Edit Preset"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete preset P${preset}?`)) {
                                        console.log("Deleting preset:", preset);
                                      }
                                    }}
                                    className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-all duration-200"
                                    title="Delete Preset"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3,6 5,6 21,6"></polyline>
                                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>}


              {/* Patrol Controls */}
              {SectionName == "Patrol" && <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-200/20 h-[calc(93vh-140px)]">
                <div className="flex items-center justify-between p-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-700">Patrol System</h3>
                  </div>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${patrolStatus === 'running'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : patrolStatus === 'paused'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${patrolStatus === 'running' ? 'bg-green-500 animate-pulse' :
                        patrolStatus === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                    {patrolStatus === 'running' ? 'Active' :
                      patrolStatus === 'paused' ? 'Paused' : 'Standby'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Status Panel */}
                  {/* <div className="bg-gray-100 rounded-lg  border border-gray-300">
                    <div className="flex items-center justify-between ">
                      <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 6v6l4 2"></path>
                        </svg>
                        System Status
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${patrolStatus === 'running' ? 'bg-green-500 animate-pulse' :
                          patrolStatus === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}></div>
                        <span className="text-xs text-gray-600">
                          {patrolStatus === 'running' ? 'Patrol Active' :
                            patrolStatus === 'paused' ? 'Patrol Paused' : 'System Ready'}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    {/* {patrolStatus !== 'idle' && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Step {currentPatrolStep + 1} of 4</span>
                          <span>{patrolProgress}% Complete</span>
                        </div>
                        <div className="h-3 bg-gray-300 rounded-full overflow-hidden border border-gray-400">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${patrolProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>  */}

                  {/* Patrol Patterns */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        Available Patterns
                      </h4>
                      
                      {/* Select All Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPatrolPatterns.length === patrolPatterns.length && patrolPatterns.length > 0}
                          onChange={handleSelectAllPatrolPatterns}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-xs text-gray-600">Select All</span>
                      </div>
                    </div>

                    {/* Bulk Actions - Show when patterns are selected */}
                    {/* {selectedPatrolPatterns.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            {selectedPatrolPatterns.length} pattern{selectedPatrolPatterns.length > 1 ? 's' : ''} selected
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const firstSelected = patrolPatterns.find(p => selectedPatrolPatterns.includes(p.id));
                                if (firstSelected) handleEditPatrolPattern(firstSelected);
                              }}
                              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-all duration-200 border border-blue-300 flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={handleDeleteSelectedPatrolPatterns}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-all duration-200 border border-red-300 flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )} */}

                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                      {patrolPatterns.slice(0, 12).map((pattern) => (
                        <div
                          key={pattern.id}
                          className={`w-full p-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-md group ${
                            selectedPatrolPatterns.includes(pattern.id) ? ' bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedPatrolPatterns.includes(pattern.id)}
                              onChange={() => handlePatrolPatternSelect(pattern.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            
                            {/* Pattern Info */}
                            <div className="flex-1 flex justify-between items-center">
                              <div className="text-left">
                                <div className="text-sm font-medium">{pattern.name}</div>
                                <div className="text-xs text-gray-500">
                                  Pan: {pattern.pan} • Tilt: {pattern.tilt} • Zoom: {pattern.zoom}%
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-xs text-gray-500">{pattern.zoom}%</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startPatrol(pattern.id)}
                                disabled={patrolStatus === 'running'}
                                className="p-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-green-700 disabled:text-gray-400 rounded transition-all duration-200"
                                title="Start Patrol"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5,3 19,12 5,21"></polygon>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEditPatrolPattern(pattern)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-all duration-200"
                                title="Edit Pattern"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete patrol pattern "${pattern.name}"?`)) {
                                    console.log("Deleting patrol pattern:", pattern);
                                    // Here you would typically make an API call to delete the pattern
                                  }
                                }}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-all duration-200"
                                title="Delete Pattern"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3,6 5,6 21,6"></polyline>
                                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {patrolStatus === 'idle' ? (
                      <button
                        onClick={() => startPatrol(1)}
                        className="px-4 py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded-lg border border-green-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        Start Patrol
                      </button>
                    ) : patrolStatus === 'running' ? (
                      <>
                        <button
                          onClick={pausePatrol}
                          className="px-4 py-3 bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700 rounded-lg border border-yellow-300 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-200/50 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </svg>
                          Pause
                        </button>
                        <button
                          onClick={stopPatrol}
                          className="px-4 py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 rounded-lg border border-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="6" width="12" height="12"></rect>
                          </svg>
                          Stop
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={resumePatrol}
                          className="px-4 py-3 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 rounded-lg border border-green-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                          </svg>
                          Resume
                        </button>
                        <button
                          onClick={stopPatrol}
                          className="px-4 py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 rounded-lg border border-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="6" width="12" height="12"></rect>
                          </svg>
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>}
          </div>
        
        </div>
      </div>

      {/* Camera Selection Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl w-96 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Select Camera</h3>
                  <p className="text-sm text-gray-500">Choose a camera to switch to</p>
                </div>
              </div>
              <button
                onClick={() => setShowCameraModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close camera selection modal"
                aria-label="Close camera selection modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="space-y-3">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => handleCameraSelect(camera.id)}
                    className={`w-full p-4 rounded-lg border transition-all duration-200 flex items-center gap-4 ${
                      camera.id === selectedCamera
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      camera.id === selectedCamera
                        ? 'bg-blue-200'
                        : 'bg-gray-200'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{camera.appName || camera.name}</div>
                      <div className="text-sm opacity-75">
                        {camera.id === selectedCamera ? 'Currently Selected' : 'Available'}
                      </div>
                    </div>
                    {camera.id === selectedCamera && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-300">
              <button
                onClick={() => setShowCameraModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patrol Pattern Modal */}
      {showEditPatrolModal && editingPatrolPattern && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl w-96 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Edit Patrol Pattern</h3>
                  <p className="text-sm text-gray-500">Modify pattern settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditPatrolModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close edit modal"
                aria-label="Close edit modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const updatedPattern = {
                  ...editingPatrolPattern,
                  name: formData.get('name') as string,
                  pan: parseFloat(formData.get('pan') as string),
                  tilt: parseFloat(formData.get('tilt') as string),
                  zoom: parseInt(formData.get('zoom') as string)
                };
                handleSavePatrolPattern(updatedPattern);
              }}>
                {/* Pattern Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pattern Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingPatrolPattern.name}
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Pan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pan</label>
                  <input
                    type="number"
                    name="pan"
                    defaultValue={editingPatrolPattern.pan || 0.5}
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Tilt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tilt</label>
                  <input
                    type="number"
                    name="tilt"
                    defaultValue={editingPatrolPattern.tilt || 0.5}
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Zoom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                  <input
                    type="number"
                    name="zoom"
                    defaultValue={editingPatrolPattern.zoom || 50}
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-300">
              <button
                onClick={() => setShowEditPatrolModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    const formData = new FormData(form);
                    const updatedPattern = {
                      ...editingPatrolPattern,
                      name: formData.get('name') as string,
                      pan: parseFloat(formData.get('pan') as string),
                      tilt: parseFloat(formData.get('tilt') as string),
                      zoom: parseInt(formData.get('zoom') as string)
                    };
                    handleSavePatrolPattern(updatedPattern);
                  }
                }}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Preset Modal */}
      {showEditPresetModal && editingPreset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-2xl w-96 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Edit Preset</h3>
                  <p className="text-sm text-gray-500">Modify preset settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditPresetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close edit modal"
                aria-label="Close edit modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const updatedPreset = {
                  ...editingPreset,
                  name: formData.get('name') as string,
                  pan: parseFloat(formData.get('pan') as string),
                  tilt: parseFloat(formData.get('tilt') as string),
                  zoom: parseInt(formData.get('zoom') as string)
                };
                handleSavePreset(updatedPreset);
              }}>
                {/* Preset Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preset Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingPreset.name}
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Pan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pan</label>
                  <input
                    type="number"
                    name="pan"
                    defaultValue={editingPreset.pan || 0.5}
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Tilt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tilt</label>
                  <input
                    type="number"
                    name="tilt"
                    defaultValue={editingPreset.tilt || 0.5}
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {/* Zoom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                  <input
                    type="number"
                    name="zoom"
                    defaultValue={editingPreset.zoom || 50}
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-300">
              <button
                onClick={() => setShowEditPresetModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    const formData = new FormData(form);
                    const updatedPreset = {
                      ...editingPreset,
                      name: formData.get('name') as string,
                      pan: parseFloat(formData.get('pan') as string),
                      tilt: parseFloat(formData.get('tilt') as string),
                      zoom: parseInt(formData.get('zoom') as string)
                    };
                    handleSavePreset(updatedPreset);
                  }
                }}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoniterPage;


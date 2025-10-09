


import { useEffect, useRef, useState, useCallback } from "react";
import nipplejs from "nipplejs";
import { cameraApi, type Camera } from "../utils/cameraApi";

function MoniterPage() {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // State for Pan/Tilt
  const [speeds, setSpeeds] = useState({ Pan: 0.5, Tilt: 0.5 });
  const [zoomLevel, setZoomLevel] = useState(50); // Zoom percentage (0-100) - Display only
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [patrolStatus, setPatrolStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [currentPatrolStep, setCurrentPatrolStep] = useState(0);
  const [patrolProgress, setPatrolProgress] = useState(0);
  const cameraId = "CAM001"; // Example camera ID, aap dynamic bhi kar sakte ho
  const zoomLevelRef = useRef<number>(50);
  const [showCreatePresetModal, setShowCreatePresetModal] = useState(false);
  const [SectionName, setSectionName] = useState('Joystick');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Load cameras from API
  const loadCameras = async () => {
    setCamerasLoading(true);
    setCamerasError(null);
    
    try {
      const cameraData = await cameraApi.getCameras();
      setCameras(cameraData);
      console.log('✅ Cameras loaded successfully:', cameraData.length);
    } catch (error) {
      console.error('❌ Error loading cameras:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cameras';
      setCamerasError(errorMessage);
      
      // If authentication failed, redirect to login
      if (errorMessage.includes('Authentication failed') || errorMessage.includes('No authentication token')) {
        console.log('🔐 Authentication failed, redirecting to login...');
        window.location.href = '/login';
      }
    } finally {
      setCamerasLoading(false);
    }
  };

  // Refresh cameras data
  const refreshCameras = async () => {
    try {
      const cameraData = await cameraApi.refreshCameras();
      setCameras(cameraData);
      setCamerasError(null);
      console.log('✅ Cameras refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing cameras:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh cameras';
      setCamerasError(errorMessage);
      
      // If authentication failed, redirect to login
      if (errorMessage.includes('Authentication failed') || errorMessage.includes('No authentication token')) {
        console.log('🔐 Authentication failed, redirecting to login...');
        window.location.href = '/login';
      }
    }
  };

  const handleCameraSelect = (cameraId: string) => {
    setSelectedCamera(cameraId);
    setShowCameraDropdown(false);
    setShowCameraModal(false);
  };

  const handleCameraButtonClick = () => {
    if (selectedCamera) {
      // If camera is already selected, show modal
      setShowCameraModal(true);
    } else {
      // If no camera selected, show dropdown
      setShowCameraDropdown(!showCameraDropdown);
    }
  };

  // Load cameras on component mount
  useEffect(() => {
    loadCameras();
  }, []);

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
    { id: 1, name: "Standard Patrol", duration: 300, steps: 4 },
    { id: 2, name: "Quick Scan", duration: 120, steps: 2 },
    { id: 3, name: "Detailed Survey", duration: 600, steps: 8 },
    { id: 4, name: "Perimeter Check", duration: 180, steps: 3 },
    { id: 1, name: "Standard Patrol", duration: 300, steps: 4 },
    { id: 2, name: "Quick Scan", duration: 120, steps: 2 },
    { id: 3, name: "Detailed Survey", duration: 600, steps: 8 },
    { id: 4, name: "Perimeter Check", duration: 180, steps: 3 }, { id: 1, name: "Standard Patrol", duration: 300, steps: 4 },
    { id: 2, name: "Quick Scan", duration: 120, steps: 2 },
    { id: 3, name: "Detailed Survey", duration: 600, steps: 8 },
    { id: 4, name: "Perimeter Check", duration: 180, steps: 3 }
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
      duration: pattern.duration
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Main Content */}
      <div className="pt-16 p-6">
        <div className={`grid grid-cols-1 gap-6  ${selectedCamera ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} min-h-[calc(100vh-140px)]`}>

          {/* Video Stream Section */}
          <div className="lg:col-span-2 space-y-2 pt-2   ">
            {/* Connection Status & Speed Controls */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 shadow-lg ">
              {!selectedCamera ? (
                /* Camera Selection - Centered */
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Select Camera</h3>
                  <p className="text-slate-300 text-sm mb-6 text-center max-w-md">
                    Choose a camera to start monitoring and controlling PTZ operations
                  </p>

                  {/* Camera Dropdown */}
                  <div className="relative w-full max-w-sm" ref={dropdownRef}>
                    <button
                      onClick={() => setShowCameraDropdown(!showCameraDropdown)}
                      disabled={camerasLoading}
                      className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-lg border border-slate-600/50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>
                        {camerasLoading ? 'Loading cameras...' : 
                         camerasError ? 'Error loading cameras' :
                         selectedCamera ? cameras.find(c => c.id === selectedCamera)?.name || 'Select a camera' :
                         'Select a camera'}
                      </span>
                      <div className="flex items-center gap-2">
                        {camerasLoading && (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {camerasError && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshCameras();
                            }}
                            className="p-1 hover:bg-slate-600/50 rounded transition-colors"
                            title="Retry loading cameras"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                              <path d="M21 3v5h-5"></path>
                              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                              <path d="M3 21v-5h5"></path>
                            </svg>
                          </button>
                        )}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </div>
                    </button>

                    {showCameraDropdown && (
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-2xl z-[9999] w-80 max-h-48 overflow-y-auto">
                        {/* Header with refresh button */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/30">
                          <span className="text-xs text-slate-400">Available Cameras</span>
                          <button
                            onClick={refreshCameras}
                            disabled={camerasLoading}
                            className="p-1 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                            title="Refresh cameras"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                              <path d="M21 3v5h-5"></path>
                              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                              <path d="M3 21v-5h5"></path>
                            </svg>
                          </button>
                        </div>

                        {/* Loading state */}
                        {camerasLoading && (
                          <div className="px-4 py-6 text-center">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-xs text-slate-400">Loading cameras...</p>
                          </div>
                        )}

                        {/* Error state */}
                        {camerasError && !camerasLoading && (
                          <div className="px-4 py-6 text-center">
                            <div className="text-red-400 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            </div>
                            <p className="text-xs text-red-400 mb-2">Failed to load cameras</p>
                            <p className="text-xs text-slate-500 mb-3">{camerasError}</p>
                            <button
                              onClick={refreshCameras}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                            >
                              Try Again
                            </button>
                          </div>
                        )}

                        {/* Empty state */}
                        {!camerasLoading && !camerasError && cameras.length === 0 && (
                          <div className="px-4 py-6 text-center">
                            <div className="text-slate-400 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                              </svg>
                            </div>
                            <p className="text-xs text-slate-400">No cameras available</p>
                          </div>
                        )}

                        {/* Camera list */}
                        {!camerasLoading && !camerasError && cameras.length > 0 && (
                          <>
                            {cameras.map((camera) => (
                              <button
                                key={camera.id}
                                onClick={() => handleCameraSelect(camera.id)}
                                className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors border-b border-slate-700/30 last:border-b-0 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    camera.status === 'online' ? 'bg-green-400' :
                                    camera.status === 'offline' ? 'bg-red-400' :
                                    'bg-yellow-400'
                                  }`}></div>
                                  <span>{camera.appName || camera.name}</span>
                                </div>
                                {camera.location && (
                                  <span className="text-xs text-slate-500">{camera.location}</span>
                                )}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Camera Selected - Show Controls */
                <>
                  <div className="flex items-center justify-between mb-2">
                    {/* <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-white">Live Stream</h3>
                    </div> */}
                    <div className="flex items-center gap-3">
                      {/* Camera Name - Clickable */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={handleCameraButtonClick}
                          className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg border border-slate-600/50 text-xs transition-colors flex items-center gap-2"
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

                      </div>

                      {/* Connection Status */}
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${connectionStatus === 'connected'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : connectionStatus === 'connecting'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                              'bg-red-400'
                          }`}></div>
                        {connectionStatus === 'connected' ? 'Connected' :
                          connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                      </div>
                    </div>
                  </div>

                  {/* Speed Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(speeds).map((label, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            {label} Speed
                          </label>
                          <div className="px-2 bg-slate-700/50 rounded-lg text-xs font-mono text-white border border-slate-600/30">
                            {speeds[label as keyof typeof speeds].toFixed(1)}
                          </div>
                        </div>

                        {/* Enhanced Speed Bar */}
                        <div className="relative">
                          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 rounded-full transition-all duration-300 shadow-sm"
                              style={{ width: `${speeds[label as keyof typeof speeds] * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>0.0</span>
                            <span>0.5</span>
                            <span>1.0</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Video Player - Only show when camera is selected */}
            {selectedCamera && (
              <div className="bg-slate-800/30 backdrop-blur-sm h-[calc(92vh-140px)] rounded-xl border border-slate-700/50 shadow-2xl">
                <div className="aspect-video h-full w-full bg-slate-900 relative overflow-hidden rounded-xl">
                  <video
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    controls
                    className="w-full h-full object-cover"
                  />
                  {/* Video Overlay Info */}
                  <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/50 z-10">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-300">1080p</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Panel - Only show when camera is selected */}
          {selectedCamera && (
            <div className="space-y-2 pt-2">
              {/* Section Toggle */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-2 shadow-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">PTZ Control Panel</h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSectionName('Joystick')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${SectionName === 'Joystick'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-transparent hover:border-slate-600/50'
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
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-transparent hover:border-slate-600/50'
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
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-transparent hover:border-slate-600/50'
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
              {SectionName == "Joystick" && <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Joystick Control</h3>
                </div>

                {/* Joystick Container */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-52 h-52 bg-slate-700/30 rounded-full border-2 border-slate-600/50 shadow-inner backdrop-blur-sm">
                    <div ref={joystickRef} className="absolute inset-0 rounded-full"></div>

                    {/* Center indicator */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-4 h-4 bg-white/20 rounded-full border border-white/30"></div>
                    </div>

                    {/* Direction indicators */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-slate-300 text-sm font-medium">↑</div>
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-slate-300 text-sm font-medium">↓</div>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300 text-sm font-medium">←</div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300 text-sm font-medium">→</div>

                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-600/30"></div>
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600/30"></div>
                    </div>
                  </div>
                </div>

                {/* Zoom Control */}
                <div className="space-y-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        Zoom Level
                      </span>
                      <div className="px-2 bg-slate-600/50 rounded-lg text-sm font-mono text-white border border-slate-500/30">
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
                        className="w-full h-2 bg-slate-600/50 rounded-lg appearance-none cursor-pointer slider border border-slate-500/30"
                        title="Zoom level control"
                        aria-label="Camera zoom level"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={zoomLevel}
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${zoomLevel}%, #475569 ${zoomLevel}%, #475569 100%)`
                        }}
                      />

                      {/* Zoom Labels */}
                      <div className="flex justify-between text-xs text-slate-400 ">
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
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleZoomChange(25)}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => handleZoomChange(50)}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => handleZoomChange(100)}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                    >
                      100%
                    </button>
                  </div>
                </div>
              </div>}


              {/* Preset Controls */}
              {SectionName == "Preset" && <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-lg flex flex-col">
                <div className="flex items-center space-x-2 p-4 border-b border-slate-600/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Preset Management</h3>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* Add New Preset Form */}
                  <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Create New Preset
                      </h4>
                      <button
                        onClick={() => setShowCreatePresetModal(!showCreatePresetModal)}
                        className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-all duration-200 border border-blue-500/30"
                      >
                        {showCreatePresetModal ? 'Cancel' : 'Add'}
                      </button>
                    </div>

                    {showCreatePresetModal && (
                      <form className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Name"
                            className="w-full px-2 py-1.5 bg-slate-600/50 text-white rounded border border-slate-500/50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                          />
                          <input
                            type="number"
                            placeholder="Pan"
                            min={0} max={1} step={0.01}
                            className="w-full px-2 py-1.5 bg-slate-600/50 text-white rounded border border-slate-500/50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                          />
                          <input
                            type="number"
                            placeholder="Tilt"
                            min={0} max={1} step={0.01}
                            className="w-full px-2 py-1.5 bg-slate-600/50 text-white rounded border border-slate-500/50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                          />
                          <input
                            type="number"
                            placeholder="Zoom"
                            min={0} max={100} step={1}
                            className="w-full px-2 py-1.5 bg-slate-600/50 text-white rounded border border-slate-500/50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                          />
                        </div>

                        <button
                          type="button"
                          className="w-full px-3 py-1.5 bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 text-green-400 rounded border border-green-500/30 transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1"
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
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                      </svg>
                      Saved Presets
                    </h4>
                    <div className="grid grid-cols-2 gap-2 h-[calc(74vh-200px)] overflow-y-auto custom-scrollbar">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((preset) => (
                        <button
                          key={preset}
                          className="group relative px-3 py-2 bg-gradient-to-br from-slate-700/60 to-slate-600/40 hover:from-slate-600/60 hover:to-slate-500/40 text-white rounded-lg border border-slate-600/50 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <div className="text-xs font-medium">P{preset}</div>
                              <div className="text-xs text-slate-400">0.5, 0.3</div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>}


              {/* Patrol Controls */}
              {SectionName == "Patrol" && <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between p-2 border-b border-slate-600/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Patrol System</h3>
                  </div>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${patrolStatus === 'running'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : patrolStatus === 'paused'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${patrolStatus === 'running' ? 'bg-green-400 animate-pulse' :
                        patrolStatus === 'paused' ? 'bg-yellow-400' : 'bg-slate-400'
                      }`}></div>
                    {patrolStatus === 'running' ? 'Active' :
                      patrolStatus === 'paused' ? 'Paused' : 'Standby'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Status Panel */}
                  <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 6v6l4 2"></path>
                        </svg>
                        System Status
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${patrolStatus === 'running' ? 'bg-green-400 animate-pulse' :
                          patrolStatus === 'paused' ? 'bg-yellow-400' : 'bg-slate-400'
                          }`}></div>
                        <span className="text-xs text-slate-300">
                          {patrolStatus === 'running' ? 'Patrol Active' :
                            patrolStatus === 'paused' ? 'Patrol Paused' : 'System Ready'}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    {patrolStatus !== 'idle' && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-slate-400">
                          <span>Step {currentPatrolStep + 1} of 4</span>
                          <span>{patrolProgress}% Complete</span>
                        </div>
                        <div className="h-3 bg-slate-600/50 rounded-full overflow-hidden border border-slate-500/30">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${patrolProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patrol Patterns */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                      Available Patterns
                    </h4>

                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {patrolPatterns.slice(0, 4).map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => startPatrol(pattern.id)}
                          disabled={patrolStatus === 'running'}
                          className="w-full p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/30 hover:from-slate-600/50 hover:to-slate-500/30 disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:cursor-not-allowed text-white rounded-lg border border-slate-600/50 transition-all duration-200 hover:shadow-md group"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <div className="text-sm font-medium">{pattern.name}</div>
                              <div className="text-xs text-slate-400">{pattern.steps} steps • {pattern.duration}s duration</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                              <span className="text-xs text-slate-400">{pattern.duration}s</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {patrolStatus === 'idle' ? (
                      <button
                        onClick={() => startPatrol(1)}
                        className="px-4 py-3 bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 text-sm font-medium flex items-center justify-center gap-2"
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
                          className="px-4 py-3 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 hover:from-yellow-600/30 hover:to-yellow-500/30 text-yellow-400 rounded-lg border border-yellow-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </svg>
                          Pause
                        </button>
                        <button
                          onClick={stopPatrol}
                          className="px-4 py-3 bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10 text-sm font-medium flex items-center justify-center gap-2"
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
                          className="px-4 py-3 bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                          </svg>
                          Resume
                        </button>
                        <button
                          onClick={stopPatrol}
                          className="px-4 py-3 bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10 text-sm font-medium flex items-center justify-center gap-2"
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
          )}
        </div>
      </div>

      {/* Camera Selection Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-2xl w-96 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Select Camera</h3>
                  <p className="text-sm text-slate-400">Choose a camera to switch to</p>
                </div>
              </div>
              <button
                onClick={() => setShowCameraModal(false)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
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
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      camera.id === selectedCamera
                        ? 'bg-blue-500/20'
                        : 'bg-slate-600/50'
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-600/30">
              <button
                onClick={() => setShowCameraModal(false)}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoniterPage;

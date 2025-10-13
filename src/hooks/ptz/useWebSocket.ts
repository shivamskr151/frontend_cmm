import { useEffect, useRef, useState, useCallback } from 'react';
import { config } from '../../utils/config';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

// Global WebSocket singleton
class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null = null;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private subscribers: Set<(status: 'connecting' | 'connected' | 'disconnected') => void> = new Set();
  private messageHandlers: Set<(message: any) => void> = new Set();
  private currentCameraId: string = '';
  private isConnecting: boolean = false;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  subscribeToStatus(callback: (status: 'connecting' | 'connected' | 'disconnected') => void) {
    this.subscribers.add(callback);
    // Immediately call with current status
    callback(this.connectionStatus);
    return () => this.subscribers.delete(callback);
  }

  subscribeToMessages(callback: (message: any) => void) {
    this.messageHandlers.add(callback);
    return () => this.messageHandlers.delete(callback);
  }

  private notifyStatusChange(status: 'connecting' | 'connected' | 'disconnected') {
    this.connectionStatus = status;
    this.subscribers.forEach(callback => callback(status));
  }

  private notifyMessage(message: any) {
    this.messageHandlers.forEach(callback => callback(message));
  }

  connect(token: string, cameraId: string) {
    // Validate cameraId before connecting
    if (!cameraId) {
      console.error('❌ Cannot connect WebSocket: cameraId is required');
      this.notifyStatusChange('disconnected');
      return;
    }

    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      console.log('🔌 WebSocket already connected or connecting, skipping...');
      this.currentCameraId = cameraId;
      return;
    }

    this.isConnecting = true;
    this.currentCameraId = cameraId;
    this.notifyStatusChange('connecting');

    const wsUrl = `${config.websocket.url}?token=${encodeURIComponent(token)}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, '***'));

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected");
      this.isConnecting = false;
      this.notifyStatusChange('connected');
      
      // Send initial joystick connect message
      this.sendMessage({
        type: 'joystick_connect',
        data: {
          deviceId: this.currentCameraId,
          userId: 'anonymous' // Will be updated when client data is available
        }
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📩 Server:", message);
        this.notifyMessage(message);
      } catch (error) {
        console.log("📩 Server (raw):", event.data);
      }
    };

    this.socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      this.isConnecting = false;
      this.notifyStatusChange('disconnected');
    };

    this.socket.onclose = (event) => {
      console.log("⚠️ WebSocket disconnected", event.code, event.reason);
      this.isConnecting = false;
      this.notifyStatusChange('disconnected');
    };
  }

  sendMessage(message: WebSocketMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return;
    }
    
    const messageToSend = {
      type: message.type,
      data: message.data,
      timestamp: Date.now()
    };
    
    this.socket.send(JSON.stringify(messageToSend));
    console.log("📤 Sent:", messageToSend);
  }

  switchCamera(cameraId: string) {
    // Validate cameraId
    if (!cameraId) {
      console.error('❌ Cannot switch camera: cameraId is required');
      return;
    }

    if (this.currentCameraId !== cameraId) {
      this.currentCameraId = cameraId;
      console.log('🔄 Camera changed, sending joystick_connect for:', cameraId);
      
      this.sendMessage({
        type: 'joystick_connect',
        data: {
          deviceId: cameraId,
          userId: 'anonymous'
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
    this.notifyStatusChange('disconnected');
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }
}

export const useWebSocket = (cameraId: string) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [ptzStatus, setPtzStatus] = useState<any>(null);
  const [ptzStatusLoading, setPtzStatusLoading] = useState(false);
// const [joysticValues, setJoysticValues] = useState({ Pan: 0, Tilt: 0 });
  const wsManager = useRef(WebSocketManager.getInstance());
  const ptzStatusRequested = useRef(false);

  // Get JWT token from localStorage using the correct key
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('access_token') || localStorage.getItem('bearer_token');
  }, []);

  // Initialize WebSocket connection (only when cameraId is available)
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.error('❌ No authentication token found');
      setConnectionStatus('disconnected');
      return;
    }

    // Only connect if we have a valid cameraId
    if (!cameraId) {
      console.log('⏳ Waiting for camera selection before connecting WebSocket...');
      setConnectionStatus('disconnected');
      return;
    }

    console.log('🔌 Connecting WebSocket for camera:', cameraId);
    // Connect to WebSocket using singleton
    wsManager.current.connect(token, cameraId);

    // Subscribe to connection status changes
    const unsubscribeStatus = wsManager.current.subscribeToStatus(setConnectionStatus);

    // Subscribe to messages
    const unsubscribeMessages = wsManager.current.subscribeToMessages((message) => {
      // Handle different message types
      if (message.type === 'connection_established') {
        console.log('🎉 WebSocket connection established');
      } else if (message.type === 'error') {
        console.error('❌ Server error:', message.data);
      } else if (message.type === 'ptz_status') {
        console.log('📊 PTZ Status received:', message.data);
        // setJoysticValues({Pan: message.data.pan_tilt.position.x, Tilt: message.data.pan_tilt.position.y});
        setPtzStatus(message.data);
        setPtzStatusLoading(false);
        ptzStatusRequested.current = false; // Reset flag after receiving response
      } else if (message.type === 'ptz_status_ack') {
        console.log('✅ PTZ Status acknowledgment:', message.data);
        if (message.data.success) {
          setPtzStatus(message.data.response);
        }
        setPtzStatusLoading(false);
        ptzStatusRequested.current = false; // Reset flag after receiving response
      } else if (message.type === 'ptz_move') {
        console.log('🎮 PTZ Move received:', message.data);
        // Handle PTZ move message (broadcasted to all clients)
      } else if (message.type === 'ptz_move_ack') {
        console.log('✅ PTZ Move acknowledgment:', message.data);
        // Handle PTZ move acknowledgment (sent only to the client that initiated the move)
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, [getAuthToken, cameraId]);

  // Handle camera changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      wsManager.current.switchCamera(cameraId);
    }
    
    // Reset PTZ status request flag when camera changes
    ptzStatusRequested.current = false;
    setPtzStatus(null); // Clear previous PTZ status
  }, [cameraId, connectionStatus]);

  // Debounce timer for movement commands
  const movementTimeoutRef = useRef<number | null>(null);

  // Send movement command with debouncing
  const sendMovement = useCallback((speeds: { Pan: number; Tilt: number }, zoom: number) => {
    // Clear previous timeout
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }

    // Debounce movement commands to reduce WebSocket traffic
    movementTimeoutRef.current = setTimeout(() => {
      const message: WebSocketMessage = {
        type: "continuousMove",
        data: {
          cameraId,
          panTilt: {
            position: { x: 0, y: 0 }, // Not used for continuous move
            speed: { x: speeds.Pan, y: speeds.Tilt }
          },
          zoom: {
            position: { x: 0 }, // Not used for continuous move
            speed: { x: zoom }
          },
          timeout: 1000
        }
      };
      wsManager.current.sendMessage(message);
    }, 50); // 50ms debounce
  }, [cameraId]);

  // Send zoom command
  const sendZoom = useCallback((zoom: number) => {
    const message: WebSocketMessage = {
      type: "continuousMove",
      data: {
        cameraId,
        panTilt: {
          position: { x: 0, y: 0 },
          speed: { x: 0, y: 0 } // No pan/tilt movement
        },
        zoom: {
          position: { x: 0 },
          speed: { x: zoom }
        },
        timeout: 1000
      }
    };
    wsManager.current.sendMessage(message);
  }, [cameraId]);

  // Send stop command
  const sendStop = useCallback(() => {
    // Clear any pending movement commands
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }

    const message: WebSocketMessage = {
      type: "stop",
      data: {
        cameraId,
        pan_tilt: true,
        zoom: true
      }
    };
    wsManager.current.sendMessage(message);
  }, [cameraId]);

  // Send patrol command
  const sendPatrolCommand = useCallback((action: string, patternId?: number, pattern?: any) => {
    const message: WebSocketMessage = {
      type: action,
      data: {
        cameraId,
        patternId,
        pattern: pattern?.name,
        pan: pattern?.pan,
        tilt: pattern?.tilt,
        zoom: pattern?.zoom
      }
    };
    wsManager.current.sendMessage(message);
  }, [cameraId]);

  // Get PTZ status (only once per camera selection)
  const getPTZStatus = useCallback(() => {
    // Prevent duplicate requests for the same camera
    if (ptzStatusRequested.current) {
      console.log('📊 PTZ status already requested for this camera, skipping...');
      return;
    }

    console.log('📊 Requesting PTZ status for camera:', cameraId);
    ptzStatusRequested.current = true;
    setPtzStatusLoading(true);
    
    const message: WebSocketMessage = {
      type: "getPTZStatus",
      data: {
        cameraId,
        profileToken: undefined // You can add profileToken if needed
      }
    };
    wsManager.current.sendMessage(message);
  }, [cameraId]);

  // Cleanup function to clear timers
  useEffect(() => {
    return () => {
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    sendMovement,
    sendZoom,
    sendStop,
    sendPatrolCommand,
    getPTZStatus,
    ptzStatus,
    ptzStatusLoading
  };
};


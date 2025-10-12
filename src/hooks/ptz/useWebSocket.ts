import { useEffect, useRef, useState, useCallback } from 'react';
import { config } from '../../utils/config';
import { useUser } from '../../contexts/UserContext';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export const useWebSocket = (cameraId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [ptzStatus, setPtzStatus] = useState<any>(null);
  const [ptzStatusLoading, setPtzStatusLoading] = useState(false);
  const { client } = useUser();

  // Get JWT token from localStorage using the correct key
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('access_token') || localStorage.getItem('bearer_token');
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const token = getAuthToken();
    if (!token) {
      console.error('❌ No authentication token found');
      setConnectionStatus('disconnected');
      return;
    }

    // Construct WebSocket URL with authentication token
    const wsUrl = `${config.websocket.url}?token=${encodeURIComponent(token)}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, '***'));
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnectionStatus('connected');
      
      // Send joystick connect message
      sendMessage({
        type: 'joystick_connect',
        data: {
          deviceId: cameraId,
          userId: client?.id || 'anonymous'
        }
      });
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📩 Server:", message);
        
        // Handle different message types
        if (message.type === 'connection_established') {
          console.log('🎉 WebSocket connection established');
        } else if (message.type === 'error') {
          console.error('❌ Server error:', message.data);
        } else if (message.type === 'ptz_status') {
          console.log('📊 PTZ Status received:', message.data);
          setPtzStatus(message.data);
          setPtzStatusLoading(false);
        } else if (message.type === 'ptz_status_ack') {
          console.log('✅ PTZ Status acknowledgment:', message.data);
          if (message.data.success) {
            setPtzStatus(message.data.response);
          }
          setPtzStatusLoading(false);
        }
      } catch (error) {
        console.log("📩 Server (raw):", event.data);
      }
    };
    
    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setConnectionStatus('disconnected');
    };
    
    socket.onclose = (event) => {
      console.log("⚠️ WebSocket disconnected", event.code, event.reason);
      setConnectionStatus('disconnected');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [cameraId, getAuthToken, client]);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return;
    }
    
    const messageToSend = {
      type: message.type,
      data: message.data,
      timestamp: Date.now()
    };
    
    socketRef.current.send(JSON.stringify(messageToSend));
    console.log("📤 Sent:", messageToSend);
    
    // Log the structure for debugging
    if (messageToSend.type === 'continuousMove') {
      console.log("🔍 Message structure:", {
        panTilt: messageToSend.data.panTilt,
        zoom: messageToSend.data.zoom
      });
    }
  }, []);

  // Send movement command
  const sendMovement = useCallback((speeds: { Pan: number; Tilt: number }, zoom: number) => {
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
    sendMessage(message);
  }, [cameraId, sendMessage]);

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
    sendMessage(message);
  }, [cameraId, sendMessage]);

  // Send stop command
  const sendStop = useCallback(() => {
    const message: WebSocketMessage = {
      type: "stop",
      data: {
        cameraId,
        pan_tilt: true,
        zoom: true
      }
    };
    sendMessage(message);
  }, [cameraId, sendMessage]);

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
    sendMessage(message);
  }, [cameraId, sendMessage]);

  // Get PTZ status
  const getPTZStatus = useCallback(() => {
    setPtzStatusLoading(true);
    const message: WebSocketMessage = {
      type: "getPTZStatus",
      data: {
        cameraId,
        profileToken: undefined // You can add profileToken if needed
      }
    };
    sendMessage(message);
  }, [cameraId, sendMessage]);

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

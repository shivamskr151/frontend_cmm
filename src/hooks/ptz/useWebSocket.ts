import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  action: string;
  cameraId: string;
  Pan?: number;
  Tilt?: number;
  Zoom?: number;
  patternId?: number;
  pattern?: string;
  pan?: number;
  tilt?: number;
  zoom?: number;
}

export const useWebSocket = (cameraId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize WebSocket connection
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

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    socketRef.current.send(JSON.stringify(message));
    console.log("📤 Sent:", message);
  }, []);

  // Send movement command
  const sendMovement = useCallback((speeds: { Pan: number; Tilt: number }, zoom: number) => {
    const message: WebSocketMessage = {
      action: "move",
      cameraId,
      Pan: speeds.Pan,
      Tilt: speeds.Tilt,
      Zoom: zoom
    };
    sendMessage(message);
  }, [cameraId, sendMessage]);

  // Send zoom command
  const sendZoom = useCallback((zoom: number) => {
    const message: WebSocketMessage = {
      action: "zoom",
      cameraId,
      Zoom: zoom
    };
    sendMessage(message);
  }, [cameraId, sendMessage]);

  // Send patrol command
  const sendPatrolCommand = useCallback((action: string, patternId?: number, pattern?: any) => {
    const message: WebSocketMessage = {
      action,
      cameraId
    };

    if (patternId && pattern) {
      message.patternId = patternId;
      message.pattern = pattern.name;
      message.pan = pattern.pan;
      message.tilt = pattern.tilt;
      message.zoom = pattern.zoom;
    }

    sendMessage(message);
  }, [cameraId, sendMessage]);

  return {
    connectionStatus,
    sendMovement,
    sendZoom,
    sendPatrolCommand
  };
};

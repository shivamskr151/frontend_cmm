import { useEffect, useRef, useCallback } from 'react';
import nipplejs from 'nipplejs';

interface JoystickData {
  vector?: { x: number; y: number };
  distance?: number;
}

interface UseJoystickProps {
  isActive: boolean;
  onMove: (speeds: { Pan: number; Tilt: number }) => void;
  onEnd: () => void;
}

export const useJoystick = ({ isActive, onMove, onEnd }: UseJoystickProps) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);

  // Keep refs up to date
  useEffect(() => {
    onMoveRef.current = onMove;
    onEndRef.current = onEnd;
  }, [onMove, onEnd]);

  // Map joystick movement to Pan/Tilt
  const handleJoystickMove = useCallback((data: JoystickData) => {
    if (!data || !data.vector) return;

    const x = data.vector.x; // left-right (-1 to 1)
    const y = data.vector.y; // up-down (-1 to 1)
    const distance = Math.min((data.distance || 0) / 50, 1); // normalize

    const newSpeeds = {
      Pan: parseFloat((0.5 + x * distance).toFixed(2)),
      Tilt: parseFloat((0.5 - y * distance).toFixed(2)),
    };

    onMoveRef.current(newSpeeds);
  }, []);

  // Setup Joystick
  useEffect(() => {
    if (!isActive) return;
    if (!joystickRef.current) return;

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!joystickRef.current) return;

      console.log("🎮 Creating joystick...", joystickRef.current);

      const manager = nipplejs.create({
        zone: joystickRef.current,
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: "#3b82f6",
        size: window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 100 : 120,
      });

      console.log("✅ Joystick created:", manager);

      manager.on("move", (_evt, data) => {
        console.log("🎮 Joystick move:", data);
        handleJoystickMove(data);
      });

      manager.on("end", () => {
        console.log("🛑 Joystick released");
        onEndRef.current();
      });

      manager.on("start", () => {
        console.log("🎮 Joystick started");
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
    }, 100);

    return () => {
      clearTimeout(timer);
      if (joystickRef.current) {
        joystickRef.current.innerHTML = ""; // clear leftover elements
      }
    };
  }, [isActive]); // Removed handleJoystickMove and onEnd from dependencies

  return { joystickRef };
};

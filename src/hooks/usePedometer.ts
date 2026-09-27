import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Motion } from '@capacitor/motion';

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // In a real production app, we would use HealthKit or a native pedometer plugin here.
  // For the sake of this prototype, we'll simulate steps when running on the web,
  // and use a rough estimation via Motion on native if needed.

  const startTracking = useCallback(async () => {
    setIsTracking(true);
    
    // Simulate steps increasing every 2 seconds for testing purposes
    if (!Capacitor.isNativePlatform()) {
      const interval = setInterval(() => {
        setSteps(prev => prev + Math.floor(Math.random() * 5));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      // Very naive motion-based step tracker for native prototype
      try {
        await Motion.addListener('accel', (event) => {
          // Simple magnitude threshold (mock logic)
          const magnitude = Math.sqrt(
            Math.pow(event.acceleration.x, 2) +
            Math.pow(event.acceleration.y, 2) +
            Math.pow(event.acceleration.z, 2)
          );
          if (magnitude > 12) { // arbitrary threshold
            setSteps(prev => prev + 1);
          }
        });
      } catch (e) {
        console.error("Motion tracking failed", e);
      }
      return () => { Motion.removeAllListeners(); };
    }
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (Capacitor.isNativePlatform()) {
      Motion.removeAllListeners();
    }
  }, []);

  return { steps, isTracking, startTracking, stopTracking, setSteps };
}

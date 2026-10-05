"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useDanceSync } from '@/hooks/useDanceSync';
import type { Event } from '@/types/events';

interface DanceContextProps {
  liveEvent: any | null;
  steps: number;
  totalSessionSteps: number;
  isTracking: boolean;
  forceStartNative?: () => void;
  simulateSteps?: () => void;
}

const DanceContext = createContext<DanceContextProps>({
  liveEvent: null,
  steps: 0,
  totalSessionSteps: 0,
  isTracking: false,
});

export function DanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [liveEvent, setLiveEvent] = useState<any | null>(null);
  
  const { startDanceSession, stopDanceSession, isTracking, steps, totalSessionSteps, forceStartNative, simulateSteps } = useDanceSync();

  useEffect(() => {
    let mounted = true;

    const checkLiveStatus = async () => {
      console.log("DANCE_CONTEXT: checkLiveStatus llamado. user.id=", user?.id);
      if (!user) return;

      try {
        console.log("DANCE_CONTEXT: Pidiendo permisos / getCurrentPosition...");
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 300000, 
          timeout: 10000
        });
        console.log("DANCE_CONTEXT: Ubicación obtenida:", position.coords.latitude, position.coords.longitude);

        const res = await api.get('/v1/events/live-status', {
          params: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        });
        console.log("DANCE_CONTEXT: Respuesta live-status:", res.data);

        if (mounted && res.data?.isLive && res.data?.event) {
          console.log("DANCE_CONTEXT: ¡Fiesta detectada! Activando startDanceSession...");
          setLiveEvent(res.data.event);
          startDanceSession(res.data.event);
        } else {
          console.log("DANCE_CONTEXT: No hay fiesta en esta ubicación.");
        }
      } catch (error) {
        console.error("DANCE_CONTEXT: Error crítico chequeando estado:", error);
      }
    };

    checkLiveStatus();

    return () => {
      mounted = false;
      stopDanceSession();
    };
  }, [user, startDanceSession, stopDanceSession]);

  return (
    <DanceContext.Provider value={{ liveEvent, steps, totalSessionSteps, isTracking, forceStartNative, simulateSteps }}>
      {children}
    </DanceContext.Provider>
  );
}

export const useDanceContext = () => useContext(DanceContext);

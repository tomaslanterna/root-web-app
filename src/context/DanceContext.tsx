"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { api } from "@/lib/api";
import { useEventPresence } from "@/hooks/useEventPresence";
import type { LiveEvent, LiveStatus } from "@/services/presence";
import { useAuth } from "@/context/AuthContext";
import { useDanceSync } from "@/hooks/useDanceSync";

interface DanceContextProps {
  liveEvent: LiveEvent | null;
  attendanceConfirmed: boolean;
  steps: number;
  totalSessionSteps: number;
  isTracking: boolean;
  forceStartNative?: () => void;
  simulateSteps?: () => void;
  refreshLiveStatus?: () => Promise<void>;
}

const DanceContext = createContext<DanceContextProps>({
  liveEvent: null,
  attendanceConfirmed: false,
  steps: 0,
  totalSessionSteps: 0,
  isTracking: false,
});

export function DanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const { mutate: checkPresence } = useEventPresence();

  const {
    startDanceSession,
    stopDanceSession,
    isTracking,
    steps,
    totalSessionSteps,
    forceStartNative,
    simulateSteps,
  } = useDanceSync();

  const checkLiveStatus = React.useCallback(async () => {
    if (!user) {
      setLiveEvent(null);
      setAttendanceConfirmed(false);
      return;
    }

    try {
      console.log("DANCE_CONTEXT: Pidiendo permisos / getCurrentPosition...");
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 10000,
      });
      console.log(
        "DANCE_CONTEXT: Ubicación obtenida:",
        position.coords.latitude,
        position.coords.longitude,
      );

      const res = await api.get<LiveStatus>("/v1/events/live-status", {
        params: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
      console.log("DANCE_CONTEXT: Respuesta live-status:", res.data);

      if (res.data?.isLive && res.data?.event) {
        console.log(
          "DANCE_CONTEXT: ¡Fiesta detectada! Activando startDanceSession...",
        );
        setLiveEvent(res.data.event);
        setAttendanceConfirmed(Boolean(res.data?.attendanceConfirmed));

        const existingSteps = res.data.userSteps || 0;
        startDanceSession(res.data.event, existingSteps);
      } else {
        console.log(
          "DANCE_CONTEXT: No hay fiesta activa en esta ubicación o el horario expiró.",
        );
        setLiveEvent(null);
        setAttendanceConfirmed(false);
        stopDanceSession();
      }
    } catch (error) {
      console.error("DANCE_CONTEXT: Error crítico chequeando estado:", error);
      // Preservar el estado anterior en caso de fallo transitorio de red/GPS
    }
  }, [user, startDanceSession, stopDanceSession]);

  useEffect(() => {
    checkLiveStatus();
    // Validar ubicación y horario cada 5 minutos (300.000 ms)
    const interval = setInterval(checkLiveStatus, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      stopDanceSession();
    };
  }, [checkLiveStatus, stopDanceSession]);

  return (
    <DanceContext.Provider
      value={{
        liveEvent,
        attendanceConfirmed,
        steps,
        totalSessionSteps,
        isTracking,
        forceStartNative,
        simulateSteps,
        refreshLiveStatus: checkLiveStatus,
      }}
    >
      {children}
    </DanceContext.Provider>
  );
}

export const useDanceContext = () => useContext(DanceContext);

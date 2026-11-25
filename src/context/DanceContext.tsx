"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { debugLog } from "@/lib/debugLog";
import { Geolocation } from "@capacitor/geolocation";
import { api } from "@/lib/api";
import { useEventPresence } from "@/hooks/useEventPresence";
import type { LiveEvent, LiveStatus } from "@/services/presence";
import { useAuth } from "@/context/AuthContext";
import { useDanceSync, parseEventRealDate } from "@/hooks/useDanceSync";
import { stopLiveActivity } from "@/lib/liveActivity";

interface DanceContextProps {
  liveEvent: LiveEvent | null;
  isAtVenue: boolean;
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
  isAtVenue: false,
  attendanceConfirmed: false,
  steps: 0,
  totalSessionSteps: 0,
  isTracking: false,
});

export function DanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [isAtVenue, setIsAtVenue] = useState(false);
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
      setIsAtVenue(false);
      setAttendanceConfirmed(false);
      void stopLiveActivity();
      return;
    }

    try {
      let lat = 0;
      let lng = 0;
      let hasLocation = false;

      try {
        debugLog("DANCE_CONTEXT: Pidiendo permisos / getCurrentPosition...");
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 300000,
          timeout: 10000,
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        hasLocation = true;
        debugLog("DANCE_CONTEXT: Ubicación obtenida:", lat, lng);
      } catch (geoErr) {
        console.warn(
          "DANCE_CONTEXT: No se pudo obtener GPS, consultando igual eventos de hoy con RSVP going:",
          geoErr,
        );
      }

      const res = await api.get<LiveStatus>("/v1/events/live-status", {
        params: hasLocation
          ? { lat, lng }
          : { lat: 0, lng: 0, hasLocation: "false" },
      });
      debugLog("DANCE_CONTEXT: Respuesta live-status:", res.data);

      if (res.data?.isLive && res.data?.event) {
        const ev = res.data.event;
        const startMs = parseEventRealDate(ev.date).getTime();
        const endMs = ev.endDate
          ? parseEventRealDate(ev.endDate).getTime()
          : startMs + 12 * 60 * 60 * 1000;

        if (!Number.isNaN(endMs) && Date.now() > endMs) {
          debugLog(
            "DANCE_CONTEXT: El evento ya finalizó según su hora de cierre.",
          );
          setLiveEvent(null);
          setIsAtVenue(false);
          setAttendanceConfirmed(false);
          stopDanceSession();
          void stopLiveActivity();
          return;
        }

        const atVenue = Boolean(
          res.data.isAtVenue ?? res.data.attendanceConfirmed,
        );
        setLiveEvent(ev);
        setIsAtVenue(atVenue);
        setAttendanceConfirmed(Boolean(res.data?.attendanceConfirmed));

        if (atVenue && hasLocation) {
          debugLog(
            "DANCE_CONTEXT: ¡Usuario en la ubicación del evento! Activando startDanceSession...",
          );
          const existingSteps = res.data.userSteps || 0;
          startDanceSession(ev, existingSteps, { lat, lng });
        } else {
          stopDanceSession();
        }
      } else {
        debugLog(
          "DANCE_CONTEXT: No hay fiesta de hoy con RSVP going ni evento activo.",
        );
        setLiveEvent(null);
        setIsAtVenue(false);
        setAttendanceConfirmed(false);
        stopDanceSession();
        void stopLiveActivity();
      }
    } catch (error) {
      console.error("DANCE_CONTEXT: Error crítico chequeando estado:", error);
      // Preservar el estado anterior en caso de fallo transitorio de red/GPS
    }
  }, [user, startDanceSession, stopDanceSession]);

  // Para decidir, sin re-crear el intervalo, si hay que seguir chequeando en segundo plano.
  const liveEventRef = React.useRef(liveEvent);
  useEffect(() => {
    liveEventRef.current = liveEvent;
  }, [liveEvent]);

  useEffect(() => {
    // Validar ubicación y horario cada 1 minuto.
    // En segundo plano se sigue chequeando solo si hay un evento en vivo hoy: es lo que detecta la llegada al
    // lugar y pasa la Live Activity / notificación de pantalla de bloqueo a "EN VIVO" con el celular en el
    // bolsillo. Sin evento de hoy no se pide GPS ni se consulta /live-status en segundo plano (ahorra batería),
    // y al volver a primer plano se chequea en el momento. Los pasos en pantalla de bloqueo los actualiza el
    // código nativo y no dependen de esto.
    let interval: ReturnType<typeof setInterval> | undefined;
    const isHidden = () => document.visibilityState !== "visible";
    const pause = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
    };
    const tick = () => {
      if (isHidden() && !liveEventRef.current) {
        pause();
        return;
      }
      void checkLiveStatus();
    };
    const start = () => {
      if (interval) return;
      void checkLiveStatus();
      interval = setInterval(tick, 60 * 1000);
    };
    const onVisibility = () => {
      if (!isHidden()) start();
      else if (!liveEventRef.current) pause();
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pause();
      stopDanceSession();
    };
  }, [checkLiveStatus, stopDanceSession]);

  // Disparar re-chequeo exacto cuando llega la hora de inicio o de fin del evento
  useEffect(() => {
    if (!liveEvent) return;
    const now = Date.now();
    const startMs = parseEventRealDate(liveEvent.date).getTime();
    const endMs = liveEvent.endDate
      ? parseEventRealDate(liveEvent.endDate).getTime()
      : startMs + 12 * 60 * 60 * 1000;

    const timers: NodeJS.Timeout[] = [];
    if (!Number.isNaN(startMs) && startMs > now) {
      timers.push(setTimeout(() => void checkLiveStatus(), startMs - now + 500));
    }
    if (!Number.isNaN(endMs) && endMs > now) {
      timers.push(setTimeout(() => void checkLiveStatus(), endMs - now + 500));
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [liveEvent, checkLiveStatus]);

  const value = useMemo(
    () => ({
      liveEvent,
      isAtVenue,
      attendanceConfirmed,
      steps,
      totalSessionSteps,
      isTracking,
      forceStartNative,
      simulateSteps,
      refreshLiveStatus: checkLiveStatus,
    }),
    [liveEvent, isAtVenue, attendanceConfirmed, steps, totalSessionSteps, isTracking, forceStartNative, simulateSteps, checkLiveStatus],
  );

  return (
    <DanceContext.Provider value={value}>
      {children}
    </DanceContext.Provider>
  );
}

export const useDanceContext = () => useContext(DanceContext);

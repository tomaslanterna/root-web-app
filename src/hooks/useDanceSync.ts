import { useState, useCallback, useRef, useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLocation } from "./useLocation";
import { usePedometer } from "./usePedometer";
import { syncDance } from "@/services/presence";
import type { LiveEvent } from "@/services/presence";
import { useMutation } from "./useMutation";

/**
 * Convierte la fecha del evento guardada en la DB a su instante real en -03:00.
 * En la DB las horas nominales (ej. 23:00:00Z) representan la hora real local (-03:00),
 * por lo que si se interpretaran como UTC puro restarían 3 horas (20:00 hs).
 */
export function parseEventRealDate(raw: string | Date): Date {
  if (raw instanceof Date) return raw;
  const trimmed = String(raw).trim().replace(" ", "T");
  const withOffset = trimmed.replace(/(?:Z|[+-]00(?::?00)?)$/i, "-03:00");
  const finalStr = /[+-]\d{2}:?\d{2}$/.test(withOffset)
    ? withOffset
    : `${withOffset}-03:00`;
  return new Date(finalStr);
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DB_FORCE_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export function useDanceSync() {
  const { requestLocation } = useLocation();
  const {
    steps,
    startTracking,
    stopTracking,
    isTracking,
    setSteps,
    pollHealthSteps,
    pendingStepsRef,
  } = usePedometer();
  const { mutate: syncSteps, isLoading: isSyncing } = useMutation(syncDance);
  const [totalSessionSteps, setTotalSessionSteps] = useState(0);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const dbForceSyncInterval = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const lastKnownCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const initializedEventsRef = useRef<Set<string>>(new Set());

  const stepsRef = useRef(steps);

  const isTrackingRef = useRef(isTracking);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const syncToBackend = useCallback(
    async (event: LiveEvent, currentSteps: number, allowZero = false) => {
      if (currentSteps === 0 && !allowZero) {
        return; // No steps, do nothing quietly
      }
      if (isSyncingRef.current) {
        return;
      }
      isSyncingRef.current = true;
      try {
        console.log(
          `USE_DANCESYNC: Enviando ${currentSteps} pasos al servidor...`,
        );
        const pos = await requestLocation();
        let lat = pos?.coords.latitude ?? lastKnownCoordsRef.current?.lat ?? event.latitude ?? null;
        let lng = pos?.coords.longitude ?? lastKnownCoordsRef.current?.lng ?? event.longitude ?? null;

        if (pos) {
          lastKnownCoordsRef.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
        }

        if (lat == null || lng == null) return;

        const eventStart = parseEventRealDate(event.date);
        const startTimeISO = !Number.isNaN(eventStart.getTime())
          ? eventStart.toISOString()
          : new Date(Date.now() - 5 * 1000).toISOString();

        await syncSteps({
          eventId: event.id,
          stepsCount: currentSteps,
          startTime: startTimeISO,
          endTime: new Date().toISOString(),
          lat,
          lng,
        });

        console.log(
          `USE_DANCESYNC: ${currentSteps} pasos registrados en el servidor exitosamente.`,
        );
        if (currentSteps > 0) {
          setTotalSessionSteps((prev) => prev + currentSteps);
          setSteps((prev) => Math.max(0, prev - currentSteps));
        }
      } catch (e) {
        console.error("USE_DANCESYNC: Error syncing steps", e);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [requestLocation, setSteps, syncSteps],
  );

  const currentEventIdRef = useRef<string | null>(null);
  const currentEventRef = useRef<LiveEvent | null>(null);

  const stopDanceSession = useCallback(() => {
    const remaining = Math.max(stepsRef.current, pendingStepsRef.current);
    if (currentEventRef.current && remaining > 0) {
      void syncToBackend(currentEventRef.current, remaining);
    }
    stopTracking();
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
      syncInterval.current = null;
    }
    if (dbForceSyncInterval.current) {
      clearInterval(dbForceSyncInterval.current);
      dbForceSyncInterval.current = null;
    }
  }, [pendingStepsRef, stopTracking, syncToBackend]);

  const forceValidateAndSync = useCallback(async () => {
    const ev = currentEventRef.current;
    if (!ev || !isTrackingRef.current) return;
    const latestPending = await pollHealthSteps();
    const toSync = Math.max(latestPending, stepsRef.current);
    if (toSync > 0) {
      await syncToBackend(ev, toSync);
    }
  }, [pollHealthSteps, syncToBackend]);

  // Forzar validación de HealthKit y sincronización a la DB al volver a la app y cada 5 minutos
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void forceValidateAndSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    let appStateListener: { remove: () => Promise<void> } | null = null;
    if (Capacitor.isNativePlatform()) {
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          void forceValidateAndSync();
        }
      }).then((handle) => {
        appStateListener = handle;
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      if (appStateListener) {
        void appStateListener.remove();
      }
    };
  }, [forceValidateAndSync]);

  const startDanceSession = useCallback(
    async (
      event: LiveEvent,
      initialSteps: any,
      knownCoords?: { lat: number; lng: number },
    ) => {
      console.log(
        "USE_DANCESYNC: startDanceSession ejecutado para el evento",
        event?.id,
      );
      currentEventRef.current = event;
      if (knownCoords) {
        lastKnownCoordsRef.current = knownCoords;
      }
      const baselineSteps = Math.max(0, Math.round(Number(initialSteps) || 0));

      // Si ya estamos trackeando este mismo evento, solo actualizamos referencias sin reiniciar los intervalos
      const isDifferentEvent = currentEventIdRef.current !== event?.id;
      currentEventIdRef.current = event?.id || null;

      if (isDifferentEvent) {
        setTotalSessionSteps(baselineSteps);
      } else {
        setTotalSessionSteps((prev) => Math.max(prev, baselineSteps));
        if (isTrackingRef.current && syncInterval.current) {
          return;
        }
      }

      if (syncInterval.current) clearInterval(syncInterval.current);
      if (dbForceSyncInterval.current) clearInterval(dbForceSyncInterval.current);

      const eventStart = parseEventRealDate(event.date);

      // Asegurar que la dance_session quede creada en el backend para este usuario y evento
      if (event?.id && !initializedEventsRef.current.has(event.id)) {
        initializedEventsRef.current.add(event.id);
        void syncToBackend(event, 0, true);
      }

      const checkAndToggleTracking = async () => {
        try {
          const now = new Date();

          // Usar endDate real (-03:00) si existe y es posterior al inicio, de lo contrario +12 horas
          let eventEnd = new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);
          if (event.endDate) {
            const parsedEnd = parseEventRealDate(event.endDate);
            if (parsedEnd.getTime() > eventStart.getTime()) {
              eventEnd = parsedEnd;
            }
          }

          // Verificar si estamos dentro del horario del evento (con margen de 2h antes para activar sesión,
          // pero usePedometer solo contabiliza pasos desde eventStart real en -03:00)
          const eventStartMargin = new Date(
            eventStart.getTime() - 2 * 60 * 60 * 1000,
          );
          const isDuringEvent = now >= eventStartMargin && now <= eventEnd;

          // Verificar si el usuario sigue dentro del rango del evento cuando hay coordenadas disponibles
          let isInsideRange = true;
          if (
            lastKnownCoordsRef.current &&
            event.latitude != null &&
            event.longitude != null
          ) {
            const radius =
              event.geofenceRadiusMeters && event.geofenceRadiusMeters > 0
                ? event.geofenceRadiusMeters
                : 300;
            const dist = haversineMeters(
              lastKnownCoordsRef.current.lat,
              lastKnownCoordsRef.current.lng,
              event.latitude,
              event.longitude,
            );
            if (dist > radius) {
              isInsideRange = false;
            }
          }

          if (isDuringEvent && isInsideRange) {
            if (!isTrackingRef.current) {
              await startTracking(eventStart, baselineSteps);
            } else {
              await pollHealthSteps();
            }
            const toSync = Math.max(pendingStepsRef.current, stepsRef.current);
            await syncToBackend(event, toSync);
          } else {
            // Si terminó el horario del evento o el usuario salió del rango, finalizar la dance session
            if (isTrackingRef.current) {
              stopDanceSession();
            }
          }
        } catch (error) {
          console.error(
            "USE_DANCESYNC: Error fatal en checkAndToggleTracking:",
            error,
          );
        }
      };

      void checkAndToggleTracking();
      syncInterval.current = setInterval(checkAndToggleTracking, 5000);
      dbForceSyncInterval.current = setInterval(() => {
        void forceValidateAndSync();
      }, DB_FORCE_SYNC_INTERVAL_MS);
    },
    [
      forceValidateAndSync,
      pendingStepsRef,
      pollHealthSteps,
      startTracking,
      stopDanceSession,
      syncToBackend,
    ],
  );

  return {
    isTracking,
    isSyncing,
    steps,
    totalSessionSteps: totalSessionSteps + steps,
    startDanceSession,
    stopDanceSession,
    syncToBackend,
    simulateSteps: () => setSteps((prev) => prev + 10),
    forceStartNative: () => startTracking(),
  };
}

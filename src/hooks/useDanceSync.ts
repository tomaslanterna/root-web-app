import { useState, useCallback, useRef } from 'react';
import { useLocation } from './useLocation';
import { usePedometer } from './usePedometer';
import { api } from '@/lib/api';
import type { Event } from '@/types/events';

export function useDanceSync() {
  const { location, requestLocation } = useLocation();
  const { steps, startTracking, stopTracking, isTracking, setSteps } = usePedometer();
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalSessionSteps, setTotalSessionSteps] = useState(0);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const isTrackingRef = useRef(isTracking);
  isTrackingRef.current = isTracking;

  const syncToBackend = useCallback(async (event: Event, currentSteps: number) => {
    if (currentSteps === 0) {
      console.log("USE_DANCESYNC: Tick de 5s omitido. No hay pasos nuevos.");
      return;
    }
    try {
      setIsSyncing(true);
      console.log(`USE_DANCESYNC: Enviando ${currentSteps} pasos al servidor...`);
      const pos = await requestLocation();
      const lat = pos?.coords.latitude || 0;
      const lng = pos?.coords.longitude || 0;

      await api.post('/v1/dance/sync', {
        eventId: event.id,
        stepsCount: currentSteps,
        startTime: new Date(Date.now() - 5 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        lat,
        lng
      });
      
      setTotalSessionSteps(prev => prev + currentSteps);
      setSteps(0);
      console.log("USE_DANCESYNC: Pasos guardados en DB exitosamente.");
    } catch (e) {
      console.error("USE_DANCESYNC: Error syncing steps", e);
    } finally {
      setIsSyncing(false);
    }
  }, [requestLocation, setSteps]);

  const startDanceSession = useCallback(async (event: Event) => {
    console.log("USE_DANCESYNC: startDanceSession ejecutado para el evento", event?.id);
    if (syncInterval.current) clearInterval(syncInterval.current);
    
    const checkAndToggleTracking = async () => {
      try {
        console.log("USE_DANCESYNC: Evaluando lógica de tiempo...");
        const now = new Date();
        const safeDateString = typeof event.date === 'string' ? event.date.replace(' ', 'T') : event.date;
        const eventStart = new Date(safeDateString);
        if (isNaN(eventStart.getTime())) {
            console.error("USE_DANCESYNC: La fecha sigue siendo inválida después del parche:", event.date);
        }
        const eventEnd = new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);
        
        console.log(`USE_DANCESYNC: Ahora=${now.toISOString()}, Inicio=${eventStart.toISOString()}`);
        
        const isDuringEvent = now >= eventStart && now <= eventEnd;

        if (isDuringEvent) {
          if (!isTrackingRef.current) {
            console.log("USE_DANCESYNC: Hora del evento alcanzada. Activando podómetro...");
            await startTracking();
          } else {
            console.log("USE_DANCESYNC: Podómetro ya activo, omitiendo encendido.");
          }
          syncToBackend(event, stepsRef.current);
        } else {
          console.log("USE_DANCESYNC: isDuringEvent es FALSE.");
          if (isTrackingRef.current) {
            console.log("USE_DANCESYNC: Apagando podómetro por estar fuera de horario.");
            stopTracking();
          }
        }
      } catch (error) {
        console.error("USE_DANCESYNC: Error fatal en checkAndToggleTracking:", error);
      }
    };

    checkAndToggleTracking();
    syncInterval.current = setInterval(checkAndToggleTracking, 5000);
  }, [startTracking, stopTracking, syncToBackend]);

  const stopDanceSession = useCallback(() => {
    console.log("USE_DANCESYNC: stopDanceSession llamado.");
    stopTracking();
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
    }
  }, [stopTracking]);

  return {
    isTracking,
    isSyncing,
    steps,
    totalSessionSteps: totalSessionSteps + steps,
    startDanceSession,
    stopDanceSession,
    syncToBackend,
    simulateSteps: () => setSteps(prev => prev + 10),
    forceStartNative: () => startTracking()
  };
}

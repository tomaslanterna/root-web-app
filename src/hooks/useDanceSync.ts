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
      return; // No steps, do nothing quietly
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
      
      console.log(`USE_DANCESYNC: ${currentSteps} pasos registrados en el servidor exitosamente.`);
      setTotalSessionSteps(prev => prev + currentSteps);
      setSteps(0);
    } catch (e) {
      console.error("USE_DANCESYNC: Error syncing steps", e);
    } finally {
      setIsSyncing(false);
    }
  }, [requestLocation, setSteps]);

  const startDanceSession = useCallback(async (event: Event, initialSteps: number = 0) => {
    if (syncInterval.current) clearInterval(syncInterval.current);
    
    // Seteamos el estado inicial con lo que haya en la DB, solo si no teníamos pasos acumulados en memoria
    setTotalSessionSteps(prev => prev > 0 ? prev : initialSteps);
    
    const checkAndToggleTracking = async () => {
      try {
        const now = new Date();
        const safeDateString = typeof event.date === 'string' ? event.date.replace(' ', 'T') : event.date;
        const eventStart = new Date(safeDateString);
        
        // Usar endDate si existe, de lo contrario +12 horas
        let eventEnd = new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);
        if (event.endDate) {
          const safeEndDateString = typeof event.endDate === 'string' ? event.endDate.replace(' ', 'T') : event.endDate;
          eventEnd = new Date(safeEndDateString);
        }
        
        // Verificar si estamos dentro del horario (con un pequeño margen de 2h antes)
        // Similar a la DB: NOW() >= e.date - INTERVAL '2 hours'
        const eventStartMargin = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);
        const isDuringEvent = now >= eventStartMargin && now <= eventEnd;

        if (isDuringEvent) {
          if (!isTrackingRef.current) {
            await startTracking();
          }
          syncToBackend(event, stepsRef.current);
        } else {
          if (isTrackingRef.current) {
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

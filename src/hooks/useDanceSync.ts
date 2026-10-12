import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from './useLocation';
import { usePedometer } from './usePedometer';
import { syncDance } from '@/services/presence';
import type { LiveEvent } from '@/services/presence';
import { useMutation } from './useMutation';

export function useDanceSync() {
  const { requestLocation } = useLocation();
  const { steps, startTracking, stopTracking, isTracking, setSteps } = usePedometer();
  const { mutate: syncSteps, isLoading: isSyncing } = useMutation(syncDance);
  const [totalSessionSteps, setTotalSessionSteps] = useState(0);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  
  const stepsRef = useRef(steps);

  const isTrackingRef = useRef(isTracking);
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);

  const syncToBackend = useCallback(async (event: LiveEvent, currentSteps: number) => {
    if (currentSteps === 0) {
      console.log("USE_DANCESYNC: Tick de 5s omitido. No hay pasos nuevos.");
      return;
    }
    try {
      console.log(`USE_DANCESYNC: Enviando ${currentSteps} pasos al servidor...`);
      const pos = await requestLocation();
      if (!pos) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      await syncSteps({
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
    }
  }, [requestLocation, setSteps, syncSteps]);

  const startDanceSession = useCallback(async (event: LiveEvent) => {
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

import { useState, useCallback, useRef } from 'react';
import { useLocation } from './useLocation';
import { usePedometer } from './usePedometer';
import { api } from '@/lib/api';
import type { Event } from '@/types/events';

export function useDanceSync() {
  const { location, requestLocation } = useLocation();
  const { steps, startTracking, stopTracking, isTracking, setSteps } = usePedometer();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  // Syncs current steps to backend
  const syncToBackend = useCallback(async (event: Event, currentSteps: number) => {
    try {
      setIsSyncing(true);
      // Get fresh location
      const pos = await requestLocation();
      const lat = pos?.coords.latitude || 0;
      const lng = pos?.coords.longitude || 0;

      await api.post('/v1/dance/sync', {
        eventId: event.id,
        stepsCount: currentSteps,
        startTime: new Date(Date.now() - 30 * 60000).toISOString(), // rough 30m window
        endTime: new Date().toISOString(),
        lat,
        lng
      });
      // Reset steps after sync
      setSteps(0);
    } catch (e) {
      console.error("Error syncing steps", e);
    } finally {
      setIsSyncing(false);
    }
  }, [requestLocation, setSteps]);

  const startDanceSession = useCallback(async (event: Event) => {
    await startTracking();
    
    // Sync every 5 minutes in production, but here every 30s for demo
    syncInterval.current = setInterval(() => {
      // In a real app we'd pass the actual accumulated steps
      syncToBackend(event, 500); 
    }, 30000);
  }, [startTracking, syncToBackend]);

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
    startDanceSession,
    stopDanceSession,
    syncToBackend
  };
}

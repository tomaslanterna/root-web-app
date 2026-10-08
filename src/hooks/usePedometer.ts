import { useState, useCallback, useRef } from 'react';
import { Health } from '@capgo/capacitor-health';
import { Capacitor } from '@capacitor/core';

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTracking = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Health.requestAuthorization({
          read: ['steps'],
          write: [],
        });
      } catch (err) {
        console.error("USE_PEDOMETER: Error solicitando permisos de salud:", err);
      }
    }

    setIsTracking(true);
    setSteps(0);
    sessionStartTimeRef.current = new Date();

    if (!Capacitor.isNativePlatform()) {
      pollIntervalRef.current = setInterval(() => {
        setSteps(prev => prev + Math.floor(Math.random() * 5));
      }, 2000);
      return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    } else {
      // Polling de Apple Health / Google Fit cada 5 segundos
      let lastStepTotal = 0;
      
      pollIntervalRef.current = setInterval(async () => {
        if (!sessionStartTimeRef.current) return;
        
        try {
          // Consultar los pasos desde el momento en que se activó el tracking
          const { samples } = await Health.queryAggregated({
            dataType: 'steps',
            startDate: sessionStartTimeRef.current.toISOString(),
            endDate: new Date().toISOString(),
            bucket: 'hour',
            aggregation: 'sum'
          });

          // Sumar todos los buckets obtenidos
          let totalSteps = 0;
          for (const sample of samples) {
            if (sample.value) {
                totalSteps += sample.value;
            }
          }

          if (totalSteps > lastStepTotal) {
            const newSteps = totalSteps - lastStepTotal;
            setSteps(prev => prev + newSteps);
            lastStepTotal = totalSteps;
          }
        } catch (e) {
          console.error("USE_PEDOMETER: Error leyendo HealthKit:", e);
        }
      }, 5000); // Polling cada 5 segundos

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, []);

  return { steps, isTracking, startTracking, stopTracking, setSteps };
}

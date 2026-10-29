import { useState, useCallback, useRef } from 'react';
import { Health } from '@capgo/capacitor-health';
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

interface NativePedometerQueryResult {
  available: boolean;
  steps: number;
  distanceMeters?: number;
  startDate?: string;
  endDate?: string;
  authStatus?: number;
  reason?: string;
}

export interface SyncLiveActivityOptions {
  eventId: string;
  eventTitle: string;
  startHourLabel: string;
  venueLabel: string;
  bannerUrl?: string;
  mode: 'before_start' | 'started_away' | 'dancing';
  headerTitle: string;
  stepsCount: number;
  subtitle: string;
  footerLabel: string;
  eventStartEpochMs: number;
}

interface NativePedometerPlugin {
  querySteps(options: { startDate: string; endDate: string }): Promise<NativePedometerQueryResult>;
  startLiveUpdates(options: { startDate: string }): Promise<{ available: boolean; started: boolean }>;
  stopLiveUpdates(): Promise<{ stopped: boolean }>;
  syncLiveActivity(options: SyncLiveActivityOptions): Promise<{ supported: boolean; started?: boolean; updated?: boolean; activityId?: string; reason?: string }>;
  stopLiveActivity(): Promise<{ stopped: boolean }>;
  addListener(
    eventName: 'pedometerUpdate',
    listenerFunc: (data: { steps: number; distanceMeters: number; startDate: string; endDate: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'pedometerError',
    listenerFunc: (data: { message: string }) => void,
  ): Promise<PluginListenerHandle>;
}

export const NativePedometer = registerPlugin<NativePedometerPlugin>('NativePedometer');

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStepTotalRef = useRef<number>(0);
  const pendingStepsRef = useRef<number>(0);
  const liveListenersRef = useRef<PluginListenerHandle[]>([]);

  const updatePendingSteps = useCallback((updater: (prev: number) => number) => {
    const next = Math.max(0, updater(pendingStepsRef.current));
    pendingStepsRef.current = next;
    setSteps(next);
  }, []);

  // Aplica de forma atómica y monotónica cualquier lectura acumulada (CMPedometer o HealthKit)
  // garantizando que nunca se dupliquen ni se pisen pasos entre sensores o renders.
  const applySensorTotal = useCallback(
    (sensorTotal: number, source: string) => {
      const cleanTotal = Math.round(Number(sensorTotal) || 0);
      if (cleanTotal > lastStepTotalRef.current) {
        const delta = cleanTotal - lastStepTotalRef.current;
        lastStepTotalRef.current = cleanTotal;
        updatePendingSteps((prev) => prev + delta);
        console.log(
          `✅ [USE_PEDOMETER - ${source}]: +${delta} pasos nuevos (Total acumulado evento: ${cleanTotal})`,
        );
      }
    },
    [updatePendingSteps],
  );

  const pollHealthSteps = useCallback(async (): Promise<number> => {
    if (!sessionStartTimeRef.current) return pendingStepsRef.current;
    const now = new Date();
    const startTime = sessionStartTimeRef.current;

    // Solo tomar pasos a partir de la hora real de inicio del evento (-03:00)
    if (now.getTime() < startTime.getTime()) {
      return 0;
    }

    if (!Capacitor.isNativePlatform()) {
      const simulatedDelta = Math.floor(Math.random() * 5);
      applySensorTotal(lastStepTotalRef.current + simulatedDelta, 'WebSim');
      return pendingStepsRef.current;
    }

    let healthKitSteps = 0;
    let cmPedometerSteps = 0;

    // 1. Consultar CMPedometer (CoreMotion en tiempo real desde el coprocesador del iPhone)
    try {
      const cmRes = await NativePedometer.querySteps({
        startDate: startTime.toISOString(),
        endDate: now.toISOString(),
      });
      if (cmRes.available && cmRes.steps > 0) {
        cmPedometerSteps = Math.round(cmRes.steps);
      }
    } catch (cmErr) {
      console.log(
        "🌉 [BRIDGE SWIFT CMPedometer]: No disponible en este dispositivo/build:",
        cmErr,
      );
    }

    // 2. Consultar HealthKit (respaldo para Apple Watch / Android Health Connect)
    try {
      const { samples } = await Health.queryAggregated({
        dataType: 'steps',
        startDate: startTime.toISOString(),
        endDate: now.toISOString(),
        bucket: 'hour',
        aggregation: 'sum',
      });

      for (const sample of samples) {
        if (sample.value) {
          healthKitSteps += Math.round(sample.value);
        }
      }

      if (healthKitSteps === 0) {
        try {
          const rawRes = await Health.readSamples({
            dataType: 'steps',
            startDate: startTime.toISOString(),
            endDate: now.toISOString(),
            limit: 500,
            ascending: true,
          });
          let proratedTotal = 0;
          const eventStartMs = startTime.getTime();
          for (const s of rawRes.samples || []) {
            if (!s.value || s.value <= 0) continue;
            const sStart = new Date(s.startDate).getTime();
            const sEnd = new Date(s.endDate).getTime();
            if (sStart >= eventStartMs) {
              proratedTotal += s.value;
            } else if (sEnd > eventStartMs && sEnd > sStart) {
              const overlapRatio = (sEnd - eventStartMs) / (sEnd - sStart);
              proratedTotal += s.value * Math.min(1, Math.max(0, overlapRatio));
            }
          }
          healthKitSteps = Math.round(proratedTotal);
        } catch {
          // Ignorar si readSamples falla
        }
      }
    } catch (e) {
      console.error("USE_PEDOMETER: Error leyendo HealthKit:", e);
    }

    console.log("🌉 [BRIDGE SWIFT CMPedometer vs HealthKit]:", {
      cmPedometerSteps,
      healthKitSteps,
      lastRecordedTotal: lastStepTotalRef.current,
      pendingToSync: pendingStepsRef.current,
      startDate: startTime.toISOString(),
      endDate: now.toISOString(),
    });

    const bestTotal = Math.max(cmPedometerSteps, healthKitSteps);
    const winningSource =
      cmPedometerSteps >= healthKitSteps ? 'CMPedometer' : 'HealthKit';
    applySensorTotal(bestTotal, winningSource);

    return pendingStepsRef.current;
  }, [applySensorTotal]);

  const startTracking = useCallback(async (eventStartTime?: Date, initialSyncedSteps = 0) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

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

    const nextStartTime =
      eventStartTime && !Number.isNaN(eventStartTime.getTime())
        ? eventStartTime
        : new Date();

    const isNewEventSession =
      !sessionStartTimeRef.current ||
      sessionStartTimeRef.current.getTime() !== nextStartTime.getTime();

    sessionStartTimeRef.current = nextStartTime;
    setIsTracking(true);

    const baseline = Math.max(0, Math.round(Number(initialSyncedSteps) || 0));
    if (isNewEventSession) {
      lastStepTotalRef.current = baseline;
      updatePendingSteps(() => 0);
    } else if (baseline > lastStepTotalRef.current) {
      lastStepTotalRef.current = baseline;
    }

    // Iniciar stream en vivo de CMPedometer (CoreMotion) para actualizar el contador al instante
    if (Capacitor.isNativePlatform() && sessionStartTimeRef.current) {
      try {
        for (const h of liveListenersRef.current) {
          await h.remove();
        }
        liveListenersRef.current = [];

        const updateListener = await NativePedometer.addListener('pedometerUpdate', (data) => {
          console.log("🏃 [BRIDGE SWIFT CMPedometer LIVE UPDATE]:", data);
          if (data && typeof data.steps === 'number' && data.steps > 0) {
            applySensorTotal(data.steps, 'CMPedometer-Live');
          }
        });
        const errorListener = await NativePedometer.addListener('pedometerError', (err) => {
          console.warn("⚠️ [BRIDGE SWIFT CMPedometer LIVE ERROR]:", err);
        });
        liveListenersRef.current.push(updateListener, errorListener);

        const startRes = await NativePedometer.startLiveUpdates({
          startDate: sessionStartTimeRef.current.toISOString(),
        });
        console.log("🚀 [BRIDGE SWIFT CMPedometer startLiveUpdates]:", startRes);
      } catch (err) {
        console.log("🌉 [BRIDGE SWIFT CMPedometer startLiveUpdates]: No disponible aún:", err);
      }
    }

    await pollHealthSteps();
    pollIntervalRef.current = setInterval(
      () => {
        void pollHealthSteps();
      },
      Capacitor.isNativePlatform() ? 5000 : 2000,
    );

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [applySensorTotal, pollHealthSteps, updatePendingSteps]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (Capacitor.isNativePlatform()) {
      void NativePedometer.stopLiveUpdates().catch(() => {});
      for (const h of liveListenersRef.current) {
        void h.remove().catch(() => {});
      }
      liveListenersRef.current = [];
    }
  }, []);

  return {
    steps,
    isTracking,
    startTracking,
    stopTracking,
    setSteps: updatePendingSteps,
    pollHealthSteps,
    pendingStepsRef,
  };
}

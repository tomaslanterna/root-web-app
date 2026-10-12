"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useEventPresence } from '@/hooks/useEventPresence';
import type { LiveEvent } from '@/services/presence';
import { useAuth } from '@/context/AuthContext';
import { useDanceSync } from '@/hooks/useDanceSync';

interface DanceContextProps {
  liveEvent: LiveEvent | null;
  attendanceConfirmed: boolean;
  steps: number;
  totalSessionSteps: number;
  isTracking: boolean;
  forceStartNative?: () => void;
  simulateSteps?: () => void;
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
  
  const { startDanceSession, stopDanceSession, isTracking, steps, totalSessionSteps, forceStartNative, simulateSteps } = useDanceSync();

  useEffect(() => {
    let mounted = true;

    const checkLiveStatus = async () => {
      setLiveEvent(null);
      setAttendanceConfirmed(false);
      if (!user) return;

      try {
        const result = await checkPresence(undefined);
        if (!mounted) return;
        setLiveEvent(result.isLive ? result.event : null);
        setAttendanceConfirmed(result.attendanceConfirmed === true);
        if (result.isLive && result.event) await startDanceSession(result.event);
      } catch { /* Location permission denial must not show a developer overlay. */ }
    };

    checkLiveStatus();

    return () => {
      mounted = false;
      stopDanceSession();
    };
  }, [user, checkPresence, startDanceSession, stopDanceSession]);

  return (
    <DanceContext.Provider value={{ liveEvent, attendanceConfirmed, steps, totalSessionSteps, isTracking, forceStartNative, simulateSteps }}>
      {children}
    </DanceContext.Provider>
  );
}

export const useDanceContext = () => useContext(DanceContext);

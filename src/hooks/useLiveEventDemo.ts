"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { LiveEvent } from "@/services/presence";

/**
 * Solo en desarrollo: `?liveDemo=hoy | vivo | bailando` en cualquier URL simula un evento
 * en vivo para diseñar el banner del home sin crear eventos reales ni estar en el predio.
 *   hoy       → arranca en 3 horas (cuenta regresiva)
 *   vivo      → arrancó hace 1 hora y todavía no llegaste
 *   bailando  → arrancó hace 1 hora y estás en el predio sumando pasos
 */
export type LiveDemoMode = "hoy" | "vivo" | "bailando";

const MODES: LiveDemoMode[] = ["hoy", "vivo", "bailando"];
const HOUR = 60 * 60 * 1000;

function readMode(): LiveDemoMode | null {
  if (process.env.NODE_ENV !== "development") return null;
  const value = new URLSearchParams(window.location.search).get("liveDemo");
  return MODES.includes(value as LiveDemoMode) ? (value as LiveDemoMode) : null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/** Fecha en hora de Montevideo (-03:00), el formato que espera parseEventRealDate. */
function montevideoDate(ms: number) {
  return `${new Date(ms - 3 * HOUR).toISOString().slice(0, 19)}-03:00`;
}

export function useLiveEventDemo() {
  const mode = useSyncExternalStore(subscribe, readMode, () => null);

  return useMemo(() => {
    if (!mode) return null;
    // eslint-disable-next-line react-hooks/purity -- la hora de referencia se fija al elegir el modo
    const now = Date.now();
    const start = mode === "hoy" ? now + 3 * HOUR : now - HOUR;
    const liveEvent: LiveEvent = {
      id: "demo-live",
      title: "Fiesta en casa",
      date: montevideoDate(start),
      endDate: montevideoDate(start + 8 * HOUR),
      location: "Casa de Mathías",
      lineup: ["Mathi b2b Tomi"],
      genre: "Techno",
      bannerUrl: "",
    };
    return {
      liveEvent,
      isAtVenue: mode === "bailando",
      totalSessionSteps: mode === "bailando" ? 8420 : 0,
    };
  }, [mode]);
}

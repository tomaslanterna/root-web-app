"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Music, ChevronRight } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useDanceContext } from "@/context/DanceContext";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import { NativePedometer } from "@/hooks/usePedometer";

function formatStartHour(rawDate: string | Date): string {
  const parsed = parseEventRealDate(rawDate);
  if (Number.isNaN(parsed.getTime())) return "23:59";
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(parsed);
}

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = String(hours % 24).padStart(2, "0");
    return `${days}d ${remHours}:${minutes}:${seconds}`;
  }
  return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
}

export interface LiveEventBannerProps {
  forcedMode?: "before_start" | "started_away" | "dancing";
  mockEvent?: {
    id?: string;
    title: string;
    bannerUrl?: string;
    date?: string;
  };
  mockSteps?: number;
}

export function LiveEventBanner({
  forcedMode,
  mockEvent,
  mockSteps,
}: LiveEventBannerProps = {}) {
  const context = useDanceContext();
  const liveEvent = mockEvent
    ? {
        id: mockEvent.id || "preview-id",
        title: mockEvent.title,
        bannerUrl: mockEvent.bannerUrl,
        date: mockEvent.date || new Date().toISOString(),
        lineup: [],
      }
    : context.liveEvent;

  const isAtVenue = forcedMode ? forcedMode === "dancing" : context.isAtVenue;
  const totalSessionSteps = mockSteps ?? context.totalSessionSteps;

  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [liveEvent?.id]);

  useEffect(() => {
    if (!liveEvent) {
      if (!forcedMode && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        void NativePedometer.stopLiveActivity().catch(() => {});
      }
      return;
    }
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [liveEvent, forcedMode]);

  const eventStartForEffect = liveEvent ? parseEventRealDate(liveEvent.date) : null;
  const eventStartMsForEffect =
    eventStartForEffect && !Number.isNaN(eventStartForEffect.getTime())
      ? eventStartForEffect.getTime()
      : 0;
  const isBeforeStartForEffect = forcedMode
    ? forcedMode === "before_start"
    : eventStartMsForEffect > nowMs;
  const modeForEffect: "before_start" | "started_away" | "dancing" = forcedMode
    ? forcedMode
    : isBeforeStartForEffect
      ? "before_start"
      : isAtVenue
        ? "dancing"
        : "started_away";

  // Ventana de 5 horas para la Live Activity en Pantalla de Bloqueo
  const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
  const msUntilStartForLockScreen = eventStartMsForEffect - nowMs;
  const isWithinFiveHours = msUntilStartForLockScreen <= FIVE_HOURS_MS;

  // Sincronizar con el Widget de Pantalla de Bloqueo de iOS (Live Activity)
  useEffect(() => {
    if (forcedMode) return; // No sobreescribir la Live Activity real con datos mock
    if (!liveEvent) return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    // Si aún no arrancó el evento pero faltan más de 5 horas, la Live Activity en
    // pantalla de bloqueo y Dynamic Island no debe mostrarse (se finaliza si estaba activa).
    // En la app se sigue mostrando desde el comienzo del día sin restricción.
    if (modeForEffect === "before_start" && !isWithinFiveHours) {
      void NativePedometer.stopLiveActivity().catch(() => {});
      return;
    }

    const headerTitleSync =
      modeForEffect === "before_start"
        ? "TU EVENTO DE HOY"
        : modeForEffect === "dancing"
          ? "EN VIVO"
          : "EL EVENTO YA ARRANCÓ";

    const subtitleSync =
      modeForEffect === "before_start"
        ? "¡Es hoy! Preparate para esta noche"
        : modeForEffect === "started_away"
          ? "¡No te lo pierdas!"
          : "";

    const footerSync =
      modeForEffect === "dancing"
        ? "Ver estadísticas de baile"
        : modeForEffect === "before_start"
          ? "Ver entradas y detalles"
          : "Ver ubicación del evento";

    void NativePedometer.syncLiveActivity({
      eventId: liveEvent.id,
      eventTitle: liveEvent.title,
      startHourLabel: formatStartHour(liveEvent.date),
      venueLabel: liveEvent.location?.trim() || liveEvent.title,
      bannerUrl: liveEvent.bannerUrl,
      mode: modeForEffect,
      headerTitle: headerTitleSync,
      stepsCount: totalSessionSteps,
      subtitle: subtitleSync,
      footerLabel: footerSync,
      eventStartEpochMs: eventStartMsForEffect,
    })
      .then((res) => {
        console.log("🔒 [iOS LOCK SCREEN LIVE ACTIVITY]:", res);
      })
      .catch((err) => {
        console.warn("🔒 [iOS LOCK SCREEN LIVE ACTIVITY ERROR]:", err);
      });
  }, [
    liveEvent,
    modeForEffect,
    isWithinFiveHours,
    totalSessionSteps,
    eventStartMsForEffect,
    forcedMode,
  ]);

  if (!liveEvent) return null;

  const eventStart = parseEventRealDate(liveEvent.date);
  const eventEnd = (liveEvent as { endDate?: string | null }).endDate
    ? parseEventRealDate((liveEvent as { endDate?: string }).endDate!)
    : new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);

  if (!forcedMode && !Number.isNaN(eventEnd.getTime()) && nowMs > eventEnd.getTime()) {
    return null;
  }

  const rawMsUntilStart = !Number.isNaN(eventStart.getTime())
    ? eventStart.getTime() - nowMs
    : 0;

  const msUntilStart =
    forcedMode === "before_start" && rawMsUntilStart <= 0
      ? 2 * 3600 * 1000 + 14 * 60 * 1000 + 45 * 1000
      : rawMsUntilStart;

  const isBeforeStart = forcedMode
    ? forcedMode === "before_start"
    : msUntilStart > 0;

  // Estados:
  // 1) before_start: El evento todavía no arrancó (cuenta regresiva).
  // 2) started_away: El evento ya arrancó pero el usuario aún no llegó al predio.
  // 3) dancing: El evento arrancó y el usuario está en el predio (sumando pasos).
  const mode: "before_start" | "started_away" | "dancing" = forcedMode
    ? forcedMode
    : isBeforeStart
      ? "before_start"
      : isAtVenue
        ? "dancing"
        : "started_away";

  const targetHref = mode === "dancing" ? "/dance-ranker" : `/events/${liveEvent.id}`;
  const imageUrl =
    liveEvent.bannerUrl ||
    (liveEvent as { cinematicBannerUrl?: string }).cinematicBannerUrl ||
    "";
  const startHour = formatStartHour(liveEvent.date);

  return (
    <Link
      href={targetHref}
      aria-label={`${liveEvent.title}.`}
      className="group flex items-center gap-2.5 sm:gap-3 w-full my-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-surface border border-line text-ink transition-[background-color,border-color,transform] duration-200 hover:bg-surface-2 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent motion-safe:animate-fade-in shadow-sm min-h-[52px]"
    >
      {/* 1. Flyer cuadrado compacto */}
      <div className="relative size-11 sm:size-12 shrink-0 rounded-xl overflow-hidden bg-surface-2 border border-line/60 shadow-inner">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={liveEvent.title}
            onError={() => setImageError(true)}
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="size-full flex items-center justify-center bg-gradient-to-br from-surface-2 to-surface text-accent">
            <Music className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* 2. Info central */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {mode === "dancing" ? (
          <>
            {/* Estado 3 (Cuando ya ingresó): punto rojo tintineando con "En vivo" */}
            <div className="flex items-center gap-1.5 text-xs leading-none">
              <span className="relative flex size-2 shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-live" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-live">
                En vivo
              </span>
            </div>
            {/* Abajo el nombre del evento */}
            <h3 className="text-xs sm:text-sm font-black text-ink uppercase tracking-tight truncate leading-tight">
              {liveEvent.title}
            </h3>
          </>
        ) : mode === "started_away" ? (
          <>
            {/* Estado 2 (Ya arrancó pero no está ahí): solo el nombre del evento (sin hora, sin textos debajo) */}
            <h3 className="text-xs sm:text-sm font-black text-ink uppercase tracking-tight truncate leading-tight">
              {liveEvent.title}
            </h3>
          </>
        ) : (
          <>
            {/* Estado 1 (Antes de ir a la fiesta): hora tal cual está ahora y abajo el nombre */}
            <div className="flex items-center gap-1.5 text-xs text-ink-2 leading-none">
              <Clock className="size-3 text-accent shrink-0" aria-hidden="true" />
              <span className="font-bold text-ink">{startHour}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-ink uppercase tracking-tight truncate leading-tight">
              {liveEvent.title}
            </h3>
          </>
        )}
      </div>

      {/* 3. Lado derecho */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1 text-right">
        {mode === "dancing" ? (
          <>
            {/* Estado 3: pasos con la palabra "pasos" abajo y al lado chevron */}
            <div className="flex flex-col items-end justify-center">
              <span className="num-display text-lg sm:text-xl text-accent leading-none font-black tracking-tight">
                {totalSessionSteps.toLocaleString("en-US")}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-ink-2 uppercase tracking-wider mt-0.5">
                pasos
              </span>
            </div>
            <ChevronRight
              className="size-4 text-accent/80 group-hover:text-accent transition-colors shrink-0"
              aria-hidden="true"
            />
          </>
        ) : mode === "started_away" ? (
          <>
            {/* Estado 2: solo "¡No te lo pierdas!" donde estaba la cuenta regresiva en rojo */}
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-live">
              ¡No te lo pierdas!
            </span>
            <ChevronRight
              className="size-4 text-live/80 group-hover:text-live transition-colors shrink-0"
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            {/* Estado 1: cuenta regresiva donde está */}
            <div className="flex flex-col items-end justify-center">
              <span className="num-display text-sm sm:text-base text-accent leading-none font-black tracking-tight font-mono">
                {mounted ? formatCountdown(msUntilStart) : "02:14:45"}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-ink-3 uppercase tracking-wider mt-0.5">
                comienza en
              </span>
            </div>
            <ChevronRight
              className="size-4 text-ink-3 group-hover:text-accent transition-colors shrink-0"
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </Link>
  );
}

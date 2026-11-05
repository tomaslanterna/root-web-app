"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { useDanceContext } from "@/context/DanceContext";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import { NativePedometer } from "@/hooks/usePedometer";
import { useLiveEventDemo } from "@/hooks/useLiveEventDemo";

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

// Versión corta para el banner: "2h 59m", o "59:55" en la última hora.
function formatShortCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${String(minutes).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function LiveEventBanner() {
  const dance = useDanceContext();
  // En desarrollo, ?liveDemo=hoy|vivo|bailando reemplaza el evento real para diseñar el banner.
  const demo = useLiveEventDemo();
  const { liveEvent, isAtVenue, totalSessionSteps } = demo ?? dance;
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [liveEvent?.id]);

  useEffect(() => {
    if (!liveEvent) {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        void NativePedometer.stopLiveActivity().catch(() => {});
      }
      return;
    }
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [liveEvent]);

  const eventStartForEffect = liveEvent ? parseEventRealDate(liveEvent.date) : null;
  const eventStartMsForEffect =
    eventStartForEffect && !Number.isNaN(eventStartForEffect.getTime())
      ? eventStartForEffect.getTime()
      : 0;
  const isBeforeStartForEffect = eventStartMsForEffect > nowMs;
  const modeForEffect: "before_start" | "started_away" | "dancing" =
    isBeforeStartForEffect
      ? "before_start"
      : isAtVenue
        ? "dancing"
        : "started_away";

  // Sincronizar con el Widget de Pantalla de Bloqueo de iOS (Live Activity)
  useEffect(() => {
    if (!liveEvent || demo) return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    const headerTitleSync =
      modeForEffect === "before_start"
        ? "¡Es hoy! Tu evento de hoy"
        : modeForEffect === "dancing"
          ? "En vivo"
          : "El evento ya arrancó";

    const lineupSync =
      liveEvent.lineup && liveEvent.lineup.length > 0
        ? liveEvent.lineup.join(", ")
        : liveEvent.genre || "";

    const subtitleSync =
      modeForEffect === "before_start"
        ? lineupSync || "¡Es hoy! Preparate para esta noche"
        : modeForEffect === "dancing"
          ? lineupSync || "¡Ponete a bailar, es el momento!"
          : "El evento ya arrancó, ¡no te olvides de ir!";

    const footerSync =
      modeForEffect === "dancing"
        ? "Ver estadísticas de baile"
        : modeForEffect === "before_start"
          ? "Ver detalles del evento"
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
    demo,
    modeForEffect,
    totalSessionSteps,
    eventStartMsForEffect,
  ]);

  if (!liveEvent) return null;

  const eventStart = parseEventRealDate(liveEvent.date);
  const eventEnd = liveEvent.endDate
    ? parseEventRealDate(liveEvent.endDate)
    : new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);

  if (!Number.isNaN(eventEnd.getTime()) && nowMs > eventEnd.getTime()) {
    return null;
  }

  const msUntilStart = !Number.isNaN(eventStart.getTime())
    ? eventStart.getTime() - nowMs
    : 0;
  const isBeforeStart = msUntilStart > 0;

  // Estados:
  // 1) before_start: El evento todavía no arrancó (cuenta regresiva).
  // 2) started_away: El evento ya arrancó pero el usuario aún no llegó al predio.
  // 3) dancing: El evento arrancó y el usuario está en el predio (sumando pasos).
  const mode: "before_start" | "started_away" | "dancing" = isBeforeStart
    ? "before_start"
    : isAtVenue
      ? "dancing"
      : "started_away";

  // "DJ principal x productora" (ej. "Pawsa x Key"); si no se puede armar, el título del evento.
  const producer = liveEvent.title.match(/^(.+?)\s+presenta\b/i)?.[1]?.trim();
  const headliner = liveEvent.lineup?.[0]?.trim();
  const partyName = headliner && producer ? `${headliner} x ${producer}` : liveEvent.title;

  const isLive = mode !== "before_start";
  const statusText =
    mode === "before_start"
      ? `Hoy · ${formatStartHour(liveEvent.date)}`
      : mode === "started_away"
        ? "Ya arrancó"
        : "En vivo";

  const targetHref = mode === "dancing" ? "/dance-ranker" : `/events/${liveEvent.id}`;
  const imageUrl =
    liveEvent.bannerUrl ||
    (liveEvent as { cinematicBannerUrl?: string }).cinematicBannerUrl ||
    "";

  // Columna derecha: pasos mientras bailás, cuenta regresiva antes de empezar, o un empujón para ir.
  const metric =
    mode === "before_start"
      ? { value: formatShortCountdown(msUntilStart), label: "para arrancar", accent: false }
      : totalSessionSteps > 0 || mode === "dancing"
        ? { value: totalSessionSteps.toLocaleString("en-US"), label: "pasos", accent: true }
        : { value: "Andá", label: "a la fiesta", accent: true };

  const ariaLabel =
    mode === "dancing"
      ? `En vivo en ${partyName}, ${metric.value} pasos. Ver estadísticas de baile`
      : mode === "started_away"
        ? `${partyName} ya arrancó. Ver el evento`
        : `${partyName} es hoy a las ${formatStartHour(liveEvent.date)}, arranca en ${metric.value}. Ver el evento`;

  return (
    <Link
      href={targetHref}
      aria-label={ariaLabel}
      className="!mb-0 flex items-center gap-3 py-3 pl-3 pr-2.5 rounded-[18px] bg-surface border border-line text-ink transition-[background-color,transform] duration-200 hover:bg-surface-2 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="relative size-[60px] shrink-0 rounded-xl overflow-hidden bg-[#2B2F36]">
        {imageUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element -- flyer remoto de tamaño fijo
          <img
            src={imageUrl}
            alt=""
            onError={() => setImageError(true)}
            className="size-full object-cover"
          />
        ) : (
          <span className="size-full flex items-center justify-center text-ink-3">
            <Music className="size-5" aria-hidden="true" />
          </span>
        )}
      </span>

      <span className="flex-1 min-w-0 flex flex-col gap-[5px]">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
          <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", isLive ? "live-dot bg-live" : "bg-accent")} />
          <span className="truncate">{statusText}</span>
        </span>
        <span className="text-[17px] font-semibold truncate">{partyName}</span>
      </span>

      <span className="shrink-0 flex flex-col items-end gap-[3px]">
        <span className={cn("num-display leading-none", metric.accent ? "text-accent" : "text-ink", metric.accent ? "text-[34px]" : "text-2xl")}>
          {metric.value}
        </span>
        <span className="num-display text-[13px] leading-none text-ink-2">{metric.label}</span>
      </span>

      <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
    </Link>
  );
}

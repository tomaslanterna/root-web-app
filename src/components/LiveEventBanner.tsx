"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function LiveEventBanner() {
  const { liveEvent, isAtVenue, totalSessionSteps } = useDanceContext();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

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
    if (!liveEvent) return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    const headerTitleSync =
      modeForEffect === "before_start"
        ? "¡Es hoy! Tu evento de hoy"
        : modeForEffect === "dancing"
          ? "¡Ponete a bailar, es el momento!"
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
  // 1) isBeforeStart === true -> El evento es hoy pero todavía no llegó la hora ("¡Es hoy!")
  // 2) !isBeforeStart && !isAtVenue -> Ya es la hora pero no está en la ubicación ("El evento ya arrancó, no te olvides de ir")
  // 3) !isBeforeStart && isAtVenue -> Es la hora y está en el lugar ("¡Ponete a bailar, es el momento!" + pasos)
  const isDancingNow = !isBeforeStart && isAtVenue;

  const headerTitle = isBeforeStart
    ? "¡Es hoy! Tu evento de hoy"
    : isAtVenue
      ? "¡Ponete a bailar, es el momento!"
      : "El evento ya arrancó";

  // Etiqueta corta del estado: cuenta regresiva, pasos o "en vivo".
  const statusLabel = isBeforeStart
    ? `Hoy · arranca en ${formatCountdown(msUntilStart)}`
    : isAtVenue
      ? `En vivo · ${totalSessionSteps.toLocaleString("es-AR")} pasos`
      : "En vivo ahora";

  const venueLabel = liveEvent.location?.trim();
  const targetHref = isDancingNow ? "/dance-ranker" : `/events/${liveEvent.id}`;

  return (
    <Link
      href={targetHref}
      aria-label={`${liveEvent.title}. ${headerTitle}. ${statusLabel}`}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-card bg-surface border text-ink transition-[background-color,transform] duration-200 hover:bg-surface-2 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent motion-safe:animate-fade-in",
        isBeforeStart ? "border-accent/35" : "border-live/35",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          isBeforeStart
            ? "bg-accent shadow-[0_0_0_4px_rgba(212,255,0,0.2)]"
            : "bg-live shadow-[0_0_0_4px_rgba(255,90,54,0.2)]",
        )}
      />
      <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <span className={cn("label-mono", isBeforeStart ? "text-accent" : "text-live-ink")}>
          {statusLabel}
        </span>
        <span className="text-[15px] font-semibold truncate">
          {liveEvent.title}
          {venueLabel ? ` · ${venueLabel}` : ""}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-2" />
    </Link>
  );
}

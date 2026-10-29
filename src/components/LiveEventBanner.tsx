"use client";

import React, { useEffect, useState } from "react";
import { Clock, Music, Sparkles, Ticket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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

  const headerBadgeText = isBeforeStart
    ? `Arranca en ${formatCountdown(msUntilStart)}`
    : isAtVenue
      ? `${totalSessionSteps.toLocaleString("es-AR")} Pasos`
      : "¡No te olvides de ir!";

  const startHourLabel = formatStartHour(liveEvent.date);
  const lineupLabel =
    liveEvent.lineup && liveEvent.lineup.length > 0
      ? liveEvent.lineup.join(", ")
      : liveEvent.genre || "";

  const subtitleText = isBeforeStart
    ? lineupLabel || "¡Es hoy! Preparate para esta noche"
    : isAtVenue
      ? lineupLabel || "¡Ponete a bailar, es el momento!"
      : "El evento ya arrancó, ¡no te olvides de ir!";

  const venuePillText = liveEvent.location?.trim() || liveEvent.title;
  const targetHref = isDancingNow ? "/dance-ranker" : `/events/${liveEvent.id}`;
  const footerLabel = isDancingNow
    ? "Ver estadísticas de baile"
    : isBeforeStart
      ? "Ver detalles del evento"
      : "Ver ubicación del evento";

  return (
    <div className="w-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-500">
      <Link
        href={targetHref}
        aria-label={`${liveEvent.title} - ${headerTitle}`}
        className="block w-full group motion-safe:active:scale-[0.99] transition-transform"
      >
        <article className="w-full overflow-hidden rounded-3xl border-0 bg-[#111114] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
          {/* Header superior */}
          <header className="bg-[#111114] px-4 pt-3 pb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate">
              {headerTitle}
            </span>
            <span className="shrink-0 rounded-full bg-[#D4FF00] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-neutral-950 shadow-[0_0_16px_rgba(212,255,0,0.25)]">
              {headerBadgeText}
            </span>
          </header>

          {/* Cuerpo central con flyer cuadrado e info */}
          <div className="bg-[#111114] px-4 py-2 flex items-center gap-3.5">
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 rounded-2xl overflow-hidden bg-neutral-900 border-0 shadow-md">
              {liveEvent.bannerUrl ? (
                <Image
                  src={liveEvent.bannerUrl}
                  alt={liveEvent.title}
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0B0D10]">
                  <Sparkles className="w-6 h-6 text-[#D4FF00]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[#D4FF00] mb-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0 stroke-[2.3]" />
                <span className="text-xs font-bold tracking-tight text-white">
                  {startHourLabel}
                </span>
              </div>

              <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight text-white leading-tight line-clamp-1">
                {liveEvent.title}
              </h3>

              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-tight text-neutral-400 leading-snug line-clamp-1 mt-0.5">
                {subtitleText}
              </p>

              <div className="mt-1.5 inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-[#0B0D10] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-neutral-200 border-0">
                <Music className="w-3 h-3 shrink-0 text-[#D4FF00]" />
                <span className="truncate">{venuePillText}</span>
              </div>
            </div>
          </div>

          {/* Barra inferior de acción */}
          <footer className="bg-[#111114] px-4 pt-1.5 pb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#D4FF00] transition-colors">
            <Ticket className="w-3.5 h-3.5 shrink-0 text-[#D4FF00] stroke-[2]" />
            <span>{footerLabel}</span>
          </footer>
        </article>
      </Link>
    </div>
  );
}

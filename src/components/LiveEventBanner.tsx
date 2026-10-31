"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Ticket,
  MapPin,
  Music,
  Sparkles,
  Flame,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { DancerFigureIcon } from "@/components/ui/DancerIcon";
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

export function LiveEventBanner() {
  const { liveEvent, isAtVenue, totalSessionSteps } = useDanceContext();
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
    if (!liveEvent) return;
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

  const headerTitle =
    mode === "before_start"
      ? "TU EVENTO DE HOY"
      : mode === "dancing"
        ? "EN VIVO"
        : "EL EVENTO YA ARRANCÓ";

  const lineupText =
    liveEvent.lineup && liveEvent.lineup.length > 0
      ? liveEvent.lineup.join(", ")
      : liveEvent.genre || "";

  const subtitleText =
    mode === "before_start"
      ? lineupText || "¡Es hoy! Preparate para esta noche"
      : mode === "started_away"
        ? "El evento ya arrancó · ¡Andá a la pista!"
        : "";

  const targetHref = mode === "dancing" ? "/dance-ranker" : `/events/${liveEvent.id}`;
  const imageUrl =
    liveEvent.bannerUrl ||
    (liveEvent as { cinematicBannerUrl?: string }).cinematicBannerUrl ||
    "";
  const startHour = formatStartHour(liveEvent.date);

  return (
    <Link
      href={targetHref}
      aria-label={`${liveEvent.title}. ${headerTitle}.`}
      className="group block w-full p-3 sm:p-3.5 rounded-card bg-surface border border-line text-ink transition-[background-color,border-color,transform] duration-200 hover:bg-surface-2 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent motion-safe:animate-fade-in shadow-lg"
    >
      {/* 1. Header superior */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {mode === "dancing" || mode === "started_away" ? (
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-live" />
            </span>
          ) : (
            <Sparkles className="size-3.5 text-accent shrink-0" aria-hidden="true" />
          )}
          <span
            className={cn(
              "tech-label text-xs tracking-wider uppercase truncate",
              mode === "dancing" || mode === "started_away" ? "text-live" : "text-ink",
            )}
          >
            {headerTitle}
          </span>
        </div>

        {/* Texto superior derecho (sin tag/cápsula) */}
        {mode === "dancing" ? (
          <span className="shrink-0 text-[11px] sm:text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Flame className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>A LA PISTA A BAILAR</span>
          </span>
        ) : mode === "started_away" ? (
          <span className="shrink-0 text-[11px] sm:text-xs font-black uppercase tracking-wider text-live flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-live" aria-hidden="true" />
            <span>¡NO TE OLVIDES DE IR!</span>
          </span>
        ) : (
          <span className="shrink-0 text-[11px] sm:text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              ARRANCA EN <span className="font-mono">{formatCountdown(msUntilStart)}</span>
            </span>
          </span>
        )}
      </div>

      {/* 2. Cuerpo central: Flyer + Info + Pasos / Métrica */}
      <div className="flex items-center gap-3">
        {/* Flyer cuadrado con fallback */}
        <div className="relative size-14 sm:size-16 shrink-0 rounded-xl overflow-hidden bg-surface-2 border border-line shadow-inner">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={liveEvent.title}
              onError={() => setImageError(true)}
              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-2 to-surface text-accent">
              <Music className="size-5" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Info central */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs text-ink-2">
            <Clock className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span className="font-bold text-ink">{startHour}</span>
            {mode === "started_away" && (
              <span className="text-live font-bold uppercase text-[10px] ml-1">
                · ¡Arrancó!
              </span>
            )}
          </div>

          <h3 className="text-sm font-black text-ink uppercase tracking-tight truncate leading-tight">
            {liveEvent.title}
          </h3>

          {mode === "before_start" ? (
            <p className="text-xs truncate font-semibold uppercase leading-tight text-ink-2">
              {subtitleText}
            </p>
          ) : mode === "started_away" ? (
            <p className="text-xs truncate font-semibold uppercase leading-tight text-live">
              {subtitleText}
            </p>
          ) : lineupText ? (
            <p className="text-xs truncate font-medium uppercase leading-tight text-ink-2">
              {lineupText}
            </p>
          ) : null}
        </div>

        {/* Columna derecha: Pasos en num-display / Métrica */}
        {mode === "dancing" ? (
          <div className="flex flex-col items-end justify-center shrink-0 pl-2 text-right">
            <div className="flex items-baseline gap-1">
              <span className="num-display text-2xl sm:text-3xl text-accent leading-none tracking-tight">
                {totalSessionSteps.toLocaleString("en-US")}
              </span>
              <span className="num-display text-xs text-accent/80 uppercase">
                pasos
              </span>
            </div>
            <span className="num-display text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">
              en la pista
            </span>
          </div>
        ) : mode === "started_away" ? (
          <div className="flex flex-col items-end justify-center shrink-0 pl-2 text-right">
            {totalSessionSteps > 0 ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="num-display text-xl sm:text-2xl text-live leading-none">
                    {totalSessionSteps.toLocaleString("en-US")}
                  </span>
                  <span className="num-display text-xs text-live/80 uppercase">
                    pasos
                  </span>
                </div>
                <span className="num-display text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">
                  Andá a la pista
                </span>
              </>
            ) : (
              <>
                <span className="num-display text-lg sm:text-xl text-live leading-none tracking-tight uppercase">
                  Andá
                </span>
                <span className="num-display text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">
                  a la fiesta
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex flex-col items-end justify-center shrink-0 pl-2 text-right">
            <span className="num-display text-xl sm:text-2xl text-accent leading-none tracking-tight">
              {formatCountdown(msUntilStart)}
            </span>
            <span className="num-display text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">
              cuenta regresiva
            </span>
          </div>
        )}
      </div>

      {/* 3. Footer inferior con acción */}
      <div className="mt-2 pt-0.5 flex items-center justify-center gap-1.5 text-xs font-bold text-ink-2 group-hover:text-ink transition-colors">
        {mode === "dancing" ? (
          <>
            <DancerFigureIcon className="size-3.5 text-accent" aria-hidden="true" />
            <span>Ver estadísticas de baile</span>
            <ArrowUpRight
              className="size-3.5 text-ink-3 group-hover:text-accent transition-colors"
              aria-hidden="true"
            />
          </>
        ) : mode === "started_away" ? (
          <>
            <MapPin className="size-3.5 text-live" aria-hidden="true" />
            <span>Ver ubicación del evento</span>
            <ChevronRight
              className="size-3.5 text-ink-3 group-hover:text-live transition-colors"
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            <Ticket className="size-3.5 text-accent" aria-hidden="true" />
            <span>Ver entradas y detalles</span>
            <ChevronRight
              className="size-3.5 text-ink-3 group-hover:text-accent transition-colors"
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </Link>
  );
}

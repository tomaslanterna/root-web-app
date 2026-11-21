"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, Music, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { cn } from "@/lib/utils";
import {
  eventsApi,
  type EventLiveRankingEntry,
  type EventLiveRankingResponse,
} from "@/services/events";
import { useAuth } from "@/context/AuthContext";
import { useDanceContext } from "@/context/DanceContext";

interface EventLiveRankingProps {
  eventId: string;
  eventTitle?: string;
  eventLocation?: string;
  eventBannerUrl?: string;
  eventDate?: string;
  eventLineup?: string[];
  eventGenre?: string;
}

export function useEventLiveRankingData(eventId: string, enabled = true) {
  const { user } = useAuth();
  const { liveEvent, isAtVenue, totalSessionSteps } = useDanceContext();
  const [rankingData, setRankingData] = useState<EventLiveRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRanking = useCallback(
    async (silent = false) => {
      if (!eventId) return;
      if (!silent) setIsRefreshing(true);
      try {
        const res = await eventsApi.getEventLiveRanking(eventId);
        setRankingData(res);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    if (!enabled || !eventId) return;
    void fetchRanking(false);
    const interval = setInterval(() => {
      void fetchRanking(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [enabled, eventId, fetchRanking]);

  // Combinar los pasos en vivo del usuario actual si está en este evento
  const mergedEntries = useMemo<EventLiveRankingEntry[]>(() => {
    const base = rankingData?.data ? [...rankingData.data] : [];
    const isCurrentUserLiveHere =
      Boolean(user?.id) && liveEvent?.id === eventId && (isAtVenue || totalSessionSteps > 0);

    if (isCurrentUserLiveHere && user) {
      const existingIdx = base.findIndex((e) => e.userId === user.id);
      if (existingIdx >= 0) {
        const current = base[existingIdx];
        base[existingIdx] = {
          ...current,
          steps: Math.max(current.steps, totalSessionSteps),
          isActive: true,
        };
      } else {
        base.push({
          rank: base.length + 1,
          userId: user.id,
          name: user.name || user.username || "Vos",
          username: user.username || "",
          avatarUrl: user.avatarUrl,
          steps: totalSessionSteps,
          isActive: true,
        });
      }
    }

    base.sort((a, b) => b.steps - a.steps);
    return base.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }, [rankingData, user, liveEvent?.id, eventId, isAtVenue, totalSessionSteps]);

  const totalEventSteps = useMemo(
    () => mergedEntries.reduce((acc, item) => acc + (Number(item.steps) || 0), 0),
    [mergedEntries],
  );

  const activeDancers = useMemo(
    () => mergedEntries.filter((item) => item.isActive).length,
    [mergedEntries],
  );

  return {
    entries: mergedEntries,
    totalDancers: mergedEntries.length,
    activeDancers,
    totalEventSteps,
    isLoading,
    isRefreshing,
    refresh: () => fetchRanking(false),
  };
}

/** Punto rojo pulsante + "En vivo": el mismo indicador que el Live Activity banner. */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 leading-none", className)}>
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-live" />
      </span>
      <span className="text-[11px] font-black uppercase tracking-wider text-live">En vivo</span>
    </span>
  );
}

const fmtSteps = (n: number) => n.toLocaleString("es-UY");

/** Encabezado sticky del ranking en vivo, con el mismo patrón que Dance stats. */
export function LiveRankingHeader({
  onBack,
  rightAction,
}: {
  onBack: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
      <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
        <SwipeBack />
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft className="size-[22px]" aria-hidden="true" />
        </button>
        <h1 className="font-display m-0 flex-1 min-w-0 truncate text-2xl">Ranking</h1>
        {rightAction}
      </div>
    </header>
  );
}

function RowSkeleton({ rows }: { rows: number }) {
  return (
    <ol aria-hidden="true" className="m-0 p-0 list-none rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 p-3.5">
          <span className="w-6 h-3.5 rounded bg-surface-2 motion-safe:animate-pulse" />
          <span className="size-9 rounded-full bg-surface-2 motion-safe:animate-pulse" />
          <span className="flex-1 h-3.5 rounded bg-surface-2 motion-safe:animate-pulse" />
          <span className="w-14 h-3.5 rounded bg-surface-2 motion-safe:animate-pulse" />
        </li>
      ))}
    </ol>
  );
}

/** Fila del ranking: posición, persona y pasos. Igual que la lista de la crew. */
function RankingRow({
  person,
  isMe,
  compact = false,
}: {
  person: EventLiveRankingEntry;
  isMe: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "px-3.5 py-3" : "p-3.5")}>
      <span className={cn("num-mono w-6 text-sm shrink-0", isMe ? "text-accent font-semibold" : "text-ink-3")}>
        {person.rank}
      </span>
      <span className="relative shrink-0">
        <Avatar
          src={person.avatarUrl || undefined}
          fallback={person.name}
          username={person.username || undefined}
          className={cn("rounded-full", compact ? "size-8" : "size-9")}
        />
        {person.isActive && (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-surface"
            aria-label="Bailando ahora"
          />
        )}
      </span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="flex items-baseline gap-1 min-w-0 text-[15px]">
          <span className="font-semibold truncate">{person.name}</span>
          {isMe && <span className="shrink-0 text-ink-3">(vos)</span>}
        </span>
        {!compact && person.username && (
          <span className="text-[13px] text-ink-3 truncate">@{person.username}</span>
        )}
      </span>
      <span className={cn("num-mono text-sm font-semibold shrink-0", isMe && "text-accent")}>
        {fmtSteps(person.steps)}
      </span>
    </div>
  );
}

export function EventLiveRankingCard({
  eventId,
  eventTitle,
}: EventLiveRankingProps) {
  const { user } = useAuth();
  const { liveEvent, isAtVenue, attendanceConfirmed } = useDanceContext();
  const isUserAtThisEvent = Boolean(
    liveEvent?.id === eventId && (isAtVenue || attendanceConfirmed),
  );
  const { entries, isLoading } = useEventLiveRankingData(eventId, isUserAtThisEvent);

  if (!isUserAtThisEvent) {
    return null;
  }

  const topThree = entries.slice(0, 3);
  const myEntry = user?.id ? entries.find((e) => e.userId === user.id) : undefined;
  const meOutsideTop = myEntry && myEntry.rank > 3 ? myEntry : undefined;

  return (
    <Link
      href={`/events/${eventId}/live`}
      aria-label={`Ver el ranking en vivo de ${eventTitle || "este evento"}`}
      className="group p-4 rounded-card bg-surface border border-line flex flex-col gap-3.5 hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <h2 className="label-mono text-ink-2 m-0">Ranking del evento</h2>
          {eventTitle && <span className="text-[15px] font-semibold truncate">{eventTitle}</span>}
        </div>
        <LiveBadge className="mt-0.5 shrink-0" />
      </div>

      {isLoading ? (
        <RowSkeleton rows={3} />
      ) : topThree.length > 0 ? (
        <ol className="m-0 p-0 list-none rounded-control overflow-hidden bg-bg border border-line divide-y divide-white/[0.06]">
          {topThree.map((person) => (
            <li key={person.userId}>
              <RankingRow person={person} isMe={user?.id === person.userId} compact />
            </li>
          ))}
          {meOutsideTop && (
            <li>
              <RankingRow person={meOutsideTop} isMe compact />
            </li>
          )}
        </ol>
      ) : (
        <p className="m-0 text-[15px] text-ink-2">
          Cuando la gente empiece a bailar, acá vas a ver el ranking de pasos en tiempo real.
        </p>
      )}

      <span className="min-h-11 -mb-2 flex items-center gap-1.5 text-sm font-medium text-accent group-hover:text-accent-hover">
        Ver ranking completo
        <ChevronRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function EventLiveRankingContent({
  eventId,
  eventTitle,
  eventLocation,
  eventBannerUrl,
  onClose,
}: EventLiveRankingProps & { onClose: () => void }) {
  const { user } = useAuth();
  const { liveEvent } = useDanceContext();
  const [imageError, setImageError] = useState(false);
  const {
    entries,
    totalDancers,
    activeDancers,
    totalEventSteps,
    isLoading,
    isRefreshing,
    refresh,
  } = useEventLiveRankingData(eventId, true);

  const myEntry = useMemo(
    () => (user?.id ? entries.find((e) => e.userId === user.id) : undefined),
    [entries, user?.id],
  );

  const isSameLiveEvent = liveEvent?.id === eventId;
  const displayTitle =
    eventTitle || (isSameLiveEvent ? liveEvent?.title : "") || "Evento en vivo";
  const displayLocation =
    eventLocation || (isSameLiveEvent ? liveEvent?.location : "") || "";
  const displayBannerUrl =
    eventBannerUrl || (isSameLiveEvent ? liveEvent?.bannerUrl : "") || "";

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(2rem+var(--root-safe-bottom))]">
      <LiveRankingHeader
        onBack={onClose}
        rightAction={
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Actualizar ranking"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <RefreshCw
              className={cn("size-[18px]", isRefreshing && "motion-safe:animate-spin text-accent")}
              aria-hidden="true"
            />
          </button>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Evento: mismo formato que el Live Activity banner en modo "bailando", sin hora. */}
        <Link
          href={`/events/${eventId}`}
          className="group flex items-center gap-3 p-3 rounded-card bg-surface border border-line hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          <span className="relative size-14 shrink-0 rounded-xl overflow-hidden bg-surface-2 border border-line/60">
            {displayBannerUrl && !imageError ? (
              <img
                src={displayBannerUrl}
                alt=""
                onError={() => setImageError(true)}
                className="size-full object-cover"
              />
            ) : (
              <span className="size-full flex items-center justify-center text-accent">
                <Music className="size-5" aria-hidden="true" />
              </span>
            )}
          </span>
          <span className="flex-1 min-w-0 flex flex-col gap-1">
            <LiveBadge />
            <span className="text-sm font-black uppercase tracking-tight truncate leading-tight">
              {displayTitle}
            </span>
            {displayLocation && (
              <span className="text-[13px] text-ink-2 truncate">{displayLocation}</span>
            )}
          </span>
          <ChevronRight className="size-4 text-ink-3 group-hover:text-ink transition-colors shrink-0" aria-hidden="true" />
        </Link>

        {/* Resumen: mismo bloque partido que los datos clave del evento. */}
        <dl className="m-0 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line">
          <div className="bg-surface p-3.5 flex flex-col gap-1">
            <dt className="label-mono text-ink-3">En el evento</dt>
            <dd className="m-0 num-mono text-[26px] font-semibold leading-tight">{totalDancers}</dd>
            <dd className="m-0 text-[13px] text-ink-2">
              {activeDancers > 0 ? `${activeDancers} bailando ahora` : "Nadie bailando ahora"}
            </dd>
          </div>
          <div className="bg-surface p-3.5 flex flex-col gap-1">
            <dt className="label-mono text-ink-3">Pasos de la fiesta</dt>
            <dd className="m-0 num-mono text-[26px] font-semibold leading-tight">{fmtSteps(totalEventSteps)}</dd>
            <dd className="m-0 text-[13px] text-ink-2">entre todos</dd>
          </div>
        </dl>

        {/* Tu posición */}
        {myEntry && (
          <section
            aria-label="Tu posición"
            className="p-4 rounded-card border border-accent/40 bg-accent/12 flex items-center justify-between gap-3"
          >
            <span className="flex flex-col gap-1 min-w-0">
              <span className="label-mono text-accent">Tu posición</span>
              <span className="text-[15px]">
                <span className="num-mono text-[26px] font-semibold leading-none">#{myEntry.rank}</span>
                <span className="text-ink-2"> de {entries.length}</span>
              </span>
            </span>
            <span className="flex flex-col items-end gap-1 shrink-0">
              <span className="num-mono text-[26px] font-semibold leading-none text-accent">{fmtSteps(myEntry.steps)}</span>
              <span className="text-[13px] text-ink-2">pasos</span>
            </span>
          </section>
        )}

        {/* Lista completa */}
        <section aria-labelledby="live-ranking-list" className="flex flex-col gap-2.5 pt-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 id="live-ranking-list" className="label-mono text-ink-2 m-0">Todos en el evento</h2>
            <span className="label-mono text-ink-3">Pasos</span>
          </div>

          {isLoading ? (
            <RowSkeleton rows={5} />
          ) : entries.length === 0 ? (
            <div className="p-6 rounded-card bg-surface border border-line flex flex-col items-center gap-1.5 text-center">
              <Activity className="size-6 text-accent" aria-hidden="true" />
              <p className="m-0 text-[15px] font-semibold">Todavía no hay pasos en vivo</p>
              <p className="m-0 text-[13px] text-ink-2 max-w-xs">
                Cuando la gente entre al predio y empiece a bailar, va a aparecer acá en tiempo real.
              </p>
            </div>
          ) : (
            <ol className="m-0 p-0 list-none rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
              {entries.map((person) => {
                const isMe = user?.id === person.userId;
                const row = <RankingRow person={person} isMe={isMe} />;
                return (
                  <li key={person.userId} className={cn(isMe && "bg-accent/[0.06]")}>
                    {person.username ? (
                      <Link
                        href={`/profile/${person.username}`}
                        className="block hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                      >
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

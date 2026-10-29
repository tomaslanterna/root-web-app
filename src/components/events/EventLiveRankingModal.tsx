"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  Clock,
  Crown,
  Flame,
  Loader2,
  Medal,
  Music,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { DetailHeader } from "@/components/ui/DetailHeader";
import { cn } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";
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

export function EventLiveRankingCard({
  eventId,
  eventTitle,
  eventLocation,
}: EventLiveRankingProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { liveEvent, isAtVenue, attendanceConfirmed } = useDanceContext();
  const isUserAtThisEvent = Boolean(
    liveEvent?.id === eventId && (isAtVenue || attendanceConfirmed),
  );
  const { entries, totalDancers, activeDancers, totalEventSteps, isLoading } =
    useEventLiveRankingData(eventId, isUserAtThisEvent);

  if (!isUserAtThisEvent) {
    return null;
  }

  const topThree = entries.slice(0, 3);

  return (
    <div
      onClick={() => router.push(`/events/${eventId}/live`)}
      className="relative rounded-3xl border-0 bg-[#111114] hover:bg-[#16171D] p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4 transition-all cursor-pointer group overflow-hidden"
    >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D4FF00] stroke-[2] shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-white truncate">
                Ranking del evento
              </span>
            </div>
            {eventTitle && (
              <p className="text-[11px] font-bold text-neutral-400 truncate mt-0.5 pl-6">
                {eventTitle}
              </p>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#D4FF00]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#D4FF00]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF00] animate-pulse" />
            Tiempo Real
          </span>
        </div>

        {!isLoading && topThree.length > 0 ? (
          <div className="space-y-2 pt-1">
            {topThree.map((person, idx) => {
              const isMe = user?.id === person.userId;
              return (
                <div
                  key={person.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-2.5",
                    isMe ? "bg-[#D4FF00]/15" : "bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "num-display text-xs w-4 text-center shrink-0",
                      idx === 0
                        ? "text-[#D4FF00]"
                        : idx === 1
                          ? "text-neutral-300"
                          : "text-amber-500",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <Avatar
                    src={person.avatarUrl || undefined}
                    fallback={person.name}
                    size="sm"
                    className="w-7 h-7 aspect-square shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{person.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#D4FF00] shrink-0">
                    <Activity className="w-3 h-3" />
                    <span className="num-display text-xs">
                      {person.steps.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !isLoading && (
            <p className="text-xs text-neutral-400 font-medium">
              Cuando la gente esté en el evento bailando, acá vas a ver a todos en vivo y el ranking de pasos en tiempo real.
            </p>
          )
        )}

      <div className="flex items-center justify-between pt-2 text-xs font-black uppercase tracking-wider text-[#D4FF00] group-hover:translate-x-0.5 transition-transform">
        <span>Ver todas las personas y ranking en vivo</span>
        <span>→</span>
      </div>
    </div>
  );
}

export function EventLiveRankingContent({
  eventId,
  eventTitle,
  eventLocation,
  eventBannerUrl,
  eventDate,
  eventLineup,
  eventGenre,
  onClose,
}: EventLiveRankingProps & { onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const { liveEvent } = useDanceContext();
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
    eventTitle || (isSameLiveEvent ? liveEvent?.title : "") || "Evento en Vivo";
  const displayLocation =
    eventLocation || (isSameLiveEvent ? liveEvent?.location : "") || displayTitle;
  const displayBannerUrl =
    eventBannerUrl || (isSameLiveEvent ? liveEvent?.bannerUrl : "") || "";
  const rawDate = eventDate || (isSameLiveEvent ? liveEvent?.date : "") || "";
  const startHourLabel = useMemo(() => {
    if (!rawDate) return "";
    const parsed = parseEventRealDate(rawDate);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(parsed);
  }, [rawDate]);

  const lineupList =
    eventLineup && eventLineup.length > 0
      ? eventLineup
      : isSameLiveEvent && liveEvent?.lineup
        ? liveEvent.lineup
        : [];
  const genreLabel =
    eventGenre || (isSameLiveEvent ? liveEvent?.genre : "") || "";
  const subtitleText =
    lineupList.length > 0
      ? lineupList.join(", ")
      : genreLabel || "Ranking de pasos en tiempo real";

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white">
      {/* Sticky Header */}
      <DetailHeader
        position="sticky"
        onBack={onClose}
        icon={<Trophy className="w-4 h-4 text-[#D4FF00]" />}
        title="Ranking del Evento"
        showSave={false}
        showShare={false}
        rightActions={
          <button
            type="button"
            onClick={() => void refresh()}
            className="w-10 h-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:text-[#D4FF00] transition-colors cursor-pointer"
            aria-label="Actualizar ranking"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#D4FF00]")} />
          </button>
        }
      />

      <div className="flex-1 p-4 pb-24 space-y-5 max-w-2xl w-full mx-auto">
        {/* Card del Evento (estilo Live Activity Banner con flyer a la izquierda) */}
        <div
          onClick={() => router.push(`/events/${eventId}`)}
          className="w-full overflow-hidden rounded-3xl border-0 bg-[#111114] hover:bg-[#16171D] p-4 flex items-center gap-3.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-colors cursor-pointer group"
        >
          <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-neutral-900 border-0 shadow-md">
            {displayBannerUrl ? (
              <Image
                src={displayBannerUrl}
                alt={displayTitle}
                fill
                unoptimized
                sizes="80px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0B0D10]">
                <Sparkles className="w-6 h-6 text-[#D4FF00]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 text-[#D4FF00]">
                <Clock className="w-3.5 h-3.5 shrink-0 stroke-[2.3]" />
                <span className="text-xs font-bold tracking-tight text-white">
                  {startHourLabel || "En vivo"}
                </span>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#D4FF00]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#D4FF00]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse" />
                En Vivo
              </span>
            </div>

            <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-white leading-tight line-clamp-1 group-hover:text-[#D4FF00] transition-colors">
              {displayTitle}
            </h2>

            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-tight text-neutral-400 leading-snug line-clamp-1 mt-0.5">
              {subtitleText}
            </p>

            <div className="mt-1.5 inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-[#0B0D10] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-neutral-200 border-0">
              <Music className="w-3 h-3 shrink-0 text-[#D4FF00]" />
              <span className="truncate">{displayLocation}</span>
            </div>
          </div>
        </div>
        {/* Resumen en vivo del evento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-[#111114] p-4 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
              <span className="tech-label text-[#D4FF00]">En el evento</span>
            </div>
            <p className="num-display text-3xl text-white">{totalDancers}</p>
            <p className="tech-label text-[9px] text-neutral-400 mt-1">
              {activeDancers > 0 ? `${activeDancers} bailando ahora` : "Personas registradas"}
            </p>
          </div>

          <div className="rounded-3xl bg-[#111114] p-4 flex flex-col items-center justify-center text-center shadow-lg">
            <span className="tech-label text-neutral-400 mb-1">Pasos de la Fiesta</span>
            <p className="num-display text-3xl text-[#D4FF00]">
              {totalEventSteps.toLocaleString("es-AR")}
            </p>
            <p className="tech-label text-[9px] text-neutral-400 mt-1">Pasos totales</p>
          </div>
        </div>

        {/* Tu posición actual si estás participando */}
        {myEntry && (
          <div className="rounded-3xl bg-[#D4FF00] text-neutral-950 p-4 flex items-center justify-between shadow-[0_8px_30px_rgba(212,255,0,0.2)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-black text-[#D4FF00] flex items-center justify-center num-display text-sm shrink-0">
                #{myEntry.rank}
              </div>
              <div className="min-w-0">
                <p className="tech-label text-[9px] text-black/70">Tu posición en vivo</p>
                <p className="text-sm font-black uppercase tracking-tight text-black truncate">
                  {myEntry.name}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="num-display text-xl text-black">
                {myEntry.steps.toLocaleString("es-AR")}
              </p>
              <p className="tech-label text-[9px] text-black/70">pasos</p>
            </div>
          </div>
        )}

        {/* Título de sección */}
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300 px-1 pt-1">
          Todos en el evento
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#D4FF00]" />
            <p className="text-xs font-bold text-neutral-400">
              Cargando ranking del evento en tiempo real...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-3xl bg-[#111114] p-8 text-center space-y-2">
            <Activity className="w-8 h-8 text-[#D4FF00] mx-auto stroke-[1.8]" />
            <p className="text-sm font-black uppercase tracking-wider text-white">
              Aún no hay pasos registrados en vivo
            </p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              A medida que las personas ingresen al predio del evento y empiecen a bailar, aparecerán acá en tiempo real.
            </p>
          </div>
        ) : (
          <>
            {/* Podio Top 3 */}
            {entries.length >= 3 && (
              <div className="flex items-end justify-center gap-3 pt-2 pb-1">
                {/* 2do */}
                <div
                  onClick={() =>
                    entries[1].username &&
                    router.push(`/profile/${entries[1].username}`)
                  }
                  className="flex flex-col items-center gap-2 flex-1 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar
                      src={entries[1].avatarUrl || undefined}
                      fallback={entries[1].name}
                      size="sm"
                      className="ring-2 ring-neutral-300/30 aspect-square"
                    />
                    {entries[1].isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#D4FF00] ring-2 ring-[#0B0D10]" />
                    )}
                  </div>
                  <p className="tech-label text-white truncate max-w-[85px]">
                    {entries[1].name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]">
                    <span className="num-display text-neutral-300">
                      {entries[1].steps.toLocaleString("es-AR")}
                    </span>{" "}
                    <span className="text-[9px]">👟</span>
                  </p>
                  <div className="w-full h-16 rounded-t-2xl bg-neutral-300/10 flex items-end justify-center pb-2">
                    <Medal className="w-5 h-5 text-neutral-300 stroke-[1.8]" />
                  </div>
                </div>

                {/* 1ro */}
                <div
                  onClick={() =>
                    entries[0].username &&
                    router.push(`/profile/${entries[0].username}`)
                  }
                  className="flex flex-col items-center gap-2 flex-1 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar
                      src={entries[0].avatarUrl || undefined}
                      fallback={entries[0].name}
                      size="md"
                      className="ring-2 ring-[#D4FF00] aspect-square"
                    />
                    {entries[0].isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#D4FF00] ring-2 ring-[#0B0D10]" />
                    )}
                  </div>
                  <p className="tech-label text-white truncate max-w-[90px]">
                    {entries[0].name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]">
                    <span className="num-display text-[#D4FF00]">
                      {entries[0].steps.toLocaleString("es-AR")}
                    </span>{" "}
                    <span className="text-[9px]">👟</span>
                  </p>
                  <div className="w-full h-28 rounded-t-2xl bg-[#D4FF00]/15 flex items-end justify-center pb-2">
                    <Crown className="w-5 h-5 text-[#D4FF00] stroke-[2]" />
                  </div>
                </div>

                {/* 3ro */}
                <div
                  onClick={() =>
                    entries[2].username &&
                    router.push(`/profile/${entries[2].username}`)
                  }
                  className="flex flex-col items-center gap-2 flex-1 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar
                      src={entries[2].avatarUrl || undefined}
                      fallback={entries[2].name}
                      size="sm"
                      className="ring-2 ring-amber-600/30 aspect-square"
                    />
                    {entries[2].isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#D4FF00] ring-2 ring-[#0B0D10]" />
                    )}
                  </div>
                  <p className="tech-label text-white truncate max-w-[85px]">
                    {entries[2].name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]">
                    <span className="num-display text-neutral-300">
                      {entries[2].steps.toLocaleString("es-AR")}
                    </span>{" "}
                    <span className="text-[9px]">👟</span>
                  </p>
                  <div className="w-full h-14 rounded-t-2xl bg-amber-600/10 flex items-end justify-center pb-2">
                    <Medal className="w-5 h-5 text-amber-600 stroke-[1.8]" />
                  </div>
                </div>
              </div>
            )}

            {/* Listado completo de personas en el evento */}
            <div className="space-y-2">
              {entries.map((person) => {
                const isMe = user?.id === person.userId;
                return (
                  <div
                    key={person.userId}
                    onClick={() => {
                      if (person.username) {
                        router.push(`/profile/${person.username}`);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer shadow-lg",
                      isMe
                        ? "bg-[#D4FF00]/15 hover:bg-[#D4FF00]/20"
                        : "bg-[#111114] hover:bg-[#16171D]",
                    )}
                  >
                    <span
                      className={cn(
                        "num-display text-xs w-6 text-center shrink-0",
                        person.rank === 1
                          ? "text-[#D4FF00]"
                          : person.rank === 2
                            ? "text-neutral-300"
                            : person.rank === 3
                              ? "text-amber-500"
                              : "text-neutral-500",
                      )}
                    >
                      {person.rank}
                    </span>

                    <Avatar
                      src={person.avatarUrl || undefined}
                      fallback={person.name}
                      size="sm"
                      className="aspect-square shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">
                        {person.name}
                      </p>
                      {person.username && (
                        <p className="text-[10px] text-neutral-400 font-medium truncate">
                          @{person.username}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[#D4FF00] shrink-0">
                      <Activity className="w-3.5 h-3.5 stroke-[1.8]" />
                      <span className="num-display text-xs">
                        {person.steps.toLocaleString("es-AR")}
                      </span>
                      <span className="tech-label text-[9px] text-neutral-400">pasos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

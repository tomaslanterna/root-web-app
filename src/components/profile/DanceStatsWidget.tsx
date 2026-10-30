"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Flame, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DanceSession {
  id: string;
  eventId: string;
  eventTitle: string;
  stepsCount: number;
  startTime: string;
}

const RECENT_PARTIES = 4;

export function DanceStatsWidget() {
  const [sessions, setSessions] = useState<DanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/v1/dance/sessions")
      .then((res) => {
        const rawSessions = res.data?.data || [];
        // Agrupar los pasos por eventId
        const aggregatedMap = new Map<string, DanceSession>();

        rawSessions.forEach((session: DanceSession) => {
          if (aggregatedMap.has(session.eventId)) {
            const existing = aggregatedMap.get(session.eventId)!;
            existing.stepsCount += session.stepsCount;
          } else {
            aggregatedMap.set(session.eventId, { ...session });
          }
        });

        // Orden cronológico: la fiesta más reciente queda a la derecha.
        setSessions(Array.from(aggregatedMap.values()).reverse());
      })
      .catch((err) => console.error("Error fetching sessions for widget:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-28 flex items-center justify-center rounded-[24px] bg-surface border border-line">
        <Loader2 className="size-5 animate-spin text-ink-3" aria-label="Cargando estadísticas" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Link
        href="/dance-ranker"
        className="w-full p-[18px] flex items-center gap-3 rounded-[24px] bg-surface border border-line hover:bg-surface-2 transition-colors"
      >
        <Flame className="size-5 shrink-0 text-accent" aria-hidden="true" />
        <span className="flex-1 flex flex-col gap-0.5">
          <span className="num-display text-sm uppercase">Actividad</span>
          <span className="text-sm text-ink-2">Todavía no hay registros</span>
        </span>
        <ArrowUpRight className="size-5 text-ink-2" aria-hidden="true" />
      </Link>
    );
  }

  const recent = sessions.slice(-RECENT_PARTIES);
  const totalSteps = recent.reduce((acc, s) => acc + s.stepsCount, 0);
  const maxSteps = Math.max(...recent.map((s) => s.stepsCount), 1);
  const label = (title: string) => title.replace("Noche de ", "").replace(" en ", " ");

  return (
    <Link
      href="/dance-ranker"
      aria-label={`Actividad de baile: ${totalSteps.toLocaleString("es-UY")} pasos en tus últimas ${recent.length} fiestas. Ver estadísticas`}
      className="w-full p-[18px] flex flex-col gap-3.5 rounded-[24px] bg-accent text-on-accent shadow-[0_12px_40px_rgba(212,255,0,0.16)] transition-[filter,transform] hover:brightness-105 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <Flame className="size-4" aria-hidden="true" />
            <span className="num-display text-sm uppercase">Actividad</span>
          </span>
          <span className="pl-[22px] flex items-baseline gap-1.5">
            <span className="num-display text-[28px]">{totalSteps.toLocaleString("en-US")}</span>
            <span className="num-display text-base text-[#2A2F12]">pasos</span>
          </span>
        </div>
        <span aria-hidden="true" className="size-9 shrink-0 rounded-full bg-bg text-accent flex items-center justify-center">
          <ArrowUpRight className="size-[18px]" strokeWidth={2.2} />
        </span>
      </div>

      <div aria-hidden="true" className="h-24 flex items-end gap-2.5">
        {recent.map((session) => {
          const strong = session.stepsCount > maxSteps * 0.7;
          return (
            <div key={session.eventId} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5">
              <div
                className={cn(
                  "w-full max-w-16 rounded-lg flex justify-center pt-1.5",
                  strong ? "bg-bg" : "bg-bg/15",
                )}
                style={{ height: Math.max(28, Math.round((session.stepsCount / maxSteps) * 76)) }}
              >
                <span className={cn("num-display text-xs", strong ? "text-accent" : "text-on-accent")}>
                  {(session.stepsCount / 1000).toFixed(1)}k
                </span>
              </div>
              <span className="num-display text-xs max-w-full truncate">{label(session.eventTitle)}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

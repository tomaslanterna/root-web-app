import React from "react";
import { cn } from "@/lib/utils";

interface CrewDetailSkeletonProps {
  className?: string;
}

export function CrewDetailSkeleton({ className }: CrewDetailSkeletonProps) {
  return (
    <div
      aria-label="Cargando crew..."
      role="status"
      className={cn(
        "min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16 select-none animate-pulse",
        className,
      )}
    >
      <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6 flex flex-col gap-6">
        {/* Header con botón atrás y chat */}
        <header className="flex items-center justify-between">
          <div className="size-11 rounded-control bg-surface border border-line" />
          <div className="h-11 w-24 rounded-control bg-surface border border-line" />
        </header>

        {/* Hero de la Crew */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="size-24 rounded-full bg-surface-2 border border-line" />
          <div className="h-7 w-44 rounded-lg bg-white/10" />
          <div className="h-4 w-36 rounded bg-white/5" />
          <div className="h-11 w-full max-w-xs rounded-xl bg-surface border border-line mt-2" />
        </div>

        {/* Podio / Top 3 */}
        <section className="mt-2 flex flex-col gap-3">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="pt-10 flex items-end justify-center gap-3 px-4">
            {/* 2do puesto */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="size-[52px] rounded-full bg-surface-2 border border-line" />
              <div className="h-4 w-16 rounded bg-white/10" />
              <div className="w-full h-24 rounded-t-xl bg-surface-2 border-t border-x border-line" />
            </div>
            {/* 1er puesto */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="size-16 rounded-full bg-accent/30 border-2 border-accent" />
              <div className="h-4 w-20 rounded bg-accent/40" />
              <div className="w-full h-[132px] rounded-t-xl bg-accent/25 border-t border-x border-accent/40" />
            </div>
            {/* 3er puesto */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="size-[52px] rounded-full bg-surface-2 border border-line" />
              <div className="h-4 w-16 rounded bg-white/10" />
              <div className="w-full h-[72px] rounded-t-xl bg-surface-2 border-t border-x border-line" />
            </div>
          </div>
        </section>

        {/* Lista de integrantes */}
        <section className="flex flex-col gap-2.5 mt-2">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/5" />
          </div>
          <div className="flex flex-col rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5">
                <div className="w-6 h-4 rounded bg-white/5" />
                <div className="size-10 rounded-full bg-surface-2 shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="h-4 w-28 rounded bg-white/10" />
                  <div className="h-3 w-20 rounded bg-white/5" />
                </div>
                <div className="h-4 w-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

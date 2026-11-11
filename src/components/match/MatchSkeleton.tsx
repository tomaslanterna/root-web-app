import React from "react";
import { cn } from "@/lib/utils";

interface MatchSkeletonProps {
  className?: string;
}

export function MatchSkeleton({ className }: MatchSkeletonProps) {
  return (
    <div
      aria-label="Cargando crews..."
      role="status"
      className={cn(
        "flex flex-col min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16 select-none animate-pulse",
        className,
      )}
    >
      {/* Header fijo */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center justify-between gap-3">
          <div className="h-9 w-24 rounded-lg bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="size-11 rounded-control bg-surface border border-line" />
            <div className="size-11 rounded-control bg-surface border border-line" />
          </div>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* DanceStatsWidget placeholder */}
        <div className="w-full h-28 rounded-[24px] bg-surface border border-line p-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-7 w-36 rounded bg-white/10" />
          </div>
          <div className="size-9 rounded-full bg-white/5" />
        </div>

        {/* Tab pills */}
        <div className="flex p-[2px] rounded-lg bg-surface border border-line">
          <div className="flex-1 h-7 rounded-[6px] bg-ink/70" />
          <div className="flex-1 h-7 rounded-[6px]" />
        </div>

        {/* Banner "Armá tu crew" */}
        <div className="px-3.5 py-3 rounded-2xl bg-black text-white border-[1.5px] border-white/60 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
          <div className="h-5 w-32 rounded bg-white/20" />
          <div className="col-start-2 row-span-2 row-start-1 self-center shrink-0 h-10 w-28 rounded-xl bg-white/80" />
          <div className="col-start-1 h-4 w-44 rounded bg-white/10" />
        </div>

        {/* Sección: Tus crews */}
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="flex flex-col rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5">
                <div className="size-11 rounded-full bg-surface-2 shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="h-4 w-32 rounded bg-white/10" />
                  <div className="h-3 w-24 rounded bg-white/5" />
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="h-4 w-12 rounded bg-white/10" />
                  <div className="h-3 w-14 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección: Squads de eventos */}
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-xl bg-surface-2 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="h-4 w-40 rounded bg-white/10" />
                    <div className="h-3 w-24 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

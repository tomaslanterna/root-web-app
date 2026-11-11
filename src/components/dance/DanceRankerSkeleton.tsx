import React from "react";
import { cn } from "@/lib/utils";

interface DanceRankerSkeletonProps {
  className?: string;
}

export function DanceRankerSkeleton({ className }: DanceRankerSkeletonProps) {
  return (
    <div
      aria-label="Cargando estadísticas de baile..."
      role="status"
      className={cn(
        "min-h-[100dvh] bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink select-none animate-pulse md:pb-16",
        className,
      )}
    >
      {/* Header fijo */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
          <div className="size-11 shrink-0 rounded-control bg-surface border border-line" />
          <div className="h-7 w-32 rounded-lg bg-white/10 flex-1" />
          <div className="h-4 w-20 rounded bg-white/5" />
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto pt-4 flex flex-col gap-6">
        {/* Hero: Última fiesta y pasos gigantes */}
        <section className="px-4 flex flex-col gap-1.5 pt-2">
          <div className="h-4 w-44 rounded bg-white/10" />
          <div className="h-24 w-64 rounded-2xl bg-accent/20 my-1" />
          <div className="h-6 w-52 rounded bg-white/10" />
        </section>

        {/* Sección de Totales (grid histórico) */}
        <section className="mx-4 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line">
          <div className="col-span-2 bg-surface p-4 flex items-center justify-between">
            <div className="h-3.5 w-24 rounded bg-white/10" />
            <div className="h-7 w-36 rounded bg-white/10" />
          </div>
          <div className="bg-surface p-4 flex flex-col gap-2">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-6 w-20 rounded bg-white/10" />
          </div>
          <div className="bg-surface p-4 flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-6 w-20 rounded bg-white/10" />
          </div>
        </section>

        {/* Gráfico y selector de período */}
        <section className="mx-4 flex flex-col gap-3">
          <div className="h-9 rounded-xl bg-surface border border-line p-1 flex gap-1">
            <div className="flex-1 rounded-lg bg-white/10" />
            <div className="flex-1 rounded-lg bg-transparent" />
            <div className="flex-1 rounded-lg bg-transparent" />
          </div>

          <div className="h-64 rounded-card bg-surface border border-line p-4 flex items-end justify-between gap-3">
            {[40, 65, 30, 85, 50, 95, 70, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full rounded-t-md bg-white/10"
                  style={{ height: `${h}%` }}
                />
                <div className="h-2.5 w-6 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

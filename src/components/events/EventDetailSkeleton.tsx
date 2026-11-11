import React from "react";
import { cn } from "@/lib/utils";

interface EventDetailSkeletonProps {
  className?: string;
}

export function EventDetailSkeleton({ className }: EventDetailSkeletonProps) {
  return (
    <div
      aria-label="Cargando evento..."
      role="status"
      className={cn(
        "min-h-screen bg-bg text-ink pb-16 md:pb-20 select-none animate-pulse",
        className,
      )}
    >
      <div className="w-full max-w-3xl mx-auto md:px-8 md:pt-6">
        {/* Póster con acciones flotantes */}
        <div className="relative aspect-[4/5] sm:aspect-[16/10] w-full rounded-b-2xl md:rounded-card overflow-hidden bg-surface-2 border border-line">
          <div className="absolute top-[calc(1rem+var(--root-safe-top))] md:top-4 inset-x-4 md:inset-x-6 flex justify-between pointer-events-none">
            <div className="size-11 rounded-full bg-bg/80 border border-line" />
            <div className="size-11 rounded-full bg-bg/80 border border-line" />
          </div>
        </div>

        {/* Info principal del evento */}
        <div className="px-4 md:px-0 pt-5 flex flex-col gap-4">
          {/* Badge de género / categoría */}
          <div className="h-6 w-24 rounded-full bg-surface-2" />

          {/* Título de 2 líneas */}
          <div className="flex flex-col gap-2">
            <div className="h-8 w-4/5 rounded-lg bg-white/10" />
            <div className="h-8 w-1/2 rounded-lg bg-white/10" />
          </div>

          {/* Fecha, hora y ubicación */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="h-4 w-44 rounded bg-accent/25" />
            <div className="h-4 w-60 rounded bg-white/5" />
          </div>

          {/* Botón de RSVP / Voy */}
          <div className="mt-2 h-14 rounded-2xl bg-surface border border-line flex items-center justify-center">
            <div className="h-5 w-28 rounded bg-white/10" />
          </div>

          {/* Pestañas: La fiesta / Predio / Reglas */}
          <div className="mt-4 flex border-b border-line gap-6">
            <div className="h-11 w-20 border-b-2 border-accent flex items-center justify-center">
              <div className="h-4 w-16 rounded bg-white/10" />
            </div>
            <div className="h-11 w-28 flex items-center justify-center">
              <div className="h-4 w-20 rounded bg-white/5" />
            </div>
            <div className="h-11 w-16 flex items-center justify-center">
              <div className="h-4 w-12 rounded bg-white/5" />
            </div>
          </div>

          {/* Card de entradas / descripción */}
          <div className="rounded-card bg-surface border border-line p-5 flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 rounded bg-white/10" />
              <div className="h-6 w-16 rounded bg-accent/30" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
              <div className="h-4 w-2/3 rounded bg-white/5" />
            </div>
            <div className="h-12 w-full rounded-xl bg-white/10 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

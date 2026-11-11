import React from "react";
import { cn } from "@/lib/utils";

interface CommunityDetailSkeletonProps {
  className?: string;
}

export function CommunityDetailSkeleton({ className }: CommunityDetailSkeletonProps) {
  return (
    <div
      aria-label="Cargando comunidad..."
      role="status"
      className={cn(
        "min-h-[100dvh] w-full overflow-x-hidden bg-bg text-ink pb-10 select-none animate-pulse",
        className,
      )}
    >
      {/* Portada con botones flotantes */}
      <div className="relative h-[200px] w-full bg-surface-2 border-b border-line">
        <div className="absolute top-[calc(1rem+var(--root-safe-top))] md:top-4 inset-x-4 flex justify-between">
          <div className="size-11 rounded-full bg-bg/80 border border-line" />
          <div className="size-11 rounded-full bg-bg/80 border border-line" />
        </div>
      </div>

      {/* Info de la comunidad: Nombre, badges y botón de unirse */}
      <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-7 w-56 rounded-lg bg-white/10" />
            <div className="h-4 w-40 rounded bg-white/5" />
            <div className="h-4 w-28 rounded bg-white/5" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-surface border border-line shrink-0" />
        </div>

        {/* Pestañas: Muro y Canal */}
        <div className="mt-4 flex border-b border-line gap-6">
          <div className="h-11 w-16 border-b-2 border-accent flex items-center justify-center">
            <div className="h-4 w-12 rounded bg-white/10" />
          </div>
          <div className="h-11 w-16 flex items-center justify-center">
            <div className="h-4 w-12 rounded bg-white/5" />
          </div>
        </div>

        {/* Publicaciones del Muro (Skeletons) */}
        <div className="flex flex-col gap-4 pt-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-card bg-surface border border-line flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-surface-2 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-4 w-32 rounded bg-white/10" />
                  <div className="h-3 w-20 rounded bg-white/5" />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-white/5" />
              </div>
              {i === 1 && <div className="aspect-[16/9] w-full rounded-xl bg-surface-2 mt-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

interface ProfileSkeletonProps {
  className?: string;
}

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div
      aria-label="Cargando perfil..."
      role="status"
      className={cn(
        "flex min-h-[100dvh] flex-col bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink md:pb-16 select-none animate-pulse",
        className,
      )}
    >
      {/* Header fijo idéntico al del perfil */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-3xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
          <h1 className="font-display text-[32px] m-0 flex-1 min-w-0">Perfil</h1>
          <div className="size-11 shrink-0 rounded-control bg-surface border border-line" />
          <div className="size-11 shrink-0 rounded-control bg-surface border border-line" />
        </div>
      </header>

      {/* Info de usuario: Avatar circular (88px) + Detalles */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-5 flex items-center gap-[18px]">
        {/* Avatar con anillo */}
        <div className="relative size-[88px] shrink-0 rounded-full overflow-hidden bg-surface-2 ring-2 ring-accent/30 ring-offset-[3px] ring-offset-bg" />

        {/* Datos de usuario */}
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="h-6 w-36 rounded-md bg-white/10" />
            <div className="h-4 w-24 rounded-md bg-white/5" />
            <div className="mt-1 flex flex-wrap gap-1.5">
              <div className="h-5 w-16 rounded-full bg-surface-2" />
              <div className="h-5 w-20 rounded-full bg-surface-2" />
            </div>
          </div>
          <div className="flex gap-[18px]">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Pestañas (Posts / Insignias) */}
      <div className="mt-6 w-full max-w-3xl mx-auto">
        <div role="tablist" className="flex border-b border-line">
          <div className="flex-1 h-12 flex items-center justify-center text-accent shadow-[inset_0_-2px_0_var(--color-accent)]">
            <div className="size-5 rounded bg-accent/40" />
          </div>
          <div className="flex-1 h-12 flex items-center justify-center text-ink-3">
            <div className="size-5 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Grilla de publicaciones: 3 por fila, formato vertical 9:16 tal cual ProfilePostsGrid */}
      <div className="w-full max-w-3xl mx-auto pt-0.5">
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="relative aspect-[9/16] overflow-hidden bg-surface-2"
            />
          ))}
        </div>
      </div>

      {/* Botón flotante (+) en la esquina inferior derecha */}
      <div className="fixed right-5 bottom-[calc(var(--root-mobile-nav-clearance)+0.75rem)] md:bottom-8 md:right-8 z-40 size-14 rounded-full bg-accent/40 shadow-[0_8px_30px_rgba(212,255,0,0.2)]" />
    </div>
  );
}

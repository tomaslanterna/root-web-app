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
      {/* Header fijo */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-3xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center justify-between gap-3">
          <div className="h-9 w-24 rounded-lg bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="size-11 rounded-control bg-surface border border-line" />
            <div className="size-11 rounded-control bg-surface border border-line" />
          </div>
        </div>
      </header>

      {/* Info de usuario: Avatar + Detalles */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-5 flex items-center gap-[18px]">
        {/* Avatar circular */}
        <div className="size-[88px] shrink-0 rounded-full bg-surface-2 border border-line" />

        {/* Datos de usuario */}
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-36 rounded-md bg-white/10" />
            <div className="h-4 w-24 rounded-md bg-white/5" />
            <div className="mt-1 flex gap-1.5">
              <div className="h-5 w-16 rounded-full bg-surface-2" />
              <div className="h-5 w-20 rounded-full bg-surface-2" />
            </div>
          </div>
          <div className="flex gap-4 pt-1">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Pestañas (Posts / Insignias) */}
      <div className="mt-6 w-full max-w-3xl mx-auto">
        <div className="flex border-b border-line">
          <div className="flex-1 h-12 flex items-center justify-center border-b-2 border-accent">
            <div className="size-5 rounded bg-accent/40" />
          </div>
          <div className="flex-1 h-12 flex items-center justify-center">
            <div className="size-5 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Grilla 3x3 de publicaciones */}
      <div className="w-full max-w-3xl mx-auto pt-0.5">
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface border border-line/20" />
          ))}
        </div>
      </div>
    </div>
  );
}

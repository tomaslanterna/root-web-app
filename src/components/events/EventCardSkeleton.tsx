import * as React from "react";
import { cn } from "@/lib/utils";

interface EventCardSkeletonProps {
  variant?: "grid" | "list" | "featured";
  className?: string;
}

export function EventCardSkeleton({ variant = "grid", className }: EventCardSkeletonProps) {
  if (variant === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-card bg-surface border border-line text-ink animate-pulse",
          className,
        )}
      >
        {/* Bloque de fecha lateral */}
        <div className="w-12 shrink-0 flex flex-col items-center gap-1.5">
          <div className="h-2.5 w-7 rounded bg-white/10" />
          <div className="h-5 w-7 rounded bg-white/10" />
          <div className="h-2.5 w-6 rounded bg-white/5" />
        </div>

        {/* Miniatura cuadrada */}
        <div className="size-14 shrink-0 rounded-thumb bg-surface-2" />

        {/* Título y locación */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>

        {/* Precio y asistentes */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <div className="h-3.5 w-12 rounded bg-white/10" />
          <div className="h-3 w-8 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  const isFeatured = variant === "featured";

  // Misma forma que la card "el flyer es la card": flyer con sello de fecha y texto suelto abajo.
  return (
    <div
      aria-hidden="true"
      className={cn("flex flex-col gap-2.5 animate-pulse select-none", isFeatured && "shrink-0 snap-start", className)}
      style={
        isFeatured
          ? { width: "calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols) * (1 - var(--p-card, 0)) + 56px * var(--p-card, 0))" }
          : undefined
      }
    >
      <div
        className="relative overflow-hidden bg-surface-2 rounded-[14px]"
        style={isFeatured ? { borderRadius: "calc(14px - 4px * var(--p-card, 0))" } : undefined}
      >
        <div className="aspect-square" />
        {isFeatured && <div style={{ height: "calc(44px * (1 - var(--p-footer, 0)))" }} />}
        {/* Sello de fecha */}
        <div className="absolute top-2 left-2 h-[42px] w-10 rounded-[10px] bg-white/10" />
      </div>

      {!isFeatured && (
        <div className="flex flex-col gap-1.5 px-0.5">
          {/* Título (2 líneas) */}
          <div className="h-4 w-4/5 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
          {/* Hora · lugar */}
          <div className="mt-1 h-3 w-3/5 rounded bg-white/5" />
        </div>
      )}
    </div>
  );
}

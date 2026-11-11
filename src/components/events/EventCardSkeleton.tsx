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

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-surface border border-line animate-pulse select-none",
        isFeatured ? "shrink-0 snap-start" : "rounded-card",
        className,
      )}
      style={
        isFeatured
          ? {
              width:
                "calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols) * (1 - var(--p-card, 0)) + 56px * var(--p-card, 0))",
              borderRadius: "calc(16px - 4px * var(--p-card, 0))",
            }
          : undefined
      }
    >
      {/* Imagen cuadrada */}
      <div className="aspect-square p-3 flex items-start bg-surface-2">
        <div className="h-5 w-16 rounded-full bg-white/10" />
      </div>

      {/* Bloque de texto inferior */}
      <div
        className={cn(
          "p-3 flex flex-col gap-2",
          isFeatured ? "flex-none overflow-hidden" : "flex-1",
        )}
        style={
          isFeatured
            ? {
                height: "calc(137px * (1 - var(--p-footer, 0)))",
                paddingBlock: "calc(12px * (1 - var(--p-footer, 0)))",
              }
            : undefined
        }
      >
        {/* Fecha */}
        <div className="h-3 w-28 rounded bg-white/10" />
        {/* Título (2 líneas) */}
        <div className="h-4 w-4/5 rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
        {/* Locación */}
        <div className="h-3 w-3/5 rounded bg-white/5" />

        {/* Footer: Precio + Convocatoria */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="h-3.5 w-14 rounded bg-white/10" />
          <div className="h-3 w-10 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

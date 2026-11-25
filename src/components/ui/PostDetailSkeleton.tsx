import React from "react";
import { cn } from "@/lib/utils";

interface PostDetailSkeletonProps {
  className?: string;
}

/**
 * Esqueleto del contenido de /posts/[id]: misma columna, foto cuadrada, acciones, "Me gusta", pie y comentarios,
 * para que al cargar no salte el layout. El header (volver) lo pone la página, así se puede salir mientras carga.
 */
export function PostDetailSkeleton({ className }: PostDetailSkeletonProps) {
  return (
    <main
      aria-label="Cargando publicación..."
      role="status"
      className={cn("w-full max-w-xl mx-auto flex-1 flex flex-col px-0 sm:px-4 sm:pt-4 select-none animate-pulse", className)}
    >
      <div className="overflow-hidden bg-[#111114] sm:rounded-3xl">
        {/* Foto cuadrada */}
        <div className="aspect-square w-full bg-white/[0.06]" />

        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Me gusta, comentar y compartir */}
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-white/10" />
            <div className="size-8 rounded-full bg-white/10" />
            <div className="size-8 rounded-full bg-white/10" />
          </div>

          {/* "N Me gusta" */}
          <div className="h-3.5 w-20 rounded bg-white/10" />

          {/* Pie de foto */}
          <div className="flex flex-col gap-2 pt-0.5">
            <div className="h-3 w-11/12 rounded bg-white/[0.07]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.07]" />
          </div>
        </div>

        {/* Comentarios */}
        <div className="border-t border-white/[0.06] p-3.5 sm:p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-7 w-28 rounded-full bg-accent/15" />
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="flex items-start gap-3">
              <div className="size-8 shrink-0 rounded-full bg-white/10" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className={cn("h-3 rounded bg-white/[0.07]", row === 0 ? "w-4/5" : "w-3/5")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

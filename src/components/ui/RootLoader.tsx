"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RootBootAnimation } from "@/components/brand/RootBootAnimation";
import { RootMark } from "@/components/ui/RootLogo";

export interface RootLoaderProps {
  /** Si es true, ocupa toda la pantalla con fondo bg-bg */
  fullScreen?: boolean;
  /** Ancho de la animación: xs (cuadrado de 36px, scroll infinito), sm (~160px), md (~280px), lg (~420px, pantalla completa) */
  size?: "xs" | "sm" | "md" | "lg";
  /** Etiqueta accesible o mensaje opcional debajo del logo */
  label?: string;
  /** Etiqueta accesible para aria-label sin mostrar texto visual */
  ariaLabel?: string;
  className?: string;
  imageClassName?: string;
}

export function RootLoader({
  fullScreen = false,
  size = "lg",
  label,
  ariaLabel,
  className,
  imageClassName,
}: RootLoaderProps) {
  const sizeClasses = {
    xs: "w-32",
    sm: "w-[min(45vw,160px)]",
    md: "w-[min(65vw,280px)]",
    lg: "w-[min(80vw,420px)]",
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel || label || "Cargando root"}
      className={cn(
        "flex flex-col items-center justify-center select-none",
        fullScreen
          ? "fixed inset-0 z-40 min-h-[100dvh] bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16"
          : size === "xs"
            ? "w-full py-4"
            : "w-full py-12",
        className
      )}
    >
      {size === "xs" ? (
        // Paginación / scroll infinito: solo el cuadrado de la cara, chico y bailando.
        <RootMark size={36} />
      ) : (
        // Versión compacta de la animación de arranque: tarjeta lima con el logo bailando en loop.
        <RootBootAnimation
          variant="loop"
          className={cn(sizeClasses[size], "aspect-[3/2] h-auto rounded-card select-none pointer-events-none", imageClassName)}
        />
      )}
      {label && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-3 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

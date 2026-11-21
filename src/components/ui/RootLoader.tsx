"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RootLoaderProps {
  /** Si es true, ocupa toda la pantalla con fondo bg-bg */
  fullScreen?: boolean;
  /** Ancho del video: xs (~128px, scroll infinito), sm (~160px), md (~280px), lg (~420px, pantalla completa) */
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
      {/* El video es vertical (9:16) con el logo en el medio: se recorta a 3:2 alrededor de "root" y la cara. */}
      <video
        src="/brand/root-cara-de-asco.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        disablePictureInPicture
        className={cn(
          sizeClasses[size],
          "aspect-[3/2] h-auto rounded-card bg-[#0a0a0c] object-cover object-[50%_50.8%] select-none pointer-events-none",
          imageClassName,
        )}
      />
      {label && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-3 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

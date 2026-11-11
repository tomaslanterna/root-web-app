"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RootLoaderProps {
  /** Si es true, ocupa toda la pantalla con fondo bg-bg */
  fullScreen?: boolean;
  /** Tamaño del gif: xs (~128px, destacado para scroll infinito), sm (~160px), md (~280px), lg (~420px, idéntico al splash) */
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
      {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado: next/image lo congelaría al optimizarlo */}
      <img
        src="/brand/root-loader.gif"
        alt=""
        width={960}
        height={640}
        fetchPriority="high"
        className={cn(sizeClasses[size], "h-auto select-none pointer-events-none", imageClassName)}
        draggable={false}
      />
      {label && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-3 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RootLoaderProps {
  /** Si es true, ocupa toda la pantalla con fondo bg-bg */
  fullScreen?: boolean;
  /** Tamaño del gif: sm (~200px), md (~300px), lg (~420px, idéntico al splash) */
  size?: "sm" | "md" | "lg";
  /** Etiqueta accesible o mensaje opcional debajo del logo */
  label?: string;
  className?: string;
}

export function RootLoader({
  fullScreen = false,
  size = "lg",
  label,
  className,
}: RootLoaderProps) {
  const sizeClasses = {
    sm: "w-[min(50vw,200px)]",
    md: "w-[min(65vw,300px)]",
    lg: "w-[min(80vw,420px)]",
  };

  return (
    <div
      role="status"
      aria-label={label || "Cargando root"}
      className={cn(
        "flex flex-col items-center justify-center select-none",
        fullScreen
          ? "fixed inset-0 z-40 min-h-[100dvh] bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16"
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
        className={cn(sizeClasses[size], "h-auto select-none pointer-events-none")}
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

"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TabIndicatorProps {
  /**
   * "pill": fondo de la opción elegida en un control segmentado.
   * "underline": barra lima debajo de la pestaña elegida.
   */
  variant: "pill" | "underline";
  /** Margen horizontal de la barra "underline" respecto del ancho de la pestaña (px por lado). */
  inset?: number;
  className?: string;
}

const SELECTED = '[aria-selected="true"], [aria-checked="true"]';

/**
 * Indicador animado de la opción activa en un tablist / radiogroup. Se pone como primer hijo del
 * contenedor (que tiene que ser `relative`) y se mueve solo hasta el botón con aria-selected o
 * aria-checked: no hace falta pasarle cuál está activo. Los botones tienen que quedar por encima
 * (`relative z-[1]`) y sin fondo propio cuando están activos.
 */
export function TabIndicator({ variant, inset = 0, className }: TabIndicatorProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ left: number; width: number; top: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>(SELECTED);
      if (!active) {
        setBox(null);
        return;
      }
      setBox({ left: active.offsetLeft, width: active.offsetWidth, top: active.offsetTop, height: active.offsetHeight });
    };

    measure();
    // La primera posición se pinta sin animar; desde ahí, cada cambio se desliza.
    const frame = requestAnimationFrame(() => setReady(true));

    const mutations = new MutationObserver(measure);
    mutations.observe(container, { subtree: true, attributes: true, attributeFilter: ["aria-selected", "aria-checked"], childList: true });
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    Array.from(container.children).forEach((child) => resize.observe(child));

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  const width = box ? Math.max(0, box.width - inset * 2) : 0;

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-ready={ready}
      className={cn(
        "tab-indicator",
        variant === "pill" ? "rounded-[6px] bg-ink" : "bottom-0 h-0.5 rounded-full bg-accent",
        className,
      )}
      style={{
        width,
        transform: `translateX(${box ? box.left + inset : 0}px)`,
        opacity: box ? 1 : 0,
        ...(variant === "pill" && box ? { top: box.top, height: box.height } : null),
      }}
    />
  );
}

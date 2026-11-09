"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNativeBackHandler } from "@/hooks/useNativeBack";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  initialHeight?: number; // en px (o se calcula dinámicamente)
  minHeight?: number; // en px (defecto: 280)
  maxHeightRatio?: number; // ratio de la pantalla (defecto: 0.92)
  className?: string;
  bodyClassName?: string;
  ariaLabel?: string;
  hideHeader?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerRight,
  children,
  initialHeight,
  minHeight = 280,
  maxHeightRatio = 0.92,
  className,
  bodyClassName,
  ariaLabel,
  hideHeader = false,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Calcula la altura máxima permitida en base al viewport actual
  const getMaxHeight = useCallback(() => {
    if (typeof window === "undefined") return 700;
    return Math.floor(window.innerHeight * maxHeightRatio);
  }, [maxHeightRatio]);

  // Altura por defecto: si no se especifica, toma 65% del viewport o 540px
  const getDefaultHeight = useCallback(() => {
    if (initialHeight) return Math.min(initialHeight, getMaxHeight());
    if (typeof window === "undefined") return 540;
    return Math.min(Math.floor(window.innerHeight * 0.65), getMaxHeight());
  }, [initialHeight, getMaxHeight]);

  const [currentHeight, setCurrentHeight] = useState<number>(getDefaultHeight);
  const currentHeightRef = useRef(currentHeight);
  currentHeightRef.current = currentHeight;

  // Montado del componente para SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animación de entrada y salida
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const defH = getDefaultHeight();
      setCurrentHeight(defH);
      if (sheetRef.current) {
        sheetRef.current.style.height = `${defH}px`;
      }
      const frame = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, getDefaultHeight]);

  // Manejo de tecla Escape y botón Atrás de Android/Capacitor
  useNativeBackHandler(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Bloqueo del scroll del body mientras el bottomsheet está abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Ajuste en caso de resize de ventana
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      const maxH = getMaxHeight();
      if (currentHeightRef.current > maxH) {
        setCurrentHeight(maxH);
        if (sheetRef.current) {
          sheetRef.current.style.height = `${maxH}px`;
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, getMaxHeight]);

  // RESIZE MANUAL: Drag & Pull
  const startDrag = (clientY: number, pointerId?: number, target?: HTMLElement) => {
    if (pointerId !== undefined && target) {
      try {
        target.setPointerCapture(pointerId);
      } catch {}
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    startYRef.current = clientY;
    startHeightRef.current = currentHeightRef.current;
    startTimeRef.current = Date.now();

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientY, e.pointerId, e.currentTarget as HTMLElement);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = startYRef.current - e.clientY;
    if (Math.abs(deltaY) > 3) {
      hasMovedRef.current = true;
    }

    const maxHeight = getMaxHeight();
    const rawTarget = startHeightRef.current + deltaY;
    const clampedHeight = Math.max(minHeight * 0.4, Math.min(maxHeight, rawTarget));

    if (sheetRef.current) {
      sheetRef.current.style.height = `${clampedHeight}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const deltaY = startYRef.current - e.clientY;
    const deltaDown = e.clientY - startYRef.current;
    const duration = Math.max(Date.now() - startTimeRef.current, 1);
    const velocity = deltaDown / duration; // px por ms

    const maxHeight = getMaxHeight();
    const finalCalculatedHeight = startHeightRef.current + deltaY;

    if (sheetRef.current) {
      sheetRef.current.style.transition =
        "height 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)";
    }

    // Condición de descarte: si se achicó por debajo de 75% del mínimo o hubo swipe rápido hacia abajo
    if (finalCalculatedHeight < minHeight * 0.75 || (deltaDown > 60 && velocity > 0.45)) {
      onClose();
      return;
    }

    const settledHeight = Math.max(minHeight, Math.min(maxHeight, finalCalculatedHeight));
    setCurrentHeight(settledHeight);
    if (sheetRef.current) {
      sheetRef.current.style.height = `${settledHeight}px`;
    }
  };

  // Click rápido en el botón handle: toggle entre tamaño inicial y expandido máximo
  const handleHandleClick = () => {
    if (hasMovedRef.current) return;
    const maxHeight = getMaxHeight();
    const defHeight = getDefaultHeight();
    const nextHeight = currentHeightRef.current >= maxHeight - 40 ? defHeight : maxHeight;

    if (sheetRef.current) {
      sheetRef.current.style.transition =
        "height 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)";
      sheetRef.current.style.height = `${nextHeight}px`;
    }
    setCurrentHeight(nextHeight);
  };

  if (!mounted || (!isOpen && !shouldRender)) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === "string" ? title : "Ventana emergente")}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col justify-end items-center pointer-events-auto",
        !isOpen && !isAnimatingIn && "pointer-events-none"
      )}
    >
      {/* Backdrop con desenfoque adaptado al estilo nocturno */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isAnimatingIn && isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Contenedor de la BottomSheet con estilo nocturno editorial */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{ height: `${currentHeight}px` }}
        className={cn(
          "relative z-10 w-full sm:max-w-2xl rounded-t-[28px] sm:rounded-t-[32px] border-t sm:border-x sm:border-t border-line-strong bg-surface text-ink shadow-[0_-20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden will-change-[height,transform] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isAnimatingIn && isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          className
        )}
      >
        {/* BOTÓN SUPERIOR DE RESIZE MANUAL (Línea horizontal con área de agarre touch-friendly) */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Arrastrar para redimensionar"
          aria-valuemin={minHeight}
          aria-valuemax={getMaxHeight()}
          aria-valuenow={currentHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleHandleClick}
          className="group w-full flex flex-col items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none touch-none shrink-0 transition-colors hover:bg-white/[0.02]"
        >
          <div
            className={cn(
              "h-1.5 w-12 rounded-full transition-colors",
              isDragging
                ? "bg-accent scale-105 shadow-[0_0_12px_rgba(212,255,0,0.4)]"
                : "bg-white/25 group-hover:bg-white/40"
            )}
          />
        </div>

        {/* Header de la BottomSheet */}
        {!hideHeader && (
          <div
            className="flex items-center justify-between border-b border-line px-5 pb-3 mb-1 shrink-0 select-none"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button, a, input, select")) return;
              handlePointerDown(e);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && <span className="shrink-0 text-accent">{icon}</span>}
              <div className="min-w-0">
                {title && (
                  <h3 className="m-0 text-sm sm:text-base font-bold text-ink truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="m-0 text-[11px] sm:text-xs text-ink-3 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerRight}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="size-8 sm:size-9 rounded-full bg-surface-2 border border-line text-ink-2 hover:bg-white/10 hover:text-ink transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Cuerpo con scroll independiente que se adapta fluidamente al resize */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-2 pb-[calc(1.5rem+var(--root-safe-bottom))] hide-scrollbar",
            bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_INTERESTS } from "@/hooks/useInterests";

interface InterestsSheetProps {
  isOpen: boolean;
  options: string[];
  initialGenres: string[];
  isSaving: boolean;
  /** "onboarding": se pregunta al entrar (botón secundario "Ahora no"). "edit": se edita desde configuración. */
  mode: "onboarding" | "edit";
  onSave: (genres: string[]) => Promise<unknown>;
  onClose: () => void;
}

const CLOSE_MS = 240;
const DISMISS_DRAG = 120;

/**
 * Hoja de intereses musicales: géneros como chips para tocar (hasta 8). Con lo elegido se ordenan los
 * eventos destacados. Sube desde abajo y se cierra deslizándola, con la X o con Escape.
 */
export function InterestsSheet({ isOpen, options, initialGenres, isSaving, mode, onSave, onClose }: InterestsSheetProps) {
  const [selected, setSelected] = useState<string[]>(initialGenres);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const requestClose = () => {
    if (closeTimer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setClosing(false);
      setDrag(0);
      onCloseRef.current();
    }, CLOSE_MS);
  };
  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  if (!isOpen) return null;

  const toggle = (genre: string) => {
    const full = !selected.includes(genre) && selected.length >= MAX_INTERESTS;
    setError(full ? `Podés elegir hasta ${MAX_INTERESTS} géneros.` : null);
    // Actualización funcional: dos toques seguidos no se pisan.
    setSelected((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      return prev.length >= MAX_INTERESTS ? prev : [...prev, genre];
    });
  };

  const submit = async (genres: string[]) => {
    setError(null);
    try {
      await onSave(genres);
      requestClose();
    } catch {
      setError("No pudimos guardar tus géneros. Probá de nuevo.");
    }
  };

  const onDragEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    setDragging(false);
    if (drag > DISMISS_DRAG) requestClose();
    else setDrag(0);
  };

  return (
    <div className="fixed inset-0 z-[95] md:flex md:items-center md:justify-center md:p-6">
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="absolute inset-0 bg-black/60 motion-safe:animate-fade-in transition-opacity duration-200"
        style={{ opacity: closing ? 0 : 1 - Math.min(drag / 400, 0.6) }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="interests-title"
        className="bottom-sheet absolute inset-x-0 bottom-0 max-h-[88dvh] flex flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[0_-1px_0_rgba(255,255,255,0.08)] md:relative md:inset-auto md:max-h-[min(720px,90dvh)] md:w-full md:max-w-lg md:rounded-[28px]"
        style={{
          transform: closing ? "translateY(100%)" : drag ? `translateY(${drag}px)` : undefined,
          transition: dragging ? "none" : `transform ${closing ? CLOSE_MS : 220}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        <div
          className="shrink-0 touch-none"
          onTouchStart={(event) => {
            dragStart.current = event.touches[0].clientY;
            setDragging(true);
          }}
          onTouchMove={(event) => {
            if (dragStart.current !== null) setDrag(Math.max(0, event.touches[0].clientY - dragStart.current));
          }}
          onTouchEnd={onDragEnd}
        >
          <div aria-hidden="true" className="mx-auto mt-2 h-[5px] w-10 rounded-full bg-white/20" />
          <div className="flex items-start gap-3 pl-5 pr-4 pt-3 pb-2">
            <div className="min-w-0 flex-1 pt-1.5">
              <h2 id="interests-title" className="font-display m-0 text-2xl">¿Qué te gusta escuchar?</h2>
              <p className="m-0 mt-1.5 text-sm leading-[1.45] text-ink-2">
                Elegí tus géneros y te mostramos primero los eventos destacados que van con vos.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar"
              className="size-11 shrink-0 rounded-full bg-surface-2 text-ink-2 flex items-center justify-center hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-5">
          <div role="group" aria-label="Géneros" className="flex flex-wrap gap-2">
            {options.map((genre) => {
              const on = selected.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(genre)}
                  className={cn(
                    "h-11 px-4 rounded-full border text-[15px] font-semibold flex items-center gap-1.5 transition-[background-color,border-color,color,transform] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    on ? "bg-accent border-accent text-on-accent" : "bg-bg border-white/10 text-ink hover:border-white/25",
                  )}
                >
                  {on && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                  {genre}
                </button>
              );
            })}
          </div>
          <p className="m-0 mt-3 text-xs text-ink-3">
            {selected.length > 0 ? `${selected.length} de ${MAX_INTERESTS} elegidos` : `Podés elegir hasta ${MAX_INTERESTS}.`}
          </p>
        </div>

        <div className="shrink-0 bg-surface px-5 pt-3 pb-[calc(1rem+var(--root-safe-bottom))] shadow-[0_-1px_0_rgba(255,255,255,0.08)] flex flex-col gap-2">
          {error && <p role="alert" className="m-0 text-center text-[13px] text-rose-400">{error}</p>}
          <button
            type="button"
            disabled={isSaving || (mode === "onboarding" && selected.length === 0)}
            onClick={() => void submit(selected)}
            className={cn(
              "font-display h-14 rounded-2xl flex items-center justify-center gap-2 text-[15px] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              mode === "onboarding" && selected.length === 0
                ? "bg-surface-2 text-[#5A6068] cursor-not-allowed"
                : "bg-accent text-on-accent",
            )}
          >
            {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isSaving ? "Guardando…" : "Guardar"}
          </button>
          {mode === "onboarding" && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void submit([])}
              className="h-11 rounded-xl text-[15px] font-semibold text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              Ahora no
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

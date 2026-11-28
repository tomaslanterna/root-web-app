"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronRight, Image, Moon, Users, X } from "lucide-react";
import { useNativeBackHandler } from "@/hooks/useNativeBack";
import { useRequireKyc } from "@/hooks/useRequireKyc";
import { cn } from "@/lib/utils";
import { getOverlayRoot } from "@/components/ui/Modal";

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  title: string;
  description: string;
  icon: typeof Image;
  href: string;
  /** Pide identidad verificada (subir afters y mandar eventos). */
  needsKyc?: boolean;
  isNew?: boolean;
}

const ACTIONS: QuickAction[] = [
  { title: "Nueva publicación", description: "Fotos, tracks o sets para la comunidad", icon: Image, href: "/create/post" },
  { title: "Subir un after", description: "Para seguir después de una fiesta", icon: Moon, href: "/afters/new", needsKyc: true, isNew: true },
  { title: "Mandanos tu evento", description: "Lo revisamos y lo sumamos a root", icon: CalendarPlus, href: "/events/submit", needsKyc: true, isNew: true },
  { title: "Nueva comunidad RRPP", description: "Tu grupo de listas, accesos y beneficios", icon: Users, href: "/communities" },
];

/** Menú "+": ¿Qué querés subir? Hoja inferior en mobile y diálogo centrado desde sm. */
export function QuickActionMenu({ isOpen, onClose }: QuickActionMenuProps) {
  const router = useRouter();
  const requireKyc = useRequireKyc();
  useNativeBackHandler(isOpen, onClose);
  if (!isOpen) return null;
  // Fuera del árbol de la página (que tiene transform): así queda arriba de la barra inferior.
  const overlayRoot = getOverlayRoot();
  if (!overlayRoot) return null;

  const open = (action: QuickAction) => {
    onClose();
    if (action.needsKyc) requireKyc(() => router.push(action.href));
    else router.push(action.href);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="quick-actions-title" className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md px-4 pt-2.5 pb-[calc(1.75rem+var(--root-safe-bottom))] rounded-t-[28px] sm:rounded-hero sm:pb-5 bg-surface border-t sm:border border-line-strong flex flex-col gap-3.5 text-ink shadow-[0_24px_48px_rgba(0,0,0,0.6)]">
        <span aria-hidden="true" className="self-center w-10 h-[5px] rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 id="quick-actions-title" className="font-display text-[22px] m-0">¿Qué querés subir?</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="size-11 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center hover:bg-[#23272D] transition-colors">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.title}>
                <button
                  type="button"
                  onClick={() => open(action)}
                  className={cn(
                    "w-full flex items-center gap-3.5 p-3.5 rounded-card border text-left transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent",
                    action.isNew ? "bg-accent/[0.06] border-accent/30 hover:bg-accent/10" : "bg-bg/40 border-line hover:bg-surface-2",
                  )}
                >
                  <span className={cn("size-11 shrink-0 rounded-control flex items-center justify-center", action.isNew ? "bg-accent text-on-accent" : "bg-surface-2 text-ink")}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                    <span className="font-semibold inline-flex gap-2 items-center">
                      {action.title}
                      {action.isNew && <span className="label-mono text-[9px] text-on-accent bg-accent px-1.5 py-0.5 rounded-md">Nuevo</span>}
                    </span>
                    <span className="text-[13px] text-ink-2">{action.description}</span>
                  </span>
                  <ChevronRight className="size-[18px] text-ink-3 shrink-0" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    overlayRoot,
  );
}

"use client";
import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { useNativeBackHandler } from "@/hooks/useNativeBack";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  presentation?: "dialog" | "screen";
  header?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer, presentation = "dialog", header }: ModalProps) {
  useNativeBackHandler(isOpen, onClose);
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); close.current(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]') || []);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
    };
    const node = ref.current;
    node?.addEventListener("keydown", keydown);
    return () => { node?.removeEventListener("keydown", keydown); document.body.style.overflow = previous; focused?.focus({ preventScroll: true }); };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/80 ${presentation === "screen" ? "" : "p-4 backdrop-blur-sm"}`}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={presentation === "screen" ? "mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-bg pt-[var(--root-safe-top)] pb-[var(--root-safe-bottom)] md:h-[min(900px,100dvh)] md:rounded-hero md:border md:border-line" : "bg-surface text-ink rounded-hero border border-line w-full max-w-sm max-h-[85dvh] overflow-hidden flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.6)] motion-safe:animate-fade-in"}>
        
        {/* Header */}
        {header || <div className="flex items-center justify-between gap-3 pl-4 pr-2 py-2 border-b border-line">
          <h3 className="m-0 text-[17px] font-semibold">{title}</h3>
          <button 
            onClick={onClose} 
            aria-label="Cerrar diálogo"
            className="size-11 rounded-full flex items-center justify-center text-ink-2 hover:bg-white/10 hover:text-ink transition-colors"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>}
        
        {/* Body */}
        <div className="min-h-0 p-4 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-line flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper para crear diálogos de confirmación rápidamente
interface ConfirmModalProps extends Omit<ModalProps, "children" | "footer"> {
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  isLoading = false
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Cargando..." : confirmText}
          </Button>
        </>
      }
    >
      <p className="m-0 text-[15px] text-ink-2 leading-relaxed">{message}</p>
    </Modal>
  );
}

// Helper para crear modales de alerta (solo botón OK)
interface AlertModalProps extends Omit<ModalProps, "children" | "footer"> {
  message: string;
}

export function AlertModal({ isOpen, onClose, title, message }: AlertModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <Button variant="secondary" size="full" onClick={onClose}>
          Entendido
        </Button>
      }
    >
      <p className="m-0 text-[15px] text-ink-2 leading-relaxed">{message}</p>
    </Modal>
  );
}

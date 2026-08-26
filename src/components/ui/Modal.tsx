"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#14171F] rounded-3xl border border-white/10 w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400 hover:text-white" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-white/5 bg-black/20 flex gap-2 justify-end">
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
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="text-xs font-bold uppercase border-white/10 text-neutral-300">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="text-xs font-black uppercase bg-[#D4FF00] text-black hover:bg-[#b3d600]">
            {isLoading ? "Cargando..." : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-300 leading-relaxed font-medium">{message}</p>
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
        <Button onClick={onClose} className="w-full text-xs font-black uppercase bg-white/10 text-white hover:bg-white/20">
          Entendido
        </Button>
      }
    >
      <p className="text-sm text-neutral-300 leading-relaxed font-medium">{message}</p>
    </Modal>
  );
}

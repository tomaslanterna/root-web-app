"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { kycHref } from "@/lib/kycRedirect";

interface KycRequiredSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Adónde volver al terminar la verificación. Por defecto, la pantalla actual. */
  returnTo?: string;
  /** false cuando cerrar significa salir de la pantalla (no se cierra al ir a verificar). */
  closeOnVerify?: boolean;
}

const currentPath = () => (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`);

/**
 * "Verificá tu identidad": se abre al tocar subir un after o mandar un evento sin la identidad verificada
 * (o cuando el backend responde 403 kyc_required). Hoja en mobile, diálogo en escritorio.
 */
export function KycRequiredSheet({ isOpen, onClose, returnTo, closeOnVerify = true }: KycRequiredSheetProps) {
  const router = useRouter();
  const verify = () => {
    const href = kycHref(returnTo ?? currentPath());
    if (closeOnVerify) onClose();
    router.push(href);
  };

  const footer = (
    <>
      <Button size="full" onClick={verify} className="lg:w-auto">
        <ShieldCheck className="size-[18px]" aria-hidden="true" /> Verificar ahora
      </Button>
      <Button size="full" variant="secondary" onClick={onClose} className="lg:w-auto">
        Ahora no
      </Button>
    </>
  );

  return (
    <ResponsiveSheet isOpen={isOpen} onClose={onClose} title="Verificá tu identidad" footer={footer} initialHeight={420}>
      <div className="flex gap-3.5 items-start">
        <span className="size-11 shrink-0 rounded-control bg-accent/12 text-accent flex items-center justify-center">
          <ShieldCheck className="size-[22px]" aria-hidden="true" />
        </span>
        <p className="m-0 text-[15px] leading-relaxed text-ink/90">
          Para subir afters o mandarnos eventos necesitás tener tu identidad verificada.
        </p>
      </div>
      <p className="m-0 text-[13px] leading-normal text-ink-3">Tarda unos minutos: una selfie y tu documento. Después volvés acá.</p>
    </ResponsiveSheet>
  );
}

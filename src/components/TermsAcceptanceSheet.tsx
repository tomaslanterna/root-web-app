"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useAcceptTerms } from "@/hooks/useAcceptTerms";
import { needsTermsAcceptance } from "@/lib/terms";

/**
 * Pantallas donde no se muestra: el ingreso, /complete-profile (que ya tiene su propio checkbox) y los textos legales,
 * para poder leerlos. Al volver de /terms o /privacy, la hoja aparece de nuevo.
 */
export const TERMS_SHEET_SKIP = /^\/(login|register|forgot-password|reset-password|complete-profile|terms|privacy|support)(\/|$)/;

/**
 * Cuentas con el perfil completo que todavía no aceptaron los Términos (anteriores al checkbox, o cuando sube
 * TERMS_VERSION): en vez de mandarlas al formulario de /complete-profile, sube esta hoja en cualquier pantalla.
 * No se puede cerrar sin elegir: aceptar o cerrar sesión (Apple pide aceptar las normas antes de usar el contenido
 * de otros usuarios).
 */
export function TermsAcceptanceSheet() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { accept, error } = useAcceptTerms();

  const open = Boolean(user && needsTermsAcceptance(user)) && !TERMS_SHEET_SKIP.test(pathname);
  if (!open) return null;

  return (
    <BottomSheet
      isOpen
      dismissible={false}
      onClose={() => undefined}
      icon={<FileText className="size-4" aria-hidden="true" />}
      title="Actualizamos los Términos"
      subtitle="Aceptalos para seguir usando root"
      initialHeight={560}
      minHeight={540}
      bodyClassName="flex flex-col gap-4"
    >
      <p className="m-0 text-[15px] leading-relaxed text-ink-2">
        Para seguir usando root necesitamos que aceptes los Términos y Condiciones y la Política de privacidad. En
        root no se tolera el contenido ofensivo ni el acoso: podés denunciar publicaciones, comentarios, mensajes y
        cuentas, y bloquear a quien quieras.
      </p>

      <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface-2 overflow-hidden">
        <Link
          href="/terms"
          className="flex min-h-12 items-center justify-between px-4 text-[15px] font-semibold text-ink hover:bg-white/5"
        >
          Términos y Condiciones
          <span aria-hidden="true" className="text-accent">
            Ver
          </span>
        </Link>
        <Link
          href="/privacy"
          className="flex min-h-12 items-center justify-between px-4 text-[15px] font-semibold text-ink hover:bg-white/5"
        >
          Política de privacidad
          <span aria-hidden="true" className="text-accent">
            Ver
          </span>
        </Link>
      </div>

      {error && (
        <p role="alert" className="m-0 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <Button
          type="button"
          size="full"
          disabled={accept.isLoading}
          onClick={() => void accept.mutate(undefined).catch(() => undefined)}
          className="h-[52px] text-base"
        >
          {accept.isLoading ? <Loader2 className="size-5 animate-spin" aria-label="Guardando" /> : "Aceptar y continuar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="full"
          disabled={accept.isLoading}
          onClick={() => void logout()}
          className="h-11 text-sm text-ink-2"
        >
          Cerrar sesión
        </Button>
      </div>
    </BottomSheet>
  );
}

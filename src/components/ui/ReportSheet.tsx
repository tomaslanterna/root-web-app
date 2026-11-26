"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useReport } from "@/hooks/useReport";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ReportReason, ReportTarget } from "@/types/moderation";

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "spam", label: "Spam o publicidad engañosa", hint: "Promociones, estafas o mensajes repetidos" },
  { value: "abuse", label: "Acoso, odio o contenido inapropiado", hint: "Insultos, amenazas, discriminación o contenido sexual" },
  { value: "other", label: "Otro motivo", hint: "Contanos qué pasó en el detalle" },
];

export const REPORT_SUCCESS_MESSAGE = "Gracias. Vamos a revisarlo en menos de 24 h.";

const DEFAULT_TITLES: Record<ReportTarget["targetType"], string> = {
  post: "Denunciar publicación",
  comment: "Denunciar comentario",
  message: "Denunciar mensaje",
  user: "Denunciar cuenta",
};

interface ReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  target: ReportTarget;
  title?: string;
}

/**
 * Denuncia genérica (post, comentario, mensaje o cuenta). La persona denunciada no se entera de quién la denunció.
 * Lo de una comunidad lo revisa su administración; el resto, el equipo de root.
 */
export function ReportSheet({ isOpen, onClose, target, title }: ReportSheetProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const { mutate, isLoading, error } = useReport(target);
  const isCommunity = !!target.communityId && (target.targetType === "post" || target.targetType === "comment");

  // Cada vez que se abre (o cambia lo denunciado) arranca de cero. Se ajusta durante el render, no en un efecto;
  // al cerrar no se toca, así el mensaje de éxito se ve hasta que termina la animación.
  const openedFor = isOpen ? `${target.targetType}:${target.targetId}` : null;
  const [lastOpenedFor, setLastOpenedFor] = useState(openedFor);
  if (openedFor !== lastOpenedFor) {
    setLastOpenedFor(openedFor);
    if (openedFor) {
      setReason(null);
      setDetails("");
      setSent(false);
    }
  }

  const close = () => {
    if (!isLoading) onClose();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason || isLoading) return;
    void mutate({ reason, details: details.trim() || undefined })
      .then(() => setSent(true))
      .catch(() => undefined);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={title || DEFAULT_TITLES[target.targetType]}
      icon={<Flag className="size-4" aria-hidden="true" />}
      initialHeight={sent ? 320 : 620}
      minHeight={300}
    >
      {!user ? (
        <div className="py-6 flex flex-col items-center gap-4 text-center">
          <p className="m-0 text-sm text-ink-2">Iniciá sesión para denunciar.</p>
          <Link href="/login" className="h-11 px-5 rounded-control bg-accent text-on-accent text-sm font-semibold flex items-center">
            Iniciar sesión
          </Link>
        </div>
      ) : sent ? (
        <div role="status" className="py-6 flex flex-col items-center gap-4 text-center">
          <span className="size-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <p className="m-0 max-w-xs text-[15px] text-ink leading-relaxed">
            {isCommunity ? "Gracias. La administración de la comunidad va a revisarlo." : REPORT_SUCCESS_MESSAGE}
          </p>
          <Button variant="secondary" size="full" onClick={onClose}>
            Listo
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
          <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold text-ink-2">¿Qué pasa con este contenido?</legend>
            {REPORT_REASONS.map((option) => {
              const selected = reason === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-control border cursor-pointer transition-colors",
                    selected ? "border-accent/60 bg-accent/[0.06]" : "border-line bg-surface-2 hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={option.value}
                    checked={selected}
                    onChange={() => setReason(option.value)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold text-ink">{option.label}</span>
                    <span className="text-xs text-ink-3">{option.hint}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <label className="flex flex-col gap-2 text-[13px] font-semibold text-ink-2">
            Detalle (opcional)
            <textarea
              value={details}
              maxLength={1000}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Contanos más si querés"
              className="min-h-24 w-full rounded-control border border-line bg-surface-2 p-3 text-sm font-normal text-ink placeholder:text-ink-3 outline-none focus:border-accent/50"
            />
          </label>

          <p className="m-0 text-xs text-ink-3">
            {isCommunity
              ? "Tu denuncia solo la ve la administración de la comunidad."
              : "La persona no se entera de que la denunciaste."}
          </p>

          {error && (
            <p role="alert" className="m-0 text-xs font-semibold text-danger">
              No pudimos enviar la denuncia. Intentá nuevamente.
            </p>
          )}

          <Button type="submit" size="full" disabled={!reason || isLoading}>
            {isLoading ? "Enviando…" : "Enviar denuncia"}
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}

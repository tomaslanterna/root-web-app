"use client";

import { useId, useState } from "react";
import { CheckCircle2, Flag, MapPin, Send } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { TempCrewRequestCard } from "@/components/match/TempCrewCards";
import { REPORT_REASONS } from "@/components/ui/ReportSheet";
import { useAfterRequests } from "@/hooks/useAfters";
import { apiErrorMessage, apiErrorStatus } from "@/lib/apiErrors";
import { cn } from "@/lib/utils";
import { spotsLeft, timeAgo } from "@/lib/afters";
import { AFTER_MESSAGE_MAX, AFTER_NOTICE_MAX, AFTER_REPORT_MAX, type AfterDetail, type AfterJoinRequest } from "@/types/afters";
import type { TempCrewJoinRequest } from "@/types/tempCrews";
import type { ReportReason } from "@/types/moderation";

const fieldClass =
  "w-full rounded-control border border-line-strong bg-bg px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent";

/** Calles dibujadas en diagonal (sin grilla): solo dan idea de mapa. */
const MAP_BACKGROUND =
  "linear-gradient(35deg, transparent 46%, rgba(255,255,255,0.09) 46%, rgba(255,255,255,0.09) 49%, transparent 49%), linear-gradient(-20deg, transparent 60%, rgba(255,255,255,0.07) 60%, rgba(255,255,255,0.07) 62%, transparent 62%), linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 31.5%, transparent 31.5%), var(--color-surface)";

/** Mapa ilustrativo: con la zona sola marca un círculo; con la dirección, un pin. */
export function AfterZoneMap({ zone, pinned, className }: { zone: string; pinned?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative h-[150px]", className)} style={{ background: MAP_BACKGROUND }}>
      {pinned ? (
        <MapPin className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-full size-8 text-accent" strokeWidth={2} fill="var(--color-bg)" />
      ) : (
        <>
          <span className="absolute left-1/2 top-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/14 border border-dashed border-accent/60 motion-safe:animate-pulse" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-[10px] bg-bg/85 text-[13px] font-semibold">{zone}</span>
        </>
      )}
    </div>
  );
}

/** "Pedir entrar" con un mensaje opcional para quien organiza (acceso con aprobación). */
export function AfterJoinSheet({
  after,
  isOpen,
  onClose,
  onSend,
  isSending,
  error,
}: {
  after: AfterDetail;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  isSending: boolean;
  error: unknown;
}) {
  const ids = useId();
  const [message, setMessage] = useState("");
  const hostName = after.host.name.split(" ")[0] || after.host.username;
  const footer = (
    <>
      {Boolean(error) && <p role="alert" className="m-0 text-[13px] text-danger">{apiErrorMessage(error, "No pudimos mandar el pedido. Probá de nuevo.")}</p>}
      <Button size="full" onClick={() => onSend(message)} disabled={isSending} className="lg:w-auto">
        <Send className="size-4" aria-hidden="true" /> {isSending ? "Enviando…" : "Enviar pedido"}
      </Button>
    </>
  );
  return (
    <ResponsiveSheet isOpen={isOpen} onClose={onClose} title="Pedir entrar" footer={footer} initialHeight={560}>
      <div className="flex flex-col gap-[18px]">
        <p className="m-0 text-[15px] leading-normal text-ink-2">
          <b className="text-ink">{after.host.name}</b> aprueba cada pedido. Cuando te acepta, ves la dirección exacta.
        </p>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-msg`} className="text-sm font-semibold">Mensaje para {hostName} (opcional)</label>
          <textarea
            id={`${ids}-msg`}
            value={message}
            rows={3}
            maxLength={AFTER_MESSAGE_MAX}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ej: Salgo de la fiesta con una amiga."
            className={`${fieldClass} py-3 resize-none leading-snug`}
          />
          <span className="text-xs text-ink-3">{hostName} ve tu perfil y este mensaje.</span>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

/** Denuncia del after (una por persona). Con 3 denuncias se oculta hasta que lo revise el equipo. */
export function AfterReportSheet({
  isOpen,
  onClose,
  onSend,
  isSending,
  error,
  sent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (reason: string) => void;
  isSending: boolean;
  error: unknown;
  sent: boolean;
}) {
  const ids = useId();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const label = REPORT_REASONS.find((r) => r.value === reason)?.label ?? "";
  const text = [label, details.trim()].filter(Boolean).join(": ").slice(0, AFTER_REPORT_MAX);
  // Ya lo había denunciado: se toma como enviado.
  const alreadySent = apiErrorStatus(error) === 409;

  const footer = sent || alreadySent ? (
    <Button size="full" variant="secondary" onClick={onClose} className="lg:w-auto">Listo</Button>
  ) : (
    <>
      {Boolean(error) && <p role="alert" className="m-0 text-[13px] text-danger">{apiErrorMessage(error, "No pudimos mandar la denuncia. Probá de nuevo.")}</p>}
      <Button size="full" onClick={() => onSend(text)} disabled={!reason || isSending || (reason === "other" && !details.trim())} className="lg:w-auto">
        <Flag className="size-4" aria-hidden="true" /> {isSending ? "Enviando…" : "Denunciar"}
      </Button>
    </>
  );

  return (
    <ResponsiveSheet isOpen={isOpen} onClose={onClose} title="Denunciar after" footer={footer} initialHeight={620}>
      {sent || alreadySent ? (
        <div className="py-4 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-accent" aria-hidden="true" />
          <p className="m-0 text-[15px] text-ink-2">{alreadySent ? "Ya lo habías denunciado. Lo estamos revisando." : "Gracias. Lo vamos a revisar."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
            <legend className="text-sm font-semibold mb-2">¿Qué pasa con este after?</legend>
            {REPORT_REASONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex gap-3 items-start p-3 rounded-control border cursor-pointer",
                  reason === option.value ? "border-accent bg-accent/[0.06]" : "border-line-strong bg-bg",
                )}
              >
                <input type="radio" name={`${ids}-reason`} value={option.value} checked={reason === option.value} onChange={() => setReason(option.value)} className="mt-1 accent-[var(--color-accent)]" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{option.label}</span>
                  <span className="text-[13px] text-ink-2">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label htmlFor={`${ids}-details`} className="text-sm font-semibold">Detalle {reason === "other" ? "" : "(opcional)"}</label>
          <textarea id={`${ids}-details`} value={details} rows={3} maxLength={200} onChange={(e) => setDetails(e.target.value)} className={`${fieldClass} py-3 resize-none`} />
        </div>
      )}
    </ResponsiveSheet>
  );
}

const asCrewRequest = (afterId: string, request: AfterJoinRequest): TempCrewJoinRequest => ({
  id: request.userId,
  crewId: afterId,
  status: "pending",
  message: request.message,
  createdAt: request.createdAt,
  user: { userId: request.userId, name: request.name, username: request.username, avatarUrl: request.avatarUrl },
});

/** Vista del host: aviso para los que van y, con aprobación, las solicitudes con Aceptar / Rechazar. */
export function AfterHostPanel({
  after,
  onChanged,
  onSaveNotice,
  savingNotice,
  noticeError,
}: {
  after: AfterDetail;
  onChanged: () => void;
  onSaveNotice: (notice: string) => Promise<unknown>;
  savingNotice: boolean;
  noticeError: unknown;
}) {
  const ids = useId();
  const [notice, setNotice] = useState(after.notice ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const withApproval = after.access === "approval";
  const { requests, status, respond, respondingId, respondError } = useAfterRequests(after.id, withApproval, onChanged);
  const left = spotsLeft(after);

  return (
    <div className="flex flex-col gap-5">
      {withApproval && (
        <section aria-labelledby={`${ids}-req`} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${ids}-req`} className="font-display text-[22px] m-0">Solicitudes</h2>
            {status === "ready" && <span className="text-[13px] text-ink-2"><span className="num-mono text-ink">{requests.length}</span> pendientes</span>}
          </div>
          {status === "loading" && <div className="h-[180px] rounded-card bg-surface border border-line animate-pulse" aria-hidden="true" />}
          {status === "unavailable" && <p className="m-0 text-sm text-ink-2">No pudimos cargar las solicitudes.</p>}
          {status === "ready" && requests.length === 0 && <p className="m-0 text-sm text-ink-2">Todavía nadie pidió entrar. Te avisamos cuando alguien pida.</p>}
          {status === "ready" && requests.length > 0 && (
            <div className="-mx-4 px-4 scroll-px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar lg:mx-0 lg:px-0 lg:scroll-px-0">
              {requests.map((request) => (
                <TempCrewRequestCard
                  key={request.userId}
                  request={asCrewRequest(after.id, request)}
                  isBusy={respondingId === request.userId}
                  canAccept={left === null || left > 0}
                  onRespond={(decision) => void respond(request.userId, decision).catch(() => undefined)}
                />
              ))}
            </div>
          )}
          {Boolean(respondError) && <p role="alert" className="m-0 text-[13px] text-danger">{apiErrorMessage(respondError, "No pudimos responder. Probá de nuevo.")}</p>}
        </section>
      )}

      <section aria-labelledby={`${ids}-notice`} className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <label id={`${ids}-notice`} htmlFor={`${ids}-notice-input`} className="text-[15px] font-semibold">Aviso para los que van</label>
          {after.noticeUpdatedAt && <span className="text-xs text-ink-3">{savedAt ? "Guardado" : timeAgo(after.noticeUpdatedAt)}</span>}
        </div>
        <textarea
          id={`${ids}-notice-input`}
          value={notice}
          rows={3}
          maxLength={AFTER_NOTICE_MAX}
          onChange={(e) => {
            setNotice(e.target.value);
            setSavedAt(null);
          }}
          placeholder="Ej: Timbre 3. Arrancamos apenas cierra la fiesta."
          className={`${fieldClass} py-3 resize-none leading-snug`}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-3">Solo lo ven {withApproval ? "los aceptados" : "los que van"}.</span>
          <Button
            size="sm"
            variant="secondary"
            disabled={savingNotice || notice.trim() === (after.notice ?? "").trim()}
            onClick={() => void onSaveNotice(notice.trim()).then(() => setSavedAt(new Date().toISOString())).catch(() => undefined)}
          >
            {savingNotice ? "Guardando…" : "Guardar aviso"}
          </Button>
        </div>
        {Boolean(noticeError) && <p role="alert" className="m-0 text-[13px] text-danger">{apiErrorMessage(noticeError, "No pudimos guardar el aviso.")}</p>}
      </section>
    </div>
  );
}

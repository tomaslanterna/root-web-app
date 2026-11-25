"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Check, Lock, Minus, Plus, Send } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import { tempCrewsApi } from "@/services/tempCrews";
import { EventMiniCard, FacePile, firstName } from "@/components/match/TempCrewCards";
import {
  TEMP_CREW_MAX_CAPACITY,
  TEMP_CREW_MESSAGE_MAX,
  TEMP_CREW_MIN_CAPACITY,
  TEMP_CREW_NAME_MAX,
  TEMP_CREW_PLAN_MAX,
  type TempCrewEventRef,
  type TempCrewSummary,
} from "@/types/tempCrews";

/** true desde 1024 px: en escritorio las hojas se muestran como diálogo centrado. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function ResponsiveSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" footer={footer}>
        {children}
      </Modal>
    );
  }
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxHeightRatio={0.94} initialHeight={760}>
      <div className="px-5 pt-2 pb-[calc(1rem+var(--root-safe-bottom))] flex flex-col gap-5">
        {children}
        <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-surface border-t border-line flex flex-col gap-2">{footer}</div>
      </div>
    </BottomSheet>
  );
}

const fieldClass =
  "w-full rounded-control border border-line-strong bg-bg px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent";

const errorText = (error: { response?: { status?: number } } | null, fallback: string) => {
  const status = error?.response?.status;
  if (status === 409) return "No se pudo: puede que ya estés en una crew de este evento o que se haya llenado.";
  if (status === 401) return "Tenés que iniciar sesión.";
  return fallback;
};

export function CreateTempCrewSheet({
  isOpen,
  onClose,
  event,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  event: TempCrewEventRef;
  onCreated: (crew: TempCrewSummary) => void;
}) {
  const ids = useId();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(6);
  const [plan, setPlan] = useState("");
  const create = useMutation((input: { name: string; capacity: number; plan: string }) => tempCrewsApi.create(event, input));
  const canSubmit = name.trim().length > 0 && plan.trim().length > 0 && !create.isLoading;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const crew = await create.mutate({ name: name.trim(), capacity, plan: plan.trim() });
      setName("");
      setPlan("");
      onCreated(crew);
    } catch {
      // el error se muestra abajo
    }
  };

  const footer = (
    <>
      {create.error && <p role="alert" className="m-0 text-[13px] text-danger">{errorText(create.error, "No pudimos crear la crew. Probá de nuevo.")}</p>}
      <Button size="full" onClick={() => void submit()} disabled={!canSubmit} className="lg:w-auto">
        {create.isLoading ? "Creando…" : "Crear y publicar en el evento"}
      </Button>
    </>
  );

  return (
    <ResponsiveSheet isOpen={isOpen} onClose={onClose} title="Crew temporal" footer={footer}>
      <div className="flex flex-col gap-[18px]">
        <EventMiniCard event={event} />
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-name`} className="text-sm font-semibold">Nombre de la crew</label>
          <input
            id={`${ids}-name`}
            value={name}
            maxLength={TEMP_CREW_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Los de la previa"
            className={`${fieldClass} h-12`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span id={`${ids}-cap`} className="text-sm font-semibold">¿Cuántos lugares?</span>
          <div role="group" aria-labelledby={`${ids}-cap`} className="flex items-center justify-between gap-3 p-1.5 rounded-control border border-line-strong bg-bg">
            <button
              type="button"
              aria-label="Menos lugares"
              disabled={capacity <= TEMP_CREW_MIN_CAPACITY}
              onClick={() => setCapacity((c) => Math.max(TEMP_CREW_MIN_CAPACITY, c - 1))}
              className="size-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center disabled:opacity-40"
            >
              <Minus className="size-[18px]" aria-hidden="true" />
            </button>
            <span className="flex items-baseline gap-1.5" aria-live="polite">
              <span className="num-mono text-[22px] font-semibold">{capacity}</span>
              <span className="text-[13px] text-ink-2">personas</span>
            </span>
            <button
              type="button"
              aria-label="Más lugares"
              disabled={capacity >= TEMP_CREW_MAX_CAPACITY}
              onClick={() => setCapacity((c) => Math.min(TEMP_CREW_MAX_CAPACITY, c + 1))}
              className="size-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center disabled:opacity-40"
            >
              <Plus className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
          <span className="text-xs text-ink-3">Contándote a vos. De {TEMP_CREW_MIN_CAPACITY} a {TEMP_CREW_MAX_CAPACITY}.</span>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-plan`} className="text-sm font-semibold">Contá el plan</label>
          <textarea
            id={`${ids}-plan`}
            value={plan}
            rows={3}
            maxLength={TEMP_CREW_PLAN_MAX}
            onChange={(e) => setPlan(e.target.value)}
            aria-describedby={`${ids}-plan-hint`}
            placeholder="Ej: Previa en Pocitos desde las 22 y vamos juntos."
            className={`${fieldClass} py-3 resize-none leading-snug`}
          />
          <span id={`${ids}-plan-hint`} className="text-xs text-ink-3">Lo ven quienes van al evento antes de pedir unirse.</span>
        </div>
        <div className="flex gap-3 items-start p-3.5 rounded-control bg-accent/[0.06] border border-accent/20">
          <Lock className="size-[17px] text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <p className="m-0 text-[13px] leading-normal text-ink-2">
            <b className="text-ink">Vos aprobás cada solicitud.</b> La crew aparece en el evento y se archiva 24 h después de la fiesta.
          </p>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

export function JoinTempCrewSheet({
  crew,
  onClose,
  onSent,
}: {
  crew: TempCrewSummary | null;
  onClose: () => void;
  onSent: (crew: TempCrewSummary) => void;
}) {
  const ids = useId();
  const [message, setMessage] = useState("");
  const request = useMutation(tempCrewsApi.requestToJoin);
  const hostName = crew ? firstName(crew.host) : "";

  const submit = async () => {
    if (!crew || request.isLoading) return;
    try {
      await request.mutate({ crewId: crew.id, message });
      setMessage("");
      onSent(crew);
    } catch {
      // el error se muestra abajo
    }
  };

  const footer = (
    <>
      {request.error && <p role="alert" className="m-0 text-[13px] text-danger">{errorText(request.error, "No pudimos enviar la solicitud. Probá de nuevo.")}</p>}
      <Button size="full" onClick={() => void submit()} disabled={request.isLoading} className="lg:w-auto">
        <Send className="size-4" aria-hidden="true" />
        {request.isLoading ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </>
  );

  return (
    <ResponsiveSheet isOpen={!!crew} onClose={onClose} title="Pedir unirme" footer={footer}>
      {crew && (
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-3">
            <FacePile people={crew.membersPreview} size="size-9" />
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-base font-semibold truncate">{crew.name}</span>
              <span className="text-[13px] text-ink-2">
                Creada por {crew.host.name} · <span className="num-mono">{crew.memberCount}/{crew.capacity}</span> lugares
              </span>
            </span>
          </div>
          <p className="m-0 px-3.5 py-3 rounded-control bg-surface-2 text-sm leading-normal text-ink-2">“{crew.plan}”</p>
          <EventMiniCard event={crew.event} />
          <div className="flex flex-col gap-2">
            <label htmlFor={`${ids}-msg`} className="text-sm font-semibold">Mensaje para {hostName} (opcional)</label>
            <textarea
              id={`${ids}-msg`}
              value={message}
              rows={3}
              maxLength={TEMP_CREW_MESSAGE_MAX}
              onChange={(e) => setMessage(e.target.value)}
              aria-describedby={`${ids}-msg-hint`}
              placeholder="Ej: Voy solo, me sumo a la previa."
              className={`${fieldClass} py-3 resize-none leading-snug`}
            />
            <span id={`${ids}-msg-hint`} className="text-xs text-ink-3">{hostName} ve tu perfil y este mensaje.</span>
          </div>
          <p className="m-0 flex gap-3 items-start text-[13px] leading-normal text-ink-2">
            <Check className="size-[17px] text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <span>Te marcamos como <b className="text-ink">Voy</b> en el evento. Si te acepta, entrás al chat de la crew.</span>
          </p>
        </div>
      )}
    </ResponsiveSheet>
  );
}

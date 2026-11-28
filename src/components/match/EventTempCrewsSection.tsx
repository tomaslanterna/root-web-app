"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { AdmittingPill, TempCrewLaneCard, TempCrewLaneEnd } from "@/components/match/TempCrewCards";
import { AlreadyInEventCrewModal, CreateTempCrewSheet, JoinTempCrewSheet } from "@/components/match/TempCrewSheets";
import type { TempCrewEventRef, TempCrewSummary } from "@/types/tempCrews";
import { eventPath } from "@/lib/eventPath";

export const TEMP_CREWS_ANCHOR = "crews-para-ir";
const SECTION_BACKGROUND = "linear-gradient(180deg, rgba(212,255,0,0.07), rgba(212,255,0,0) 140px), #0F1114";
const SECTION_CLASS = "scroll-mt-24 p-4 rounded-hero border border-accent/25 flex flex-col gap-3.5 lg:p-[22px] lg:gap-4";
const LANE_MAX = 3;

interface EventTempCrewsSectionProps {
  event: TempCrewEventRef;
  crews: TempCrewSummary[];
  total: number;
  viewerCrewId: string | null;
  /** Para refrescar la lista después de pedir unirse. */
  onChanged?: () => void;
  className?: string;
}

/**
 * Resumen de crews temporales en el detalle del evento: cuántas admiten gente, un carrusel con hasta 3,
 * "Unirme a una crew" al final (lleva a la lista completa) y el botón para crear una.
 * Tocar una crew en la que no estás abre la hoja para pedir unirte; si ya estás, la creaste o ya pediste,
 * abre su detalle. Si ya tenés otra crew en este evento, avisa que solo se puede estar en una.
 */
export function EventTempCrewsSection({ event, crews, total, viewerCrewId, onChanged, className }: EventTempCrewsSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joining, setJoining] = useState<TempCrewSummary | null>(null);
  const [isAlreadyOpen, setIsAlreadyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const openJoin = (crew: TempCrewSummary) => {
    if (!user) {
      router.push("/login");
      return;
    }
    // Solo se puede estar en una crew temporal por evento.
    if (viewerCrewId && viewerCrewId !== crew.id) {
      setIsAlreadyOpen(true);
      return;
    }
    setJoining(crew);
  };
  const listHref = eventPath(event, "crews");
  const lane = crews.slice(0, LANE_MAX);

  const openCreate = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsCreateOpen(true);
  };

  return (
    <section
      id={TEMP_CREWS_ANCHOR}
      aria-labelledby={`${TEMP_CREWS_ANCHOR}-title`}
      className={cn(SECTION_CLASS, className)}
      style={{ background: SECTION_BACKGROUND }}
    >
      <div className="flex items-center justify-between gap-2.5 flex-wrap lg:justify-start lg:gap-3">
        <h2 id={`${TEMP_CREWS_ANCHOR}-title`} className="font-display text-[22px] m-0 lg:text-[28px]">Crews para ir</h2>
        {total > 0 && <AdmittingPill>{total} admitiendo</AdmittingPill>}
      </div>
      <p className="m-0 text-sm leading-normal text-ink-2">
        {total > 0
          ? "Grupos para ir juntos a esta fiesta. Quien crea la crew aprueba a cada persona."
          : "Todavía nadie armó una crew para esta fiesta. Armá la primera y sumá gente para ir juntos."}
      </p>

      {lane.length > 0 && (
        <div
          aria-label="Algunas crews que admiten gente"
          className="-mx-4 px-4 scroll-px-4 pb-1 flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory hide-scrollbar lg:mx-0 lg:px-0 lg:scroll-px-0 lg:pb-0 xl:grid xl:grid-cols-[repeat(3,minmax(0,1fr))_156px] xl:overflow-visible"
        >
          {lane.map((crew) => (
            <TempCrewLaneCard key={crew.id} crew={crew} onRequestJoin={openJoin} />
          ))}
          <TempCrewLaneEnd href={listHref} total={total} />
        </div>
      )}

      {viewerCrewId ? (
        <Link
          href={`/crews/${viewerCrewId}`}
          className="h-[50px] rounded-control bg-surface-2 border border-line-strong text-[15px] font-semibold flex items-center justify-center hover:bg-[#23272D] transition-colors lg:self-start lg:h-12 lg:px-[18px]"
        >
          Ver tu crew para este evento
        </Link>
      ) : (
        <button
          type="button"
          onClick={openCreate}
          className="h-[50px] rounded-control bg-accent text-on-accent text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover active:scale-[0.98] transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:self-start lg:h-12 lg:px-[18px]"
        >
          <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" /> Crear crew temporal
        </button>
      )}

      <AlreadyInEventCrewModal viewerCrewId={viewerCrewId} isOpen={isAlreadyOpen} onClose={() => setIsAlreadyOpen(false)} />
      <JoinTempCrewSheet
        crew={joining}
        onClose={() => setJoining(null)}
        onSent={(crew) => {
          setJoining(null);
          setToast(`Solicitud enviada a ${crew.name}`);
          onChanged?.();
        }}
      />
      {toast && (
        <div role="status" className="fixed left-4 right-4 bottom-[calc(1.5rem+var(--root-safe-bottom))] z-40 mx-auto max-w-sm h-12 px-4 rounded-2xl bg-ink text-bg text-sm font-semibold flex items-center gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-fade-in">
          <Check className="size-[18px]" aria-hidden="true" /> {toast}
        </div>
      )}

      <CreateTempCrewSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        event={event}
        onCreated={(crew) => {
          setIsCreateOpen(false);
          router.push(`/crews/${crew.id}`);
        }}
      />
    </section>
  );
}

/** Lugar reservado mientras cargan las crews, con la misma forma que la sección (evita el salto). */
export function EventTempCrewsSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn(SECTION_CLASS, className)} style={{ background: SECTION_BACKGROUND }}>
      <div className="flex items-center gap-3">
        <span className="h-6 w-40 rounded-md bg-surface-2 animate-pulse" />
        <span className="h-7 w-28 rounded-full bg-surface-2 animate-pulse" />
      </div>
      <span className="h-10 w-full max-w-md rounded-md bg-surface-2/70 animate-pulse" />
      <div className="-mx-4 px-4 flex gap-3 overflow-hidden lg:mx-0 lg:px-0 xl:grid xl:grid-cols-[repeat(3,minmax(0,1fr))_156px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-[236px] h-[178px] shrink-0 rounded-card bg-surface border border-line animate-pulse xl:w-auto" />
        ))}
        <span className="w-[160px] h-[178px] shrink-0 rounded-card border border-dashed border-accent/30 xl:w-auto" />
      </div>
      <span className="h-[50px] rounded-control bg-surface-2 animate-pulse lg:h-12 lg:w-52" />
    </div>
  );
}

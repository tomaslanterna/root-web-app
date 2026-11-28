"use client";

import { useRouter } from "next/navigation";
import { CalendarPlus, Moon, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AfterCard, AfterRow, AftersLaneEnd } from "@/components/afters/AfterCard";
import { useRequireKyc } from "@/hooks/useRequireKyc";
import { groupAftersByNight, nightKey, nightLabel } from "@/lib/afters";
import type { AfterSummary } from "@/types/afters";

const STRIP_MAX = 3;

/** Franja "Afters de esta noche" arriba de Próximos eventos. "Ver todos" activa el filtro Afters. */
export function TonightAftersStrip({ afters, total, onSeeAll }: { afters: AfterSummary[]; total: number; onSeeAll: () => void }) {
  const lane = afters.slice(0, STRIP_MAX);
  return (
    <section
      aria-labelledby="afters-tonight"
      className="p-4 rounded-hero border border-line-strong flex flex-col gap-3 animate-fade-in lg:p-5"
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 140px), var(--color-surface)" }}
    >
      <div className="flex items-end justify-between gap-2.5">
        <span className="flex flex-col gap-1 min-w-0">
          <span className="label-mono text-accent">{nightLabel(nightKey(new Date()))}</span>
          <h2 id="afters-tonight" className="font-display text-[22px] m-0 inline-flex items-center gap-[9px]">
            <Moon className="size-[19px] text-accent shrink-0" strokeWidth={2} aria-hidden="true" /> Afters de esta noche
          </h2>
        </span>
        <button type="button" onClick={onSeeAll} className="min-h-9 text-[13px] font-semibold text-accent whitespace-nowrap hover:text-accent-hover">Ver todos</button>
      </div>
      <div role="list" aria-label="Afters de esta noche" className="-mx-4 px-4 scroll-px-4 pb-1 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain snap-x snap-mandatory hide-scrollbar lg:-mx-5 lg:px-5 lg:scroll-px-5 xl:mx-0 xl:px-0 xl:grid xl:grid-cols-[repeat(3,minmax(0,1fr))_156px] xl:overflow-visible">
        {lane.map((after) => <AfterCard key={after.id} after={after} />)}
        <AftersLaneEnd total={total} onClick={onSeeAll} />
      </div>
    </section>
  );
}

/**
 * Lista del filtro Afters: agrupada por noche y ordenada por hora. Mobile en filas, escritorio en grilla.
 * Nunca se mezcla con la grilla de eventos.
 */
export function AftersFilterResults({
  afters,
  status,
  onRetry,
  onlyGoing,
}: {
  afters: AfterSummary[];
  status: "loading" | "ready" | "unavailable";
  onRetry: () => void;
  onlyGoing: boolean;
}) {
  const router = useRouter();
  const requireKyc = useRequireKyc();
  const upload = () => requireKyc(() => router.push("/afters/new"));

  if (status === "loading" && afters.length === 0) {
    return (
      <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[138px] rounded-card bg-surface border border-line animate-pulse lg:h-[300px]" />)}
      </div>
    );
  }
  if (status === "unavailable" && afters.length === 0) {
    return (
      <div className="space-y-4 rounded-card border border-line bg-surface p-8 text-center">
        <RefreshCw className="mx-auto size-7 text-ink-3" aria-hidden="true" />
        <p className="m-0 text-base font-semibold">No pudimos cargar los afters.</p>
        <Button size="sm" variant="outline" onClick={onRetry}>Reintentar</Button>
      </div>
    );
  }
  if (afters.length === 0) {
    return (
      <div className="space-y-3 rounded-card border border-line bg-surface p-8 text-center">
        <Moon className="mx-auto size-8 text-ink-3" aria-hidden="true" />
        <p className="m-0 text-base font-semibold">{onlyGoing ? "Todavía no vas a ningún after" : "No hay afters próximos con esos filtros"}</p>
        <p className="m-0 text-sm text-ink-2">¿Armás uno? Se publica al instante y se archiva 24 h después.</p>
        <Button size="sm" onClick={upload}><Plus className="size-4" aria-hidden="true" /> Subir un after</Button>
      </div>
    );
  }

  const nights = groupAftersByNight(afters);
  return (
    <div className="tab-panel-in flex flex-col gap-6 lg:gap-8">
      {nights.map((night) => (
        <section key={night.key} aria-labelledby={`night-${night.key}`} className="flex flex-col gap-2.5 lg:gap-4">
          <h2 id={`night-${night.key}`} className={`label-mono m-0 ${night.isTonight ? "text-accent" : "text-ink-2"}`}>
            {night.label}
            <span className="hidden lg:inline"> · {night.afters.length} {night.afters.length === 1 ? "after" : "afters"}</span>
          </h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-2.5 lg:hidden">
            {night.afters.map((after) => <li key={after.id}><AfterRow after={after} /></li>)}
          </ul>
          <div role="list" className="hidden lg:grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {night.afters.map((after) => <AfterCard key={after.id} after={after} variant="grid" />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Al final de la lista de eventos: "¿Organizás una fiesta? Sumala a root". */
export function SubmitEventCta() {
  const router = useRouter();
  const requireKyc = useRequireKyc();
  return (
    <section aria-labelledby="submit-event-cta" className="mt-4 p-4 rounded-card bg-surface border border-line flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:p-5">
      <span className="flex gap-3 items-start">
        <span className="size-11 shrink-0 rounded-control bg-accent/12 text-accent flex items-center justify-center">
          <CalendarPlus className="size-5" aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-0.5">
          <h2 id="submit-event-cta" className="m-0 text-[15px] font-semibold">¿Organizás una fiesta? Sumala a root</h2>
          <span className="text-[13px] text-ink-2">Mandanos el evento y lo revisamos en 24 a 48 h.</span>
        </span>
      </span>
      <Button variant="secondary" onClick={() => requireKyc(() => router.push("/events/submit"))} className="sm:shrink-0">
        Mandanos tu evento
      </Button>
    </section>
  );
}

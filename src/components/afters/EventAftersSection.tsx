"use client";

import { useRouter } from "next/navigation";
import { Moon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequireKyc } from "@/hooks/useRequireKyc";
import { AfterCard, AftersLaneEnd } from "@/components/afters/AfterCard";
import type { AftersEventSummary } from "@/types/afters";
import { eventPath, type EventLinkRef } from "@/lib/eventPath";

export const AFTERS_ANCHOR = "afters";
const SECTION_BACKGROUND = "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 140px), var(--color-surface)";
const LANE_MAX = 3;

/**
 * Sección "Afters" del detalle del evento, debajo de "Crews para ir". Usa lo que viene en el evento
 * (`event.afters`), sin otro request. Si no hay afters queda solo el título y "Subir un after".
 */
export function EventAftersSection({ event, afters, className }: { event: EventLinkRef; afters: AftersEventSummary; className?: string }) {
  const eventId = event.id;
  const router = useRouter();
  const requireKyc = useRequireKyc();
  const lane = afters.preview.slice(0, LANE_MAX);
  const total = afters.total;

  return (
    <section
      id={AFTERS_ANCHOR}
      aria-labelledby={`${AFTERS_ANCHOR}-title`}
      className={cn("scroll-mt-24 p-4 rounded-hero border border-line-strong flex flex-col gap-3.5 lg:p-[22px] lg:gap-4", className)}
      style={{ background: SECTION_BACKGROUND }}
    >
      <div className="flex items-center justify-between gap-2.5 flex-wrap lg:justify-start lg:gap-3">
        <h2 id={`${AFTERS_ANCHOR}-title`} className="font-display text-[22px] m-0 inline-flex items-center gap-2.5 lg:text-[28px] lg:gap-3">
          <Moon className="size-5 text-accent lg:size-6" strokeWidth={2} aria-hidden="true" /> Afters
        </h2>
        {total > 0 && (
          <span className="inline-flex items-center h-6 px-[9px] rounded-full bg-surface-2 text-ink/80 text-xs font-semibold whitespace-nowrap">
            {total} después de esta fiesta
          </span>
        )}
      </div>
      {total > 0 && (
        <p className="m-0 text-sm leading-normal text-ink-2">Para seguir cuando termine. El oficial va primero; los demás los sube gente que va.</p>
      )}

      {lane.length > 0 && (
        <div
          role="list"
          aria-label="Algunos afters"
          className="-mx-4 px-4 scroll-px-4 pb-1 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain snap-x snap-mandatory hide-scrollbar lg:mx-0 lg:px-0 lg:scroll-px-0 lg:pb-0 2xl:grid 2xl:grid-cols-[repeat(3,minmax(0,1fr))_156px] 2xl:overflow-visible"
        >
          {lane.map((after) => (
            // La columna del detalle es angosta: en grilla recién desde 2xl, antes carrusel con tarjetas enteras.
            <AfterCard key={after.id} after={after} className="xl:w-[236px] 2xl:w-auto" />
          ))}
          <AftersLaneEnd total={total} href={eventPath(event, "afters")} className="xl:w-[150px] 2xl:w-auto" />
        </div>
      )}

      <button
        type="button"
        onClick={() => requireKyc(() => router.push(`/afters/new?eventId=${encodeURIComponent(eventId)}`))}
        className="h-[50px] rounded-control bg-surface-2 border border-line-strong text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#23272D] transition-colors focus-visible:outline-2 focus-visible:outline-accent lg:self-start lg:h-12 lg:px-[18px]"
      >
        <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" /> Subir un after
      </button>
    </section>
  );
}

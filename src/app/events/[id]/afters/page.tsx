"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useRequireKyc } from "@/hooks/useRequireKyc";
import { useEventAftersList } from "@/hooks/useAfters";
import { useEventId } from "@/hooks/useEventId";
import { AfterCard, AfterRow } from "@/components/afters/AfterCard";

/** Todos los afters de un evento ("Ver todos" del detalle). El oficial va primero. */
export default function EventAftersPage({ params }: { params: Promise<{ id: string }> }) {
  // La URL trae el UUID o el slug; la API siempre va con el id.
  const { id: param } = use(params);
  const { eventId, failed } = useEventId(param);
  const router = useRouter();
  const requireKyc = useRequireKyc();
  const goBack = useBackNavigation(`/events/${param}`);
  const { afters, total, status: listStatus, reload } = useEventAftersList(eventId ?? "");
  const status = failed ? "unavailable" : listStatus;
  const retry = () => (failed ? window.location.reload() : void reload());
  const upload = () => {
    if (eventId) requireKyc(() => router.push(`/afters/new?eventId=${encodeURIComponent(eventId)}`));
  };

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(7rem+var(--root-safe-bottom))] lg:pb-16">
      <SwipeBack onBack={goBack} />
      <div className="w-full max-w-2xl mx-auto px-4 lg:max-w-none lg:px-0">
        <header className="sticky top-0 z-30 -mx-4 px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 bg-bg/95 backdrop-blur-md flex items-center gap-3 lg:static lg:mx-0 lg:px-0 lg:pt-2 lg:pb-6 lg:bg-transparent lg:backdrop-blur-none">
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver al evento"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display text-[26px] m-0 flex-1 lg:text-[44px]">Afters</h1>
          {status === "ready" && <span className="text-[13px] text-ink-2"><span className="num-mono text-ink">{total}</span> después de esta fiesta</span>}
        </header>

        {status === "loading" && (
          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:gap-4" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-[138px] rounded-card bg-surface border border-line animate-pulse lg:h-[300px]" />)}
          </div>
        )}
        {status === "unavailable" && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <p className="m-0 text-[15px] text-ink-2">No pudimos cargar los afters.</p>
            <button type="button" onClick={retry} className="min-h-11 text-sm font-semibold text-accent">Reintentar</button>
          </div>
        )}
        {status === "ready" && afters.length === 0 && (
          <p className="py-8 m-0 text-center text-[15px] text-ink-2">Todavía no hay afters para esta fiesta. Subí el primero.</p>
        )}
        {status === "ready" && afters.length > 0 && (
          <>
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5 lg:hidden">
              {afters.map((after) => <li key={after.id}><AfterRow after={after} /></li>)}
            </ul>
            <div role="list" className="hidden lg:grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {afters.map((after) => <AfterCard key={after.id} after={after} variant="grid" />)}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={upload}
          className="mt-5 h-[50px] w-full rounded-control bg-surface-2 border border-line-strong text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#23272D] transition-colors focus-visible:outline-2 focus-visible:outline-accent lg:w-auto lg:px-[18px] lg:h-12"
        >
          <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" /> Subir un after
        </button>
      </div>
    </div>
  );
}

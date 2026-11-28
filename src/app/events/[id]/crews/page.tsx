"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Plus } from "lucide-react";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { useAuth } from "@/context/AuthContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useMutation } from "@/hooks/useMutation";
import { useEventTempCrews } from "@/hooks/useTempCrews";
import { useCanonicalEventUrl, useEventId } from "@/hooks/useEventId";
import { eventPath } from "@/lib/eventPath";
import { eventsApi } from "@/services/events";
import { tempCrewsApi } from "@/services/tempCrews";
import { AdmittingPill, EventMiniCard, TempCrewCard } from "@/components/match/TempCrewCards";
import { AlreadyInEventCrewModal, CreateTempCrewSheet, JoinTempCrewSheet } from "@/components/match/TempCrewSheets";
import type { Event } from "@/types/events";
import type { TempCrewEventRef, TempCrewSummary } from "@/types/tempCrews";

/** Todas las crews temporales del evento que admiten gente. Acá se pide unirse. */
export default function EventTempCrewsPage({ params }: { params: Promise<{ id: string }> }) {
  // La URL trae el UUID o el slug: el detalle se pide con lo que venga, las crews siempre con el id.
  const { id: param } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const goBack = useBackNavigation(`/events/${param}`);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventFailed, setEventFailed] = useState(false);
  const [joining, setJoining] = useState<TempCrewSummary | null>(null);
  const [isAlreadyOpen, setIsAlreadyOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { mutate: fetchEvent } = useMutation((id: string) => eventsApi.getEventById(id));
  useEffect(() => {
    void fetchEvent(param)
      .then(setEvent)
      .catch(() => setEventFailed(true));
  }, [param, fetchEvent]);
  useCanonicalEventUrl(param, event);
  const { eventId: knownId } = useEventId(param);
  const eventId = event?.id ?? knownId ?? "";

  const eventRef = useMemo<TempCrewEventRef | null>(
    () =>
      event
        ? { id: event.id, slug: event.slug, title: event.title, date: event.date, location: event.location, cinematicBannerUrl: event.cinematicBannerUrl }
        : null,
    [event],
  );
  const { crews, total, viewerCrewId, status, reload } = useEventTempCrews(eventId, eventRef, 50);
  const cancel = useMutation(tempCrewsApi.cancelMyRequest, { onSuccess: () => void reload() });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const requireLogin = () => {
    if (user) return false;
    router.push("/login");
    return true;
  };

  const openCreate = () => {
    if (!requireLogin()) setIsCreateOpen(true);
  };

  const createButton = viewerCrewId ? (
    <Link href={`/crews/${viewerCrewId}`} className="h-12 px-4 rounded-control bg-surface-2 border border-line-strong text-[15px] font-semibold flex items-center hover:bg-[#23272D] transition-colors">
      Ver tu crew
    </Link>
  ) : (
    <button
      type="button"
      onClick={openCreate}
      className="h-12 px-4 rounded-control bg-accent text-on-accent text-[15px] font-semibold flex items-center gap-1.5 hover:bg-accent-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" /> Crear crew
    </button>
  );

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
          <h1 className="font-display text-[26px] m-0 flex-1 lg:text-[44px]">Crews para ir</h1>
          <div className="hidden lg:block">{createButton}</div>
        </header>

        {eventFailed ? (
          <p className="py-10 text-center text-[15px] text-ink-2">No encontramos este evento.</p>
        ) : (
          <div className="flex flex-col gap-3 lg:gap-5">
            {eventRef && <EventMiniCard event={eventRef} href={eventPath(eventRef)} className="lg:max-w-md" />}
            <div className="flex items-center justify-between gap-2.5 py-1">
              {status === "ready" && total > 0 ? <AdmittingPill>{total} admitiendo</AdmittingPill> : <span />}
              <span className="text-xs text-ink-3">Más lugares libres primero</span>
            </div>

            {status === "loading" && (
              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3" aria-hidden="true">
                {[0, 1, 2].map((i) => <div key={i} className="h-[164px] rounded-card bg-surface border border-line animate-pulse" />)}
              </div>
            )}
            {status === "unavailable" && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <p className="m-0 text-[15px] text-ink-2">No pudimos cargar las crews.</p>
                <button type="button" onClick={() => void reload()} className="min-h-11 text-sm font-semibold text-accent">Reintentar</button>
              </div>
            )}
            {status === "ready" && crews.length === 0 && (
              <p className="py-8 m-0 text-center text-[15px] text-ink-2">Ninguna crew está admitiendo gente ahora. Armá la tuya.</p>
            )}
            {status === "ready" && crews.length > 0 && (
              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] lg:gap-3.5">
                {crews.map((crew) => (
                  <TempCrewCard
                    key={crew.id}
                    crew={crew}
                    isBusy={cancel.isLoading}
                    onRequest={(target) => {
                      if (requireLogin()) return;
                      // Solo se puede estar en una crew temporal por evento.
                      if (viewerCrewId && viewerCrewId !== target.id) setIsAlreadyOpen(true);
                      else setJoining(target);
                    }}
                    onCancelRequest={(target) => void cancel.mutate(target.id).catch(() => undefined)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile: crear queda siempre a mano abajo. */}
      {!eventFailed && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-3.5 pb-[calc(0.875rem+var(--root-safe-bottom))] bg-bg/95 backdrop-blur-md border-t border-line flex items-center gap-3 lg:hidden">
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{viewerCrewId ? "Ya tenés crew para este evento" : "¿Ninguna te cierra?"}</span>
            <span className="text-xs text-ink-2">{viewerCrewId ? "Podés ver a quién sumar" : "Armá la tuya para este evento"}</span>
          </span>
          {createButton}
        </div>
      )}

      {toast && (
        <div role="status" className="fixed left-4 right-4 bottom-[calc(6.5rem+var(--root-safe-bottom))] z-40 mx-auto max-w-sm h-12 px-4 rounded-2xl bg-ink text-bg text-sm font-semibold flex items-center gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-fade-in lg:bottom-8">
          <Check className="size-[18px]" aria-hidden="true" /> {toast}
        </div>
      )}

      <AlreadyInEventCrewModal viewerCrewId={viewerCrewId} isOpen={isAlreadyOpen} onClose={() => setIsAlreadyOpen(false)} />
      <JoinTempCrewSheet
        crew={joining}
        onClose={() => setJoining(null)}
        onSent={(crew) => {
          setJoining(null);
          setToast(`Solicitud enviada a ${crew.name}`);
          void reload();
        }}
      />
      {eventRef && (
        <CreateTempCrewSheet
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          event={eventRef}
          onCreated={(crew) => {
            setIsCreateOpen(false);
            router.push(`/crews/${crew.id}`);
          }}
        />
      )}
    </div>
  );
}

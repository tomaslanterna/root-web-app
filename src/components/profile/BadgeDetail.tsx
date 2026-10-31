"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { attendanceDate, badgeStepValue } from "@/lib/badgeAppearance";
import type { EventBadge, BadgeLineup } from "@/types/badges";
import { BadgeMedal } from "./BadgeMedal";
import { EventReviewForm, type ReviewFormState } from "./EventReviewForm";
import { badgeLocation } from "@/lib/badgeLocation";
import { useEventCheckout } from "@/hooks/useReviewReminder";
import { parseEventRealDate } from "@/hooks/useDanceSync";

export function BadgeDetail({ badge, isOwner, heroRef, moving, closing, lineup, lineupLoading, lineupError, onRetry, onSaved, onFormState }: {
  badge: EventBadge; isOwner: boolean; heroRef: RefObject<HTMLDivElement | null>; moving: boolean; closing: boolean;
  lineup?: BadgeLineup; lineupLoading: boolean; lineupError: boolean; onRetry: () => void;
  onSaved: (badge: EventBadge) => void; onFormState: (state: ReviewFormState) => void;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const checkout = useEventCheckout(badge.eventId);
  const [eventStarted, setEventStarted] = useState(false);
  // Mientras el dueño puntúa, el arco y el chip siguen la nota antes de guardar.
  const [draftRating, setDraftRating] = useState<number | null | undefined>(undefined);
  useEffect(() => { queueMicrotask(() => setEventStarted(parseEventRealDate(badge.eventDate).getTime() <= Date.now())); }, [badge.eventDate]);
  const artists = lineup?.artists.filter(entry => entry.artist) || [];
  const names = artists.length ? [] : lineup?.names || [];
  const lineupCard: ReactNode = <section aria-labelledby="badge-lineup" className="rounded-card bg-surface border border-line p-4">
    <h3 id="badge-lineup" className="m-0 mb-1 text-[17px] font-semibold">Lineup</h3>
    {lineupLoading && <Loader2 aria-label="Cargando lineup" className="size-4 animate-spin text-ink-3" />}
    {lineupError ? <div role="alert" className="text-sm text-ink-2"><p className="m-0">No pudimos cargar el lineup.</p><button type="button" onClick={onRetry} className="mt-2 min-h-11 font-semibold text-accent">Reintentar</button></div> : !lineupLoading && !artists.length && !names.length ? <p className="m-0 py-2 text-sm text-ink-3">No hay información del lineup disponible.</p> : null}
    {artists.map(entry => <div key={entry.artistId} className="flex items-baseline justify-between gap-3 border-t border-line py-3">
      <span className="min-w-0 break-words text-[15px] font-semibold">{entry.artist!.name}</span>
      <span className={`label-mono shrink-0 ${entry.isHeadliner ? "text-accent" : "text-ink-3"}`}>{entry.isHeadliner ? "Headliner" : entry.artist!.artistType}</span>
    </div>)}
    {names.map((name, index) => <p key={`${index}:${name}`} className="m-0 break-words border-t border-line py-3 text-[15px] font-semibold">{name}</p>)}
  </section>;

  return <div className="mx-auto max-w-sm px-4 pb-8">
    <div className={`flex justify-center ${badge.mostDanced ? "pt-10" : "pt-7"}`}>
      <div ref={heroRef} style={{ visibility: moving ? "hidden" : "visible" }}>
        <BadgeMedal badge={badge} size="hero" isOwner={isOwner} ratingOverride={isOwner && badge.review == null ? draftRating : undefined} />
      </div>
    </div>

    <div className={`badge-detail-content ${closing ? "badge-detail-closing" : ""}`}>
      <div className="pt-5 px-2 flex flex-col items-center gap-1.5 text-center">
        <h3 className="font-display m-0 text-[26px]">{badge.title}</h3>
        <span className="break-words text-sm text-ink-2">{badgeLocation(badge)}</span>
        <span className="num-mono text-[13px] text-ink-3">{attendanceDate(badge.eventDate)}</span>
        {badge.mostDanced && <span className="mt-1 text-[13px] font-semibold text-accent">{badge.mostDancedPreview ? "La más bailada · ejemplo visual, sin pasos reales" : "Tu noche más bailada del año"}</span>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line">
        <div className="bg-surface p-3.5 flex flex-col gap-[3px]">
          <span className="num-mono text-xl font-semibold text-accent">{badgeStepValue(badge.steps)}</span>
          <span className="text-[13px] text-ink-2">pasos esa noche</span>
        </div>
        <div className="bg-surface p-3.5 flex flex-col gap-[3px]">
          <span className="text-[15px] font-semibold flex items-center gap-1.5">
            {badge.source !== "manual" && <Check className="size-4 text-info" strokeWidth={2.4} aria-hidden="true" />}
            Asistencia
          </span>
          <span className="text-[13px] text-ink-2">{badge.source === "manual" ? "asignada manualmente" : "confirmada por ubicación"}</span>
        </div>
      </div>
      {badge.source === "manual" && <p className="mt-3 mb-0 text-center text-[13px] text-ink-3">Insignia asignada manualmente · No acredita asistencia por ubicación.</p>}

      {isOwner && badge.source === "geofence" && !badge.departedAt && !checkout.data && eventStarted && <div className="mt-4 text-center">
        <button type="button" disabled={checkout.isLoading} onClick={() => void checkout.mutate().catch(() => undefined)} className="min-h-11 text-sm font-semibold text-accent">{checkout.isLoading ? "Confirmando..." : "Terminé mi noche"}</button>
        <p className="m-0 text-[13px] text-ink-3">Confirmá tu salida para recibir una invitación a reseñar en otra apertura.</p>
        {checkout.error && <p role="alert" className="m-0 mt-1 text-sm text-danger">No pudimos guardar tu salida.</p>}
      </div>}
      {checkout.data && <p role="status" className="mt-4 mb-0 text-center text-sm text-ink-2">Salida confirmada. La reseña es opcional.</p>}

      <div className="pt-8 flex flex-col gap-5">
        {isOwner
          ? <EventReviewForm badge={badge} onSaved={onSaved} onStateChange={onFormState} onRatingChange={setDraftRating} lineup={lineup} lineupLoading={lineupLoading} lineupError={lineupError} onRetry={onRetry} />
          : <>
            {lineupCard}
            <p className="m-0 text-center text-[13px] text-ink-3">Las puntuaciones y reseñas son personales y solo puede verlas su dueño.</p>
            {!authLoading && !user && <Link href={`/login?next=${encodeURIComponent(`/events/${badge.eventId}/survey`)}`} className="flex h-12 items-center justify-center rounded-control bg-accent px-4 text-[15px] font-semibold text-on-accent">Iniciá sesión para reseñar</Link>}
          </>}
      </div>
    </div>
  </div>;
}

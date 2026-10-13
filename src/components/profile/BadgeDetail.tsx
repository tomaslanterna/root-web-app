"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { attendanceDate } from "@/lib/badgeAppearance";
import type { EventBadge, BadgeLineup } from "@/types/badges";
import { EventBadgeArtwork } from "./EventBadgeArtwork";
import { EventReviewForm, type ReviewFormState } from "./EventReviewForm";
import { badgeLocation } from "@/lib/badgeLocation";
import { useEventCheckout } from "@/hooks/useReviewReminder";

export function BadgeDetail({ badge, isOwner, heroRef, moving, closing, lineup, lineupLoading, lineupError, onRetry, onSaved, onFormState }: {
  badge: EventBadge; isOwner: boolean; heroRef: RefObject<HTMLDivElement | null>; moving: boolean; closing: boolean;
  lineup?: BadgeLineup; lineupLoading: boolean; lineupError: boolean; onRetry: () => void;
  onSaved: (badge: EventBadge) => void; onFormState: (state: ReviewFormState) => void;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const checkout = useEventCheckout(badge.eventId);
  const [eventStarted,setEventStarted]=useState(false);
  useEffect(()=>{queueMicrotask(()=>setEventStarted(Date.parse(badge.eventDate)<=Date.now()));},[badge.eventDate]);
  const artists = lineup?.artists.filter(entry => entry.artist) || [];
  const names = artists.length ? [] : lineup?.names || [];
  const lineupCard: ReactNode = <section aria-label="Lineup" className="rounded-2xl bg-[#14171F] p-4">
    <h4 className="mb-2 text-sm font-bold">Lineup</h4>
    {lineupLoading && <Loader2 aria-label="Cargando lineup" className="h-4 w-4 animate-spin text-neutral-500" />}
    {lineupError ? <div role="alert" className="text-xs text-neutral-400"><p>No pudimos cargar el lineup.</p><button type="button" onClick={onRetry} className="mt-2 min-h-11 text-[#D4FF00]">Reintentar</button></div> : !lineupLoading && !artists.length && !names.length ? <p className="py-2 text-xs text-neutral-500">No hay información del lineup disponible.</p> : null}
    {artists.map(entry => <div key={entry.artistId} className="flex items-center gap-3 border-t border-white/5 py-3">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4FF00]" />
      <div className="min-w-0"><p className="break-words text-sm font-bold">{entry.artist!.name}</p><p className="mt-0.5 text-[11px] text-neutral-500">{entry.isHeadliner ? "Headliner" : entry.artist!.artistType}</p></div>
    </div>)}
    {names.map((name, index) => <p key={`${index}:${name}`} className="break-words border-t border-white/5 py-3 text-sm font-bold">{name}</p>)}
  </section>;
  return <div className="mx-auto max-w-sm space-y-5 pb-6">
    <div className={badge.mostDanced ? "pt-16" : undefined}>
      <div ref={heroRef} className={`mx-auto ${badge.mostDanced ? "w-[min(72vw,20rem)]" : "w-[min(86vw,23rem)]"}`} style={{ visibility: moving ? "hidden" : "visible" }}><EventBadgeArtwork badge={badge} celebrate={!moving} /></div>
    </div>
    <div className={`space-y-5 badge-detail-content ${closing ? "badge-detail-closing" : ""}`}>
      {badge.source === "manual" && <p className="text-center text-xs text-neutral-500">Insignia asignada manualmente · No acredita asistencia por ubicación.</p>}
      <div className="text-center"><h3 className="text-xl font-black italic leading-tight">{badge.title}</h3><p className="mt-2 break-words text-[11px] text-neutral-500">{badgeLocation(badge)}</p><p className="mt-1 text-[11px] text-neutral-500">{attendanceDate(badge.eventDate)}</p>{badge.mostDanced && <p className="mt-2 text-xs text-[#D4FF00]">{badge.mostDancedPreview ? "La más bailada · Ejemplo visual, sin pasos reales" : "Tu fiesta más bailada de ese año"}</p>}</div>
      {isOwner && badge.source === "geofence" && !badge.departedAt && !checkout.data && eventStarted && <div className="text-center"><button type="button" disabled={checkout.isLoading} onClick={() => void checkout.mutate().catch(() => undefined)} className="min-h-11 text-xs text-neutral-400 underline">{checkout.isLoading ? "Confirmando..." : "Terminé mi noche"}</button><p className="text-[10px] text-neutral-500">Confirmá tu salida para recibir una invitación a reseñar en otra apertura.</p>{checkout.error && <p role="alert" className="text-xs text-red-400">No pudimos guardar tu salida.</p>}</div>}
      {checkout.data && <p role="status" className="text-center text-xs text-neutral-400">Salida confirmada. La reseña es opcional.</p>}
      {isOwner ? <EventReviewForm badge={badge} onSaved={onSaved} onStateChange={onFormState} lineup={lineup} lineupLoading={lineupLoading} lineupError={lineupError} onRetry={onRetry} /> : <>{lineupCard}<p className="text-center text-xs text-neutral-500">Las puntuaciones y reseñas son personales y solo puede verlas su dueño.</p>{!authLoading && !user && <Link href={`/login?next=${encodeURIComponent(`/events/${badge.eventId}/survey`)}`} className="flex min-h-11 items-center justify-center rounded-full bg-[#D4FF00] px-4 text-sm font-bold text-black">Iniciá sesión con tu cuenta para reseñar</Link>}</>}
    </div>
  </div>;
}

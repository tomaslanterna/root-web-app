"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { useEventReview } from "@/hooks/useBadges";
import type { EventBadge, BadgeLineup } from "@/types/badges";
import { ArtistRatings } from "./ArtistRatings";

export interface ReviewFormState { dirty: boolean; saving: boolean }
export function EventReviewForm({ badge, onSaved, onStateChange, onRatingChange, children, lineup, lineupLoading, lineupError, onRetry }: { badge: EventBadge; onSaved?: (badge: EventBadge) => void; onStateChange?: (state: ReviewFormState) => void; onRatingChange?: (rating: number | null | undefined) => void; children?: ReactNode; lineup?: BadgeLineup; lineupLoading?: boolean; lineupError?: boolean; onRetry?: () => void }) {
  const [rating, setRating] = useState<number | null>(badge.review?.generalRating ?? 1);
  const [comment, setComment] = useState(badge.review?.comment ?? "");
  const [confirmedBadge, setConfirmedBadge] = useState<EventBadge | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitting = useRef(false);
  const [artistRatings, setArtistRatings] = useState<Record<string, number>>(() => Object.fromEntries((badge.review?.artistRatings || []).map(entry => [entry.artistId, entry.rating])));
  const review = useEventReview(badge.eventId);
  const baseline = confirmedBadge?.review ?? review.badge?.review ?? badge.review;
  const locked = baseline != null;
  const baselineRatings = Object.fromEntries((baseline?.artistRatings || []).map(entry => [entry.artistId, entry.rating]));
  const dirty = !locked && (rating !== 1 || comment !== "" || Object.keys(artistRatings).length > 0);
  useEffect(() => { onStateChange?.({ dirty, saving: review.isSaving }); }, [dirty, review.isSaving, onStateChange]);
  // La insignia solo refleja la nota cuando la persona empezó a puntuar.
  useEffect(() => { onRatingChange?.(dirty ? rating : undefined); }, [dirty, rating, onRatingChange]);
  const confirm = async () => {
    if (!confirmOpen || locked || rating === null || lineupLoading || lineupError || review.isSaving || submitting.current) return;
    submitting.current = true;
    try {
      const result = await review.save({ general_rating: rating, comment: comment.trim() || null,
        artist_ratings: (lineup?.artists || []).filter(entry => entry.artist).map(entry => ({ artist_id: entry.artistId, rating: artistRatings[entry.artistId] ?? 1 })) });
      setConfirmedBadge(result);
      setConfirmOpen(false);
      onStateChange?.({ dirty: false, saving: false });
      onSaved?.(result);
    } catch {
      setConfirmOpen(false);
      // A concurrent confirmation or a failed refresh must never overwrite a review.
      await review.load().catch(() => undefined);
    } finally { submitting.current = false; }
  };
  return <>
    <form className="flex flex-col gap-7" onSubmit={event => {
      event.preventDefault();
      if (!locked && rating !== null && !lineupLoading && !lineupError && !review.isSaving && !submitting.current) setConfirmOpen(true);
    }}>
      <fieldset className="m-0 p-0 border-0 flex flex-col gap-3" disabled={review.isSaving || confirmOpen}>
        <legend className="sr-only">Tu noche</legend>
        <div className="flex items-baseline justify-between gap-2"><h4 className="font-display m-0 text-xl">Tu noche</h4><span className="label-mono text-ink-3">{locked ? "Confirmada" : "Opcional"}</span></div>
        <div className="px-4 py-[18px] rounded-card bg-surface border border-line flex flex-col gap-2.5">
          <span className="text-[15px] font-semibold">Puntuación del evento</span>
          <StarRating value={locked ? baseline.generalRating : rating} onChange={setRating} readonly={locked} size={30} appearance="slider" label="Puntuación del evento" />
          {!locked && <span className="text-[13px] text-ink-2">Deslizá para puntuar. El arco de la insignia se llena con tu nota.</span>}
        </div>
      </fieldset>
      {children}
      {(lineup || lineupLoading || lineupError) && <fieldset disabled={review.isSaving || confirmOpen}><legend className="sr-only">Valoración de artistas</legend><ArtistRatings eventId={badge.eventId} lineup={lineup} ratings={locked ? baselineRatings : artistRatings} readonly={locked} onChange={(id, value) => setArtistRatings(current => ({ ...current, [id]: value }))} loading={lineupLoading} error={lineupError} onRetry={onRetry} /></fieldset>}
      <fieldset className="m-0 p-0 border-0 flex flex-col gap-2" disabled={review.isSaving || confirmOpen}>
        <legend className="sr-only">Tu reseña</legend>
        <label className="text-[17px] font-semibold" htmlFor="event-review-text">Tu reseña</label>
        <textarea id="event-review-text" maxLength={1000} value={locked ? baseline.comment ?? "" : comment} readOnly={locked} onChange={event => setComment(event.target.value)} rows={4} placeholder="¿Qué pasó esa noche? El momento, el tema, la gente..." className="w-full resize-none rounded-control border border-line-strong bg-surface p-3.5 text-base leading-normal text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent" />
        {!locked && <p className="num-mono m-0 self-end text-xs text-ink-3">{comment.length} / 1000</p>}
      </fieldset>
      {review.saveError && !locked && <p role="alert" className="m-0 text-sm text-danger">{review.saveError.response?.status === 401 ? "Tu sesión venció. Iniciá sesión nuevamente para guardar la reseña." : review.saveError.response?.status === 409 ? "Esta reseña ya fue confirmada. Volvé a abrirla para ver los datos guardados." : review.saveError.response?.status === 403 ? "Necesitás asistencia confirmada para guardar una reseña." : "No pudimos guardar tu valoración. Intentá nuevamente."}</p>}
      {locked ? <p role="status" className="m-0 flex items-start gap-2 text-sm text-ink-2"><CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden="true" /> Reseña confirmada. Las puntuaciones y el texto no se pueden cambiar.</p> : <div className="flex flex-col gap-2.5">
        <p className="m-0 flex gap-2 text-[13px] leading-snug text-ink-2"><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Al confirmar, la nota y la reseña quedan fijas. Solo vos podés verlas.</p>
        <Button type="submit" size="full" disabled={rating === null || lineupLoading || lineupError || review.isSaving || confirmOpen} className="h-[52px] text-base">{review.isSaving ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Guardando...</> : "Guardar valoración"}</Button>
      </div>}
    </form>
    <ConfirmModal isOpen={confirmOpen} title="¿Confirmar tu reseña?" message="Se guardarán tu puntuación del evento, las notas de los DJs y tu reseña. Una vez confirmados, no podrás cambiarlos. ¿Deseás continuar?" confirmText="Confirmar y guardar" cancelText="Cancelar" isLoading={review.isSaving} onClose={() => { if (!submitting.current) setConfirmOpen(false); }} onConfirm={confirm} />
  </>;
}

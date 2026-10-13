"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { useEventReview } from "@/hooks/useBadges";
import type { EventBadge, BadgeLineup } from "@/types/badges";
import { ArtistRatings } from "./ArtistRatings";

export interface ReviewFormState { dirty: boolean; saving: boolean }
export function EventReviewForm({ badge, onSaved, onStateChange, children, lineup, lineupLoading, lineupError, onRetry }: { badge: EventBadge; onSaved?: (badge: EventBadge) => void; onStateChange?: (state: ReviewFormState) => void; children?: ReactNode; lineup?: BadgeLineup; lineupLoading?: boolean; lineupError?: boolean; onRetry?: () => void }) {
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
    <form className="space-y-5" onSubmit={event => {
      event.preventDefault();
      if (!locked && rating !== null && !lineupLoading && !lineupError && !review.isSaving && !submitting.current) setConfirmOpen(true);
    }}>
      <fieldset className="rounded-2xl bg-[#14171F] p-4" disabled={review.isSaving || confirmOpen}>
        <legend className="sr-only">Tu noche</legend>
        <div className="mb-3 flex items-center justify-between gap-2"><h4 className="text-sm font-bold">Tu noche</h4><span className="text-[10px] text-neutral-500">{locked ? "Puntuación confirmada" : "Deslizá para puntuar"}</span></div>
        <StarRating value={locked ? baseline.generalRating : rating} onChange={setRating} readonly={locked} size={30} appearance="slider" label="Puntuación del evento" />
      </fieldset>
      {children}
      {(lineup || lineupLoading || lineupError) && <fieldset disabled={review.isSaving || confirmOpen}><legend className="sr-only">Valoración de artistas</legend><ArtistRatings eventId={badge.eventId} lineup={lineup} ratings={locked ? baselineRatings : artistRatings} readonly={locked} onChange={(id, value) => setArtistRatings(current => ({ ...current, [id]: value }))} loading={lineupLoading} error={lineupError} onRetry={onRetry} /></fieldset>}
      <fieldset className="rounded-2xl bg-[#14171F] p-4" disabled={review.isSaving || confirmOpen}>
        <legend className="sr-only">Tu reseña</legend>
        <label className="mb-3 block text-sm font-bold" htmlFor="event-review-text">Tu reseña</label>
        <textarea id="event-review-text" maxLength={1000} value={locked ? baseline.comment ?? "" : comment} readOnly={locked} onChange={event => setComment(event.target.value)} rows={4} placeholder="¿Qué pasó esa noche? El momento, el tema, la gente..." className="w-full resize-y rounded-xl border border-white/5 bg-black/25 p-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#D4FF00]/60" />
        {!locked && <p className="mt-1 text-right text-[10px] text-neutral-500">{comment.length}/1000</p>}
      </fieldset>
      {review.saveError && !locked && <p role="alert" className="text-sm text-red-400">{review.saveError.response?.status === 401 ? "Tu sesión venció. Iniciá sesión nuevamente para guardar la reseña." : review.saveError.response?.status === 409 ? "Esta reseña ya fue confirmada. Volvé a abrirla para ver los datos guardados." : review.saveError.response?.status === 403 ? "Necesitás asistencia confirmada para guardar una reseña." : "No pudimos guardar tu valoración. Intentá nuevamente."}</p>}
      {locked ? <p role="status" className="flex items-start gap-2 text-sm text-neutral-400"><CheckCircle2 size={18} className="shrink-0 text-[#D4FF00]" /> Reseña confirmada. Las puntuaciones y el texto no se pueden cambiar.</p> : <Button type="submit" disabled={rating === null || lineupLoading || lineupError || review.isSaving || confirmOpen} className="w-full rounded-full font-bold">{review.isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar valoración"}</Button>}
    </form>
    <ConfirmModal isOpen={confirmOpen} title="¿Confirmar tu reseña?" message="Se guardarán tu puntuación del evento, las notas de los DJs y tu reseña. Una vez confirmados, no podrás cambiarlos. ¿Deseás continuar?" confirmText="Confirmar y guardar" cancelText="Cancelar" isLoading={review.isSaving} onClose={() => { if (!submitting.current) setConfirmOpen(false); }} onConfirm={confirm} />
  </>;
}

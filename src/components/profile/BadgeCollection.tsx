"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Award, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { useBadgeCollection, useBadgeLineup } from "@/hooks/useBadges";
import { useBadgeTransition } from "@/hooks/useBadgeTransition";
import { badgeRingLabel } from "@/lib/badgeAppearance";
import { badgePreview } from "@/lib/badgePreview";
import { useBadgeShare } from "@/hooks/useBadgeShare";
import { BadgeShareDialog } from "./BadgeShareDialog";
import { EventBadgeArtwork } from "./EventBadgeArtwork";
import type { ReviewFormState } from "./EventReviewForm";
import { BadgeDetail } from "./BadgeDetail";
import { BadgeDesignGuide } from "./BadgeDesignGuide";

export function BadgeCollection({ username, isOwner }: { username: string; isOwner: boolean }) {
  const collection = useBadgeCollection(username);
  const [formState, setFormState] = useState<ReviewFormState>({ dirty: false, saving: false });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  function canClose() {
    if (formState.saving) return false;
    if (formState.dirty) { setConfirmDiscard(true); return false; }
    return true;
  }
  const { eventId, phase, open, close, heroRef, movingRef, moving } = useBadgeTransition(canClose);
  const requestClose = () => { if (canClose()) close(); };
  // Also mask a previously loaded owner page immediately on logout/account change.
  const visibleBadges = badgePreview(username, (collection.page?.data || []).map(badge => isOwner ? badge : { ...badge, review: null }));
  const selected = visibleBadges.find(badge => badge.eventId === eventId);
  const share = useBadgeShare(selected);
  const lineup = useBadgeLineup(eventId, isOwner, username);
  const reportFormState = useCallback((next: ReviewFormState) => setFormState(current => current.dirty === next.dirty && current.saving === next.saving ? current : next), []);
  useEffect(() => {
    if (!selected || !formState.dirty) return;
    const preventLoss = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [selected, formState.dirty]);
  return (
    <section className="mx-auto max-w-xl space-y-9" aria-label="Colección de insignias">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="tech-label text-[10px] text-[#D4FF00]">Archivo personal</p><h2 className="mt-2 text-[1.7rem] font-semibold tracking-[-.045em]">Tus noches</h2><p className="mt-1.5 text-sm font-normal leading-relaxed text-neutral-500">Cada insignia guarda un lugar, una fecha y una historia.</p></div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 flex items-center gap-1.5 text-neutral-400">
          <span className="num-display text-xs text-white">{collection.page?.meta.total ?? "…"}</span>
          <span className="tech-label text-[9px] text-neutral-400">insignias</span>
        </span>
      </div>
      {visibleBadges.some(badge => badge.stepsPreview) && <p className="text-xs leading-relaxed text-neutral-500">Vista de prueba: los pasos de estas siete insignias son ficticios. No se guardan como actividad real.</p>}
      {collection.error && <div role="alert" className="rounded-2xl border border-white/10 p-5 text-center text-sm text-neutral-400"><p>No pudimos cargar las insignias.</p><Button variant="outline" className="mt-3" onClick={() => void collection.load().catch(() => undefined)}>Reintentar</Button></div>}
      {collection.isLoading && !collection.page && <Loader2 aria-label="Cargando insignias" className="mx-auto h-6 w-6 animate-spin text-[#D4FF00]" />}
      {collection.page?.data.length === 0 && !collection.error && <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#D4FF00]/5 to-transparent px-6 py-12 text-center"><Award className="mx-auto mb-5 h-12 w-12 text-[#D4FF00]" /><h3 className="font-bold">¡Tu colección empieza con tu próxima fiesta! 🎉</h3><p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">Cada presencia confirmada se transforma en una insignia para guardar esa noche. No hace falta dejar una reseña para obtenerla.</p></div>}
      {!!visibleBadges.length && <div className="grid grid-cols-3 gap-x-2.5 gap-y-7 sm:gap-x-4 sm:gap-y-8">
          {visibleBadges.map(badge => <button key={badge.eventId} type="button" onClick={event => {
            setFormState({ dirty: false, saving: false });
            open(badge.eventId, event.currentTarget.firstElementChild as HTMLElement);
          }} aria-label={`Ver insignia: ${badgeRingLabel(badge)}${badge.mostDanced ? ", la más bailada" : ""}`} disabled={phase !== "closed"} className="group min-w-0 self-start rounded-[2rem] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF00] motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-[1.035] motion-safe:active:scale-[1.02]" style={{ opacity: badge.eventId === eventId ? 0 : 1 }}>
            <EventBadgeArtwork badge={badge} compact />
          </button>)}
        </div>}
      {collection.page?.meta.hasMore && <Button variant="outline" className="mx-auto flex rounded-full" disabled={collection.isLoading} onClick={() => void collection.load(collection.page?.data.length).catch(() => undefined)}>{collection.isLoading ? "Cargando..." : "Cargar más insignias"}</Button>}
      {!!visibleBadges.length && <BadgeDesignGuide example={visibleBadges[0]} />}
      <Modal isOpen={!!selected} onClose={requestClose} title="Tu insignia" presentation="screen" header={<div className="badge-detail-header grid grid-cols-[44px_1fr_44px] items-center px-3 py-2">
        <button type="button" aria-label="Volver a la colección" disabled={formState.saving || phase !== "open"} onClick={requestClose} className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]"><ArrowLeft size={18} /></button>
        <h2 className="text-center text-[11px] font-medium uppercase tracking-[.18em] text-neutral-400">Tu insignia</h2>
        <button type="button" aria-label="Compartir insignia" disabled={phase !== "open" || share.isPreparing} onClick={share.prepare} className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[#D4FF00]">{share.isPreparing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}</button>
      </div>}>
        {selected && <BadgeDetail key={selected.eventId} badge={selected} isOwner={isOwner} heroRef={heroRef} moving={moving} closing={phase === "closing"} lineup={lineup.data} lineupLoading={lineup.isLoading} lineupError={!!lineup.error} onRetry={() => void lineup.load().catch(() => undefined)} onSaved={badge => { collection.update(badge); setFormState({ dirty: false, saving: false }); close(); }} onFormState={reportFormState} />}
      </Modal>
      <BadgeShareDialog share={share} />
      {selected && moving && <div ref={movingRef} aria-hidden="true" className="pointer-events-none fixed z-[90]" style={{ visibility: "hidden" }}><EventBadgeArtwork badge={selected} /></div>}
      <ConfirmModal isOpen={confirmDiscard} title="Cambios sin guardar" message="Tu puntuación o reseña todavía no se guardó. ¿Querés volver y descartar los cambios?" confirmText="Descartar y volver" cancelText="Seguir editando" onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); close(); }} />
    </section>
  );
}

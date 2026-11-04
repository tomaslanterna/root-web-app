"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { useBadgeCollection, useBadgeLineup } from "@/hooks/useBadges";
import { useBadgeTransition } from "@/hooks/useBadgeTransition";
import { badgeRingDate, badgeRingLabel, groupBadges } from "@/lib/badgeAppearance";
import { badgePreview } from "@/lib/badgePreview";
import { useBadgeShare } from "@/hooks/useBadgeShare";
import { BadgeShareDialog } from "./BadgeShareDialog";
import { BadgeArc, BadgeCrown, BadgeMedal } from "./BadgeMedal";
import type { ReviewFormState } from "./EventReviewForm";
import { BadgeDetail } from "./BadgeDetail";

// "25.10.2026" → "25.10.26", como en el archivo de noches.
const shortDate = (value: string) => badgeRingDate(value).replace(/\.\d{2}(\d{2})$/, ".$1");

const headerButton =
  "size-11 rounded-control bg-surface border border-line text-ink flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";

export function BadgeCollection({ username, isOwner, initialBadgeId = null }: { username: string; isOwner: boolean; initialBadgeId?: string | null }) {
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

  const groups = groupBadges(visibleBadges);
  const openBadge = (id: string, element: HTMLElement) => {
    setFormState({ dirty: false, saving: false });
    open(id, element);
  };

  // Llegada desde un recordatorio o un link de reseña: abre esa insignia una sola vez.
  const openedInitial = useRef(false);
  const initialBadgeLoaded = !!initialBadgeId && visibleBadges.some(badge => badge.eventId === initialBadgeId);
  useEffect(() => {
    if (openedInitial.current || !initialBadgeLoaded || phase !== "closed") return;
    const tile = document.querySelector<HTMLElement>(`[data-badge-id="${CSS.escape(initialBadgeId!)}"]`);
    if (!tile) return;
    openedInitial.current = true;
    tile.scrollIntoView({ block: "center" });
    open(initialBadgeId!, (tile.firstElementChild as HTMLElement) ?? tile);
  }, [initialBadgeLoaded, initialBadgeId, phase, open]);

  return (
    <section className="mx-auto max-w-xl" aria-label="Insignias">
      {visibleBadges.some(badge => badge.stepsPreview) && (
        <p className="m-0 mb-4 text-[13px] leading-relaxed text-ink-3">Vista de prueba: los pasos de estas insignias son ficticios. No se guardan como actividad real.</p>
      )}
      {collection.error && (
        <div role="alert" className="rounded-card border border-line bg-surface p-5 text-center text-[15px] text-ink-2">
          <p className="m-0">No pudimos cargar las insignias.</p>
          <Button variant="secondary" className="mt-3" onClick={() => void collection.load().catch(() => undefined)}>Reintentar</Button>
        </div>
      )}
      {collection.isLoading && !collection.page && <Loader2 aria-label="Cargando insignias" className="mx-auto my-8 size-6 animate-spin text-accent" />}
      {collection.page?.data.length === 0 && !collection.error && (
        <div className="rounded-card border border-line bg-surface px-6 py-10 text-center">
          <h3 className="m-0 text-base font-semibold">Tu colección empieza con tu próxima fiesta</h3>
          <p className="mx-auto mt-2 mb-0 max-w-sm text-sm leading-relaxed text-ink-2">Cada presencia confirmada se transforma en una insignia para guardar esa noche. No hace falta dejar una reseña para obtenerla.</p>
        </div>
      )}

      {groups.map((group, index) => (
        <section key={group.key} aria-label={group.label.replace(" de ", " ")} className={index === 0 ? undefined : "pt-7"}>
          <h3 className="m-0 mb-4 flex items-baseline justify-between">
            <span className="font-display text-lg">{group.label.replace(" de ", " ")}</span>
            <span className="label-mono text-ink-3">{group.badges.length} {group.badges.length === 1 ? "noche" : "noches"}</span>
          </h3>
          <div className="grid grid-cols-3 gap-x-2 gap-y-6">
            {group.badges.map(badge => (
              <button
                key={badge.eventId}
                type="button"
                data-badge-id={badge.eventId}
                onClick={event => openBadge(badge.eventId, event.currentTarget.firstElementChild as HTMLElement)}
                aria-label={`Ver insignia: ${badgeRingLabel(badge)}${isOwner && badge.review == null ? ", sin reseñar" : ""}${badge.mostDanced ? ", la más bailada" : ""}`}
                disabled={phase !== "closed"}
                className="min-w-0 flex flex-col items-center gap-2 rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                style={{ opacity: badge.eventId === eventId ? 0 : 1 }}
              >
                <BadgeMedal badge={badge} isOwner={isOwner} />
                <span className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-[13px] font-semibold leading-tight line-clamp-2">{badge.title}</span>
                  <span className="num-mono text-xs text-ink-3">{shortDate(badge.eventDate)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {collection.page?.meta.hasMore && (
        <Button
          variant="outline"
          size="full"
          className="mt-6"
          disabled={collection.isLoading}
          onClick={() => void collection.load(collection.page?.data.length).catch(() => undefined)}
        >
          {collection.isLoading ? "Cargando..." : "Cargar más insignias"}
        </Button>
      )}

      {!!visibleBadges.length && (
        <section aria-labelledby="badges-legend" className="mt-7 p-4 rounded-card bg-surface border border-line flex flex-col gap-3.5">
          <h3 id="badges-legend" className="m-0 text-base font-semibold">Cómo leer tus insignias</h3>
          <div className="flex items-center gap-3">
            <BadgeArc percent={80} strokeWidth={9} className="size-10 shrink-0" />
            <p className="m-0 text-sm leading-snug text-ink-2"><strong className="font-semibold text-ink">Arco y nota:</strong> se completa según tu puntuación de la noche.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="num-mono w-10 shrink-0 py-[3px] rounded-full bg-accent text-on-accent text-[10px] font-semibold text-center">RESEÑAR</span>
            <p className="m-0 text-sm leading-snug text-ink-2"><strong className="font-semibold text-ink">Sin reseñar:</strong> flyer atenuado y arco vacío. La reseña es opcional.</p>
          </div>
          <div className="flex items-center gap-3">
            <BadgeCrown className="w-10 shrink-0" />
            <p className="m-0 text-sm leading-snug text-ink-2"><strong className="font-semibold text-ink">La más bailada:</strong> la corona marca tu noche con más pasos del año.</p>
          </div>
        </section>
      )}

      <Modal isOpen={!!selected} onClose={requestClose} title="Tu insignia" presentation="screen" header={
        <div className="badge-detail-header grid grid-cols-[44px_1fr_44px] items-center px-4 py-2">
          <button type="button" aria-label="Volver a la colección" disabled={formState.saving || phase !== "open"} onClick={requestClose} className={headerButton}>
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h2 className="label-mono m-0 text-center text-ink-2">Tu insignia</h2>
          <button type="button" aria-label="Compartir insignia" disabled={phase !== "open" || share.isPreparing} onClick={share.prepare} className={headerButton}>
            {share.isPreparing ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Share className="size-5" aria-hidden="true" />}
          </button>
        </div>
      }>
        {selected && <BadgeDetail key={selected.eventId} badge={selected} isOwner={isOwner} heroRef={heroRef} moving={moving} closing={phase === "closing"} lineup={lineup.data} lineupLoading={lineup.isLoading} lineupError={!!lineup.error} onRetry={() => void lineup.load().catch(() => undefined)} onSaved={badge => { collection.update(badge); setFormState({ dirty: false, saving: false }); close(); }} onFormState={reportFormState} />}
      </Modal>
      <BadgeShareDialog share={share} />
      {selected && moving && <div ref={movingRef} aria-hidden="true" className="pointer-events-none fixed z-[90]" style={{ visibility: "hidden" }}><BadgeMedal badge={selected} size="hero" isOwner={isOwner} /></div>}
      <ConfirmModal isOpen={confirmDiscard} title="Cambios sin guardar" message="Tu puntuación o reseña todavía no se guardó. ¿Querés volver y descartar los cambios?" confirmText="Descartar y volver" cancelText="Seguir editando" onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); close(); }} />
    </section>
  );
}

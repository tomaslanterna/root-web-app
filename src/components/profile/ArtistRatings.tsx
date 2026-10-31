"use client";

import Image from "next/image";
import { useState } from "react";
import type { BadgeLineup } from "@/types/badges";
import { badgeArtistImageUrl } from "@/services/badges";
import { StarRating } from "@/components/ui/StarRating";

export function ArtistRatings({ eventId, lineup, ratings, onChange, loading, error, onRetry, readonly = false }: {
  eventId: string; lineup?: BadgeLineup; ratings: Record<string, number>; onChange: (id: string, rating: number) => void;
  loading?: boolean; error?: boolean; onRetry?: () => void;
  readonly?: boolean;
}) {
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const artists = lineup?.artists.filter(entry => entry.artist) || [];
  return <section className="flex flex-col gap-3" aria-label="Valoraciones del lineup">
    <div className="flex flex-col gap-1"><h4 className="m-0 text-[17px] font-semibold">Valoración de artistas</h4><p className="m-0 text-[13px] text-ink-2">{readonly ? "Tus puntuaciones confirmadas." : "Las notas empiezan en 1. Ajustalas antes de confirmar tu reseña."}</p></div>
    {artists.some(entry => entry.artist?.isExample) && <p className="m-0 text-[13px] text-ink-2">DJ 1, DJ 2 y DJ 3 son ejemplos para probar tu reseña. No son el lineup oficial.</p>}
    {loading && <p role="status" className="m-0 py-3 text-sm text-ink-2">Cargando artistas...</p>}
    {error && <p role="alert" className="m-0 py-3 text-sm text-ink-2">No pudimos cargar el lineup. <button type="button" onClick={onRetry} className="min-h-11 font-semibold text-accent">Reintentar</button></p>}
    {artists.length > 0 && <div className="rounded-card bg-surface border border-line divide-y divide-white/[0.06]">{artists.map(entry => <div key={entry.artistId} className="px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {entry.artist!.avatarUrl && !failedPhotos.includes(entry.artistId) ? <Image src={badgeArtistImageUrl(eventId, entry.artistId)} alt="" width={36} height={36} unoptimized onError={() => setFailedPhotos(current => [...current, entry.artistId])} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs text-ink-2">{entry.artist!.name[0]}</span>}
        <div className="min-w-0 flex-1"><p className="m-0 break-words text-[15px] font-semibold">{entry.artist!.name}</p><p className={`label-mono m-0 ${entry.isHeadliner ? "text-accent" : "text-ink-3"}`}>{entry.isHeadliner ? "Headliner" : entry.artist!.artistType}</p></div>
        <span className="shrink-0 text-sm text-ink-2">{readonly && ratings[entry.artistId] == null ? "Sin puntuar" : <span className="num-mono font-semibold text-ink">{ratings[entry.artistId] ?? 1}<span className="text-ink-3">/5</span></span>}</span>
      </div>
      <StarRating value={ratings[entry.artistId] ?? (readonly ? null : 1)} onChange={value => onChange(entry.artistId, value)} readonly={readonly} appearance="slider" size={20} label={`Puntuación de ${entry.artist!.name}`} className="mt-3" />
    </div>)}</div>}
    {!loading && !error && !artists.length && <p className="m-0 py-3 text-sm text-ink-3">{lineup?.names.length ? "Hay nombres anunciados, pero todavía no hay artistas registrados para puntuarlos." : "No hay información del lineup disponible."}</p>}
    {!artists.length && lineup?.names.map((name, index) => <p key={`${index}:${name}`} className="m-0 border-t border-line py-3 text-[15px]">{name}</p>)}
  </section>;
}

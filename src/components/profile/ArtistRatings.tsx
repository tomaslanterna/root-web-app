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
  return <section className="rounded-2xl bg-[#14171F] p-4" aria-label="Valoraciones del lineup">
    <h4 className="text-sm font-bold">Lineup</h4><p className="mt-1 text-[11px] text-neutral-500">{readonly ? "Tus puntuaciones confirmadas." : "Las notas empiezan en 1. Ajustalas antes de confirmar tu reseña."}</p>
    {artists.some(entry => entry.artist?.isExample) && <p className="mt-2 text-xs text-neutral-400">DJ 1, DJ 2 y DJ 3 son ejemplos para probar tu reseña. No son el lineup oficial.</p>}
    {loading && <p role="status" className="py-3 text-xs text-neutral-400">Cargando artistas...</p>}
    {error && <p role="alert" className="py-3 text-xs text-neutral-400">No pudimos cargar el lineup. <button type="button" onClick={onRetry} className="min-h-11 text-[#D4FF00]">Reintentar</button></p>}
    {artists.map(entry => <div key={entry.artistId} className="mt-3 border-t border-white/5 pt-3">
      <div className="flex min-w-0 items-center gap-3">
        {entry.artist!.avatarUrl && !failedPhotos.includes(entry.artistId) ? <Image src={badgeArtistImageUrl(eventId, entry.artistId)} alt="" width={36} height={36} unoptimized onError={() => setFailedPhotos(current => [...current, entry.artistId])} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs text-neutral-500">{entry.artist!.name[0]}</span>}
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{entry.artist!.name}</p><p className="text-[10px] text-neutral-500">{entry.isHeadliner ? "Headliner" : entry.artist!.artistType}</p></div>
        <span className="shrink-0 text-xs text-neutral-400">{readonly && ratings[entry.artistId] == null ? "Sin puntuar" : <span className="tech-mono font-bold text-white">{ratings[entry.artistId] ?? 1}<span className="text-neutral-500">/5</span></span>}</span>
      </div>
      <StarRating value={ratings[entry.artistId] ?? (readonly ? null : 1)} onChange={value => onChange(entry.artistId, value)} readonly={readonly} appearance="slider" size={20} label={`Puntuación de ${entry.artist!.name}`} className="mt-3" />
    </div>)}
    {!loading && !error && !artists.length && <p className="py-3 text-xs text-neutral-500">{lineup?.names.length ? "Hay nombres anunciados, pero todavía no hay artistas registrados para puntuarlos." : "No hay información del lineup disponible."}</p>}
    {!artists.length && lineup?.names.map((name, index) => <p key={`${index}:${name}`} className="border-t border-white/5 py-3 text-sm">{name}</p>)}
  </section>;
}

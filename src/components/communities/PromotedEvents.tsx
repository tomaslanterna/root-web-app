"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Flame,
  Loader2,
  MapPin,
  Music,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CommunityManageEventsModal } from "./CommunityManageEventsModal";
import { useCommunityPromotedEvents } from "@/hooks/useCommunities";
import type { Event } from "@/types/events";

interface PromotedEventsProps {
  communityId: string;
  isRRPP: boolean;
  isMember: boolean;
}

export function PromotedEvents({
  communityId,
  isRRPP,
  isMember,
}: PromotedEventsProps) {
  const {
    promotedEvents,
    catalog,
    isLoading,
    isSaving,
    error,
    loadEvents,
    updatePromoted,
  } = useCommunityPromotedEvents(communityId);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleSaveEvents = async (selectedIds: string[]) => {
    await updatePromoted(selectedIds);
  };

  const handleRemoveSingle = async (eventId: string) => {
    const nextIds = promotedEvents
      .filter((e) => e.id !== eventId)
      .map((e) => e.id);
    await updatePromoted(nextIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="flex items-center gap-2 tech-label text-xs text-neutral-300">
            <CalendarDays className="h-4 w-4 text-[#D4FF00]" /> Eventos Promocionados
          </h2>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Fechas oficiales y festivales impulsados por el equipo de RRPP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00]/10 px-2.5 py-1">
            <span className="num-display text-xs text-white">{promotedEvents.length}</span>
            <span className="tech-label text-[9px] text-[#D4FF00]">{promotedEvents.length === 1 ? "evento" : "eventos"}</span>
          </span>

          {isRRPP && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManageModalOpen(true)}
              className="gap-1.5 border-[#D4FF00]/30 hover:bg-[#D4FF00]/10 hover:text-[#D4FF00]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Gestionar Eventos</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Grid or Empty */}
      {isLoading && promotedEvents.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#D4FF00]" />
        </div>
      ) : promotedEvents.length === 0 ? (
        <div className="rounded-3xl border-0 bg-[#111114] p-12 text-center shadow-xl">
          <Music className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Sin eventos promocionados
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-400">
            {isRRPP
              ? "Aún no asociaste ningún evento a la comunidad. Hace click en 'Gestionar Eventos' para seleccionar las fechas destacadas."
              : "El RRPP aún no asoció eventos a esta comunidad. Próximamente se anunciarán nuevas fechas."}
          </p>
          {isRRPP && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsManageModalOpen(true)}
              className="mt-5"
            >
              <Plus className="h-4 w-4" /> Seleccionar eventos ahora
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
          {promotedEvents.map((event) => {
            const eventDate = new Date(event.date);
            const isValidDate = !Number.isNaN(eventDate.getTime());
            const formattedDay = isValidDate ? eventDate.getDate() : "--";
            const formattedMonth = isValidDate
              ? eventDate
                  .toLocaleDateString("es-AR", { month: "short" })
                  .toUpperCase()
                  .replace(".", "")
              : "";

            return (
              <div
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-[#111114] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] hover:bg-[#16171D] transition-all duration-300 hover:shadow-2xl"
              >
                {/* Banner with date badge */}
                <div className="relative h-36 w-full overflow-hidden bg-neutral-900 sm:h-48">
                  {event.cinematicBannerUrl ? (
                    <Image
                      src={event.cinematicBannerUrl}
                      alt={event.title}
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-600">
                      <Music className="h-10 w-10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/20 to-transparent" />

                  {/* Date badge */}
                  <div className="absolute left-3 top-3 sm:left-4 sm:top-4 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-0 bg-black/75 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-md backdrop-blur-md">
                    <span className="num-display text-sm sm:text-base leading-none text-[#D4FF00]">
                      {formattedDay}
                    </span>
                    <span className="tech-label text-[8px] sm:text-[9px] text-white">
                      {formattedMonth}
                    </span>
                  </div>

                  {/* Genre pill */}
                  {event.genre && (
                    <span className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full border-0 bg-black/75 px-2.5 py-0.5 tech-label text-[8px] sm:text-[9px] text-neutral-200 backdrop-blur-md shadow-sm">
                      {event.genre}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5">
                  <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-black uppercase leading-tight tracking-tight text-white group-hover:text-[#D4FF00] transition-colors">
                      {event.title}
                    </h3>

                    <p className="flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-400">
                      <MapPin className="h-3 w-3 shrink-0 text-[#D4FF00]" />
                      <span className="truncate">{event.location}</span>
                    </p>

                    {event.lineup && event.lineup.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {event.lineup.slice(0, 3).map((artist, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-neutral-300"
                          >
                            {artist}
                          </span>
                        ))}
                        {event.lineup.length > 3 && (
                          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-neutral-500">
                            +{event.lineup.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Price & Link button */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                    <div>
                      {event.isFree ? (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-emerald-400">
                          Gratis
                        </span>
                      ) : event.price ? (
                        <div className="text-[11px] sm:text-xs flex items-baseline gap-1">
                          <span className="tech-label text-[9px] text-neutral-500">Desde</span>
                          <span className="num-display text-sm text-white">
                            ${event.price.toLocaleString("es-AR")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-400">
                          Tickets
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isRRPP && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveSingle(event.id)}
                          aria-label="Quitar evento de la comunidad"
                          className="rounded-xl border-0 bg-white/5 p-2 text-neutral-400 shadow-sm transition-colors hover:bg-red-500/15 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <Link href={`/events/${event.id}`}>
                        <Button variant="primary" size="sm" className="h-9 px-3 gap-1 text-xs">
                          <span>Ver Evento</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RRPP Modal to Manage Events */}
      {isRRPP && (
        <CommunityManageEventsModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          catalog={catalog}
          selectedEventIds={promotedEvents.map((e) => e.id)}
          onSave={handleSaveEvents}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

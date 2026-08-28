"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Disc3,
  Flame,
  Loader2,
  MapPin,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { FollowedAttendeesModal } from "@/components/events/FollowedAttendeesModal";
import { CommentSection } from "@/components/ui/CommentSection";
import { EventAttendanceVote } from "@/components/ui/EventAttendanceVote";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import { api } from "@/lib/api";
import type { Event, RSVPResponse } from "@/types/events";

const fallbackBanner =
  "https://images.unsplash.com/photo-1514525253344-93168e974686?q=80&w=1200&auto=format&fit=crop";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);

  const {
    mutate: fetchEvent,
    isLoading: isLoadingEvent,
  } = useMutation<Event, string>(
    async (id) => {
      const response = await api.get<Event>(`/v1/events/${id}`);
      return response.data;
    },
    {
      onSuccess: (response) => {
        setEvent(response);
        setHasLoaded(true);
      },
      onError: () => setHasLoaded(true),
    },
  );

  useEffect(() => {
    void fetchEvent(eventId).catch(() => undefined);
  }, [eventId, fetchEvent]);

  if (!hasLoaded && isLoadingEvent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0B0D10] p-6 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4FF00]" />
        <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Cargando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B0D10] p-6 text-center text-white">
        <p className="text-sm font-bold uppercase text-neutral-300">No pudimos encontrar el evento</p>
        <p className="max-w-xs text-xs text-neutral-500">
          Puede que ya no esté disponible o que haya ocurrido un error al cargarlo.
        </p>
        <div className="flex gap-2">
          <Link
            href="/events"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
          >
            Volver
          </Link>
          <Button size="sm" onClick={() => void fetchEvent(eventId)}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = Number.isNaN(eventDate.getTime())
    ? event.date
    : new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(eventDate);
  const priceLabel =
    event.price == null
      ? "Precio no informado"
      : event.price === 0
        ? "Entrada gratuita"
        : `$${event.price.toLocaleString("es-AR")}`;
  const banner = event.cinematicBannerUrl?.trim() || fallbackBanner;

  const updateAttendance = (response: RSVPResponse) => {
    setEvent((current) =>
      current
        ? {
            ...current,
            goingCount: response.goingCount,
            notGoingCount: response.notGoingCount,
            userRsvp: response.userRsvp,
          }
        : current,
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] pb-28 text-white">
      <header className="glass-header-obsidian sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <Link
          href="/events"
          className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-2 text-xs font-bold uppercase text-white transition-all hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" /> Eventos
        </Link>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00]">
          Cartelera oficial
        </span>
      </header>

      <main className="space-y-6 p-4">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 shadow-2xl">
          <div
            role="img"
            aria-label={`Imagen de ${event.title}`}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/25 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#D4FF00] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-950">
                {priceLabel}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-200 backdrop-blur-md">
                {event.genre?.trim() || "Sin especificar"}
              </span>
            </div>
            <p className="flex items-center gap-1 text-xs font-bold text-neutral-300">
              <MapPin className="h-3.5 w-3.5 text-[#D4FF00]" /> {event.location}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-bold capitalize text-[#D4FF00]">{formattedDate}</p>
            <h1 className="text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
              {event.title}
            </h1>
          </div>

          <EventAttendanceVote
            eventId={event.id}
            initialGoing={event.goingCount}
            initialNotGoing={event.notGoingCount}
            initialStatus={event.userRsvp}
            onChange={updateAttendance}
          />

          <button
            type="button"
            onClick={() => setIsAttendeesOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#14171F] p-3.5 text-left transition-colors hover:border-[#D4FF00]/40"
          >
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
              <UserCheck className="h-4 w-4 text-[#D4FF00]" /> Personas que seguís y van
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4FF00]">Ver →</span>
          </button>

          <Link
            href="/match"
            className="flex items-center justify-between rounded-2xl border border-[#D4FF00]/30 bg-gradient-to-r from-[#14171F] to-[#1E2330] p-3.5 shadow-md transition-all hover:border-[#D4FF00]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4FF00] text-neutral-950">
                <Flame className="h-4 w-4 fill-neutral-950" />
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-wider">Encontrá tu crew</span>
                <span className="block text-[10px] text-neutral-400">Grupos de 3-5 personas con tu vibra</span>
              </span>
            </span>
            <span className="text-[10px] font-black uppercase text-[#D4FF00]">Match →</span>
          </Link>
        </section>

        {event.lineup.length > 0 && (
          <section className="space-y-2 rounded-3xl border border-white/10 bg-[#14171F] p-4 shadow-md">
            <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-neutral-400">
              <Disc3 className="h-4 w-4 text-[#D4FF00]" /> Lineup confirmado
            </h2>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {event.lineup.map((artist) => (
                <span
                  key={artist}
                  className="rounded-full bg-[#D4FF00] px-3 py-1 text-xs font-black uppercase tracking-wider text-neutral-950"
                >
                  {artist}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3 rounded-3xl border border-white/10 bg-[#14171F] p-5 shadow-md">
          <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-neutral-400">
            <Sparkles className="h-4 w-4 text-[#D4FF00]" /> Información del evento
          </h2>
          <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-300 sm:text-sm">
            {event.description || "Este evento todavía no tiene una descripción disponible."}
          </p>
        </section>

        <CommentSection targetId={event.id} title="Muro de comentarios" />
      </main>

      <FollowedAttendeesModal
        eventId={event.id}
        isOpen={isAttendeesOpen}
        onClose={() => setIsAttendeesOpen(false)}
        totalGoingCount={event.goingCount}
      />
    </div>
  );
}

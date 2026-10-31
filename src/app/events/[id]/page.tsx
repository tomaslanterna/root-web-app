"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Share,
} from "lucide-react";
import { FollowedAttendeesModal } from "@/components/events/FollowedAttendeesModal";
import { EventLiveRankingCard } from "@/components/events/EventLiveRankingModal";
import { CommentSection } from "@/components/ui/CommentSection";
import { EventAttendanceVote } from "@/components/ui/EventAttendanceVote";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import { eventsApi } from "@/services/events";
import type { Event, RSVPResponse } from "@/types/events";
import { cn, copyTextToClipboard } from "@/lib/utils";

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");
  const { id: eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isTicketsExpanded, setIsTicketsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "venue" | "rules">("info");
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (
    tab: "info" | "venue" | "rules",
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setActiveTab(tab);

    // 1. Auto-scroll horizontal suave dentro de la barra de tabs para centrar el botón activo
    if (e?.currentTarget && tabsListRef.current) {
      const button = e.currentTarget;
      const container = tabsListRef.current;
      const buttonRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetScrollLeft =
        buttonRect.left - containerRect.left + container.scrollLeft - container.clientWidth / 2 + buttonRect.width / 2;
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }

    // 2. Auto-scroll vertical de la pantalla hacia la sección
    if (tabsRef.current) {
      const elementPosition = tabsRef.current.getBoundingClientRect().top + window.pageYOffset;
      const offset = 80;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  const {
    mutate: fetchEvent,
    isLoading: isLoadingEvent,
  } = useMutation<Event, string>(
    async (id) => {
      const response = await eventsApi.getEventById(id);
      return response;
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

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || "Evento en Root",
          text: `Mirá este evento: ${event?.title}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    const copied = await copyTextToClipboard(url);
    if (copied) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  let googleMapsUrl = "#";
  if (event) {
    if (event.latitude != null && event.longitude != null) {
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
    } else {
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    }
  }

  const handleBuyTicket = (tierId?: string) => {
    if (!event) return;
    const customTicketUrl = (event as any)?.ticketUrl || (event as any)?.affiliateUrl;
    if (customTicketUrl) {
      window.open(customTicketUrl, "_blank", "noopener,noreferrer");
      return;
    }
    // Redirección segura con atribución RRPP oficial de Root
    const partnerUrl = `https://www.passline.com/sitio?q=${encodeURIComponent(event.title)}&ref=root_rrpp`;
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
  };

  const ticketTiers = useMemo(() => {
    if (!event || !event.ticketTiers) return null;

    return event.ticketTiers.map((tier, idx) => ({
      id: `tier_${idx}`,
      name: tier.name,
      description: "",
      priceLabel: tier.currency === "UYU" ? `$${tier.price.toLocaleString("es-UY")}` : `$${tier.price.toLocaleString("es-AR")} ${tier.currency}`,
      status: tier.soldOut ? ("sold_out" as const) : tier.fewRemaining ? ("limited" as const) : ("available" as const),
      statusLabel: tier.soldOut ? "Agotado" : tier.fewRemaining ? "Últimos pases" : "Disponible",
      perk: "",
    }));
  }, [event]);

  const hasLineup = useMemo(() => {
    if (!event) return false;
    return (event.artists && event.artists.length > 0) || (event.lineup && event.lineup.length > 0);
  }, [event]);

  if (!hasLoaded && isLoadingEvent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg p-6 text-ink">
        <Loader2 className="size-8 animate-spin text-accent" aria-hidden="true" />
        <p className="label-mono text-ink-2">Cargando evento</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-ink">
        <p className="text-lg font-semibold">No encontramos este evento</p>
        <p className="max-w-xs text-sm text-ink-2">
          Es posible que el evento haya concluido o el enlace ya no se encuentre disponible.
        </p>
        <div className="flex gap-2">
          <Link
            href="/events"
            className="h-11 px-4 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold flex items-center hover:bg-[#23272D] transition-colors"
          >
            Volver a eventos
          </Link>
          <Button size="sm" onClick={() => void fetchEvent(eventId)}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = parseEventRealDate(event.date);
  const hasValidDate = !Number.isNaN(eventDate.getTime());
  const timeZone = "America/Montevideo";
  const formatHour = (date: Date) =>
    new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(date);
  const formattedDate = hasValidDate
    ? new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone })
        .format(eventDate)
        .replace(/\./g, "")
        .replace(/^\w/, (c) => c.toUpperCase())
    : event.date;
  const endDate = event.endDate ? parseEventRealDate(event.endDate) : null;
  const formattedHours = hasValidDate
    ? endDate && !Number.isNaN(endDate.getTime())
      ? `${formatHour(eventDate)} – ${formatHour(endDate)}`
      : formatHour(eventDate)
    : "A confirmar";

  const priceLabel =
    event.price == null
      ? "A confirmar"
      : event.price === 0
        ? "Gratis"
        : `$ ${event.price.toLocaleString("es-AR")}`;

  const banner = event.cinematicBannerUrl?.trim() || fallbackBanner;
  const selectedTier =
    ticketTiers?.find((tier) => tier.id === selectedTierId) ??
    ticketTiers?.find((tier) => tier.status !== "sold_out");

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

  const tabs = [
    { id: "info", label: "La fiesta" },
    { id: "venue", label: "Predio y acceso" },
    { id: "rules", label: "Reglas" },
  ] as const;

  const roundButton =
    "size-11 rounded-full bg-bg/80 text-ink flex items-center justify-center transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="min-h-screen bg-bg text-ink pb-16 md:pb-20">
      {copiedShare && (
        <div role="status" className="fixed top-[calc(1.5rem+var(--root-safe-top))] left-1/2 -translate-x-1/2 z-50 h-11 px-5 rounded-full bg-accent text-on-accent text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="size-4" aria-hidden="true" /> Enlace copiado
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto md:px-8 md:pt-6">
        {/* Póster con acciones flotantes */}
        <div
          role="img"
          aria-label={`Póster de ${event.title}`}
          className="relative h-[470px] md:h-[520px] md:rounded-hero overflow-hidden bg-surface-2 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner})` }}
        >
          <div className="absolute top-[calc(1rem+var(--root-safe-top))] md:top-4 inset-x-4 flex justify-between">
            <button
              type="button"
              aria-label="Volver"
              onClick={() => router.push(origin || "/events")}
              className={roundButton}
            >
              <ChevronLeft className="size-[22px]" aria-hidden="true" />
            </button>
            <div className="flex gap-2">
              <button type="button" aria-label="Compartir evento" onClick={handleShare} className={roundButton}>
                <Share className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Identidad */}
        <div className="px-4 md:px-0 pt-6 flex flex-col gap-3.5">
          <div className="flex flex-wrap gap-2">
            {event.genre && (
              <span className="label-mono px-2.5 py-[7px] rounded-full bg-accent/12 text-accent">{event.genre}</span>
            )}
            <span className="label-mono px-2.5 py-[7px] rounded-full bg-surface-2 text-ink-2">+18</span>
          </div>
          <h1 className="font-display text-[34px] md:text-5xl m-0">{event.title}</h1>
        </div>

        {/* Datos clave */}
        <dl className="mx-4 md:mx-0 mt-5 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line">
          <div className="bg-surface p-3.5 flex flex-col gap-1">
            <dt className="label-mono text-ink-3">Fecha</dt>
            <dd className="m-0 text-[15px] font-semibold">{formattedDate}</dd>
          </div>
          <div className="bg-surface p-3.5 flex flex-col gap-1">
            <dt className="label-mono text-ink-3">Horario</dt>
            <dd className="m-0 num-mono text-[15px] font-semibold">{formattedHours}</dd>
          </div>
          <div className="bg-surface p-3.5 flex flex-col gap-1 min-w-0">
            <dt className="label-mono text-ink-3">Lugar</dt>
            <dd className="m-0 text-[15px] font-semibold truncate">{event.location}</dd>
            <dd className="m-0">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-6 items-center text-[13px] font-medium text-accent hover:text-accent-hover"
              >
                Abrir en Maps
              </a>
            </dd>
          </div>
          <div className="bg-surface p-3.5 flex flex-col gap-1">
            <dt className="label-mono text-ink-3">Ingreso</dt>
            <dd className="m-0 text-[15px] font-semibold">DNI físico</dd>
            <dd className="m-0 text-[13px] text-ink-2">Mayores de 18</dd>
          </div>
        </dl>

        {/* Radar de pista */}
        <section
          aria-labelledby="event-radar"
          className="mx-4 md:mx-0 mt-4 p-4 rounded-card bg-surface border border-line flex flex-col gap-3.5"
        >
          <div className="flex flex-col gap-1">
            <h2 id="event-radar" className="label-mono text-ink-2 m-0">Radar de pista</h2>
            <span className="text-[15px]">
              <span className="num-mono font-semibold">{event.goingCount}</span> van
            </span>
          </div>
          <EventAttendanceVote
            eventId={event.id}
            initialGoing={event.goingCount}
            initialNotGoing={event.notGoingCount}
            initialStatus={event.userRsvp}
            onChange={updateAttendance}
            showMetrics={false}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            {event.goingCount > 0 ? (
              <button
                type="button"
                onClick={() => setIsAttendeesOpen(true)}
                className="min-h-11 text-sm font-medium text-accent hover:text-accent-hover"
              >
                Ver a quiénes seguís que van
              </button>
            ) : (
              <span className="text-sm text-ink-2">Sé el primero en confirmar</span>
            )}
            <Link
              href={`/events/${event.id}/survey`}
              className="min-h-11 inline-flex items-center text-sm font-medium text-ink-2 hover:text-ink"
            >
              Dejar reseña
            </Link>
          </div>
        </section>

        <div className="mx-4 md:mx-0 mt-4">
          <EventLiveRankingCard eventId={event.id} eventTitle={event.title} eventLocation={event.location} />
        </div>

        {/* Información en pestañas */}
        <div ref={tabsRef} className="mx-4 md:mx-0 mt-7 scroll-mt-24">
          <div
            ref={tabsListRef}
            role="tablist"
            aria-label="Información del evento"
            className="flex p-[3px] rounded-xl bg-surface border border-line"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`event-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`event-panel-${tab.id}`}
                onClick={(e) => handleTabChange(tab.id, e)}
                className={cn(
                  "flex-1 h-10 rounded-[9px] text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                  activeTab === tab.id ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "info" && (
            <div role="tabpanel" id="event-panel-info" aria-labelledby="event-tab-info" className="pt-[18px] flex flex-col gap-[18px]">
              {hasLineup && (
                <div className="flex flex-col">
                  {event.artists && event.artists.length > 0
                    ? event.artists.map((ea) => (
                        <div key={ea.artistId} className="flex items-center gap-3.5 py-3 border-b border-line">
                          <span className="num-mono w-[52px] shrink-0 text-sm font-semibold text-accent">
                            {ea.performanceTime || "—"}
                          </span>
                          <span className="flex-1 min-w-0 text-base font-semibold truncate">
                            {ea.artist?.name}
                          </span>
                          <span className="label-mono text-ink-3 shrink-0">
                            {ea.isHeadliner ? "Headliner" : ea.artist?.artistType || "DJ set"}
                          </span>
                        </div>
                      ))
                    : event.lineup.map((artist) => (
                        <div key={artist} className="flex items-center gap-3.5 py-3 border-b border-line">
                          <span className="num-mono w-[52px] shrink-0 text-sm font-semibold text-ink-3">—</span>
                          <span className="flex-1 min-w-0 text-base font-semibold truncate">{artist}</span>
                        </div>
                      ))}
                </div>
              )}
              {hasLineup && (
                <p className="m-0 text-[13px] text-ink-3">Horarios sujetos a confirmación de la organización.</p>
              )}
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-[17px] font-semibold">Concepto</h3>
                <p className="m-0 whitespace-pre-line text-base leading-relaxed text-ink-2">
                  {event.description || "Este evento todavía no tiene una descripción."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "venue" && (
            <div role="tabpanel" id="event-panel-venue" aria-labelledby="event-tab-venue" className="pt-[18px] flex flex-col gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-control bg-surface-2 flex items-center justify-between gap-3 hover:bg-[#23272D] transition-colors"
              >
                <span className="flex flex-col gap-1 min-w-0">
                  <span className="label-mono text-ink-3">Predio</span>
                  <span className="text-base font-semibold truncate">{event.location}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent flex items-center gap-1">
                  Abrir en Maps <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </a>
              <p className="m-0 text-base leading-relaxed text-ink-2">
                Apertura de puertas {hasValidDate ? formatHour(eventDate) : "a confirmar"}. Requisito obligatorio: DNI físico, mayores de 18.
              </p>
            </div>
          )}

          {activeTab === "rules" && (
            <div role="tabpanel" id="event-panel-rules" aria-labelledby="event-tab-rules" className="pt-[18px] flex flex-col gap-2.5 text-base leading-normal text-ink-2">
              <p className="m-0"><strong className="text-ink">Tolerancia cero:</strong> no se tolera acoso, discriminación ni violencia. El consentimiento es indiscutible.</p>
              <p className="m-0"><strong className="text-ink">Cuidado en pista:</strong> si alguien necesita asistencia o agua, avisá al personal del club.</p>
              <p className="m-0"><strong className="text-ink">Teléfonos:</strong> flashes apagados y respeto por la privacidad de las personas.</p>
              <p className="m-0"><strong className="text-ink">Ingreso:</strong> mayores de 18 con documento físico vigente.</p>
            </div>
          )}
        </div>

        {/* Entradas */}
        <section id="tickets-section" aria-labelledby="event-tickets" className="mx-4 md:mx-0 mt-8 scroll-mt-28">
          <div className="rounded-card bg-surface border border-line p-4 md:p-5 flex flex-col gap-4">
            {/* Header replegable */}
            <button
              type="button"
              onClick={() => setIsTicketsExpanded((prev) => !prev)}
              aria-expanded={isTicketsExpanded}
              aria-controls="event-tickets-content"
              className="flex items-center justify-between gap-3 text-left w-full group focus-visible:outline-2 focus-visible:outline-accent rounded-lg cursor-pointer"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <h2 id="event-tickets" className="font-display text-[22px] m-0">Entradas</h2>
                <span className="num-mono text-sm text-ink-2 font-medium">
                  {selectedTier ? selectedTier.priceLabel : priceLabel}
                  {ticketTiers && ticketTiers.length > 0 && (
                    <span className="text-xs text-ink-3 ml-2 font-normal">
                      ({ticketTiers.length} {ticketTiers.length === 1 ? "lote" : "lotes"})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:text-accent-hover transition-colors shrink-0">
                <span>{isTicketsExpanded ? "Ocultar precios" : "Ver precios"}</span>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isTicketsExpanded && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </div>
            </button>

            {/* Precios de entradas dentro de sección replegable */}
            {isTicketsExpanded && (
              <div id="event-tickets-content" className="pt-3 border-t border-line animate-in fade-in duration-200 flex flex-col gap-2.5">
                {event.ticketTiers == null ? (
                  <p className="m-0 p-3.5 rounded-control bg-surface-2 border border-line text-[14px] text-ink-2">
                    Todavía no hay información de entradas oficiales para este evento.
                  </p>
                ) : event.ticketTiers.length === 0 ? (
                  <p className="m-0 p-3.5 rounded-control bg-surface-2 border border-line text-[14px] text-ink-2">
                    Estamos buscando las entradas oficiales de este evento.
                  </p>
                ) : (
                  <fieldset className="m-0 p-0 border-0 flex flex-col gap-2.5">
                    <legend className="sr-only">Elegí un lote</legend>
                    {ticketTiers?.map((tier) => {
                      const isSoldOut = tier.status === "sold_out";
                      const isSelected = !isSoldOut && selectedTier?.id === tier.id;
                      if (isSoldOut) {
                        return (
                          <div
                            key={tier.id}
                            aria-disabled="true"
                            className="p-3.5 rounded-control border border-dashed border-line-strong text-ink-3 flex items-center justify-between gap-3"
                          >
                            <span className="flex flex-col gap-[2px]">
                              <span className="text-[14px] font-semibold line-through">{tier.name}</span>
                              <span className="label-mono">Agotado</span>
                            </span>
                            <span className="num-mono text-sm line-through">{tier.priceLabel}</span>
                          </div>
                        );
                      }
                      return (
                        <label
                          key={tier.id}
                          className={cn(
                            "p-3.5 rounded-control flex items-center gap-3 cursor-pointer transition-colors",
                            isSelected
                              ? "border-[1.5px] border-accent bg-accent/[0.06]"
                              : "border border-white/10 bg-surface-2 hover:bg-[#23272D]",
                          )}
                        >
                          <input
                            type="radio"
                            name="ticket-tier"
                            checked={isSelected}
                            onChange={() => setSelectedTierId(tier.id)}
                            className="size-4 m-0 accent-accent"
                          />
                          <span className="flex-1 min-w-0 flex flex-col gap-[2px]">
                            <span className="text-[14px] font-semibold">{tier.name}</span>
                            <span className={cn("label-mono", tier.status === "limited" ? "text-accent" : "text-ink-3")}>
                              {tier.status === "limited" ? "Disponible · quedan pocas" : "Disponible"}
                            </span>
                          </span>
                          <span className="num-mono text-base font-semibold">{tier.priceLabel}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                )}
              </div>
            )}

            {/* Botón Conseguir ticket al final de los tickets, visible tanto replegada como expandida */}
            <Button
              size="lg"
              onClick={() => handleBuyTicket(selectedTier?.id)}
              className="w-full flex items-center justify-center gap-2 text-base font-bold shadow-[0_4px_20px_rgba(212,255,0,0.15)]"
            >
              <span>Conseguir ticket</span>
              <ArrowUpRight className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* Muro */}
        <section className="mx-4 md:mx-0 mt-8">
          <CommentSection targetId={event.id} title="Muro y comunidad" />
        </section>
      </div>

      <FollowedAttendeesModal
        eventId={event.id}
        isOpen={isAttendeesOpen}
        onClose={() => setIsAttendeesOpen(false)}
        totalGoingCount={event.goingCount}
      />
    </div>
  );
}

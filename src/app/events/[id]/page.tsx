"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { SwipeBack } from "@/components/ui/SwipeBack";
import { FollowedAttendeesModal } from "@/components/events/FollowedAttendeesModal";
import { EventDetailSkeleton } from "@/components/events/EventDetailSkeleton";
import { EventLiveRankingCard } from "@/components/events/EventLiveRankingModal";
import { EventRRPPsSection } from "@/components/events/EventRRPPsSection";
import { CommentSection } from "@/components/ui/CommentSection";
import { EventAttendanceVote } from "@/components/ui/EventAttendanceVote";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useMutation } from "@/hooks/useMutation";
import { eventsApi } from "@/services/events";
import type { Event, RSVPResponse } from "@/types/events";
import { cn, copyTextToClipboard } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { badgeReviewHref } from "@/lib/badgeReviewLink";
import { TabIndicator } from "@/components/ui/TabIndicator";
import { useEventTempCrews } from "@/hooks/useTempCrews";
import { EventTempCrewsSection, EventTempCrewsSkeleton, TEMP_CREWS_ANCHOR } from "@/components/match/EventTempCrewsSection";
import { AdmittingPill } from "@/components/match/TempCrewCards";
import type { TempCrewEventRef } from "@/types/tempCrews";

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

/** Eventos ya abiertos: al volver a entrar a uno se ve al instante y se actualiza por detrás, sin pasar por el skeleton. */
const openedEvents = new Map<string, Event>();

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");
  const goBack = () => router.push(origin || "/events");
  const { id: eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(() => openedEvents.get(eventId) ?? null);
  const [hasLoaded, setHasLoaded] = useState(() => openedEvents.has(eventId));
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isTicketsExpanded, setIsTicketsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "venue" | "rules">("info");
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

  const { mutate: fetchEvent } = useMutation<Event, string>(
    async (id) => {
      const response = await eventsApi.getEventById(id);
      return response;
    },
    {
      onSuccess: (response) => {
        openedEvents.set(eventId, response);
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

  const handleBuyTicket = () => {
    const ticketUrl = event?.ticketUrl?.trim();
    if (!ticketUrl) return;
    window.open(ticketUrl, "_blank", "noopener,noreferrer");
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

  // Crews temporales: si el backend no tiene el endpoint, la sección no aparece.
  const tempCrewEvent = useMemo<TempCrewEventRef | null>(
    () =>
      event
        ? { id: event.id, title: event.title, date: event.date, location: event.location, cinematicBannerUrl: event.cinematicBannerUrl }
        : null,
    [event],
  );
  // Si el detalle del evento ya trae el resumen (`event.tempCrews`), no hay otra llamada.
  const tempCrews = useEventTempCrews(eventId, tempCrewEvent, 3, event?.tempCrews);

  const hasLineup = useMemo(() => {
    if (!event) return false;
    return (event.artists && event.artists.length > 0) || (event.lineup && event.lineup.length > 0);
  }, [event]);

  // Hasta que llega la primera respuesta (acierte o falle) se ve el skeleton. No alcanza con `isLoading` del
  // hook: arranca en false y el efecto que dispara la carga corre después del primer render, que mostraba
  // un instante "No encontramos este evento" antes de volver al skeleton.
  if (!hasLoaded) {
    return <EventDetailSkeleton />;
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
  // Sin ticket_url no hay dónde comprar: no se muestra la sección de entradas ni el botón.
  const hasTicketUrl = Boolean(event.ticketUrl?.trim());
  // El encabezado de Entradas muestra el precio del primer lote disponible.
  const firstAvailableTier = ticketTiers?.find((tier) => tier.status !== "sold_out");

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

  // Radar de pista: en mobile va en la columna; en escritorio (lg) se repite en el lateral junto al póster.
  const renderRadar = (radarId: string, radarClassName: string) => (
    <section
      aria-labelledby={radarId}
      className={radarClassName}
    >
      <div className="flex flex-col gap-1">
        <h2 id={radarId} className="label-mono text-ink-2 m-0">Radar de pista</h2>
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
        showNotGoing={false}
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
        {user?.username && <Link
          href={badgeReviewHref(user.username, event.id)}
          className="min-h-11 inline-flex items-center text-sm font-medium text-ink-2 hover:text-ink"
        >
          Dejar reseña
        </Link>}
      </div>
    </section>
  );

  const roundButton =
    "size-11 rounded-full bg-bg/80 text-ink flex items-center justify-center transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="min-h-screen bg-bg text-ink pb-16 md:pb-20">
      {copiedShare && (
        <div role="status" className="fixed top-[calc(1.5rem+var(--root-safe-top))] left-1/2 -translate-x-1/2 z-50 h-11 px-5 rounded-full bg-accent text-on-accent text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="size-4" aria-hidden="true" /> Enlace copiado
        </div>
      )}

      <SwipeBack onBack={goBack} />

      {/* Header fijo: volver y compartir quedan arriba mientras se hace scroll */}
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none lg:hidden">
        <div className="mx-auto flex w-full max-w-3xl justify-between px-4 pt-[calc(1rem+var(--root-safe-top))] md:px-12 md:pt-10">
          <button
            type="button"
            aria-label="Volver"
            onClick={goBack}
            className={cn(roundButton, "pointer-events-auto")}
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Compartir evento"
            onClick={handleShare}
            className={cn(roundButton, "pointer-events-auto")}
          >
            <Share className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Escritorio: volver y compartir en una barra propia (en mobile flotan sobre el póster). */}
      <div data-dsk className="hidden lg:flex items-center justify-between gap-3 pb-6">
        <button
          type="button"
          onClick={goBack}
          className="h-11 px-4 rounded-control bg-surface border border-line text-sm font-semibold flex items-center gap-2 hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft className="size-[18px]" aria-hidden="true" />
          Volver
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="h-11 px-4 rounded-control bg-surface border border-line text-sm font-semibold flex items-center gap-2 hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Share className="size-[18px]" aria-hidden="true" />
          Compartir
        </button>
      </div>

      <div className="w-full max-w-3xl mx-auto md:px-8 md:pt-6 lg:max-w-none lg:px-0 lg:pt-0 lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-x-12 lg:items-start">
        {/* Escritorio: póster completo y radar fijos en el lateral izquierdo. */}
        <aside data-dsk className="hidden lg:flex flex-col gap-4 col-start-1 row-start-1 row-end-[40] self-start sticky top-28">
          <div className="relative aspect-[4/5] rounded-hero overflow-hidden bg-surface-2 border border-line">
            <Image src={banner} alt={`Póster de ${event.title}`} fill sizes="420px" className="object-cover object-center" />
          </div>
          {renderRadar("event-radar-desktop", "p-4 rounded-card bg-surface border border-line flex flex-col gap-3.5")}
        </aside>

        {/* Póster */}
        <div
          role="img"
          aria-label={`Póster de ${event.title}`}
          className="relative h-[470px] md:h-[520px] md:rounded-hero overflow-hidden bg-surface-2 lg:hidden"
        >
          <Image
            src={banner}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover object-center"
          />
        </div>

        {/* Identidad */}
        <div className="px-4 md:px-0 pt-6 flex flex-col gap-3.5 lg:col-start-2 lg:pt-0">
          <div className="flex flex-wrap gap-2">
            {event.genre && (
              <span className="label-mono px-2.5 py-[7px] rounded-full bg-accent/12 text-accent">{event.genre}</span>
            )}
            <span className="label-mono px-2.5 py-[7px] rounded-full bg-surface-2 text-ink-2">+18</span>
            {tempCrews.status === "ready" && tempCrews.total > 0 && (
              <a href={`#${TEMP_CREWS_ANCHOR}`} className="rounded-full focus-visible:outline-2 focus-visible:outline-accent">
                <AdmittingPill>
                  {tempCrews.total} {tempCrews.total === 1 ? "crew buscando gente" : "crews buscando gente"}
                </AdmittingPill>
              </a>
            )}
          </div>
          <h1 className="font-display text-[34px] md:text-5xl m-0">{event.title}</h1>
        </div>

        {/* Datos clave */}
        <dl className="mx-4 md:mx-0 mt-5 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line lg:col-start-2 lg:grid-cols-4">
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
        {renderRadar("event-radar", "mx-4 md:mx-0 mt-4 p-4 rounded-card bg-surface border border-line flex flex-col gap-3.5 lg:hidden")}

        {/* Crews temporales: resumen con carrusel; la lista completa está en /events/[id]/crews. */}
        {tempCrewEvent && tempCrews.status === "ready" ? (
          <EventTempCrewsSection
            event={tempCrewEvent}
            crews={tempCrews.crews}
            total={tempCrews.total}
            viewerCrewId={tempCrews.viewerCrewId}
            onChanged={() => void tempCrews.reload()}
            className="mx-4 md:mx-0 mt-4 lg:col-start-2 lg:mt-6"
          />
        ) : (
          tempCrews.showPlaceholder && <EventTempCrewsSkeleton className="mx-4 md:mx-0 mt-4 lg:col-start-2 lg:mt-6" />
        )}

        <div className="mx-4 md:mx-0 mt-4 lg:col-start-2">
          <EventLiveRankingCard eventId={event.id} eventTitle={event.title} eventLocation={event.location} />
        </div>

        {/* Información en pestañas */}
        <div ref={tabsRef} className="mx-4 md:mx-0 mt-7 scroll-mt-24 lg:col-start-2">
          <div
            ref={tabsListRef}
            role="tablist"
            aria-label="Información del evento"
            className="relative flex p-[2px] rounded-lg bg-surface border border-line"
          >
            <TabIndicator variant="pill" />
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
                  "relative z-[1] flex-1 h-7 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                  activeTab === tab.id ? "text-bg" : "text-ink-2 hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "info" && (
            <div role="tabpanel" id="event-panel-info" aria-labelledby="event-tab-info" className="tab-panel-in pt-[18px] flex flex-col gap-6">
              {hasLineup && (
                <div className="flex flex-col gap-3">
                  <h3 className="m-0 text-[17px] font-semibold">Lineup</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2.5 sm:gap-x-4 gap-y-6">
                    {event.artists && event.artists.length > 0
                      ? event.artists.map((ea) => (
                          <div key={ea.artistId} className="min-w-0 flex flex-col items-center gap-2 text-center">
                            <Avatar
                              src={ea.artist?.avatarUrl}
                              fallback={ea.artist?.name || "DJ"}
                              className="size-24 sm:size-28 rounded-full border border-line bg-surface-2 text-ink-2 text-xl sm:text-2xl font-bold shadow-sm"
                            />
                            <span className="flex flex-col items-center gap-0.5 text-center w-full px-1">
                              <span className="text-[13px] font-semibold leading-tight line-clamp-2 text-ink">
                                {ea.artist?.name}
                              </span>
                              <span className="label-mono text-xs text-ink-3">
                                {ea.isHeadliner ? (
                                  <span className="text-accent font-semibold">
                                    {ea.performanceTime ? `★ ${ea.performanceTime}` : "Headliner"}
                                  </span>
                                ) : (
                                  ea.performanceTime || ea.artist?.artistType || "DJ set"
                                )}
                              </span>
                            </span>
                          </div>
                        ))
                      : event.lineup.map((artist) => (
                          <div key={artist} className="min-w-0 flex flex-col items-center gap-2 text-center">
                            <Avatar
                              fallback={artist}
                              className="size-24 sm:size-28 rounded-full border border-line bg-surface-2 text-ink-2 text-xl sm:text-2xl font-bold shadow-sm"
                            />
                            <span className="flex flex-col items-center gap-0.5 text-center w-full px-1">
                              <span className="text-[13px] font-semibold leading-tight line-clamp-2 text-ink">
                                {artist}
                              </span>
                              <span className="label-mono text-xs text-ink-3">DJ set</span>
                            </span>
                          </div>
                        ))}
                  </div>
                  <p className="m-0 text-[13px] text-ink-3">Horarios sujetos a confirmación de la organización.</p>
                </div>
              )}
              {event.rrpps && event.rrpps.length > 0 && <EventRRPPsSection rrpps={event.rrpps} />}
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-[17px] font-semibold">Concepto</h3>
                <p className="m-0 whitespace-pre-line text-base leading-relaxed text-ink-2">
                  {event.description || "Este evento todavía no tiene una descripción."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "venue" && (
            <div role="tabpanel" id="event-panel-venue" aria-labelledby="event-tab-venue" className="tab-panel-in pt-[18px] flex flex-col gap-3">
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
            <div role="tabpanel" id="event-panel-rules" aria-labelledby="event-tab-rules" className="tab-panel-in pt-[18px] flex flex-col gap-2.5 text-base leading-normal text-ink-2">
              <p className="m-0"><strong className="text-ink">Tolerancia cero:</strong> no se tolera acoso, discriminación ni violencia. El consentimiento es indiscutible.</p>
              <p className="m-0"><strong className="text-ink">Cuidado en pista:</strong> si alguien necesita asistencia o agua, avisá al personal del club.</p>
              <p className="m-0"><strong className="text-ink">Teléfonos:</strong> flashes apagados y respeto por la privacidad de las personas.</p>
              <p className="m-0"><strong className="text-ink">Ingreso:</strong> mayores de 18 con documento físico vigente.</p>
            </div>
          )}
        </div>

        {/* Entradas: solo si el evento tiene ticket_url */}
        {hasTicketUrl && (
          <section id="tickets-section" aria-labelledby="event-tickets" className="mx-4 md:mx-0 mt-8 scroll-mt-28 lg:col-start-2">
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
                    {firstAvailableTier ? firstAvailableTier.priceLabel : priceLabel}
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
                    // Solo informativo: la compra se hace en la ticketera, así que los lotes no se seleccionan.
                    <ul aria-label="Lotes de entradas" className="m-0 p-0 list-none flex flex-col gap-2.5">
                      {ticketTiers?.map((tier) =>
                        tier.status === "sold_out" ? (
                          <li
                            key={tier.id}
                            className="p-3.5 rounded-control border border-dashed border-line-strong text-ink-3 flex items-center justify-between gap-3"
                          >
                            <span className="flex flex-col gap-[2px]">
                              <span className="text-[14px] font-semibold line-through">{tier.name}</span>
                              <span className="label-mono">Agotado</span>
                            </span>
                            <span className="num-mono text-sm line-through">{tier.priceLabel}</span>
                          </li>
                        ) : (
                          <li
                            key={tier.id}
                            className="p-3.5 rounded-control border border-white/10 bg-surface-2 flex items-center justify-between gap-3"
                          >
                            <span className="min-w-0 flex flex-col gap-[2px]">
                              <span className="text-[14px] font-semibold">{tier.name}</span>
                              <span className={cn("label-mono", tier.status === "limited" ? "text-accent" : "text-ink-3")}>
                                {tier.status === "limited" ? "Disponible · quedan pocas" : "Disponible"}
                              </span>
                            </span>
                            <span className="num-mono text-base font-semibold">{tier.priceLabel}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}

              {/* Botón Conseguir ticket al final de los tickets, visible tanto replegada como expandida */}
              <Button
                size="lg"
                onClick={handleBuyTicket}
                className="w-full flex items-center justify-center gap-2 text-base font-bold shadow-[0_4px_20px_rgba(212,255,0,0.15)]"
              >
                <span>Conseguir ticket</span>
                <ArrowUpRight className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
              </Button>
            </div>
          </section>
        )}

        {/* Muro */}
        <section className="mx-4 md:mx-0 mt-8 lg:col-start-2">
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

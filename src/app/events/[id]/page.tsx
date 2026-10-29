"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Disc3,
  ExternalLink,
  Flame,
  Info,
  Loader2,
  MapPin,
  Music,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { DetailHeader } from "@/components/ui/DetailHeader";
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
  const [isSaved, setIsSaved] = useState(false);
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

  const generateGoogleCalendarUrl = () => {
    if (!event) return "#";
    const start = parseEventRealDate(event.date);
    const end = event.endDate
      ? parseEventRealDate(event.endDate)
      : new Date(start.getTime() + 6 * 60 * 60 * 1000);
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title,
    )}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(
      event.description || `Evento en Root: ${event.title}`,
    )}&location=${encodeURIComponent(event.location)}`;
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0B0D10] p-6 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4FF00]" />
        <p className="text-xs font-semibold tracking-wide text-neutral-400">Cargando fecha...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B0D10] p-6 text-center text-white">
        <p className="text-base font-bold text-neutral-200">No encontramos esta fecha</p>
        <p className="max-w-xs text-xs text-neutral-500">
          Es posible que el evento haya concluido o el enlace ya no se encuentre disponible.
        </p>
        <div className="flex gap-2">
          <Link
            href="/events"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
          >
            Volver a cartelera
          </Link>
          <Button size="sm" onClick={() => void fetchEvent(eventId)}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = parseEventRealDate(event.date);
  const formattedDate = Number.isNaN(eventDate.getTime())
    ? event.date
    : new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(eventDate);
  const formattedHour = Number.isNaN(eventDate.getTime())
    ? "23:00"
    : new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(eventDate);

  const priceLabel =
    event.price == null
      ? "Precio a confirmar"
      : event.price === 0
        ? "Entrada libre"
        : `$${event.price.toLocaleString("es-AR")}`;

  const banner = event.cinematicBannerUrl?.trim() || fallbackBanner;
  const currentTierObj = ticketTiers?.[0];

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
    <div className="min-h-screen bg-[#0B0D10] pb-28 md:pb-24 text-white relative selection:bg-[#D4FF00] selection:text-neutral-950">
      {/* Toast Feedback de Compartir */}
      {copiedShare && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#D4FF00] px-5 py-2.5 text-xs font-black tracking-wide text-neutral-950 shadow-2xl shadow-[#D4FF00]/40 animate-in fade-in slide-in-from-top-4 duration-200">
          ✓ Enlace copiado al portapapeles
        </div>
      )}

      {/* Header Superior Móvil */}
      <DetailHeader
        className="md:hidden"
        onBack={() => router.push(origin || "/events")}
        onShare={handleShare}
        onSave={() => setIsSaved(!isSaved)}
        isSaved={isSaved}
        isCopied={copiedShare}
        showSave
        showShare
      />

      {/* Contenedor Principal: Columna Central Editorial (Estilo Resident Advisor / DICE / Boiler Room) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-6 space-y-8 sm:space-y-10">
        {/* Barra Superior Desktop: Navegación Limpia y Botones Táctiles en Liquid Glass */}
        <div className="hidden md:flex items-center justify-between text-xs text-neutral-400 border-b border-white/5 pb-4">
          <Link
            href={origin || "/events"}
            className="flex items-center gap-2 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium tracking-wide">Volver a eventos</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Compartir evento"
              title="Compartir evento"
              className={cn(
                "relative group w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-md",
                copiedShare
                  ? "border-[#D4FF00]/60 bg-[#D4FF00]/15 text-[#D4FF00]"
                  : "border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl hover:border-[#D4FF00]/40 hover:bg-white/10 text-neutral-300 hover:text-white",
              )}
            >
              {copiedShare ? (
                <Check className="w-4.5 h-4.5 text-[#D4FF00] stroke-[2.5]" />
              ) : (
                <Share2 className="w-4.5 h-4.5 text-neutral-300 group-hover:text-[#D4FF00] transition-colors" />
              )}
            </button>

            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Agendar en Google Calendar"
              title="Agendar en Google Calendar"
              className="w-10 h-10 rounded-full border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl hover:border-[#D4FF00]/40 hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200 flex items-center justify-center active:scale-95 shadow-md"
            >
              <Calendar className="w-4.5 h-4.5" />
            </a>

            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              aria-label={isSaved ? "Guardado en favoritos" : "Guardar evento"}
              title={isSaved ? "Guardado en favoritos" : "Guardar evento"}
              className={cn(
                "w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-md",
                isSaved
                  ? "border-[#D4FF00]/60 bg-[#D4FF00]/15 text-[#D4FF00]"
                  : "border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl hover:border-white/25 hover:bg-white/10 text-neutral-300 hover:text-white",
              )}
            >
              <Bookmark
                className={cn(
                  "w-4.5 h-4.5 transition-all",
                  isSaved ? "fill-[#D4FF00] text-[#D4FF00]" : "text-neutral-300 group-hover:text-white",
                )}
              />
            </button>
          </div>
        </div>

        {/* 1. Hero Poster Cinemático & Atmosférico en Liquid Glass */}
        <div className="relative group overflow-hidden">
          {/* Ambient light glow */}
          <div
            className="absolute -inset-6 bg-cover bg-center opacity-25 blur-3xl pointer-events-none hidden md:block"
            style={{ backgroundImage: `url(${banner})` }}
          />

          <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[16/9] w-full overflow-hidden rounded-t-3xl shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <div
              role="img"
              aria-label={`Portada de ${event.title}`}
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${banner})` }}
            />
            {/* Viñeta cinematográfica envolvente que se difumina hacia el color de fondo de la página */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/80 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0B0D10] to-transparent" />

            {/* Micro-etiqueta de género musical en Liquid Glass */}
            {event.genre && (
              <div className="absolute top-4 left-4 z-10">
                <span className="rounded-full border border-white/20 bg-gradient-to-b from-white/[0.15] to-black/60 backdrop-blur-xl px-3.5 py-1 text-xs font-semibold tracking-wide text-white shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                  {event.genre}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Ficha de Identidad Editorial (Estilo Resident Advisor / Pitchfork) */}
        <div className="relative z-10 !-mt-12 sm:!-mt-24 space-y-3.5 border-b border-white/10 pb-8 px-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-[#D4FF00]">
            <span className="capitalize">{formattedDate}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 font-medium">Apertura {formattedHour} hs</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-sm text-neutral-300">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-[#D4FF00] transition-colors group/venue"
            >
              <MapPin className="h-4 w-4 text-[#D4FF00] shrink-0" />
              <span className="font-medium">{event.location}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover/venue:opacity-100 transition-opacity" />
            </a>

            {event.goingCount > 0 && (
              <button
                type="button"
                onClick={() => setIsAttendeesOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-4 py-1.5 text-xs font-medium text-neutral-300 hover:border-[#D4FF00]/40 hover:text-white transition-all cursor-pointer backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
                <span>{event.goingCount} personas van a estar en pista</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Radar de Asistencia en Pista (Liquid Glass Hub) */}
        <div className="pt-2 space-y-4">
          {/* Tarjeta Radar de la Pista */}
          <div className="relative rounded-3xl border-0 bg-[#111114] p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-5 flex flex-col justify-between overflow-hidden">
            <div className="space-y-3.5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[#D4FF00] animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Radar de la Pista
                  </span>
                </div>
                <span className="text-xs font-bold text-[#D4FF00]">En Vivo</span>
              </div>

              {/* Votación Limpia y Directa: VOY / NO VOY */}
              <EventAttendanceVote
                eventId={event.id}
                initialGoing={event.goingCount}
                initialNotGoing={event.notGoingCount}
                initialStatus={event.userRsvp}
                onChange={updateAttendance}
                showMetrics
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs relative z-10">
              {event.goingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsAttendeesOpen(true)}
                  className="text-neutral-300 hover:text-[#D4FF00] transition-colors cursor-pointer font-medium"
                >
                  Ver quiénes van en pista ({event.goingCount}) →
                </button>
              ) : (
                <span className="text-neutral-500">Sé el primero en confirmar</span>
              )}

              <Link
                href={`/events/${event.id}/survey`}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Dejar reseña →
              </Link>
            </div>
          </div>

          {/* Card Compacta de Ranking de Pasos en Vivo del Evento (solo visible si el usuario está en el evento) */}
          <EventLiveRankingCard
            eventId={event.id}
            eventTitle={event.title}
            eventLocation={event.location}
          />
        </div>

        {/* 3. Pestañas de Contenido Progresivo en Liquid Glass */}
        <div ref={tabsRef} id="tabs-section" className="space-y-6 scroll-mt-24">
          {/* Segmented Control Liquid Glass con Scroll Horizontal Suave */}
          <div
            ref={tabsListRef}
            className="liquid-glass-dock rounded-full p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth"
          >
            <div className="liquid-glass-specular" />

            <button
              type="button"
              onClick={(e) => handleTabChange("info", e)}
              className={cn(
                "relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer select-none active:scale-95",
                activeTab === "info"
                  ? "bg-[#D4FF00] text-neutral-950 font-black shadow-[0_0_15px_rgba(212,255,0,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.4)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>La Fiesta & Lineup</span>
              {hasLineup && (
                <span className="text-[10px] opacity-75">
                  ({event.artists?.length || event.lineup.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleTabChange("venue", e)}
              className={cn(
                "relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer select-none active:scale-95",
                activeTab === "venue"
                  ? "bg-[#D4FF00] text-neutral-950 font-black shadow-[0_0_15px_rgba(212,255,0,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.4)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Predio & Acceso</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabChange("rules", e)}
              className={cn(
                "relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer select-none active:scale-95",
                activeTab === "rules"
                  ? "bg-[#D4FF00] text-neutral-950 font-black shadow-[0_0_15px_rgba(212,255,0,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.4)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Reglas de convivencia</span>
            </button>
          </div>

          {/* Pestaña: Sobre la Fiesta, Lineup & Concepto */}
          {activeTab === "info" && (
            <section className="space-y-6 rounded-3xl border-0 bg-[#111114] p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)] animate-in fade-in duration-200">
              {/* Bloque Lineup & Horarios integrado */}
              {hasLineup && (
                <div className="space-y-4 border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Disc3 className="w-4 h-4 text-[#D4FF00]" />
                      <h3 className="text-sm font-black tracking-tight text-white uppercase">
                        Lineup Confirmado & Set Times
                      </h3>
                    </div>
                    <span className="text-xs text-neutral-400">Timetable Oficial</span>
                  </div>

                  {event.artists && event.artists.length > 0 ? (
                    <div className="space-y-3">
                      {event.artists.map((ea) => (
                        <div
                          key={ea.artistId}
                          className={cn(
                            "flex items-center justify-between gap-4 p-4 rounded-2xl border-0 transition-all shadow-sm",
                            ea.isHeadliner
                              ? "bg-[#D4FF00]/10 text-white"
                              : "bg-[#14171F] hover:bg-[#1B202B]",
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border-0 aspect-square">
                              {ea.artist?.avatarUrl ? (
                                <img
                                  src={ea.artist.avatarUrl}
                                  alt={ea.artist.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-black text-[#D4FF00] bg-neutral-950">
                                  {ea.artist?.name?.[0] || "DJ"}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={cn(
                                  "font-black tracking-tight truncate",
                                  ea.isHeadliner ? "text-lg text-white font-black" : "text-base text-neutral-200",
                                )}>
                                  {ea.artist?.name}
                                </h4>
                                {ea.isHeadliner && (
                                  <span className="rounded-full bg-[#D4FF00] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-[0_2px_8px_rgba(212,255,0,0.2)]">
                                    Headliner
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400">
                                {ea.artist?.artistType || "DJ Set"}
                              </p>
                            </div>
                          </div>

                          {ea.performanceTime && (
                            <div className="text-right shrink-0">
                              <span className="tech-mono inline-flex items-center gap-1.5 text-xs font-bold text-[#D4FF00]">
                                <Clock className="w-3.5 h-3.5" />
                                {ea.performanceTime}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border-0 bg-[#14171F] text-center space-y-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {event.lineup.map((artist, idx) => (
                          <span
                            key={artist}
                            className="text-lg sm:text-xl font-black text-white hover:text-[#D4FF00] transition-colors"
                          >
                            {artist}
                            {idx < event.lineup.length - 1 && (
                              <span className="text-neutral-600 ml-3">•</span>
                            )}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-400">Set Times y horarios a confirmar por la organización.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bloque Concepto & Propuesta Musical */}
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Concepto & Propuesta Musical
                </h3>
                <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-neutral-300">
                  {event.description || "Este evento todavía no tiene una descripción editorial disponible."}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-neutral-400">
                <p>
                  <strong className="text-white">Ingreso y permanencia:</strong> Exclusivo para mayores de 18 años con documento de identidad físico vigente.
                </p>
                <p>
                  <strong className="text-white">Dress code & Vibe:</strong> Expresión libre y cuidada. Respeto mutuo y convivencia en pista son indispensables.
                </p>
              </div>
            </section>
          )}

          {/* Pestaña: Predio & Acceso */}
          {activeTab === "venue" && (
            <section className="space-y-5 rounded-3xl border-0 bg-[#111114] p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] animate-in fade-in duration-200">
              <div className="rounded-2xl border-0 bg-[#14171F] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <span className="tech-label text-[#D4FF00]">
                    Predio Confirmado
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {event.location}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Accesos señalizados, estacionamiento en zonas habilitadas y transporte público próximo.
                  </p>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tech-label inline-flex items-center gap-2 rounded-full border-0 bg-[#D4FF00]/10 px-4 py-2 text-[#D4FF00] hover:bg-[#D4FF00] hover:text-neutral-950 transition-all shrink-0"
                >
                  <span>Abrir en Google Maps</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-300">
                <div className="rounded-2xl border-0 bg-[#14171F] p-4 space-y-1 text-center shadow-sm">
                  <Clock className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="tech-label text-neutral-400">Apertura de Puertas</p>
                  <p className="tech-mono font-black text-white text-base">23:00 hs</p>
                </div>
                <div className="rounded-2xl border-0 bg-[#14171F] p-4 space-y-1 text-center shadow-sm">
                  <Clock className="h-4 w-4 mx-auto text-amber-400" />
                  <p className="tech-label text-neutral-400">Límite de Ingreso</p>
                  <p className="tech-mono font-black text-white text-base">02:30 hs</p>
                </div>
                <div className="rounded-2xl border-0 bg-[#14171F] p-4 space-y-1 text-center shadow-sm">
                  <ShieldCheck className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="tech-label text-neutral-400">Requisito Obligatorio</p>
                  <p className="tech-label font-black text-white text-xs mt-1">DNI Físico (+18)</p>
                </div>
              </div>
            </section>
          )}

          {/* Pestaña: Reglas de convivencia */}
          {activeTab === "rules" && (
            <section className="space-y-6 rounded-3xl border-0 bg-[#111114] p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)] animate-in fade-in duration-200">
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4FF00]" />
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Reglas de Convivencia
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 font-medium">
                  Valores esenciales y normas de conducta para cuidar la pista, el respeto mutuo y garantizar una experiencia segura.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border-0 bg-[#14171F] p-5 space-y-2 shadow-sm">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
                    Tolerancia Cero y Consentimiento
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    No toleramos ninguna forma de acoso, discriminación, homofobia, transfobia ni violencia. El consentimiento es indiscutible en todo momento.
                  </p>
                </div>

                <div className="rounded-2xl border-0 bg-[#14171F] p-5 space-y-2 shadow-sm">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
                    Cuidado Colectivo en Pista
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Cuidá tu espacio y el de quienes te rodean. Si notás que alguien necesita asistencia o agua, acercate o dale aviso inmediato al personal del club.
                  </p>
                </div>

                <div className="rounded-2xl border-0 bg-[#14171F] p-5 space-y-2 shadow-sm">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
                    Conexión y Teléfonos
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Priorizá disfrutar la música y el presente. Mantené los flashes apagados y respetá la privacidad de las personas sin grabaciones invasivas.
                  </p>
                </div>

                <div className="rounded-2xl border-0 bg-[#14171F] p-5 space-y-2 shadow-sm">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
                    Ingreso y Cuidado Personal
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Ingreso exclusivo para mayores de 18 años con documento físico vigente. Cuidá tu hidratación, tus pertenencias y consumí con responsabilidad.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 4. Boletería de Noche */}
        <section
          id="tickets-section"
          className="relative space-y-6 rounded-3xl border-0 bg-[#111114] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden scroll-mt-28"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 relative z-10">
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Pases & Entradas Oficiales
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Boletería directa y autorizada con acreditación RRPP Root
              </p>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border-0 bg-white/5 px-3.5 py-1 text-xs font-semibold text-neutral-200 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-[#D4FF00]" /> Boletería Oficial
            </span>
          </div>

          {/* Lotes de Pases Estilo Ticket Stub */}
          <div className="space-y-3 relative z-10">
            {event?.ticketTiers === undefined || event?.ticketTiers === null ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-0 bg-[#14171F] shadow-sm">
                <p className="text-sm font-medium text-neutral-400 text-center">
                  Aun no tenemos informacion sobre entradas oficiales para este evento
                </p>
              </div>
            ) : event.ticketTiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-0 bg-[#D4FF00]/5 shadow-sm">
                <p className="text-sm font-black text-[#D4FF00] text-center animate-pulse">
                  Estamos buscando y calculando las entradas oficiales para este evento
                </p>
              </div>
            ) : (
              ticketTiers &&
              ticketTiers.map((tier) => {
                const isSoldOut = tier.status === "sold_out";
                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border-0 transition-all duration-300 select-none overflow-hidden",
                      isSoldOut
                        ? "bg-white/[0.01] opacity-40"
                        : "bg-[#14171F] hover:bg-[#1B202B] shadow-sm",
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base sm:text-lg font-extrabold tracking-tight text-white transition-colors">
                          {tier.name}
                        </span>
                        {isSoldOut ? (
                          <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            Agotado
                          </span>
                        ) : tier.status === "limited" ? (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Últimos pases
                          </span>
                        ) : null}
                      </div>
                      {tier.description && (
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {tier.description}
                        </p>
                      )}
                      {tier.perk && (
                        <p className="text-[11px] text-neutral-500">
                          • {tier.perk}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <span
                        className={cn(
                          "num-display text-xl sm:text-2xl",
                          isSoldOut ? "text-neutral-600 line-through" : "text-[#D4FF00]",
                        )}
                      >
                        {tier.priceLabel}
                      </span>
                      <span className="tech-label text-neutral-400">
                        {isSoldOut ? "Sin cupo" : "Precio final"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 relative z-10">
            <button
              type="button"
              onClick={() => handleBuyTicket()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D4FF00] hover:brightness-105 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_30px_rgba(212,255,0,0.16)] active:scale-[0.99] transition-all cursor-pointer border-0"
            >
              <span>Conseguir Ticket ↗</span>
            </button>
          </div>
        </section>

        {/* 5. Muro & Comunidad */}
        <section className="pt-6 border-t border-white/10">
          <CommentSection targetId={event.id} title="Muro & Comunidad" />
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

"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CommentSection } from "@/components/ui/CommentSection";
import { EventAttendanceVote } from "@/components/ui/EventAttendanceVote";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import { eventsApi } from "@/services/events";
import type { Event, RSVPResponse } from "@/types/events";
import { cn } from "@/lib/utils";

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
  const [selectedTier, setSelectedTier] = useState<string>("general");
  const [activeTab, setActiveTab] = useState<"lineup" | "info" | "venue" | "community">("lineup");

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
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // Ignored
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!event) return "#";
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title,
    )}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(
      event.description || `Evento en Root: ${event.title}`,
    )}&location=${encodeURIComponent(event.location)}`;
  };

  const googleMapsUrl = event
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : "#";

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
    if (!event) return [];
    if (event.isFree || event.price === 0) {
      return [
        {
          id: "free",
          name: "Acceso General Libre",
          description: "Entrada sin cargo válida hasta agotar capacidad del predio",
          priceLabel: "Gratis",
          status: "available" as const,
          statusLabel: "Disponible",
          perk: "Ingreso con registro previo y DNI físico",
        },
      ];
    }
    const basePrice = event.price || 25000;
    return [
      {
        id: "early_bird",
        name: "Early Bird Pass",
        description: "Acceso promocional para los primeros en llegar",
        priceLabel: `$${Math.round(basePrice * 0.75).toLocaleString("es-AR")}`,
        status: "sold_out" as const,
        statusLabel: "Agotado",
        perk: "Ingreso sin restricción horaria",
      },
      {
        id: "general",
        name: "General Access",
        description: "Acceso a pista principal y barras oficiales toda la noche",
        priceLabel: `$${basePrice.toLocaleString("es-AR")}`,
        status: "available" as const,
        statusLabel: "Disponible",
        perk: "Pase completo sin límite de permanencia",
      },
      {
        id: "vip",
        name: "VIP Backstage Experience",
        description: "Tarima preferencial elevada, barra dedicada y sanitarios exclusivos",
        priceLabel: `$${Math.round(basePrice * 1.6).toLocaleString("es-AR")}`,
        status: "limited" as const,
        statusLabel: "Últimos pases",
        perk: "Fast pass prioritario sin filas de espera",
      },
    ];
  }, [event]);

  // Selección automática del primer tier disponible
  useEffect(() => {
    if (ticketTiers.length > 0) {
      const available = ticketTiers.find((t) => t.status !== "sold_out") || ticketTiers[0];
      if (available && !ticketTiers.some((t) => t.id === selectedTier && t.status !== "sold_out")) {
        setSelectedTier(available.id);
      }
    }
  }, [ticketTiers, selectedTier]);

  const hasLineup = useMemo(() => {
    if (!event) return false;
    return (event.artists && event.artists.length > 0) || (event.lineup && event.lineup.length > 0);
  }, [event]);

  // Ajuste de pestaña si no hay lineup
  useEffect(() => {
    if (event && !hasLineup && activeTab === "lineup") {
      setActiveTab("info");
    }
  }, [event, hasLineup, activeTab]);

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

  const eventDate = new Date(event.date);
  const formattedDate = Number.isNaN(eventDate.getTime())
    ? event.date
    : new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(eventDate);

  const priceLabel =
    event.price == null
      ? "Precio a confirmar"
      : event.price === 0
        ? "Entrada libre"
        : `$${event.price.toLocaleString("es-AR")}`;

  const banner = event.cinematicBannerUrl?.trim() || fallbackBanner;
  const currentTierObj = ticketTiers.find((t) => t.id === selectedTier) || ticketTiers[0];

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
        showBrand
        onBack={() => router.push(origin || "/events")}
        onShare={handleShare}
        onSave={() => setIsSaved(!isSaved)}
        isSaved={isSaved}
        isCopied={copiedShare}
        showSave
        showShare
      />

      {/* Contenedor Principal: Columna Central Editorial (Estilo Resident Advisor / DICE / Boiler Room) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-28 md:pt-6 space-y-8 sm:space-y-10">
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
        <div className="relative group rounded-3xl overflow-hidden border border-white/[0.14] bg-neutral-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Specular top rim light */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 opacity-80" />

          {/* Ambient light glow */}
          <div
            className="absolute -inset-6 bg-cover bg-center rounded-3xl opacity-25 blur-3xl pointer-events-none hidden md:block"
            style={{ backgroundImage: `url(${banner})` }}
          />

          <div className="relative aspect-[16/9] sm:aspect-[18/9] md:aspect-[21/9] w-full overflow-hidden">
            <div
              role="img"
              aria-label={`Portada de ${event.title}`}
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${banner})` }}
            />
            {/* Viñeta cinematográfica envolvente */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/70 to-transparent" />

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
        <div className="space-y-3.5 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-[#D4FF00]">
            <span className="capitalize">{formattedDate}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 font-medium">Apertura 23:00 hs</span>
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

        {/* 3. Boletería de Noche (Liquid Glass Ticket Desk) */}
        <section
          id="tickets-section"
          className="relative space-y-6 rounded-3xl border border-white/[0.14] bg-gradient-to-b from-white/[0.09] via-neutral-950/80 to-[#0B0D10]/90 backdrop-blur-2xl backdrop-saturate-150 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(0,0,0,0.6)] overflow-hidden scroll-mt-28"
        >
          {/* Specular top rim light */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-80" />
          {/* Ambient soft refraction */}
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-28 bg-[#D4FF00]/[0.08] blur-3xl rounded-full" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 relative z-10">
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Pases & Entradas Oficiales
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Boletería directa y autorizada con acreditación RRPP Root
              </p>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-neutral-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#D4FF00]" /> Boletería Oficial
            </span>
          </div>

          {/* Lotes de Pases Estilo Ticket Stub en Vidrio Ahumado (Liquid Glass Pass) */}
          <div className="space-y-3 relative z-10">
            {ticketTiers.map((tier) => {
              const isSoldOut = tier.status === "sold_out";
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => !isSoldOut && setSelectedTier(tier.id)}
                  className={cn(
                    "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 select-none overflow-hidden",
                    isSoldOut
                      ? "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "border-[#D4FF00]/80 bg-gradient-to-r from-[#D4FF00]/15 via-[#D4FF00]/[0.04] to-transparent backdrop-blur-2xl shadow-[0_0_30px_rgba(212,255,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.22)] cursor-pointer"
                        : "border-white/[0.10] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl hover:border-white/25 hover:bg-white/[0.06] cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
                  )}
                >
                  {/* Subtle specular line for selected pass */}
                  {isSelected && (
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4FF00]/50 to-transparent" />
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "text-base sm:text-lg font-extrabold tracking-tight transition-colors",
                        isSelected ? "text-white" : "text-neutral-200",
                      )}>
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
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {tier.description}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      • {tier.perk}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <span
                      className={cn(
                        "text-xl sm:text-2xl font-black tracking-tight",
                        isSoldOut ? "text-neutral-600 line-through" : "text-[#D4FF00]",
                      )}
                    >
                      {tier.priceLabel}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {isSoldOut ? "Sin cupo" : "Precio final"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Principal Dominante de Compra */}
          <div className="pt-2 space-y-3 relative z-10">
            <button
              type="button"
              onClick={() => handleBuyTicket(selectedTier)}
              disabled={currentTierObj?.status === "sold_out"}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-2xl cursor-pointer active:scale-[0.99]",
                currentTierObj?.status === "sold_out"
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-b from-[#D4FF00] to-lime-400 text-neutral-950 shadow-[0_10px_35px_rgba(212,255,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)] hover:brightness-105 active:scale-[0.99]",
              )}
            >
              <Ticket className="h-4.5 w-4.5 stroke-[2.5]" />
              <span>
                {event.isFree
                  ? "Obtener Pase Gratuito ↗"
                  : `Conseguir Ticket — ${currentTierObj?.name} (${currentTierObj?.priceLabel}) ↗`}
              </span>
            </button>

            {/* Gancho Social: Ticket = Match de Squad Desbloqueado */}
            <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs font-semibold text-neutral-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4FF00]/20 text-[#D4FF00] shrink-0">
                <Flame className="h-3 w-3 fill-[#D4FF00]" />
              </span>
              <span>
                Al conseguir tu entrada desbloqueás tu match en el <strong>Squad de Previa</strong> de este evento.
              </span>
            </div>

            <p className="text-center text-[11px] text-neutral-500 font-medium">
              Acceso digital nominal e intransferible • Redirección directa y segura con código RRPP Root
            </p>
          </div>
        </section>

        {/* 4. Pestañas de Contenido Progresivo en Liquid Glass */}
        <div className="space-y-6">
          {/* Segmented Control Liquid Glass */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
            {hasLineup && (
              <button
                type="button"
                onClick={() => setActiveTab("lineup")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer",
                  activeTab === "lineup"
                    ? "bg-gradient-to-b from-white to-neutral-200 text-neutral-950 font-black shadow-[0_4px_15px_rgba(255,255,255,0.25)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.06] backdrop-blur-md"
                )}
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Lineup & Horarios</span>
                <span className="text-[10px] opacity-75">
                  ({event.artists?.length || event.lineup.length})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer",
                activeTab === "info"
                  ? "bg-gradient-to-b from-white to-neutral-200 text-neutral-950 font-black shadow-[0_4px_15px_rgba(255,255,255,0.25)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06] backdrop-blur-md"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>La Fiesta & Concepto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("venue")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer",
                activeTab === "venue"
                  ? "bg-gradient-to-b from-white to-neutral-200 text-neutral-950 font-black shadow-[0_4px_15px_rgba(255,255,255,0.25)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06] backdrop-blur-md"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Predio & Acceso</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("community")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shrink-0 cursor-pointer",
                activeTab === "community"
                  ? "bg-gradient-to-b from-white to-neutral-200 text-neutral-950 font-black shadow-[0_4px_15px_rgba(255,255,255,0.25)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06] backdrop-blur-md"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Muro & Comunidad</span>
            </button>
          </div>

          {/* Pestaña: Lineup (Cartelera de Festival Real en Liquid Glass) */}
          {activeTab === "lineup" && hasLineup && (
            <section className="space-y-5 rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.06] via-neutral-950/70 to-[#0B0D10]/85 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black tracking-tight text-white">
                  Lineup Confirmado & Set Times
                </h3>
                <span className="text-xs text-neutral-400">Timetable Oficial</span>
              </div>

              {event.artists && event.artists.length > 0 ? (
                <div className="space-y-3">
                  {event.artists.map((ea) => (
                    <div
                      key={ea.artistId}
                      className={cn(
                        "flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all",
                        ea.isHeadliner
                          ? "border-[#D4FF00]/40 bg-[#D4FF00]/[0.05] shadow-[inset_0_1px_1px_rgba(212,255,0,0.2)]"
                          : "border-white/5 bg-white/[0.02]",
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-900 shrink-0 border border-white/15">
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
                              ea.isHeadliner ? "text-lg text-white" : "text-base text-neutral-200",
                            )}>
                              {ea.artist?.name}
                            </h4>
                            {ea.isHeadliner && (
                              <span className="rounded-full bg-[#D4FF00] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-950">
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
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4FF00]">
                            <Clock className="w-3.5 h-3.5" />
                            {ea.performanceTime}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-3">
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
            </section>
          )}

          {/* Pestaña: Sobre la Fiesta & Concepto en Liquid Glass */}
          {activeTab === "info" && (
            <section className="space-y-6 rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.06] via-neutral-950/70 to-[#0B0D10]/85 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] animate-in fade-in duration-200">
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

          {/* Pestaña: Predio & Acceso en Liquid Glass */}
          {activeTab === "venue" && (
            <section className="space-y-5 rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.06] via-neutral-950/70 to-[#0B0D10]/85 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] animate-in fade-in duration-200">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#D4FF00]">
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4FF00]/40 bg-[#D4FF00]/10 px-4 py-2 text-xs font-bold text-[#D4FF00] hover:bg-[#D4FF00] hover:text-neutral-950 transition-all shrink-0"
                >
                  <span>Abrir en Google Maps</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-300">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-1 text-center">
                  <Clock className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="text-neutral-400">Apertura de Puertas</p>
                  <p className="font-bold text-white text-sm">23:00 hs</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-1 text-center">
                  <Clock className="h-4 w-4 mx-auto text-amber-400" />
                  <p className="text-neutral-400">Límite de Ingreso</p>
                  <p className="font-bold text-white text-sm">02:30 hs</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-1 text-center">
                  <ShieldCheck className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="text-neutral-400">Requisito Obligatorio</p>
                  <p className="font-bold text-white text-sm">DNI Físico (+18)</p>
                </div>
              </div>
            </section>
          )}

          {/* Pestaña: Muro de Comentarios */}
          {activeTab === "community" && (
            <div className="animate-in fade-in duration-200">
              <CommentSection targetId={event.id} title="Muro de la fecha" />
            </div>
          )}
        </div>

        {/* 5. Previa & Radar de Asistencia en Pista (Liquid Glass Hub) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* Tarjeta Squad de Previa (Liquid Glass) */}
          <div className="relative rounded-3xl border border-white/[0.14] bg-gradient-to-br from-white/[0.08] via-neutral-950/80 to-[#121A0F] backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.18)] space-y-5 flex flex-col justify-between overflow-hidden group">
            {/* Top specular rim light */}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            {/* Neon lime ambient corner glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 bg-[#D4FF00]/10 blur-3xl rounded-full group-hover:bg-[#D4FF00]/15 transition-all duration-500" />

            <div className="space-y-3.5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/25">
                    <Flame className="h-3.5 w-3.5 fill-neutral-950" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-[#D4FF00]">
                    Squad de Previa
                  </span>
                </div>
                <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-300">
                  Root Match
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-black tracking-tight text-white">
                  ¿Armamos previa o vas solo?
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Conectá con un Squad afín de 3 a 5 personas con tu misma zona y estilo de fiesta para coordinar previa, viaje y pista.
                </p>
              </div>
            </div>

            <Link
              href="/match"
              className="relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#D4FF00] to-lime-400 text-neutral-950 hover:brightness-105 py-3.5 text-xs font-black uppercase tracking-wider transition-all shadow-[0_8px_25px_rgba(212,255,0,0.3)] active:scale-[0.98]"
            >
              <span>Buscar mi Squad de Previa</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </Link>
          </div>

          {/* Tarjeta Radar de la Pista (Liquid Glass con VOY / NO VOY directo) */}
          <div className="relative rounded-3xl border border-white/[0.14] bg-gradient-to-b from-white/[0.08] via-neutral-950/80 to-[#0B0D10]/90 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.18)] space-y-5 flex flex-col justify-between overflow-hidden">
            {/* Top specular rim light */}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />

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
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar en Liquid Glass (Pase Rápido Nativo) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 mx-auto w-full max-w-md bg-gradient-to-b from-white/[0.09] via-neutral-950/85 to-[#0B0D10]/95 backdrop-blur-2xl border-t border-white/[0.14] px-4 py-3 shadow-[0_-15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[11px] font-bold text-neutral-300 truncate">
            {currentTierObj?.name || "General Access"}
          </span>
          <span className="text-lg font-black text-[#D4FF00] tracking-tight">
            {currentTierObj?.priceLabel || priceLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleBuyTicket(selectedTier)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#D4FF00] to-lime-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-[0_5px_20px_rgba(212,255,0,0.35)] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span>Conseguir Ticket ↗</span>
        </button>
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

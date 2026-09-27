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
import { api } from "@/lib/api";
import { eventsApi } from "@/services/events";
import type { Event, RSVPResponse } from "@/types/events";
import { cn } from "@/lib/utils";

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const { id: eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("general");

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
          name: "Acceso General - Entrada Libre",
          description: "Ingreso sin cargo válido hasta completar capacidad del recinto",
          priceLabel: "Gratis",
          status: "available",
          statusLabel: "Disponible",
          perk: "Acceso con registro y DNI",
        },
      ];
    }
    const basePrice = event.price || 25000;
    return [
      {
        id: "early_bird",
        name: "Early Bird - Lote 1",
        description: "Acceso anticipado primera etapa",
        priceLabel: `$${Math.round(basePrice * 0.75).toLocaleString("es-AR")}`,
        status: "sold_out",
        statusLabel: "Agotado",
        perk: "Ingreso en cualquier horario",
      },
      {
        id: "general",
        name: "General - Preventa Oficial",
        description: "Acceso a pista general toda la noche",
        priceLabel: `$${basePrice.toLocaleString("es-AR")}`,
        status: "available",
        statusLabel: "Últimos disponibles",
        perk: "Acceso a pista principal + barras",
      },
      {
        id: "vip",
        name: "VIP / Backstage Experience",
        description: "Acceso preferencial, tarima elevada y barra exclusiva",
        priceLabel: `$${Math.round(basePrice * 1.6).toLocaleString("es-AR")}`,
        status: "limited",
        statusLabel: "Cupos limitados",
        perk: "Baños VIP + Fast pass sin filas",
      },
    ];
  }, [event]);

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
    <div className="min-h-screen bg-[#0B0D10] pb-28 text-white relative">
      {/* Toast Feedback de Compartir */}
      {copiedShare && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#D4FF00] px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 shadow-2xl shadow-[#D4FF00]/30 animate-in fade-in slide-in-from-top-4 duration-200">
          ✓ Enlace copiado al portapapeles
        </div>
      )}

      {/* Header Superior con botones de acción funcionales (Solo móvil) */}
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

      <div className="w-full mx-auto p-4 sm:p-6 md:px-0 pt-16 md:pt-2 space-y-6 md:space-y-8">
        {/* Desktop Breadcrumb Navigation Bar */}
        <div className="hidden md:flex items-center justify-between text-xs text-neutral-400 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/events" className="hover:text-white transition-colors">
              Eventos
            </Link>
            <span>/</span>
            {event.genre && (
              <>
                <span className="text-[#D4FF00] font-black uppercase tracking-wider">
                  {event.genre}
                </span>
                <span>/</span>
              </>
            )}
            <span className="text-white font-bold truncate max-w-md uppercase tracking-tight">
              {event.title}
            </span>
          </div>

          {/* Action Icons Minimalistas (Sin texto redundante, iconos amplios y táctiles con micro-interacciones) */}
          <div className="flex items-center gap-2">
            {/* Botón Compartir */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Compartir evento"
              title="Compartir evento"
              className={cn(
                "relative group w-11 h-11 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-md",
                copiedShare
                  ? "border-[#D4FF00]/60 bg-[#D4FF00]/15 text-[#D4FF00]"
                  : "border-white/10 bg-[#14171F] hover:border-[#D4FF00]/40 hover:bg-white/10 text-neutral-300 hover:text-white",
              )}
            >
              {copiedShare ? (
                <Check className="w-5 h-5 text-[#D4FF00] stroke-[2.5] animate-in zoom-in-50 duration-150" />
              ) : (
                <Share2 className="w-5 h-5 text-neutral-300 group-hover:text-[#D4FF00] transition-colors" />
              )}
              {/* Tooltip flotante */}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/95 border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-30">
                {copiedShare ? "¡Copiado!" : "Compartir"}
              </span>
            </button>

            {/* Botón Agendar en Calendario */}
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Agendar en Google Calendar"
              title="Agendar en Google Calendar"
              className="relative group w-11 h-11 rounded-full border border-white/10 bg-[#14171F] hover:border-[#D4FF00]/40 hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200 flex items-center justify-center active:scale-95 shadow-md"
            >
              <Calendar className="w-5 h-5 text-neutral-300 group-hover:text-[#D4FF00] transition-colors" />
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/95 border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-30">
                Agendar
              </span>
            </a>

            {/* Botón Guardar Favorito */}
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              aria-label={isSaved ? "Guardado en favoritos" : "Guardar evento"}
              title={isSaved ? "Guardado en favoritos" : "Guardar evento"}
              className={cn(
                "relative group w-11 h-11 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-md",
                isSaved
                  ? "border-[#D4FF00]/60 bg-[#D4FF00]/15 text-[#D4FF00]"
                  : "border-white/10 bg-[#14171F] hover:border-white/25 hover:bg-white/10 text-neutral-300 hover:text-white",
              )}
            >
              <Bookmark
                className={cn(
                  "w-5 h-5 transition-all",
                  isSaved
                    ? "fill-[#D4FF00] text-[#D4FF00]"
                    : "text-neutral-300 group-hover:text-white",
                )}
              />
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/95 border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-30">
                {isSaved ? "Guardado" : "Guardar"}
              </span>
            </button>
          </div>
        </div>

        {/* Grilla Principal de 12 Columnas (8 Contenido / 4 Sticky Conversión) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Columna Izquierda: Contenido Principal de Experiencia y Tickets */}
          <div className="md:col-span-7 lg:col-span-8 space-y-6 md:space-y-8">
            {/* 1. Hero Poster Artwork Cinematográfico */}
            <div className="relative group rounded-3xl overflow-hidden border border-white/15 bg-neutral-950 shadow-2xl">
              {/* Resplandor Ambiental Blur en Desktop */}
              <div
                className="absolute -inset-4 bg-cover bg-center rounded-3xl opacity-20 blur-3xl pointer-events-none hidden md:block"
                style={{ backgroundImage: `url(${banner})` }}
              />

              {/* Contenedor del Póster */}
              <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[260px] sm:min-h-[340px] md:min-h-[400px] w-full overflow-hidden">
                <div
                  role="img"
                  aria-label={`Portada de ${event.title}`}
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${banner})` }}
                />
                {/* Viñeta superior e inferior sutiles */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neutral-950/70 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent" />

                {/* Badges Flotantes Superiores */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00] px-3 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-neutral-950 shadow-lg shadow-[#D4FF00]/20">
                      {priceLabel}
                    </span>
                    {event.genre && (
                      <span className="rounded-full border border-white/15 bg-neutral-950/80 backdrop-blur-md px-3 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-neutral-200">
                        {event.genre}
                      </span>
                    )}
                  </div>

                  {event.goingCount > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/15 px-3 py-1 text-[10px] md:text-[11px] font-extrabold uppercase text-neutral-200 shadow-md">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#D4FF00]" />
                      {event.goingCount} confirmados
                    </span>
                  )}
                </div>

                {/* Metadata inferior sobre la portada */}
                <div className="absolute inset-x-4 md:inset-x-6 bottom-4 md:bottom-6 z-10 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <MapPin className="h-3.5 w-3.5 text-[#D4FF00]" />
                    <span>{event.location}</span>
                  </p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white line-clamp-1 drop-shadow-md">
                    {event.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* 2. Módulo de Lotes y Entradas Oficiales (Boletería RRPP Directa) */}
            <section id="tickets-section" className="space-y-4 rounded-3xl border border-white/10 bg-[#14171F] p-5 sm:p-6 shadow-xl scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#D4FF00]/15 flex items-center justify-center text-[#D4FF00] border border-[#D4FF00]/30 shadow-md shadow-[#D4FF00]/10">
                    <Ticket className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                      Lotes y Entradas Oficiales
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                      Boletería oficial con código RRPP Root • Acreditación digital directa
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-[#D4FF00]/40 bg-[#D4FF00]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#D4FF00] shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" /> RRPP Autorizado
                </span>
              </div>

              {/* Lista Interactiva de Lotes con Redirección Directa */}
              <div className="grid grid-cols-1 gap-3">
                {ticketTiers.map((tier) => {
                  const isSoldOut = tier.status === "sold_out";
                  const isSelected = selectedTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => !isSoldOut && setSelectedTier(tier.id)}
                      className={cn(
                        "relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all",
                        isSoldOut
                          ? "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
                          : isSelected
                            ? "border-[#D4FF00] bg-[#D4FF00]/5 shadow-lg shadow-[#D4FF00]/10 cursor-pointer"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] cursor-pointer",
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black uppercase tracking-tight text-white">
                            {tier.name}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                              isSoldOut
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : tier.status === "limited"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30",
                            )}
                          >
                            {tier.statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">{tier.description}</p>
                        <p className="text-[10px] text-neutral-500 font-semibold">• {tier.perk}</p>
                      </div>

                      <div className="flex items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <span
                            className={cn(
                              "text-lg sm:text-xl font-black tracking-tight block",
                              isSoldOut ? "text-neutral-500 line-through" : "text-[#D4FF00]",
                            )}
                          >
                            {tier.priceLabel}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-neutral-500">
                            {isSoldOut ? "Agotado" : "Precio final"}
                          </span>
                        </div>

                        {/* Botón directo de Compra / Redirección RRPP */}
                        {isSoldOut ? (
                          <span className="px-3.5 py-2 rounded-xl text-neutral-500 font-bold text-xs bg-white/5 border border-white/5">
                            Sin cupo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyTicket(tier.id);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#c4ec00] text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D4FF00]/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <span>Comprar Entrada</span>
                            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3 Pilares de Seguridad y RRPP de Root */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10">
                <div className="flex items-start gap-2 text-neutral-300">
                  <ShieldCheck className="h-4 w-4 text-[#D4FF00] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-white">
                      Tickets Nominales KYC
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      Vinculados a tu identidad para erradicar estafas de reventa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-neutral-300">
                  <Flame className="h-4 w-4 text-[#D4FF00] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-white">
                      Comisión RRPP Oficial
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      Acreditación directa garantizada y acceso al Squad Matcher.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-neutral-300">
                  <Sparkles className="h-4 w-4 text-[#D4FF00] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-white">
                      QR Dinámico In-App
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      Código encriptado anticopia accesible desde tu celular.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Lineup Confirmado & Timetable */}
            {(event.artists?.length ? event.artists.length > 0 : event.lineup.length > 0) && (
              <section className="space-y-4 rounded-3xl border border-white/10 bg-[#14171F] p-5 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Disc3 className="h-5 w-5 text-[#D4FF00]" />
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-white">
                        Lineup Confirmado & Horarios
                      </h2>
                      <p className="text-[11px] text-neutral-400">
                        Artistas y set times oficiales del evento
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-neutral-400">
                    {event.artists?.length || event.lineup.length} artistas
                  </span>
                </div>

                {event.artists && event.artists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {event.artists.map((ea) => (
                      <div
                        key={ea.artistId}
                        className={cn(
                          "flex items-center gap-3.5 rounded-2xl border p-3 transition-all",
                          ea.isHeadliner
                            ? "border-[#D4FF00]/40 bg-[#D4FF00]/5 shadow-sm"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20",
                        )}
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-sm text-white truncate">{ea.artist?.name}</p>
                            {ea.isHeadliner && (
                              <span className="flex items-center gap-1 rounded-full bg-[#D4FF00] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-neutral-950">
                                <Crown className="h-2.5 w-2.5" /> Headliner
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                            {ea.artist?.artistType || "DJ Set"}
                          </p>
                          {ea.performanceTime && (
                            <p className="flex items-center gap-1 text-[10px] font-semibold text-[#D4FF00] mt-0.5">
                              <Clock className="h-2.5 w-2.5" /> {ea.performanceTime}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {event.lineup.map((artist, idx) => (
                      <div
                        key={artist}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 hover:border-[#D4FF00]/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-xs font-black text-[#D4FF00]">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase text-white truncate">{artist}</p>
                          <p className="text-[10px] font-semibold text-neutral-400">DJ Set Confirmado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 4. Información del Evento (Sobre la Fiesta & Experiencia - Diseño Elegante) */}
            <section className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-b from-[#14171F] to-[#0E1015] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D4FF00]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">
                      Información del Evento
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                      Concepto artístico, propuesta musical y reglas de la fiesta
                    </p>
                  </div>
                </div>
                {event.genre && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-300">
                    {event.genre}
                  </span>
                )}
              </div>

              {/* Ficha Técnica Minimalista */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Fecha</span>
                  <p className="font-extrabold text-white capitalize">{formattedDate.split(",")[0] || "Confirmada"}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Curaduría</span>
                  <p className="font-extrabold text-[#D4FF00] uppercase">{event.genre || "Clubbing"}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Zona</span>
                  <p className="font-extrabold text-white truncate">{event.location.split(",")[0] || "Buenos Aires"}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Admisión</span>
                  <p className="font-extrabold text-white">+18 con DNI</p>
                </div>
              </div>

              {/* Descripción Editorial de la Fiesta */}
              <div className="pt-2 border-t border-white/5">
                <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-neutral-300 font-normal">
                  {event.description || "Este evento todavía no tiene una descripción disponible."}
                </p>
              </div>
            </section>

            {/* 5. Ubicación & Logística del Predio (Venue Card) */}
            <section className="space-y-4 rounded-3xl border border-white/10 bg-[#14171F] p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#D4FF00]" />
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">
                      Ubicación & Logística del Predio
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                      Información de acceso, transporte y reglas de ingreso
                    </p>
                  </div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D4FF00]/40 bg-[#D4FF00]/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#D4FF00] hover:bg-[#D4FF00] hover:text-neutral-950 transition-all"
                >
                  <span>Google Maps</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Detalle del Venue */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00]">
                    Lugar Confirmado
                  </span>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">
                    {event.location}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Zona con accesos rápidos y paradas de transporte público habilitadas.
                  </p>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#D4FF00] hover:underline shrink-0"
                >
                  Cómo llegar paso a paso →
                </a>
              </div>

              {/* Grid de Logística 4 Bloques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-center space-y-1">
                  <Clock className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Apertura
                  </p>
                  <p className="text-xs font-black text-white">23:00 hs</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-center space-y-1">
                  <Clock className="h-4 w-4 mx-auto text-amber-400" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Límite Ingreso
                  </p>
                  <p className="text-xs font-black text-white">02:30 hs</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-center space-y-1">
                  <ShieldCheck className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Restricción
                  </p>
                  <p className="text-xs font-black text-white">+18 años (DNI)</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-center space-y-1">
                  <Sparkles className="h-4 w-4 mx-auto text-[#D4FF00]" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Dress Code
                  </p>
                  <p className="text-xs font-black text-white">Casual / Libre</p>
                </div>
              </div>
            </section>

            {/* 5. Muro de Comentarios de la Comunidad */}
            <div>
              <CommentSection targetId={event.id} title="Muro de comentarios" />
            </div>
          </div>

          {/* Columna Derecha: Panel de Compra, Social Proof y Squad Matcher (Sticky en Desktop) */}
          <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-24 space-y-6">
            {/* Panel de Compra & Acción Principal */}
            <section className="space-y-4 rounded-3xl border border-white/15 bg-gradient-to-b from-[#14171F] to-[#0E1015] p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#D4FF00] mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight text-white">
                    {event.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Compartir evento"
                    title="Compartir evento"
                    className={cn(
                      "w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-md",
                      copiedShare
                        ? "border-[#D4FF00]/60 bg-[#D4FF00]/15 text-[#D4FF00]"
                        : "border-white/10 bg-white/5 hover:border-[#D4FF00]/40 hover:bg-white/10 text-neutral-300 hover:text-white",
                    )}
                  >
                    {copiedShare ? (
                      <Check className="w-4.5 h-4.5 text-[#D4FF00] stroke-[2.5]" />
                    ) : (
                      <Share2 className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSaved(!isSaved)}
                    aria-label={isSaved ? "Guardado en favoritos" : "Guardar evento"}
                    title={isSaved ? "Guardado en favoritos" : "Guardar evento"}
                    className={cn(
                      "w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-md",
                      isSaved
                        ? "border-[#D4FF00]/60 bg-[#D4FF00]/15 text-[#D4FF00]"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 text-neutral-300 hover:text-white",
                    )}
                  >
                    <Bookmark className={cn("w-4.5 h-4.5 transition-all", isSaved && "fill-[#D4FF00]")} />
                  </button>
                </div>
              </div>

              {/* Precio y Disponibilidad */}
              <div className="flex items-baseline justify-between rounded-2xl bg-white/[0.03] border border-white/5 p-3.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Entrada General
                  </span>
                  <span className="text-2xl font-black text-[#D4FF00] tracking-tight">
                    {priceLabel}
                  </span>
                </div>
                <span className="rounded-full bg-[#D4FF00]/15 border border-[#D4FF00]/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#D4FF00]">
                  {event.isFree ? "Acceso Libre" : "Venta Activa"}
                </span>
              </div>

              {/* CTA Principal: Comprar Entrada Oficial RRPP */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleBuyTicket()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4FF00] py-3.5 text-xs font-black uppercase tracking-wider text-neutral-950 shadow-xl shadow-[#D4FF00]/25 hover:bg-[#bce400] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Ticket className="h-4 w-4 stroke-[2.5]" />
                  <span>Comprar Entrada Oficial (RRPP) ↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("tickets-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full text-center text-[11px] font-semibold text-neutral-400 hover:text-[#D4FF00] transition-colors py-1 cursor-pointer"
                >
                  Ver lotes y etapas disponibles ↓
                </button>
                <p className="text-[10px] text-center text-neutral-500 font-medium leading-tight">
                  Pase directo a boletería oficial con acreditación y código RRPP Root
                </p>
              </div>

              {/* Botón directo de Agendar */}
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-white/20 hover:text-white transition-all"
              >
                <Calendar className="h-3.5 w-3.5 text-[#D4FF00]" />
                <span>Añadir a Google Calendar</span>
              </a>

              {/* Garantías de Seguridad Oficial */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px] text-neutral-400 font-semibold">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#D4FF00] shrink-0" />
                  <span>Tickets Nominales KYC</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#D4FF00] shrink-0" />
                  <span>Acceso QR In-App</span>
                </div>
              </div>
            </section>

            {/* 2. MÓDULO DEDICADO: Encuesta & Interacción de Comunidad */}
            <section className="space-y-4 rounded-3xl border border-[#D4FF00]/30 bg-gradient-to-b from-[#14171F] via-[#161B23] to-[#0E1015] p-5 sm:p-6 shadow-2xl relative overflow-hidden group">
              {/* Glow ambiental superior */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-[#D4FF00]/10 blur-3xl group-hover:bg-[#D4FF00]/15 transition-all duration-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4FF00]/20 text-[#D4FF00]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#D4FF00]">
                    Encuesta en Vivo
                  </span>
                </div>
                <span className="rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-300">
                  Comunidad Root
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  ¿Vas a este fiestón? Registrá tu voto
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Participá en la encuesta para conectar con otros asistentes y ver quiénes de tu red ya confirmaron.
                </p>
              </div>

              {/* Votación interactiva con métricas comunitarias */}
              <EventAttendanceVote
                eventId={event.id}
                initialGoing={event.goingCount}
                initialNotGoing={event.notGoingCount}
                initialStatus={event.userRsvp}
                onChange={updateAttendance}
                showMetrics
              />

              {/* Social Proof: Personas que seguís y van */}
              <button
                type="button"
                onClick={() => setIsAttendeesOpen(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-[#D4FF00]/40 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4FF00]/20 text-[#D4FF00]">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">
                      Personas que seguís y van
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-semibold">
                      {event.goingCount} confirmaron presencia
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4FF00]">Ver →</span>
              </button>

              {/* Enlace directo a Encuesta de Reseña si ya asistió */}
              <Link
                href={`/events/${event.id}/survey`}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-neutral-400 hover:text-white hover:border-white/20 transition-all group/survey"
              >
                <span className="text-[11px] font-bold">¿Ya estuviste en esta fiesta?</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4FF00] group-hover/survey:translate-x-0.5 transition-transform">
                  Dejar reseña →
                </span>
              </Link>
            </section>

            {/* Squad Matcher Spotlight (El valor diferencial de Root) */}
            <section className="relative overflow-hidden rounded-3xl border border-[#D4FF00]/30 bg-gradient-to-br from-[#14171F] via-[#161B24] to-[#1E251A] p-5 shadow-2xl space-y-3.5 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/20">
                    <Flame className="h-4 w-4 fill-neutral-950" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#D4FF00]">
                    Squad Matcher Oficial
                  </span>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-neutral-300">
                  Root Match
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  ¿No tenés con quién ir o querés armar previa?
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Matcheá con un squad de 3 a 5 personas afines con tu misma zona y estilo de fiesta para ir a este evento.
                </p>
              </div>

              <Link
                href="/match"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4FF00] py-3 text-xs font-black uppercase tracking-wider text-neutral-950 shadow-lg shadow-[#D4FF00]/20 hover:bg-[#bce400] transition-all"
              >
                <span>Encontrar mi Squad para este evento</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </section>

            {/* Badges de Tranquilidad y Soporte */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3.5 space-y-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#D4FF00] shrink-0" />
                <span>Compra directa oficial sin intermediarios fraudulentos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#D4FF00] shrink-0" />
                <span>Ingreso directo con QR dinámico en tu app</span>
              </div>
            </div>
          </div>
        </div>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  MapPin,
  Sparkles,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/events";
import { EventCard } from "@/components/ui/EventCard";
import { parseEventRealDate } from "@/hooks/useDanceSync";

interface EventCalendarViewProps {
  events: Event[];
}

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseEventDate(dateString: string): Date | null {
  const d = parseEventRealDate(dateString);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface MonthData {
  year: number;
  month: number; // 0-11
  key: string; // YYYY-MM
  label: string;
  yearLabel: string;
  daysInMonth: number;
  firstDayOffset: number; // 0 for Monday, ..., 6 for Sunday
  daysWithEventsCount: number;
  totalEventsCount: number;
}

export function EventCalendarView({ events }: EventCalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDayKey(today), [today]);

  // Agrupar eventos por día ("YYYY-MM-DD")
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      const d = parseEventDate(event.date);
      if (!d) continue;
      const key = formatDayKey(d);
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  // Construir lista de meses ordenados cronológicamente hacia abajo (scroll vertical continuo)
  const monthsList = useMemo<MonthData[]>(() => {
    const monthsMap = new Map<string, MonthData>();

    const addMonth = (year: number, month: number) => {
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      if (monthsMap.has(key)) return;

      const firstDay = new Date(year, month, 1);
      const dayOfWeek = firstDay.getDay();
      const firstDayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      const rawLabel = new Intl.DateTimeFormat("es-AR", { month: "long" }).format(firstDay);
      const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

      monthsMap.set(key, {
        year,
        month,
        key,
        label,
        yearLabel: String(year),
        daysInMonth,
        firstDayOffset,
        daysWithEventsCount: 0,
        totalEventsCount: 0,
      });
    };

    // Añadir mes actual y próximos 5 meses
    for (let i = 0; i < 6; i++) {
      const target = new Date(today.getFullYear(), today.getMonth() + i, 1);
      addMonth(target.getFullYear(), target.getMonth());
    }

    // Añadir cualquier mes futuro que contenga eventos
    for (const event of events) {
      const d = parseEventDate(event.date);
      if (d) {
        addMonth(d.getFullYear(), d.getMonth());
      }
    }

    const result = Array.from(monthsMap.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    // Calcular totales de eventos por mes
    for (const m of result) {
      let daysWithEvents = 0;
      let totalEvs = 0;
      for (let day = 1; day <= m.daysInMonth; day++) {
        const dayKey = `${m.year}-${String(m.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayEvents = eventsByDay.get(dayKey);
        if (dayEvents && dayEvents.length > 0) {
          daysWithEvents++;
          totalEvs += dayEvents.length;
        }
      }
      m.daysWithEventsCount = daysWithEvents;
      m.totalEventsCount = totalEvs;
    }

    return result;
  }, [events, eventsByDay, today]);

  // Día seleccionado para inspeccionar eventos en modal / drawer
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [lastSelectedDayKey, setLastSelectedDayKey] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDayKey) {
      setLastSelectedDayKey(selectedDayKey);
    }
  }, [selectedDayKey]);

  const activeDayKey = selectedDayKey ?? lastSelectedDayKey;
  const isDaySheetOpen = Boolean(selectedDayKey);

  const selectedDayEvents = useMemo(() => {
    if (!activeDayKey) return [];
    return eventsByDay.get(activeDayKey) || [];
  }, [activeDayKey, eventsByDay]);

  const selectedDayFormatted = useMemo(() => {
    if (!activeDayKey) return "";
    const [y, m, d] = activeDayKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObj);
  }, [activeDayKey]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // BottomSheet en Portal con los mismos estilos y animación que los filtros de /events
  const modalContent = (
    <div
      aria-hidden={!isDaySheetOpen}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4",
        isDaySheetOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Backdrop con blur */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isDaySheetOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelectedDayKey(null);
        }}
      />

      {/* Contenedor de la BottomSheet */}
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "relative z-10 w-full sm:max-w-2xl max-h-[85dvh] sm:max-h-[90dvh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 bg-[#14171F] px-5 pt-3 pb-[calc(1.5rem+var(--root-safe-bottom))] sm:p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isDaySheetOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
        )}
      >
        {/* Indicador superior de arrastre */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden shrink-0" />

        {/* Cabecera de la BottomSheet */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon className="h-5 w-5 text-[#D4FF00] shrink-0" />
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-widest text-white capitalize truncate">
                {selectedDayFormatted}
              </h4>
              <p className="text-[10px] sm:text-xs font-bold text-[#D4FF00] uppercase tracking-wider">
                {selectedDayEvents.length === 0
                  ? "Sin eventos programados"
                  : selectedDayEvents.length === 1
                    ? "1 evento programado"
                    : `${selectedDayEvents.length} eventos programados`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDayKey(null)}
            className="rounded-full bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista de eventos del día (formato item horizontal) o estado vacío */}
        {selectedDayEvents.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <CalendarIcon className="w-10 h-10 mx-auto text-neutral-600 stroke-[1.5]" />
            <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              No hay fiestas ni eventos agendados para este día
            </p>
            <p className="text-xs text-neutral-600">
              Revisá los días marcados con fotos o el próximo fin de semana.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-3 pt-4 pb-2 hide-scrollbar">
            {selectedDayEvents.map((ev) => {
              const banner = ev.cinematicBannerUrl?.trim() || fallbackBanner;
              const priceLabel =
                ev.price == null
                  ? null
                  : ev.price === 0
                    ? "Gratis"
                    : `$${ev.price.toLocaleString("es-AR")}`;

              const evDate = parseEventRealDate(ev.date);
              const timeString = !Number.isNaN(evDate.getTime())
                ? new Intl.DateTimeFormat("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }).format(evDate)
                : null;

              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}?origin=/events`}
                  className="group relative flex items-stretch gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl bg-[#111114] hover:bg-[#16171D] border-0 transition-all duration-300 shadow-md active:scale-[0.98]"
                >
                  {/* IMAGEN A LA IZQUIERDA (Poster / Thumbnail) */}
                  <div className="relative w-24 sm:w-32 aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-neutral-900 shadow-md">
                    <div
                      role="img"
                      aria-label={`Flyer de ${ev.title}`}
                      className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
                      style={{ backgroundImage: `url(${banner})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Badge de género / categoría flotante sobre el flyer */}
                    {ev.genre && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10">
                        <span className="block truncate text-center px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#D4FF00]">
                          {ev.genre}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DATA A LA DERECHA */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    {/* Arriba: Horario y Precio */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {timeString ? (
                          <span className="tech-mono flex items-center gap-1 text-[10px] sm:text-xs font-bold text-neutral-400">
                            <Clock className="w-3 h-3 text-[#D4FF00] shrink-0" />
                            <span>{timeString} HS</span>
                          </span>
                        ) : (
                          <span className="tech-label text-neutral-500">
                            Noche
                          </span>
                        )}

                        {priceLabel && (
                          <span className="num-display px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] text-[10px] sm:text-xs">
                            {priceLabel}
                          </span>
                        )}
                      </div>

                      {/* Título del evento */}
                      <h5 className="text-sm sm:text-base font-black uppercase tracking-tight text-white line-clamp-2 group-hover:text-[#D4FF00] transition-colors pt-0.5">
                        {ev.title}
                      </h5>

                      {/* Ubicación */}
                      {ev.location && (
                        <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] sm:text-xs pt-0.5">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4FF00] shrink-0" />
                          <span className="truncate font-semibold">{ev.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Abajo: Asistentes confirmados y flecha Call-To-Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                      {ev.goingCount > 0 ? (
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold uppercase text-neutral-300">
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4FF00] shrink-0" />
                          <span className="num-display text-xs text-white">{ev.goingCount}</span>
                          <span className="tech-label text-[9px] text-neutral-400">confirmados</span>
                        </div>
                      ) : (
                        <span className="tech-label text-neutral-500">
                          Fiesta confirmada
                        </span>
                      )}

                      <span className="tech-label flex items-center gap-1 text-[#D4FF00] group-hover:translate-x-1 transition-transform">
                        <span>Ver</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Feed Vertical de Meses estilo Recuerdos BeReal */}
      {monthsList.map((month) => (
        <section
          key={month.key}
          className="space-y-4 rounded-3xl sm:rounded-4xl bg-[#111114] border-0 p-3.5 sm:p-6 shadow-2xl"
        >
          {/* Header del Mes: Nombre, Año y Contador de Eventos */}
          <div className="sticky top-[4.5rem] z-20 -mx-1 px-3 py-2.5 rounded-2xl bg-[#0B0D10]/95 backdrop-blur-xl border-0 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center text-[#D4FF00] shadow-sm">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>{month.label}</span>
                  <span className="text-neutral-500 font-extrabold">{month.yearLabel}</span>
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#D4FF00]/10 text-[#D4FF00] text-[10px] sm:text-xs font-black uppercase tracking-wider">
              {month.totalEventsCount === 0
                ? "0 eventos"
                : `${month.totalEventsCount} ${month.totalEventsCount === 1 ? "evento" : "eventos"}`}
            </span>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center pt-1 pb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Cuadrícula mensual con CARDS MÁS GRANDES */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {/* Celdas de relleno para alinear con el día inicial */}
            {Array.from({ length: month.firstDayOffset }).map((_, i) => (
              <div
                key={`empty-${month.key}-${i}`}
                className="aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-3xl bg-white/[0.01] border border-white/[0.02] opacity-20"
              />
            ))}

            {/* Días del Mes */}
            {Array.from({ length: month.daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const dayKey = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayEvents = eventsByDay.get(dayKey) || [];
              const hasEvents = dayEvents.length > 0;
              const isToday = dayKey === todayKey;
              const isSelected = dayKey === selectedDayKey;

              const mainEvent = dayEvents[0];
              const bannerUrl = mainEvent?.cinematicBannerUrl?.trim() || fallbackBanner;

              if (hasEvents) {
                const count = dayEvents.length;
                const secondEvent = count > 1 ? dayEvents[1] : null;
                const thirdEvent = count > 2 ? dayEvents[2] : null;
                const secondBanner = secondEvent?.cinematicBannerUrl?.trim() || fallbackBanner;
                const thirdBanner = thirdEvent?.cinematicBannerUrl?.trim() || fallbackBanner;

                return (
                  <button
                    type="button"
                    key={dayKey}
                    onClick={() => setSelectedDayKey(dayKey)}
                    className="relative aspect-[3/4] sm:aspect-[4/5] cursor-pointer select-none group text-left p-0 border-0 bg-transparent"
                  >
                    {/* Tarjeta de fondo 3 (si hay 3 o más eventos) */}
                    {count >= 3 && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 opacity-40 shadow-md transition-all duration-300 ease-out translate-x-1.5 -translate-y-1.5 sm:translate-x-2.5 sm:-translate-y-2.5 rotate-3 group-hover:translate-x-2.5 group-hover:-translate-y-2.5 group-hover:rotate-6 group-hover:opacity-60"
                        style={{
                          backgroundImage: `url(${thirdBanner})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/70" />
                      </div>
                    )}

                    {/* Tarjeta de fondo 2 (si hay 2 o más eventos) */}
                    {count >= 2 && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 opacity-65 shadow-md transition-all duration-300 ease-out translate-x-1 -translate-y-1 sm:translate-x-1.5 sm:-translate-y-1.5 rotate-1.5 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 group-hover:rotate-3 group-hover:opacity-85"
                        style={{
                          backgroundImage: `url(${secondBanner})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/55" />
                        {/* Brillo superior en la tarjeta secundaria */}
                        <div className="pointer-events-none absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                    )}

                    {/* Tarjeta principal (frontal) */}
                    <div
                      className={cn(
                        "relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 active:scale-95 shadow-xl shadow-black/60",
                        isSelected
                          ? "ring-2 sm:ring-4 ring-[#D4FF00] scale-[1.04] shadow-[0_0_25px_rgba(212,255,0,0.5)] z-20"
                          : count > 1
                            ? "border border-white/[0.12] border-t-white/[0.22] hover:border-[#D4FF00]/80 group-hover:scale-[1.02] z-10"
                            : "border border-white/[0.10] border-t-white/[0.20] hover:border-[#D4FF00]/80 hover:scale-[1.03] z-10"
                      )}
                    >
                      {/* Imagen de fondo del evento principal */}
                      <div
                        role="img"
                        aria-label={`Evento del día ${dayNum}: ${mainEvent.title}`}
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-115"
                        style={{ backgroundImage: `url(${bannerUrl})` }}
                      />

                      {/* Gradiente oscuro superior e inferior */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/65 group-hover:from-black/80 transition-colors" />

                      {/* Borde superior decorativo estilo Liquid Glass */}
                      <div className="pointer-events-none absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />

                      {/* Número de día en píldora frosted visible */}
                      <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
                        <span
                          className={cn(
                            "num-display flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm shadow-lg backdrop-blur-md transition-colors",
                            isSelected
                              ? "bg-[#D4FF00] text-neutral-950"
                              : isToday
                                ? "bg-[#D4FF00] text-neutral-950"
                                : "bg-black/75 text-white border border-white/25"
                          )}
                        >
                          {dayNum}
                        </span>
                      </div>

                      {/* Badge apilado con icono de cartas / indicador de stack */}
                      {count > 1 && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10">
                          <span className="num-display flex items-center gap-1 px-1.5 sm:px-2 h-4 sm:h-5 rounded-full bg-[#D4FF00] text-neutral-950 text-[9px] sm:text-[10px] shadow-lg backdrop-blur-md">
                            <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                            <span>{count}</span>
                          </span>
                        </div>
                      )}

                      {/* Pie de la card con título del evento o badge de HOY */}
                      <div className="absolute inset-x-1.5 bottom-1.5 sm:inset-x-2.5 sm:bottom-2.5 z-10 flex flex-col gap-0.5">
                        {isToday && (
                          <span className="tech-label inline-block w-fit px-1.5 py-0.5 rounded-md bg-[#D4FF00] text-neutral-950 text-[8px] sm:text-[9px] shadow-sm">
                            HOY
                          </span>
                        )}
                        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-tight text-white drop-shadow-md line-clamp-1 group-hover:text-[#D4FF00] transition-colors">
                          {mainEvent.title}
                        </p>
                        {count > 1 ? (
                          <p className="text-[8px] sm:text-[9px] font-bold text-[#D4FF00]/90 truncate">
                            +{count - 1} {count - 1 === 1 ? "más" : "más"}
                          </p>
                        ) : mainEvent.location ? (
                          <p className="hidden sm:block text-[9px] font-semibold text-neutral-300 truncate opacity-85">
                            {mainEvent.location}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              }

              // Día sin eventos: Card espaciosa en dark obsidian interactiva
              return (
                <button
                  type="button"
                  key={dayKey}
                  onClick={() => setSelectedDayKey(dayKey)}
                  className={cn(
                    "relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center select-none transition-all cursor-pointer",
                    isToday
                      ? "border-[#D4FF00]/50 bg-[#D4FF00]/10 shadow-sm shadow-[#D4FF00]/15"
                      : "border-white/5 bg-[#14171F]/40 hover:bg-[#14171F]/60"
                  )}
                >
                  <span
                    className={cn(
                      "num-display text-xs sm:text-base",
                      isToday ? "text-[#D4FF00]" : "text-neutral-500"
                    )}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="tech-label text-[7px] sm:text-[8px] text-[#D4FF00] mt-0.5">
                      Hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Montamos el modal mediante createPortal para que escape de cualquier stacking context y PullToRefresh */}
      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </div>
  );
}

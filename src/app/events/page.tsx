"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Film,
  Filter,
  Flame,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Music,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { EventCard } from "@/components/ui/EventCard";
import { Button } from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import { api } from "@/lib/api";
import { eventsApi } from "@/services/events";
import { cn } from "@/lib/utils";
import type { Event, EventFilters, EventListResponse } from "@/types/events";

const pageSize = 12;
const emptyFilters: EventFilters = {
  genre: "all",
  location: "",
  priceType: "all",
  minPrice: "",
  maxPrice: "",
  startDate: "",
  endDate: "",
};

const genreOptions = [
  { id: "all", label: "Todos" },
  { id: "Electrónica", label: "Electrónica" },
  { id: "Cachengue", label: "Cachengue" },
  { id: "Reggaetón", label: "Reggaetón" },
  { id: "Otros", label: "Otros" },
];

interface LoadVariables {
  filters: EventFilters;
  offset: number;
  append: boolean;
  query?: string;
}

function localDayToISO(value: string, endOfDay: boolean): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return date.toISOString();
}

function getWeekendRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const day = now.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
  const friday = new Date(now);
  if (day === 0) {
    friday.setDate(now.getDate() - 2);
  } else if (day === 6) {
    friday.setDate(now.getDate() - 1);
  } else {
    friday.setDate(now.getDate() + (5 - day));
  }

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const format = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: format(friday), endDate: format(sunday) };
}

function getNext7DaysRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 7);
  const format = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: format(now), endDate: format(next) };
}

function getThisMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const format = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: format(now), endDate: format(endOfMonth) };
}

function toQueryParams(filters: EventFilters, offset: number, query?: string) {
  const params: Record<string, string | number | boolean> = { limit: pageSize, offset };
  if (filters.genre !== "all") params.genre = filters.genre;
  if (filters.location.trim()) params.location = filters.location.trim();
  if (filters.priceType === "free") params.isFree = true;
  if (filters.priceType === "paid") params.isFree = false;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.startDate) params.startDate = localDayToISO(filters.startDate, false);
  if (filters.endDate) params.endDate = localDayToISO(filters.endDate, true);
  if (query && query.trim()) params.query = query.trim();
  return params;
}

type TemporalPreset = "all" | "weekend" | "week" | "month";

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

export interface ChronologicalGroup {
  id: string;
  title: string;
  subtitle?: string;
  events: Event[];
}

function groupEventsChronologically(eventsList: Event[]): ChronologicalGroup[] {
  if (!eventsList || eventsList.length === 0) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const getDaysDiff = (target: Date) => {
    const d = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const dayOfWeek = today.getDay();
  let fridayOffset = 5 - dayOfWeek;
  if (dayOfWeek === 0) fridayOffset = -2;
  else if (dayOfWeek === 6) fridayOffset = -1;

  const friday = new Date(today);
  friday.setDate(today.getDate() + fridayOffset);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const isThisWeekend = (target: Date) => {
    const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    return t >= friday.getTime() && t <= sunday.getTime();
  };

  const groupsMap = new Map<string, ChronologicalGroup>();

  for (const event of eventsList) {
    const eventDate = new Date(event.date);
    if (Number.isNaN(eventDate.getTime())) {
      const key = "nodate";
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { id: key, title: "Próximos eventos", events: [] });
      }
      groupsMap.get(key)!.events.push(event);
      continue;
    }

    const diff = getDaysDiff(eventDate);

    if (diff === 0) {
      const key = "today";
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { id: key, title: "Hoy", subtitle: "Esta noche", events: [] });
      }
      groupsMap.get(key)!.events.push(event);
    } else if (diff === 1) {
      const key = "tomorrow";
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { id: key, title: "Mañana", events: [] });
      }
      groupsMap.get(key)!.events.push(event);
    } else if (isThisWeekend(eventDate)) {
      const key = "weekend";
      if (!groupsMap.has(key)) {
        const weekendSub = `${friday.getDate()} a ${sunday.getDate()} de ${new Intl.DateTimeFormat("es-AR", { month: "short" }).format(sunday).replace(".", "")}`;
        groupsMap.set(key, { id: key, title: "Este fin de semana", subtitle: weekendSub, events: [] });
      }
      groupsMap.get(key)!.events.push(event);
    } else if (diff > 0 && diff <= 10) {
      const key = "next-week";
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { id: key, title: "Próximos días", events: [] });
      }
      groupsMap.get(key)!.events.push(event);
    } else {
      const monthYearKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      if (!groupsMap.has(monthYearKey)) {
        const monthName = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(eventDate);
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        groupsMap.set(monthYearKey, { id: monthYearKey, title: capitalizedMonth, events: [] });
      }
      groupsMap.get(monthYearKey)!.events.push(event);
    }
  }

  return Array.from(groupsMap.values());
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [draftFilters, setDraftFilters] = useState<EventFilters>({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>({ ...emptyFilters });
  const [temporalPreset, setTemporalPreset] = useState<TemporalPreset>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "popular">("date");
  const [isWhenOpen, setIsWhenOpen] = useState(false);
  const whenDropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (whenDropdownRef.current && !whenDropdownRef.current.contains(event.target as Node)) {
        setIsWhenOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWhenOpen(false);
      }
    };
    if (isWhenOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWhenOpen]);

  const {
    mutate: fetchEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useMutation<EventListResponse, LoadVariables>(
    async ({ filters, offset, query }) => {
      const response = await eventsApi.getEvents(toQueryParams(filters, offset, query));
      return response;
    },
    {
      onSuccess: (response, variables) => {
        setEvents((current) =>
          variables.append ? [...current, ...response.data] : response.data,
        );
        setTotal(response.meta.total);
        setHasMore(response.meta.hasMore);
        setHasLoaded(true);
      },
      onError: () => setHasLoaded(true),
    },
  );

  useEffect(() => {
    void fetchEvents({ filters: emptyFilters, offset: 0, append: false }).catch(() => undefined);
  }, [fetchEvents]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search fetch when debounced query changes
  useEffect(() => {
    if (!hasLoaded) return;
    void fetchEvents({
      filters: appliedFilters,
      offset: 0,
      append: false,
      query: debouncedQuery,
    }).catch(() => undefined);
  }, [debouncedQuery]);

  // Infinite Scroll via IntersectionObserver
  useEffect(() => {
    if (!hasLoaded || !hasMore || isLoadingEvents) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchEvents({
            filters: appliedFilters,
            offset: events.length,
            append: true,
            query: debouncedQuery,
          }).catch(() => undefined);
        }
      },
      { rootMargin: "300px" },
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasLoaded, hasMore, isLoadingEvents, events.length, appliedFilters, debouncedQuery, fetchEvents]);

  // Top trending event for Hero Banner (based on goingCount survey attendance)
  const featuredEvent = useMemo(() => {
    if (events.length === 0) return null;
    const sorted = [...events].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.goingCount || 0) - (a.goingCount || 0);
    });
    return sorted[0];
  }, [events]);

  // Events list sorted by date or by attendance survey votes ("Más votados")
  const displayEvents = useMemo(() => {
    if (sortBy === "popular") {
      return [...events].sort((a, b) => (b.goingCount || 0) - (a.goingCount || 0));
    }
    return events;
  }, [events, sortBy]);

  // Chronological grouping for Agenda / List view
  const chronologicalGroups = useMemo(() => {
    return groupEventsChronologically(displayEvents);
  }, [displayEvents]);

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setShowFilters(false);
    setAppliedFilters({ ...draftFilters });
    setTemporalPreset("all");
    void fetchEvents({ filters: draftFilters, offset: 0, append: false, query: debouncedQuery })
      .catch(() => undefined);
  };

  const clearFilters = () => {
    const cleared = { ...emptyFilters };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
    setTemporalPreset("all");
    setSortBy("date");
    setSearchQuery("");
    void fetchEvents({ filters: cleared, offset: 0, append: false, query: "" })
      .catch(() => undefined);
  };

  const selectGenre = (genre: string) => {
    const next = { ...draftFilters, genre };
    setDraftFilters(next);
    setAppliedFilters(next);
    void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
  };

  const selectTemporalPreset = (preset: TemporalPreset) => {
    setTemporalPreset(preset);
    let nextDates = { startDate: "", endDate: "" };
    if (preset === "weekend") nextDates = getWeekendRange();
    else if (preset === "week") nextDates = getNext7DaysRange();
    else if (preset === "month") nextDates = getThisMonthRange();

    const nextDraft = { ...draftFilters, ...nextDates };
    setDraftFilters(nextDraft);
    setAppliedFilters(nextDraft);
    void fetchEvents({ filters: nextDraft, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
  };

  const handleSelectTemporal = (preset: TemporalPreset) => {
    selectTemporalPreset(preset);
    setIsWhenOpen(false);
  };

  const clearDateFilter = () => {
    setTemporalPreset("all");
    const next = { ...appliedFilters, startDate: "", endDate: "" };
    setDraftFilters(next);
    setAppliedFilters(next);
    setIsWhenOpen(false);
    void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
  };

  const removeSingleFilter = (key: "genre" | "location" | "priceType" | "price" | "date") => {
    const nextDraft = { ...appliedFilters };
    if (key === "genre") nextDraft.genre = "all";
    if (key === "location") nextDraft.location = "";
    if (key === "priceType") nextDraft.priceType = "all";
    if (key === "price") {
      nextDraft.minPrice = "";
      nextDraft.maxPrice = "";
    }
    if (key === "date") {
      nextDraft.startDate = "";
      nextDraft.endDate = "";
      setTemporalPreset("all");
    }
    setDraftFilters(nextDraft);
    setAppliedFilters(nextDraft);
    void fetchEvents({ filters: nextDraft, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
  };

  const isDateActive =
    temporalPreset !== "all" || !!appliedFilters.startDate || !!appliedFilters.endDate;

  const getDateLabel = () => {
    if (temporalPreset === "weekend") return "Este finde";
    if (temporalPreset === "week") return "Próximos 7 días";
    if (temporalPreset === "month") return "Este mes";
    if (appliedFilters.startDate || appliedFilters.endDate) return "Fecha elegida";
    return "¿Cuándo?";
  };

  const activeFilters =
    (appliedFilters.genre !== "all" ? 1 : 0) +
    (appliedFilters.location ? 1 : 0) +
    (appliedFilters.priceType !== "all" ? 1 : 0) +
    (appliedFilters.minPrice || appliedFilters.maxPrice ? 1 : 0) +
    (appliedFilters.startDate || appliedFilters.endDate ? 1 : 0);

  const hasActiveChips =
    appliedFilters.genre !== "all" ||
    !!appliedFilters.location ||
    appliedFilters.priceType !== "all" ||
    !!appliedFilters.minPrice ||
    !!appliedFilters.maxPrice ||
    !!debouncedQuery;

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0D10] text-white">
      <header className="glass-header-obsidian sticky top-0 z-40 flex items-center justify-between px-4 pb-3 pt-safe-header">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-[#D4FF00]" />
            <h1 className="text-lg font-black uppercase tracking-wider">Eventos</h1>
          </div>

          {/* Desktop inline search bar */}
          <div className="hidden sm:flex items-center relative flex-1 max-w-xs mx-4">
            <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fiesta, club o DJ..."
              className="w-full rounded-full bg-[#14171F] border border-white/10 pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search toggle button */}
            <button
              type="button"
              onClick={() => setIsSearchOpenMobile((prev) => !prev)}
              aria-label="Buscar"
              className={cn(
                "sm:hidden rounded-full p-2 transition-colors cursor-pointer",
                isSearchOpenMobile || searchQuery
                  ? "bg-[#D4FF00] text-neutral-950"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20",
              )}
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                showFilters || activeFilters > 0
                  ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950 shadow-sm shadow-[#D4FF00]/20"
                  : "border-white/10 bg-white/10 text-neutral-300 hover:bg-white/20",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilters > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-950 text-[10px] text-[#D4FF00]">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile expandable search bar */}
        {isSearchOpenMobile && (
          <div className="sm:hidden relative w-full pt-1 animate-fade-in">
            <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fiesta, club o DJ..."
              className="w-full rounded-full bg-[#14171F] border border-white/10 pl-8 pr-7 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3.5 text-neutral-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </header>

      <main className="space-y-4 p-4 pb-28">
        {/* Slide-over Drawer lateral para Filtros Avanzados (Cero Layout Shift) */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
              onClick={() => setShowFilters(false)}
            />

            <div className="relative z-10 w-full max-w-md h-full bg-[#0B0D10] border-l border-white/10 shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
              <form onSubmit={applyFilters} className="flex flex-col h-full justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#D4FF00]">
                      <Filter className="h-4 w-4" /> Filtros avanzados
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="rounded-full bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <Music className="h-3 w-3 text-[#D4FF00]" /> Género
                    </label>
                    <select
                      value={draftFilters.genre}
                      onChange={(event) =>
                        setDraftFilters((current) => ({ ...current, genre: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#14171F] px-3 py-2 text-xs font-semibold text-white focus:border-[#D4FF00] focus:outline-none"
                    >
                      {genreOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <MapPin className="h-3 w-3 text-[#D4FF00]" /> Lugar / zona
                    </label>
                    <input
                      value={draftFilters.location}
                      onChange={(event) =>
                        setDraftFilters((current) => ({ ...current, location: event.target.value }))
                      }
                      placeholder="Ej. Montevideo, Palermo..."
                      className="w-full rounded-2xl border border-white/10 bg-[#14171F] px-3 py-2 text-xs font-semibold text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none"
                    />
                  </div>

                  <fieldset className="space-y-1.5">
                    <legend className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <Tag className="h-3 w-3 text-[#D4FF00]" /> Tipo de precio
                    </legend>
                    <div className="flex rounded-2xl border border-white/10 bg-[#14171F] p-1">
                      {[
                        { id: "all", label: "Todos" },
                        { id: "free", label: "Gratis" },
                        { id: "paid", label: "De pago" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setDraftFilters((current) => ({
                              ...current,
                              priceType: option.id as EventFilters["priceType"],
                            }))
                          }
                          className={cn(
                            "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                            draftFilters.priceType === option.id
                              ? "bg-[#D4FF00] text-neutral-950"
                              : "text-neutral-400 hover:text-white",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Precio mínimo
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draftFilters.minPrice}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, minPrice: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Precio máximo
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draftFilters.maxPrice}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, maxPrice: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Desde
                      <input
                        type="date"
                        value={draftFilters.startDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Hasta
                      <input
                        type="date"
                        value={draftFilters.endDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <Button type="submit" size="full" disabled={isLoadingEvents}>
                    {isLoadingEvents ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                    Aplicar filtros
                  </Button>
                  {activeFilters > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="full"
                      onClick={() => {
                        clearFilters();
                        setShowFilters(false);
                      }}
                    >
                      Limpiar todos los filtros
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hero Banner: Evento con Mayor Convocatoria según las encuestas de Voy/No Voy */}
        {!hasActiveChips && !debouncedQuery && temporalPreset === "all" && featuredEvent && (
          <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950 group animate-in fade-in duration-300">
            <div
              role="img"
              aria-label={`Destacado: ${featuredEvent.title}`}
              className="w-full h-56 sm:h-72 md:h-80 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-102"
              style={{ backgroundImage: `url(${featuredEvent.cinematicBannerUrl?.trim() || fallbackBanner})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent hidden sm:block" />

            {/* Content overlay */}
            <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-end max-w-2xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00] text-neutral-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#D4FF00]/20">
                  <Flame className="h-3 w-3 fill-neutral-950" />
                  Mayor Convocatoria
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-neutral-200">
                  <CheckCircle2 className="h-3 w-3 text-[#D4FF00]" />
                  {featuredEvent.goingCount} confirmaron que van
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                {featuredEvent.title}
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-300 font-semibold">
                {featuredEvent.genre && (
                  <span className="text-[#D4FF00] font-black">{featuredEvent.genre}</span>
                )}
                {featuredEvent.genre && featuredEvent.location && <span className="text-white/30">•</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#D4FF00]" />
                  {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", weekday: "short" }).format(new Date(featuredEvent.date))}
                </span>
                {featuredEvent.location && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{featuredEvent.location}</span>
                    </span>
                  </>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={`/events/${featuredEvent.id}?origin=/events`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#D4FF00] text-neutral-950 px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/15"
                >
                  <span>Confirmar asistencia / Ver evento</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros Unificada: Dropdown ¿Cuándo? + Botón Más Votados + Separador + Scroll de Géneros */}
        <div className="flex items-center gap-2 pb-0.5">
          {/* Dropdown ¿Cuándo? (Comprimido y minimalista) */}
          <div ref={whenDropdownRef} className="relative shrink-0">
            <div
              className={cn(
                "flex items-center rounded-full border transition-all select-none",
                isDateActive
                  ? "border-[#D4FF00]/50 bg-[#D4FF00]/15 text-[#D4FF00] shadow-sm shadow-[#D4FF00]/10"
                  : "border-white/10 bg-[#14171F] text-neutral-300 hover:border-white/20 hover:text-white",
              )}
            >
              <button
                type="button"
                onClick={() => setIsWhenOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 py-1.5 text-xs font-bold tracking-wide cursor-pointer",
                  isDateActive ? "pl-3.5 pr-1.5" : "px-3.5",
                )}
              >
                <Calendar className={cn("h-3.5 w-3.5", isDateActive ? "text-[#D4FF00]" : "text-neutral-400")} />
                <span>{getDateLabel()}</span>
                {!isDateActive && (
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-neutral-400 transition-transform duration-200",
                      isWhenOpen && "rotate-180",
                    )}
                  />
                )}
              </button>

              {isDateActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateFilter();
                  }}
                  className="pr-3 pl-1 py-1.5 text-[#D4FF00]/80 hover:text-white transition-colors cursor-pointer"
                  title="Quitar filtro de fecha"
                  aria-label="Quitar filtro de fecha"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Menú Desplegable flotante */}
            {isWhenOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-[#14171F]/95 backdrop-blur-md p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  ¿Cuándo?
                </div>
                {[
                  { id: "weekend", label: "Este finde", desc: "Vie a Dom" },
                  { id: "week", label: "Próximos 7 días", desc: "Semana entrante" },
                  { id: "month", label: "Este mes", desc: "Mes en curso" },
                ].map((opt) => {
                  const isSelected = temporalPreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTemporal(opt.id as TemporalPreset)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                          : "text-neutral-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex flex-col text-left">
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-normal text-neutral-500">{opt.desc}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#D4FF00]" />}
                    </button>
                  );
                })}

                {isDateActive && (
                  <>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      type="button"
                      onClick={clearDateFilter}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                    >
                      <span>Cualquier fecha</span>
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Separador vertical sutil */}
          <div className="h-4 w-px bg-white/10 shrink-0" />

          {/* Botón rápido: Más votados (Encuestas de asistencia) */}
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === "popular" ? "date" : "popular"))}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none",
              sortBy === "popular"
                ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950 shadow-sm shadow-[#D4FF00]/20"
                : "border-white/10 bg-[#14171F] text-neutral-300 hover:border-white/20 hover:text-white",
            )}
            title="Ordenar por mayor convocatoria en encuestas de asistencia"
          >
            <Flame className={cn("h-3.5 w-3.5", sortBy === "popular" ? "text-neutral-950 fill-neutral-950" : "text-[#D4FF00]")} />
            <span>Más votados</span>
          </button>

          {/* Separador vertical sutil */}
          <div className="h-4 w-px bg-white/10 shrink-0" />

          {/* Scroll horizontal de géneros */}
          <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto">
            {genreOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectGenre(option.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                  appliedFilters.genre === option.id
                    ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950 shadow-sm shadow-[#D4FF00]/20"
                    : "border-white/10 bg-[#14171F] text-neutral-400 hover:border-white/20 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chips de Filtros Activos (solo para filtros adicionales no cubiertos directamente en la barra principal) */}
        {hasActiveChips && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-0.5 select-none">
              Filtros:
            </span>
            {appliedFilters.genre !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200">
                {appliedFilters.genre}
                <button
                  type="button"
                  onClick={() => selectGenre("all")}
                  className="hover:text-[#D4FF00] cursor-pointer"
                  title="Quitar filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {appliedFilters.location && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200">
                Zona: {appliedFilters.location}
                <button
                  type="button"
                  onClick={() => removeSingleFilter("location")}
                  className="hover:text-[#D4FF00] cursor-pointer"
                  title="Quitar zona"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {appliedFilters.priceType !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200">
                {appliedFilters.priceType === "free" ? "Gratis" : "De pago"}
                <button
                  type="button"
                  onClick={() => removeSingleFilter("priceType")}
                  className="hover:text-[#D4FF00] cursor-pointer"
                  title="Quitar precio"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200">
                ${appliedFilters.minPrice || "0"} - ${appliedFilters.maxPrice || "∞"}
                <button
                  type="button"
                  onClick={() => removeSingleFilter("price")}
                  className="hover:text-[#D4FF00] cursor-pointer"
                  title="Quitar rango de precio"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#D4FF00]">
                "{debouncedQuery}"
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-white cursor-pointer"
                  title="Quitar búsqueda"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 hover:text-[#D4FF00] ml-1 transition-colors cursor-pointer"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Subheader: Próximos eventos + total + Selector de vistas */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-300">
              <Sparkles className="h-4 w-4 text-[#D4FF00]" />
              {sortBy === "popular" ? "Mayor Convocatoria" : "Próximos eventos"}
            </h2>
            <span className="rounded-full border border-[#D4FF00]/20 bg-[#D4FF00]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
              {hasLoaded ? `${total} eventos` : "Cargando..."}
            </span>
          </div>

          {/* Selector de vistas (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center rounded-2xl border border-white/10 bg-[#14171F] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vista Grilla"
              aria-label="Vista Grilla"
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-[#D4FF00] text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Grilla</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vista Agenda"
              aria-label="Vista Agenda"
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-[#D4FF00] text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Agenda</span>
            </button>
          </div>
        </div>

        {/* Contenedor Principal de Eventos (Grilla o Lista Cronológica) */}
        {!hasLoaded && isLoadingEvents ? (
          viewMode === "list" ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-20 w-full animate-pulse rounded-2xl md:rounded-3xl border border-white/5 bg-[#14171F]"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="mx-auto aspect-[4/5] w-full max-w-md animate-pulse rounded-3xl border border-white/5 bg-[#14171F] md:max-w-none"
                />
              ))}
            </div>
          )
        ) : eventsError && events.length === 0 ? (
          <div className="space-y-4 rounded-3xl border border-rose-500/20 bg-[#14171F] p-8 text-center">
            <RefreshCw className="mx-auto h-7 w-7 text-rose-400" />
            <p className="text-sm font-bold text-white">No pudimos cargar los eventos.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void fetchEvents({ filters: appliedFilters, offset: 0, append: false })
              }
            >
              Reintentar
            </Button>
          </div>
        ) : displayEvents.length > 0 ? (
          viewMode === "list" ? (
            /* Vista Agenda Cronológica Agrupada */
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {chronologicalGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  {/* Encabezado Cronológico de Grupo */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#D4FF00]" />
                      <span className="text-xs font-black uppercase tracking-widest text-neutral-200">
                        {group.title}
                      </span>
                      {group.subtitle && (
                        <span className="text-[11px] font-semibold text-neutral-400">
                          • {group.subtitle}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-neutral-400">
                      {group.events.length} {group.events.length === 1 ? "evento" : "eventos"}
                    </span>
                  </div>

                  {/* Lista de eventos del grupo */}
                  <div className="flex flex-col gap-3">
                    {group.events.map((event) => (
                      <EventCard key={event.id} event={event} variant="list" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vista Grilla Espaciosa con Foco en Portadas */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 animate-in fade-in duration-300">
              {displayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="full"
                />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3 rounded-3xl border border-white/5 bg-[#14171F]/50 p-8 text-center">
            <Film className="mx-auto h-8 w-8 text-neutral-500" />
            <p className="text-sm font-bold uppercase tracking-wider text-white">
              No hay próximos eventos con esos filtros
            </p>
            <p className="text-xs text-neutral-400">Probá ampliar el rango o limpiar los filtros.</p>
            <Button size="sm" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}

        {/* Skeletons de Carga Continua (Scroll Infinito) */}
        {isLoadingEvents && events.length > 0 && (
          <div
            className={cn(
              viewMode === "list"
                ? "flex flex-col gap-3 pt-2"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 pt-2",
            )}
          >
            {[1, 2, 3].map((item) =>
              viewMode === "list" ? (
                <div
                  key={item}
                  className="h-20 w-full animate-pulse rounded-2xl md:rounded-3xl border border-white/5 bg-[#14171F]"
                />
              ) : (
                <div
                  key={item}
                  className="mx-auto aspect-[4/5] w-full max-w-md animate-pulse rounded-3xl border border-white/5 bg-[#14171F] md:max-w-none"
                />
              ),
            )}
          </div>
        )}

        {/* Sentinel invisible para IntersectionObserver (Scroll Infinito automático) */}
        <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />
      </main>
    </div>
  );
}

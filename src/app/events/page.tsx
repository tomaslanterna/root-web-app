"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  MessageSquare,
  Music,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { EventCard } from "@/components/ui/EventCard";
import { Button } from "@/components/ui/Button";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { SurveyCard } from "@/components/ui/SurveyCard";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { LiveEventBanner } from "@/components/LiveEventBanner";
import { EventCalendarView } from "@/components/events/EventCalendarView";
import { useMutation } from "@/hooks/useMutation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { eventsApi } from "@/services/events";
import { surveysApi } from "@/services/surveys";
import { cn } from "@/lib/utils";
import { useEventsInbox } from "@/context/FeedInboxContext";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import type { Event, EventFilters, EventListResponse } from "@/types/events";

const pageSize = 10;
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
  { id: "all", label: "Todas las categorías" },
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
  const router = useRouter();
  const { user } = useAuth();
  const inbox = useEventsInbox();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingSurveys, setPendingSurveys] = useState<Event[]>([]);
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "calendar">("grid");
  const [sortBy, setSortBy] = useState<"date" | "popular">("date");
  const [isWhenOpen, setIsWhenOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const whenDropdownRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const openInbox = inbox?.open ?? (() => router.push("/chat?from=events"));
  const { ref: swipeRef } = useHorizontalSwipe(
    -1,
    !!user && !isMenuOpen && !showFilters && !isWhenOpen && !isGenreOpen,
    openInbox,
    inbox ? { onProgress: inbox.move, onCancel: inbox.cancel } : undefined,
  );

  const { mutate: fetchPendingSurveys } = useMutation<Event[], void>(
    surveysApi.getPendingSurveys,
    {
      onSuccess: (data) => {
        setPendingSurveys(data);
      },
      onError: (err) => {
        console.error("Error fetching pending surveys:", err);
      },
    }
  );

  useEffect(() => {
    if (user) {
      void fetchPendingSurveys().catch(() => undefined);
    }
  }, [fetchPendingSurveys, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (whenDropdownRef.current && !whenDropdownRef.current.contains(target)) {
        setIsWhenOpen(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(target)) {
        setIsGenreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWhenOpen(false);
        setIsGenreOpen(false);
      }
    };
    if (isWhenOpen || isGenreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWhenOpen, isGenreOpen]);

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

  const handleRefresh = async () => {
    try {
      await fetchEvents({ filters: appliedFilters, offset: 0, append: false, query: debouncedQuery });
      if (user) {
        await fetchPendingSurveys();
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    setIsWhenOpen(false);
    setIsGenreOpen(false);
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

  const isGenreActive =
    appliedFilters.genre !== "all" && Boolean(appliedFilters.genre);

  const getGenreLabel = () => {
    if (isGenreActive) {
      const match = genreOptions.find((opt) => opt.id === appliedFilters.genre);
      return match ? match.label : appliedFilters.genre;
    }
    return "Categorías";
  };

  const handleSelectGenre = (genreId: string) => {
    setIsGenreOpen(false);
    selectGenre(genreId);
  };

  const clearGenreFilter = () => {
    setIsGenreOpen(false);
    selectGenre("all");
  };

  const activeFilters =
    (appliedFilters.genre !== "all" ? 1 : 0) +
    (appliedFilters.location ? 1 : 0) +
    (appliedFilters.priceType !== "all" ? 1 : 0) +
    (appliedFilters.minPrice || appliedFilters.maxPrice ? 1 : 0) +
    (appliedFilters.startDate || appliedFilters.endDate ? 1 : 0) +
    (sortBy === "popular" ? 1 : 0);

  const hasActiveChips =
    !!appliedFilters.location ||
    appliedFilters.priceType !== "all" ||
    !!appliedFilters.minPrice ||
    !!appliedFilters.maxPrice ||
    sortBy === "popular" ||
    !!debouncedQuery;

  return (
    <div
      ref={swipeRef}
      className="feed-swipe events-swipe flex min-h-screen flex-col bg-[#0B0D10] text-white"
    >
      {/* Root Sticky Header (Móvil) */}
      <header
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="md:hidden sticky top-0 z-40 glass-header-obsidian transition-all duration-300 cursor-pointer pt-[var(--root-safe-top)]"
      >
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15">
              r
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">root</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={user ? "Abrir mensajes" : "Iniciar sesión para ver mensajes"}
              onClick={(event) => {
                event.stopPropagation();
                if (!user) {
                  router.push("/login");
                  return;
                }
                openInbox();
              }}
              className="rounded-full border border-white/10 bg-white/5 p-2.5 text-[#D4FF00] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4FF00]"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(true);
              }}
              className="bg-[#D4FF00] text-neutral-950 p-2 rounded-full hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/10 flex items-center justify-center gap-1.5 px-3.5 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Crear</span>
            </button>
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 px-4 md:px-6 pt-4 md:pt-24 pb-28 w-full max-w-7xl mx-auto">
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

                  <fieldset className="space-y-1.5">
                    <legend className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <Flame className="h-3 w-3 text-[#D4FF00]" /> Ordenar por
                    </legend>
                    <div className="flex rounded-2xl border border-white/10 bg-[#14171F] p-1">
                      <button
                        type="button"
                        onClick={() => setSortBy("date")}
                        className={cn(
                          "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                          sortBy === "date"
                            ? "bg-[#D4FF00] text-neutral-950"
                            : "text-neutral-400 hover:text-white",
                        )}
                      >
                        Próximos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("popular")}
                        className={cn(
                          "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          sortBy === "popular"
                            ? "bg-[#D4FF00] text-neutral-950"
                            : "text-neutral-400 hover:text-white",
                        )}
                      >
                        <Flame className={cn("h-3.5 w-3.5", sortBy === "popular" ? "text-neutral-950 fill-neutral-950" : "text-[#D4FF00]")} />
                        Más votados
                      </button>
                    </div>
                  </fieldset>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <Music className="h-3 w-3 text-[#D4FF00]" /> Género
                    </label>
                    <select
                      value={draftFilters.genre}
                      onChange={(event) =>
                        setDraftFilters((current) => ({ ...current, genre: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs font-semibold text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
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
                      className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs font-semibold text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none transition-colors"
                    />
                  </div>

                  <fieldset className="space-y-1.5">
                    <legend className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <Tag className="h-3 w-3 text-[#D4FF00]" /> Tipo de precio
                    </legend>
                    <div className="flex rounded-2xl border border-white/[0.06] bg-black/40 p-1">
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
                              ? "bg-[#D4FF00] text-neutral-950 shadow-sm"
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
                        className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
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
                        className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
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
                        className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
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
                        className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
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
                        setSortBy("date");
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

        {/* Live Activity Banner */}
        <LiveEventBanner />

        {/* Searchbar */}
        <div className="w-full">
          <div
            onClick={() => router.push("/search")}
            className="w-full bg-[#111114] border-0 rounded-full px-4 py-3 flex items-center gap-3 text-neutral-400 hover:bg-[#16171D] transition-colors cursor-text shadow-md"
          >
            <Sparkles className="w-4 h-4 text-[#D4FF00]" />
            <span className="text-sm font-semibold tracking-wide">
              Buscar eventos, artistas o clubes...
            </span>
          </div>
        </div>

        {/* Swimlane de Encuestas Pendientes */}
        {pendingSurveys.length > 0 && (
          <div className="mt-2 mb-2">
            <div
              className={cn(
                "flex overflow-x-auto overflow-y-hidden touch-pan-x snap-x snap-mandatory hide-scrollbar gap-4 py-1 scroll-px-4",
                pendingSurveys.length === 1 ? "justify-center" : "justify-start"
              )}
            >
              {pendingSurveys.map((surveyEvent) => (
                <SurveyCard key={surveyEvent.id} surveyEvent={surveyEvent} />
              ))}
            </div>
          </div>
        )}

        {/* Hero Banner: Evento Destacado con Enfoque en Artwork y Guía en la Lectura */}
        {!hasActiveChips && !debouncedQuery && !isDateActive && !isGenreActive && featuredEvent && (
          <Link
            href={`/events/${featuredEvent.id}?origin=/events`}
            className="group relative block w-full rounded-3xl overflow-hidden border border-white/[0.08] border-t-white/[0.2] shadow-[0_20px_50px_rgba(0,0,0,0.7)] bg-neutral-950 transition-all duration-300 hover:border-white/[0.16] hover:border-t-[#D4FF00]/60 cursor-pointer animate-in fade-in"
          >
            {/* Specular top rim light */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 opacity-80" />

            {/* Background Artwork Image (Alto amplio y nítido para apreciar el póster) */}
            <div
              role="img"
              aria-label={`Destacado: ${featuredEvent.title}`}
              className="w-full h-72 sm:h-80 md:h-[380px] lg:h-[420px] bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${featuredEvent.cinematicBannerUrl?.trim() || fallbackBanner})` }}
            />

            {/* Viñeta sutil superior (protege la legibilidad de badges sin tapar el arte) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neutral-950/70 to-transparent" />

            {/* Gradiente inferior suave (solo en el 45% inferior para mantener el centro del póster despejado) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent" />

            {/* Badge Flotante Superior: Destacado / Asistencia */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.08] border-t-white/[0.16] px-3 py-1 tech-label text-[10px] text-[#D4FF00] shadow-sm">
                <Flame className="h-3.5 w-3.5 fill-[#D4FF00] text-[#D4FF00]" />
                Destacado
              </span>
              {featuredEvent.goingCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.08] px-2.5 py-1 text-neutral-200 shadow-sm">
                  <CheckCircle2 className="h-3 w-3 text-[#D4FF00]" />
                  <span className="num-display text-xs text-white">{featuredEvent.goingCount}</span>
                  <span className="tech-label text-[9px] text-neutral-300">confirmados</span>
                </span>
              )}
            </div>

            {/* Contenido Inferior con Guía de Lectura Clara y Descomprimida */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7 md:p-8 flex flex-col justify-end max-w-3xl space-y-2.5">
              {/* 1. Categoría / Género */}
              {featuredEvent.genre && (
                <span className="tech-label text-xs text-[#D4FF00]">
                  {featuredEvent.genre}
                </span>
              )}

              {/* 2. Título del Evento */}
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md group-hover:text-[#D4FF00] transition-colors line-clamp-2">
                {featuredEvent.title}
              </h2>

              {/* 3. Metadata Esencial (Fecha y Ubicación con buen espaciado) */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-300 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#D4FF00] shrink-0" />
                  <span className="capitalize">
                    {new Intl.DateTimeFormat("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(featuredEvent.date))}
                  </span>
                </div>
                {featuredEvent.location && (
                  <>
                    <span className="text-white/30">•</span>
                    <div className="flex items-center gap-1.5 truncate max-w-xs sm:max-w-md">
                      <MapPin className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="truncate">{featuredEvent.location}</span>
                    </div>
                  </>
                )}
              </div>

              {/* 4. Call to Action Claro: "Conseguir Entradas" con Flecha interactiva */}
              <div className="pt-2 sm:pt-3 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#D4FF00] px-4 py-2 sm:px-5 sm:py-2.5 tech-label text-neutral-950 shadow-[0_10px_35px_rgba(212,255,0,0.16)] group-hover:brightness-105 transition-all">
                  <span>Conseguir Entradas</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Barra de Filtros y Selector de Vistas (Organizado en 2 filas) */}
        <div className="relative z-20 flex flex-col gap-2.5 py-2.5 px-3 md:px-4 rounded-3xl bg-[#111114] border-0 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] transition-all">
          {/* Fila 1: Filtros (Únicamente ¿Cuándo?, Categorías y Botón de Filtros) */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown ¿Cuándo? */}
              <div ref={whenDropdownRef} className="relative shrink-0">
                <div
                  className={cn(
                    "flex items-center rounded-full transition-all select-none",
                    isDateActive
                      ? "bg-[#D4FF00]/15 text-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.15)] border-0"
                      : "border border-white/[0.06] border-t-white/[0.12] bg-white/[0.04] text-neutral-300 hover:border-white/[0.14] hover:text-white hover:bg-white/[0.07]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsWhenOpen((prev) => !prev);
                      setIsGenreOpen(false);
                    }}
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

                {/* Menú Desplegable flotante de Fecha */}
                {isWhenOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-[#14171F] p-1.5 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                    <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
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

              {/* Dropdown Categorías */}
              <div ref={genreDropdownRef} className="relative shrink-0">
                <div
                  className={cn(
                    "flex items-center rounded-full border transition-all select-none",
                    isGenreActive
                      ? "border-[#D4FF00]/50 bg-[#D4FF00]/15 text-[#D4FF00] shadow-sm shadow-[#D4FF00]/10"
                      : "border-white/10 bg-[#14171F] text-neutral-300 hover:border-white/20 hover:text-white",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsGenreOpen((prev) => !prev);
                      setIsWhenOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 py-1.5 text-xs font-bold tracking-wide cursor-pointer",
                      isGenreActive ? "pl-3.5 pr-1.5" : "px-3.5",
                    )}
                  >
                    <Music className={cn("h-3.5 w-3.5", isGenreActive ? "text-[#D4FF00]" : "text-neutral-400")} />
                    <span>{getGenreLabel()}</span>
                    {!isGenreActive && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-neutral-400 transition-transform duration-200",
                          isGenreOpen && "rotate-180",
                        )}
                      />
                    )}
                  </button>

                  {isGenreActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearGenreFilter();
                      }}
                      className="pr-3 pl-1 py-1.5 text-[#D4FF00]/80 hover:text-white transition-colors cursor-pointer"
                      title="Quitar filtro de categoría"
                      aria-label="Quitar filtro de categoría"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Menú Desplegable flotante de Categorías */}
                {isGenreOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-white/[0.08] border-t-white/[0.16] bg-[#14171F]/95 p-1.5 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                    <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Categoría
                    </div>
                    {genreOptions.map((opt) => {
                      const isSelected =
                        opt.id === "all"
                          ? !isGenreActive
                          : appliedFilters.genre.toLowerCase() === opt.id.toLowerCase();
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectGenre(opt.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                            isSelected
                              ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                              : "text-neutral-300 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#D4FF00]" />}
                        </button>
                      );
                    })}

                    {isGenreActive && (
                      <>
                        <div className="my-1 border-t border-white/[0.06]" />
                        <button
                          type="button"
                          onClick={clearGenreFilter}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                        >
                          <span>Todas las categorías</span>
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botón Drawer de Filtros Avanzados */}
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              aria-label="Filtros avanzados"
              title="Filtros avanzados"
              className={cn(
                "shrink-0 flex items-center justify-center gap-1.5 rounded-full p-2 text-xs font-black transition-all cursor-pointer select-none",
                showFilters || activeFilters > 0
                  ? "bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/25"
                  : "border border-white/[0.08] border-t-white/[0.14] bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilters > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-950 text-[10px] text-[#D4FF00]">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Fila 2: Elección del Layout (Grilla / Agenda / Calendario) */}
          <div className="flex items-center justify-start sm:justify-end pt-2 border-t border-white/5">
            <div className="flex items-center rounded-full border-0 bg-black/60 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Vista Cuadrícula"
                aria-label="Vista Cuadrícula"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="tech-label text-[10px]">Grilla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Vista Agenda"
                aria-label="Vista Agenda"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span className="tech-label text-[10px]">Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                title="Vista Calendario"
                aria-label="Vista Calendario"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  viewMode === "calendar"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="tech-label text-[10px]">Calendario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chips de Filtros Activos (solo para filtros adicionales no cubiertos directamente en la barra principal) */}
        {hasActiveChips && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-0.5 select-none">
              Filtros:
            </span>
            {appliedFilters.location && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200 shadow-sm">
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
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200 shadow-sm">
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
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200 shadow-sm">
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
            {sortBy === "popular" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D4FF00]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#D4FF00]">
                <Flame className="h-3 w-3 fill-[#D4FF00]" />
                Más votados
                <button
                  type="button"
                  onClick={() => setSortBy("date")}
                  className="hover:text-white cursor-pointer"
                  title="Quitar más votados"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D4FF00]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#D4FF00]">
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

        {/* Subheader: Próximos eventos + total contador */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="flex items-center gap-2 tech-label text-xs text-neutral-300">
              <Sparkles className="h-4 w-4 text-[#D4FF00]" />
              {sortBy === "popular" ? "Mayor Convocatoria" : "Próximos eventos"}
            </h2>
            <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00]/10 px-2.5 py-1">
              <span className="num-display text-xs text-white">{hasLoaded ? total : "…"}</span>
              <span className="tech-label text-[9px] text-[#D4FF00]">{hasLoaded ? "eventos" : "cargando"}</span>
            </span>
          </div>
        </div>

        {/* Contenedor Principal de Eventos (Grilla, Lista Cronológica o Calendario estilo BeReal) */}
        {!hasLoaded && isLoadingEvents ? (
          viewMode === "calendar" ? (
            <div className="rounded-3xl border border-white/5 bg-[#14171F] p-5 space-y-4 animate-pulse">
              <div className="h-8 w-48 rounded-full bg-white/10" />
              <div className="grid grid-cols-7 gap-2 pt-4">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-white/5" />
                ))}
              </div>
            </div>
          ) : viewMode === "list" ? (
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
          viewMode === "calendar" ? (
            /* Vista Calendario estilo Recuerdos BeReal */
            <EventCalendarView events={displayEvents} />
          ) : viewMode === "list" ? (
            /* Vista Agenda Cronológica Agrupada */
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {chronologicalGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  {/* Encabezado Cronológico de Grupo */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 pt-1">
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
                    <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 flex items-center gap-1">
                      <span className="num-display text-xs text-white">{group.events.length}</span>
                      <span className="tech-label text-[9px] text-neutral-400">{group.events.length === 1 ? "evento" : "eventos"}</span>
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

        {/* Indicador de Carga Continua (Scroll Infinito) */}
        {isLoadingEvents && events.length > 0 && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4 gap-3 animate-in fade-in duration-300">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4FF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Cargando más eventos...
            </span>
          </div>
        )}

        {/* Sentinel invisible para IntersectionObserver (Scroll Infinito automático) */}
        <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />
        </div>
      </PullToRefresh>

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

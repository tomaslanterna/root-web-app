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
import { parseEventRealDate } from "@/hooks/useDanceSync";
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

const citySuggestions = [
  "Montevideo",
  "Punta del Este",
  "Maldonado",
  "Buenos Aires",
  "Canelones",
  "Colonia",
  "Rocha",
];

interface LoadVariables {
  filters: EventFilters;
  offset: number;
  append: boolean;
  query?: string;
  limit?: number;
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

function toQueryParams(
  filters: EventFilters,
  offset: number,
  query?: string,
  limit: number = pageSize,
) {
  const params: Record<string, string | number | boolean> = { limit, offset };
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
    const eventDate = parseEventRealDate(event.date);
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
  const [activeSheetType, setActiveSheetType] = useState<"when" | "location">("when");
  const [cityQuery, setCityQuery] = useState("");
  const [isDatesOpen, setIsDatesOpen] = useState(false);
  const filtersContainerRef = useRef<HTMLDivElement>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const openInbox = inbox?.open ?? (() => router.push("/chat?from=events"));
  const { ref: swipeRef } = useHorizontalSwipe(
    -1,
    !!user && !isMenuOpen && !showFilters && !isWhenOpen && !isGenreOpen && !isDatesOpen,
    openInbox,
    inbox ? { onProgress: inbox.move, onCancel: inbox.cancel } : undefined,
  );

  const isEventFinished = (ev: Event) => {
    const startDate = parseEventRealDate(ev.date).getTime();
    const endDate = ev.endDate ? parseEventRealDate(ev.endDate).getTime() : 0;
    const finishTime = endDate > startDate ? endDate : startDate + 4 * 60 * 60 * 1000;
    return Date.now() >= finishTime;
  };

  const { mutate: fetchPendingSurveys } = useMutation<Event[], void>(
    surveysApi.getPendingSurveys,
    {
      onSuccess: (data) => {
        const endedSurveys = (data || []).filter(isEventFinished);
        setPendingSurveys(endedSurveys);
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filtersContainerRef.current &&
        !filtersContainerRef.current.contains(target) &&
        (!bottomSheetRef.current || !bottomSheetRef.current.contains(target))
      ) {
        setIsWhenOpen(false);
        setIsGenreOpen(false);
        setIsDatesOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWhenOpen(false);
        setIsGenreOpen(false);
        setIsDatesOpen(false);
      }
    };
    if (isWhenOpen || isGenreOpen || isDatesOpen) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWhenOpen, isGenreOpen, isDatesOpen]);

  const {
    mutate: fetchEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useMutation<EventListResponse, LoadVariables>(
    async ({ filters, offset, query, limit }) => {
      const response = await eventsApi.getEvents(
        toQueryParams(filters, offset, query, limit),
      );
      return response;
    },
    {
      onSuccess: (response, variables) => {
        setEvents((current) => {
          if (!variables.append) return response.data;
          const existingIds = new Set(current.map((ev) => ev.id));
          const uniqueNew = response.data.filter((ev) => !existingIds.has(ev.id));
          return [...current, ...uniqueNew];
        });
        setTotal(response.meta.total);
        setHasMore(response.data.length > 0 && response.meta.hasMore);
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

  // Carga automática progresiva de las páginas restantes al activar la vista Calendario
  useEffect(() => {
    if (viewMode !== "calendar" || !hasLoaded || !hasMore || isLoadingEvents) return;
    void fetchEvents({
      filters: appliedFilters,
      offset: events.length,
      append: true,
      query: debouncedQuery,
      limit: 50,
    }).catch(() => undefined);
  }, [viewMode, hasLoaded, hasMore, isLoadingEvents, events.length, appliedFilters, debouncedQuery, fetchEvents]);

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
    setIsDatesOpen(false);
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
    setIsDatesOpen(false);
    void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
  };

  const applyCustomDates = () => {
    setTemporalPreset("all");
    const next = {
      ...appliedFilters,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
    };
    setDraftFilters(next);
    setAppliedFilters(next);
    setIsDatesOpen(false);
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

  const isCustomDateActive =
    temporalPreset === "all" && (!!appliedFilters.startDate || !!appliedFilters.endDate);

  const formatShortDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })
      .format(new Date(year, month - 1, day))
      .replace(".", "");
  };

  const getDateLabel = () => {
    if (temporalPreset === "weekend") return "Este finde";
    if (temporalPreset === "week") return "Próximos 7 días";
    if (temporalPreset === "month") return "Este mes";
    if (isCustomDateActive) {
      if (appliedFilters.startDate && appliedFilters.endDate) {
        if (appliedFilters.startDate === appliedFilters.endDate) {
          return formatShortDate(appliedFilters.startDate);
        }
        return `${formatShortDate(appliedFilters.startDate)} - ${formatShortDate(appliedFilters.endDate)}`;
      }
      if (appliedFilters.startDate) return `Desde ${formatShortDate(appliedFilters.startDate)}`;
      if (appliedFilters.endDate) return `Hasta ${formatShortDate(appliedFilters.endDate)}`;
    }
    return "¿Cuándo?";
  };

  const isLocationActive = Boolean(appliedFilters.location.trim());

  const getLocationLabel = () => {
    if (isLocationActive) {
      return appliedFilters.location.trim();
    }
    return "Ubicación";
  };

  const applyLocationFilter = (cityValue: string) => {
    const trimmed = cityValue.trim();
    const next = { ...appliedFilters, location: trimmed };
    setDraftFilters(next);
    setAppliedFilters(next);
    setCityQuery(trimmed);
    setIsGenreOpen(false);
    void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(
      () => undefined,
    );
  };

  const clearLocationFilter = () => {
    setCityQuery("");
    const next = { ...appliedFilters, location: "" };
    setDraftFilters(next);
    setAppliedFilters(next);
    setIsGenreOpen(false);
    void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(
      () => undefined,
    );
  };

  const filteredCitySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return citySuggestions;
    return citySuggestions.filter((c) => c.toLowerCase().includes(q));
  }, [cityQuery]);

  const activeFilters =
    (appliedFilters.genre !== "all" ? 1 : 0) +
    (appliedFilters.location ? 1 : 0) +
    (appliedFilters.priceType !== "all" ? 1 : 0) +
    (appliedFilters.minPrice || appliedFilters.maxPrice ? 1 : 0) +
    (appliedFilters.startDate || appliedFilters.endDate ? 1 : 0) +
    (sortBy === "popular" ? 1 : 0);

  const hasActiveChips =
    appliedFilters.priceType !== "all" ||
    !!appliedFilters.minPrice ||
    !!appliedFilters.maxPrice ||
    sortBy === "popular" ||
    !!debouncedQuery;

  return (
    <div
      ref={swipeRef}
      className="feed-swipe events-swipe hide-scrollbar flex min-h-screen flex-col bg-[#0B0D10] text-white"
    >
      {/* Fixed Header + Filtros (Móvil y Desktop) */}
      <header
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed top-0 inset-x-0 z-40 mx-auto w-full max-w-md md:max-w-[1360px] glass-header-obsidian transition-all duration-300 pt-[var(--root-safe-top)] md:pt-20 md:px-8 lg:px-12"
      >
        {/* Fila 1 (Mobile): Logo + Mensajes */}
        <div className="md:hidden px-4 pt-2 pb-2 flex items-center justify-between gap-2.5 cursor-pointer">
          <div className="flex items-center gap-2 shrink-0 h-9">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15">
              r
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">root</h1>
          </div>

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
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full border-0 bg-transparent text-[#D4FF00] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[#D4FF00] transition-opacity cursor-pointer"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        {/* Fila 2: Searchbar ancho completo (entre el header y los filtros) */}
        <div
          onClick={(event) => event.stopPropagation()}
          className="px-4 md:px-6 pt-0 pb-2.5 max-w-7xl mx-auto w-full"
        >
          <div
            onClick={() => router.push("/search")}
            className="w-full h-9 md:h-10 bg-[#161922] border-0 rounded-full px-3.5 md:px-4 flex items-center gap-2 md:gap-3 text-neutral-400 hover:bg-[#1C202B] transition-colors cursor-text"
          >
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#D4FF00] shrink-0" />
            <span className="text-xs md:text-sm font-semibold tracking-wide truncate">
              Buscar eventos, usuarios o comunidades...
            </span>
          </div>
        </div>

        {/* Fila 3: Filtros a la izquierda (scroll horizontal) + Selector de layout fijo a la derecha en mobile */}
        <div
          ref={filtersContainerRef}
          onClick={(event) => event.stopPropagation()}
          className="relative z-30 px-4 md:px-6 pt-0 pb-2.5 max-w-7xl mx-auto w-full"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
              {/* Filtro 1: ¿Cuándo? */}
              <div
                className={cn(
                  "shrink-0 h-8 flex items-center rounded-full transition-all select-none",
                  isDateActive
                    ? "bg-[#D4FF00]/15 text-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.15)] border border-[#D4FF00]/40"
                    : "border border-white/10 bg-[#14171F] text-neutral-300 hover:border-white/20 hover:text-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheetType("when");
                    setIsWhenOpen((prev) => !prev);
                    setIsGenreOpen(false);
                    setIsDatesOpen(false);
                  }}
                  className={cn(
                    "h-full flex items-center gap-1.5 text-xs font-bold tracking-wide cursor-pointer",
                    isDateActive ? "pl-3 pr-1" : "px-3.5",
                  )}
                >
                  <Calendar className={cn("h-3.5 w-3.5 shrink-0", isDateActive ? "text-[#D4FF00]" : "text-neutral-400")} />
                  <span className="max-w-[95px] sm:max-w-none truncate">{getDateLabel()}</span>
                  {!isDateActive && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 shrink-0",
                        isWhenOpen && "rotate-180",
                      )}
                    />
                  )}
                </button>

                {isDateActive && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearDateFilter();
                    }}
                    className="relative z-20 mr-1 h-6 w-6 rounded-full flex items-center justify-center text-[#D4FF00] hover:bg-white/10 active:scale-90 transition-all cursor-pointer touch-manipulation"
                    title="Quitar filtro de fecha"
                    aria-label="Quitar filtro de fecha"
                  >
                    <X className="h-3.5 w-3.5 pointer-events-none" />
                  </button>
                )}
              </div>

              {/* Filtro 2: Ubicación */}
              <div
                className={cn(
                  "shrink-0 h-8 flex items-center rounded-full border transition-all select-none",
                  isLocationActive
                    ? "border-[#D4FF00]/40 bg-[#D4FF00]/15 text-[#D4FF00] shadow-sm shadow-[#D4FF00]/10"
                    : "border-white/10 bg-[#14171F] text-neutral-300 hover:border-white/20 hover:text-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheetType("location");
                    setCityQuery(appliedFilters.location);
                    setIsGenreOpen((prev) => !prev);
                    setIsWhenOpen(false);
                    setIsDatesOpen(false);
                  }}
                  className={cn(
                    "h-full flex items-center gap-1.5 text-xs font-bold tracking-wide cursor-pointer",
                    isLocationActive ? "pl-3 pr-1" : "px-3.5",
                  )}
                >
                  <MapPin className={cn("h-3.5 w-3.5 shrink-0", isLocationActive ? "text-[#D4FF00]" : "text-neutral-400")} />
                  <span className="max-w-[100px] sm:max-w-none truncate">{getLocationLabel()}</span>
                  {!isLocationActive && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 shrink-0",
                        isGenreOpen && "rotate-180",
                      )}
                    />
                  )}
                </button>

                {isLocationActive && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearLocationFilter();
                    }}
                    className="relative z-20 mr-1 h-6 w-6 rounded-full flex items-center justify-center text-[#D4FF00] hover:bg-white/10 active:scale-90 transition-all cursor-pointer touch-manipulation"
                    title="Quitar filtro de ubicación"
                    aria-label="Quitar filtro de ubicación"
                  >
                    <X className="h-3.5 w-3.5 pointer-events-none" />
                  </button>
                )}
              </div>
            </div>

            {/* Selector de 3 iconos fijo a la derecha en Mobile */}
            <div className="md:hidden shrink-0 h-8 flex items-center rounded-full border border-white/10 bg-[#14171F] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Vista Cuadrícula"
                aria-label="Vista Cuadrícula"
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Vista Agenda"
                aria-label="Vista Agenda"
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                title="Vista Calendario"
                aria-label="Vista Calendario"
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer",
                  viewMode === "calendar"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Menú Desplegable flotante de ¿Cuándo? (Solo Desktop) */}
          {isWhenOpen && (
            <div className="hidden md:block absolute left-6 top-full mt-1.5 w-72 rounded-2xl border border-white/10 bg-[#14171F] p-1.5 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
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
                    onClick={() => {
                      setIsDatesOpen(false);
                      handleSelectTemporal(opt.id as TemporalPreset);
                    }}
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

              {/* Opción para seleccionar fechas específicas */}
              <button
                type="button"
                onClick={() => setIsDatesOpen((prev) => !prev)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                  isCustomDateActive || isDatesOpen
                    ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <div className="flex flex-col text-left">
                  <span>Seleccionar fechas</span>
                  <span className="text-[10px] font-normal text-neutral-500">Elegir rango en el calendario</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isDatesOpen && "rotate-180",
                  )}
                />
              </button>

              {isDatesOpen && (
                <div className="mt-1.5 border-t border-white/10 px-2 pt-2.5 pb-1.5 space-y-2.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="min-w-0 flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <span>Desde</span>
                      <input
                        type="date"
                        value={draftFilters.startDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                        }
                        className="block w-full max-w-[122px] min-w-0 box-border appearance-none rounded-xl border border-white/10 bg-[#0B0D10] px-2 py-1.5 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                      />
                    </label>
                    <label className="min-w-0 flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <span>Hasta</span>
                      <input
                        type="date"
                        value={draftFilters.endDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                        }
                        className="block w-full max-w-[122px] min-w-0 box-border appearance-none rounded-xl border border-white/10 bg-[#0B0D10] px-2 py-1.5 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomDates}
                    className="w-full rounded-xl bg-[#D4FF00] py-2 text-xs font-black uppercase tracking-wider text-neutral-950 hover:bg-[#bce400] transition-colors cursor-pointer"
                  >
                    Aplicar fechas
                  </button>
                </div>
              )}

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

          {/* Menú Desplegable flotante de Ubicación (Solo Desktop) */}
          {isGenreOpen && (
            <div className="hidden md:block absolute left-6 top-full mt-1.5 w-72 rounded-2xl border border-white/[0.08] border-t-white/[0.16] bg-[#14171F]/95 p-3 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl space-y-2.5">
              <div className="px-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Ubicación
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyLocationFilter(cityQuery);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#0B0D10] px-3 py-2 border border-white/10 focus-within:border-[#D4FF00]"
              >
                <Search className="h-3.5 w-3.5 text-[#D4FF00] shrink-0" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Buscar ciudad..."
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
                {cityQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearLocationFilter();
                    }}
                    className="p-0.5 text-neutral-400 hover:text-white cursor-pointer"
                    aria-label="Limpiar ubicación"
                  >
                    <X className="h-3.5 w-3.5 pointer-events-none" />
                  </button>
                )}
              </form>
              <div className="max-h-48 overflow-y-auto space-y-1 hide-scrollbar">
                {filteredCitySuggestions.map((city) => {
                  const isSelected =
                    appliedFilters.location.toLowerCase() === city.toLowerCase();
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => applyLocationFilter(city)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                          : "text-neutral-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {city}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#D4FF00]" />}
                    </button>
                  );
                })}
                {cityQuery.trim() &&
                  !filteredCitySuggestions.some(
                    (c) => c.toLowerCase() === cityQuery.trim().toLowerCase(),
                  ) && (
                    <button
                      type="button"
                      onClick={() => applyLocationFilter(cityQuery)}
                      className="flex w-full items-center justify-between rounded-xl bg-[#D4FF00]/15 px-2.5 py-2 text-xs font-bold text-[#D4FF00] cursor-pointer"
                    >
                      <span>Buscar "{cityQuery.trim()}"</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
              </div>

              {isLocationActive && (
                <>
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button
                    type="button"
                    onClick={clearLocationFilter}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    <span>Todas las ubicaciones</span>
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 px-4 md:px-6 pt-[calc(var(--root-safe-top)+151px)] md:pt-28 pb-28 w-full max-w-7xl mx-auto">
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

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="min-w-0 flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <span>Desde</span>
                      <input
                        type="date"
                        value={draftFilters.startDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                        }
                        className="block w-full max-w-[136px] sm:max-w-full min-w-0 box-border appearance-none rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-2 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                      />
                    </label>
                    <label className="min-w-0 flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <span>Hasta</span>
                      <input
                        type="date"
                        value={draftFilters.endDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                        }
                        className="block w-full max-w-[136px] sm:max-w-full min-w-0 box-border appearance-none rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-2 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
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

        {/* Hero Banner: Evento Destacado con Enfoque en Artwork y Guía en la Lectura (Solo Desktop) */}
        {!hasActiveChips && !debouncedQuery && !isDateActive && !isLocationActive && featuredEvent && (
          <Link
            href={`/events/${featuredEvent.id}?origin=/events`}
            className="group relative hidden md:block w-full rounded-3xl overflow-hidden border border-white/[0.08] border-t-white/[0.2] shadow-[0_20px_50px_rgba(0,0,0,0.7)] bg-neutral-950 transition-all duration-300 hover:border-white/[0.16] hover:border-t-[#D4FF00]/60 cursor-pointer animate-in fade-in"
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
                    }).format(parseEventRealDate(featuredEvent.date))}
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

        {/* Subheader (Solo Desktop): Próximos eventos + total contador + Selector de 3 iconos */}
        <div className="hidden md:flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="flex items-center gap-2 tech-label text-xs text-neutral-300 truncate">
              <Sparkles className="h-4 w-4 text-[#D4FF00] shrink-0" />
              <span className="truncate">
                {sortBy === "popular" ? "Mayor Convocatoria" : "Próximos eventos"}
              </span>
            </h2>
            <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00]/10 px-2.5 py-1 shrink-0">
              <span className="num-display text-xs text-white">{hasLoaded ? total : "…"}</span>
              <span className="tech-label text-[9px] text-[#D4FF00]">{hasLoaded ? "eventos" : "cargando"}</span>
            </span>
          </div>

          <div className="flex items-center rounded-full border border-white/[0.06] bg-[#111114] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vista Cuadrícula"
              aria-label="Vista Cuadrícula"
              className={cn(
                "flex items-center justify-center rounded-full p-2 text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vista Agenda"
              aria-label="Vista Agenda"
              className={cn(
                "flex items-center justify-center rounded-full p-2 text-xs font-bold transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              title="Vista Calendario"
              aria-label="Vista Calendario"
              className={cn(
                "flex items-center justify-center rounded-full p-2 text-xs font-bold transition-all cursor-pointer",
                viewMode === "calendar"
                  ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
            </button>
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
                  className="mx-auto h-72 sm:h-80 md:h-auto md:aspect-[4/5] w-full max-w-md animate-pulse rounded-3xl border border-white/5 bg-[#14171F] md:max-w-none"
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

      {/* BottomSheet de Filtros (Solo Mobile - Ancho completo con transición de abajo hacia arriba y de arriba hacia abajo) */}
      <div
        role="dialog"
        aria-modal={isWhenOpen || isGenreOpen}
        aria-hidden={!(isWhenOpen || isGenreOpen)}
        aria-label={activeSheetType === "when" ? "Filtrar por fecha" : "Filtrar por ubicación"}
        className={cn(
          "md:hidden fixed inset-0 z-[70] flex flex-col justify-end transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isWhenOpen || isGenreOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isWhenOpen || isGenreOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsWhenOpen(false);
            setIsGenreOpen(false);
            setIsDatesOpen(false);
          }}
        />

        <div
          ref={bottomSheetRef}
          className={cn(
            "relative z-10 w-full rounded-t-3xl border-t border-white/10 bg-[#14171F] px-5 pt-3 pb-[calc(1.5rem+var(--root-safe-bottom))] shadow-[0_-20px_50px_rgba(0,0,0,0.85)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isWhenOpen || isGenreOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0",
          )}
        >
          {/* Indicador superior de arrastre */}
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4FF00]">
              {activeSheetType === "when" ? (
                <>
                  <Calendar className="h-4 w-4" />
                  ¿Cuándo?
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsWhenOpen(false);
                setIsGenreOpen(false);
                setIsDatesOpen(false);
              }}
              className="rounded-full bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activeSheetType === "when" ? (
            <div className="space-y-1.5">
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
                    onClick={() => {
                      setIsDatesOpen(false);
                      handleSelectTemporal(opt.id as TemporalPreset);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-bold transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                        : "bg-white/[0.03] text-neutral-200 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <div className="flex flex-col text-left">
                      <span>{opt.label}</span>
                      <span className="text-[11px] font-normal text-neutral-400">{opt.desc}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-[#D4FF00]" />}
                  </button>
                );
              })}

              {/* Opción para seleccionar fechas específicas */}
              <button
                type="button"
                onClick={() => setIsDatesOpen((prev) => !prev)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-bold transition-all cursor-pointer",
                  isCustomDateActive || isDatesOpen
                    ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                    : "bg-white/[0.03] text-neutral-200 hover:bg-white/5 hover:text-white",
                )}
              >
                <div className="flex flex-col text-left">
                  <span>Seleccionar fechas</span>
                  <span className="text-[11px] font-normal text-neutral-400">Elegir rango en el calendario</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isDatesOpen && "rotate-180",
                  )}
                />
              </button>

              {isDatesOpen && (
                <div className="mt-2 rounded-2xl border border-white/10 bg-[#0B0D10]/60 p-3 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="min-w-0 flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <span>Desde</span>
                      <input
                        type="date"
                        value={draftFilters.startDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                        }
                        className="block w-full max-w-[136px] sm:max-w-full min-w-0 box-border appearance-none rounded-xl border border-white/10 bg-[#14171F] px-2.5 py-2 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                      />
                    </label>
                    <label className="min-w-0 flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      <span>Hasta</span>
                      <input
                        type="date"
                        value={draftFilters.endDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                        }
                        className="block w-full max-w-[136px] sm:max-w-full min-w-0 box-border appearance-none rounded-xl border border-white/10 bg-[#14171F] px-2.5 py-2 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomDates}
                    className="w-full rounded-xl bg-[#D4FF00] py-2.5 text-xs font-black uppercase tracking-wider text-neutral-950 hover:bg-[#bce400] transition-colors cursor-pointer"
                  >
                    Aplicar fechas
                  </button>
                </div>
              )}

              {isDateActive && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-neutral-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <span>Limpiar filtro de fecha</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyLocationFilter(cityQuery);
                }}
                className="flex items-center gap-2.5 rounded-2xl bg-[#0B0D10] px-4 py-3 border border-white/10 focus-within:border-[#D4FF00] transition-colors"
              >
                <Search className="h-4 w-4 text-[#D4FF00] shrink-0" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Buscar ciudad (ej. Montevideo, Punta del Este)..."
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-neutral-500 focus:outline-none"
                />
                {cityQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCityQuery("");
                      if (isLocationActive) {
                        const next = { ...appliedFilters, location: "" };
                        setDraftFilters(next);
                        setAppliedFilters(next);
                        void fetchEvents({
                          filters: next,
                          offset: 0,
                          append: false,
                          query: debouncedQuery,
                        }).catch(() => undefined);
                      }
                    }}
                    className="p-1 text-neutral-400 hover:text-white cursor-pointer touch-manipulation"
                    aria-label="Limpiar ubicación"
                  >
                    <X className="h-4 w-4 pointer-events-none" />
                  </button>
                )}
              </form>

              <div className="max-h-56 overflow-y-auto space-y-1.5 hide-scrollbar">
                {filteredCitySuggestions.map((city) => {
                  const isSelected =
                    appliedFilters.location.toLowerCase() === city.toLowerCase();
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => applyLocationFilter(city)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-bold transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                          : "bg-white/[0.03] text-neutral-200 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <MapPin className={cn("h-4 w-4", isSelected ? "text-[#D4FF00]" : "text-neutral-400")} />
                        {city}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-[#D4FF00]" />}
                    </button>
                  );
                })}
              </div>

              {cityQuery.trim() && (
                <button
                  type="button"
                  onClick={() => applyLocationFilter(cityQuery)}
                  className="w-full rounded-2xl bg-[#D4FF00] py-3 text-xs font-black uppercase tracking-wider text-neutral-950 hover:bg-[#bce400] transition-colors cursor-pointer"
                >
                  Buscar en "{cityQuery.trim()}"
                </button>
              )}

              {isLocationActive && (
                <button
                  type="button"
                  onClick={clearLocationFilter}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-neutral-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <span>Limpiar filtro de ubicación</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

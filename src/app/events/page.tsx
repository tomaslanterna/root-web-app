"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Film,
  Filter,
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

function toQueryParams(filters: EventFilters, offset: number) {
  const params: Record<string, string | number | boolean> = { limit: pageSize, offset };
  if (filters.genre !== "all") params.genre = filters.genre;
  if (filters.location.trim()) params.location = filters.location.trim();
  if (filters.priceType === "free") params.isFree = true;
  if (filters.priceType === "paid") params.isFree = false;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.startDate) params.startDate = localDayToISO(filters.startDate, false);
  if (filters.endDate) params.endDate = localDayToISO(filters.endDate, true);
  return params;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [draftFilters, setDraftFilters] = useState<EventFilters>({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>({ ...emptyFilters });
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    mutate: fetchEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useMutation<EventListResponse, LoadVariables>(
    async ({ filters, offset }) => {
      const response = await eventsApi.getEvents(toQueryParams(filters, offset));
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

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setAppliedFilters({ ...draftFilters });
    void fetchEvents({ filters: draftFilters, offset: 0, append: false })
      .catch(() => undefined);
  };

  const clearFilters = () => {
    const cleared = { ...emptyFilters };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
    void fetchEvents({ filters: cleared, offset: 0, append: false })
      .catch(() => undefined);
  };

  const selectGenre = (genre: string) => {
    const next = { ...draftFilters, genre };
    setDraftFilters(next);
    setAppliedFilters(next);
    void fetchEvents({ filters: next, offset: 0, append: false }).catch(() => undefined);
  };

  const activeFilters =
    (appliedFilters.genre !== "all" ? 1 : 0) +
    (appliedFilters.location ? 1 : 0) +
    (appliedFilters.priceType !== "all" ? 1 : 0) +
    (appliedFilters.minPrice ? 1 : 0) +
    (appliedFilters.maxPrice ? 1 : 0) +
    (appliedFilters.startDate ? 1 : 0) +
    (appliedFilters.endDate ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0D10] text-white">
      <header className="glass-header-obsidian sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider">Eventos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider transition-all",
              showFilters || activeFilters > 0
                ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950"
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
          <Link
            href="/search"
            aria-label="Buscar"
            className="rounded-full bg-white/10 p-2 text-neutral-300 transition-colors hover:bg-white/20"
          >
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="space-y-5 p-4 pb-28">
        {showFilters && (
          <form
            onSubmit={applyFilters}
            className="animate-fade-in space-y-4 rounded-3xl border border-white/10 bg-[#14171F] p-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#D4FF00]">
                <Filter className="h-3.5 w-3.5" /> Filtrar eventos
              </span>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white"
                >
                  <X className="h-3 w-3" /> Limpiar
                </button>
              )}
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
                className="w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs font-semibold text-white focus:border-[#D4FF00] focus:outline-none"
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
                className="w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs font-semibold text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none"
              />
            </div>

            <fieldset className="space-y-1.5">
              <legend className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                <Tag className="h-3 w-3 text-[#D4FF00]" /> Tipo de precio
              </legend>
              <div className="flex rounded-2xl border border-white/10 bg-[#0B0D10] p-1">
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
                      "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all",
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
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
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
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
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
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
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
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none"
                />
              </label>
            </div>

            <Button type="submit" size="full" disabled={isLoadingEvents}>
              {isLoadingEvents ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              Aplicar filtros
            </Button>
          </form>
        )}

        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-300">
            <Sparkles className="h-4 w-4 text-[#D4FF00]" /> Próximos eventos
          </h2>
          <span className="rounded-full border border-[#D4FF00]/20 bg-[#D4FF00]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
            {hasLoaded ? `${total} eventos` : "Cargando..."}
          </span>
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {genreOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectGenre(option.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all",
                appliedFilters.genre === option.id
                  ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950"
                  : "border-white/10 bg-[#14171F] text-neutral-400 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {!hasLoaded && isLoadingEvents ? (
            [1, 2].map((item) => (
              <div
                key={item}
                className="mx-auto aspect-[2/3] w-full max-w-md animate-pulse rounded-3xl border border-white/5 bg-[#14171F] sm:aspect-[16/10]"
              />
            ))
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
          ) : events.length > 0 ? (
            events.map((event) => <EventCard key={event.id} event={event} variant="full" />)
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
        </div>

        {hasMore && (
          <Button
            type="button"
            variant="outline"
            size="full"
            disabled={isLoadingEvents}
            onClick={() =>
              void fetchEvents({
                filters: appliedFilters,
                offset: events.length,
                append: true,
              })
            }
          >
            {isLoadingEvents ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isLoadingEvents ? "Cargando..." : "Cargar más eventos"}
          </Button>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventCard } from "@/components/ui/EventCard";
import { SegmentedControl, SegmentOption } from "@/components/ui/SegmentedControl";
import { MOCK_EVENTS, Event } from "@/lib/mocks";
import { Calendar, Search, Film } from "lucide-react";
import { api } from "@/lib/api";

type EventFilter = "all" | "club" | "festival";

export default function EventsPage() {
  const [filter, setFilter] = useState<EventFilter>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const res = await api.get("/v1/events");
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (isMounted) {
          setEvents(list);
        }
      } catch (err) {
        console.error("Error fetching events from live backend:", err);
        if (isMounted) {
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const eventFilters: SegmentOption<EventFilter>[] = [
    { id: "all", label: "Todos", count: events.length },
    {
      id: "club",
      label: "Club",
      count: events.filter(
        (e) =>
          e.title.toLowerCase().includes("underground") ||
          e.title.toLowerCase().includes("open air") ||
          e.title.toLowerCase().includes("club")
      ).length,
    },
    {
      id: "festival",
      label: "Festivales",
      count: events.filter(
        (e) =>
          e.title.toLowerCase().includes("techno") ||
          e.title.toLowerCase().includes("fest") ||
          e.title.toLowerCase().includes("afterlife") ||
          e.title.toLowerCase().includes("keylife") ||
          e.title.toLowerCase().includes("time warp") ||
          e.title.toLowerCase().includes("zamna")
      ).length,
    },
  ];

  const filteredEvents = events.filter((e) => {
    if (filter === "club") {
      return (
        e.title.toLowerCase().includes("underground") ||
        e.title.toLowerCase().includes("open air") ||
        e.title.toLowerCase().includes("club")
      );
    }
    if (filter === "festival") {
      return (
        e.title.toLowerCase().includes("techno") ||
        e.title.toLowerCase().includes("fest") ||
        e.title.toLowerCase().includes("afterlife") ||
        e.title.toLowerCase().includes("keylife") ||
        e.title.toLowerCase().includes("time warp") ||
        e.title.toLowerCase().includes("zamna")
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Cartelera Eventos</h1>
        </div>
        <Link href="/search" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-neutral-300">
          <Search className="w-4 h-4" />
        </Link>
      </header>

      <div className="p-4 space-y-5 pb-28">
        {/* Segmented Filter Control */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Cartelera Oficial</h2>
          <SegmentedControl<EventFilter>
            options={eventFilters}
            value={filter}
            onChange={setFilter}
            theme="electronic"
          />
        </div>

        {/* Single Column Vertical Movie Poster Feed */}
        <div className="flex flex-col gap-6">
          {isLoading ? (
            [1, 2].map((i) => (
              <div
                key={i}
                className="w-full max-w-md mx-auto aspect-[2/3] sm:aspect-[16/10] rounded-3xl bg-[#14171F] border border-white/5 animate-pulse flex flex-col justify-end p-6 space-y-3"
              >
                <div className="w-20 h-4 rounded-full bg-white/10" />
                <div className="w-2/3 h-6 rounded-md bg-white/10" />
                <div className="w-1/3 h-4 rounded-md bg-white/10" />
              </div>
            ))
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="full" />
            ))
          ) : (
            <div className="text-center py-12 text-neutral-500 text-sm">
              No hay eventos disponibles en esta categoría.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

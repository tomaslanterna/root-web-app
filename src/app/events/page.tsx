"use client";

import { useState } from "react";
import Link from "next/link";
import { EventCard } from "@/components/ui/EventCard";
import { SegmentedControl, SegmentOption } from "@/components/ui/SegmentedControl";
import { MOCK_EVENTS } from "@/lib/mocks";
import { Calendar, Search, Film } from "lucide-react";

type EventFilter = "all" | "club" | "festival";

const EVENT_FILTERS: SegmentOption<EventFilter>[] = [
  { id: "all", label: "Todos", count: MOCK_EVENTS.length },
  { id: "club", label: "Club", count: 2 },
  { id: "festival", label: "Festivales", count: 1 },
];

export default function EventsPage() {
  const [filter, setFilter] = useState<EventFilter>("all");

  const filteredEvents = MOCK_EVENTS.filter((e) => {
    if (filter === "club") return e.title.toLowerCase().includes("underground") || e.title.toLowerCase().includes("open air");
    if (filter === "festival") return e.title.toLowerCase().includes("techno") || e.title.toLowerCase().includes("fest");
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
        <div className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-neutral-300">
          <Search className="w-4 h-4" />
        </div>
      </header>

      <div className="p-4 space-y-5 pb-28">
        {/* Segmented Filter Control */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Cartelera Oficial</h2>
          <SegmentedControl<EventFilter>
            options={EVENT_FILTERS}
            value={filter}
            onChange={setFilter}
            theme="electronic"
          />
        </div>

        {/* Single Column Vertical Movie Poster Feed */}
        <div className="flex flex-col gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} variant="full" />
          ))}
        </div>
      </div>
    </div>
  );
}




import * as React from "react";
import { Card } from "./Card";
import { Event } from "@/lib/mocks";
import { CalendarIcon, MapPinIcon, Ticket } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  variant?: "swimlane" | "full";
  className?: string;
}

export function EventCard({ event, variant = "swimlane", className }: EventCardProps) {
  const dateObj = new Date(event.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    : event.date;

  const isSwimlane = variant === "swimlane";
  const bannerImage =
    event.cinematicBannerUrl && event.cinematicBannerUrl.trim() !== ""
      ? event.cinematicBannerUrl
      : "https://images.unsplash.com/photo-1514525253344-93168e974686?q=80&w=1974&auto=format&fit=crop";

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "block group active:scale-[0.98] transition-all duration-300 select-none",
        isSwimlane ? "w-44 sm:w-48 shrink-0 snap-start" : "w-full",
        className
      )}
    >
      <Card
        className={cn(
          "relative overflow-hidden rounded-3xl border-neutral-200/80 hover:border-neutral-400 shadow-md hover:shadow-xl transition-all duration-300 bg-neutral-950 text-white",
          isSwimlane ? "aspect-[2/3]" : "aspect-[2/3] sm:aspect-[16/10] max-w-md mx-auto"
        )}
      >
        {/* Movie Poster Image Background */}
        <img
          src={bannerImage}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neutral-950/60 to-transparent pointer-events-none" />

        {/* Date Glass Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-neutral-950/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm z-10">
          <CalendarIcon className="w-3 h-3 text-neutral-300" />
          <span>{formattedDate}</span>
        </div>

        {/* Movie Poster Title & Venue Info (Bottom Overlaid) */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end space-y-2 z-10">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-300 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit">
            Evento En Vivo
          </span>

          <h3 className="font-black uppercase text-base sm:text-lg tracking-tight leading-snug text-white drop-shadow-md group-hover:text-neutral-200 transition-colors line-clamp-2">
            {event.title}
          </h3>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs font-semibold text-neutral-300">
            <div className="flex items-center gap-1 truncate max-w-[70%]">
              <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate text-[11px] uppercase tracking-wide">{event.location}</span>
            </div>

            {!isSwimlane && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white text-neutral-950 font-extrabold text-[10px] uppercase tracking-wider shadow-sm group-hover:bg-neutral-200">
                <Ticket className="w-3 h-3" /> Tickets
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}



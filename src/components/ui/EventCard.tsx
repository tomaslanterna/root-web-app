import * as React from "react";
import Link from "next/link";
import { CalendarIcon, CheckCircle2, MapPinIcon, Tag, XCircle } from "lucide-react";
import type { Event } from "@/types/events";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

interface EventCardProps {
  event: Event;
  variant?: "swimlane" | "full";
  className?: string;
}

const fallbackBanner =
  "https://images.unsplash.com/photo-1514525253344-93168e974686?q=80&w=1200&auto=format&fit=crop";

export function EventCard({ event, variant = "swimlane", className }: EventCardProps) {
  const date = new Date(event.date);
  const formattedDate = Number.isNaN(date.getTime())
    ? event.date
    : new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(date);
  const isSwimlane = variant === "swimlane";
  const image = event.cinematicBannerUrl?.trim() || fallbackBanner;
  const priceLabel =
    event.price == null
      ? "Precio no informado"
      : event.price === 0
        ? "Gratis"
        : `$${event.price.toLocaleString("es-AR")}`;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "block select-none transition-all duration-300 active:scale-[0.98]",
        isSwimlane ? "w-44 shrink-0 snap-start sm:w-48" : "w-full",
        className,
      )}
    >
      <Card
        className={cn(
          "group relative overflow-hidden rounded-3xl border-white/10 bg-neutral-950 text-white shadow-md transition-all duration-300 hover:border-white/25 hover:shadow-xl",
          isSwimlane ? "aspect-[2/3]" : "mx-auto aspect-[2/3] w-full max-w-md sm:aspect-[16/10]",
        )}
      >
        <div
          role="img"
          aria-label={`Imagen de ${event.title}`}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neutral-950/70 to-transparent" />

        <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
          <span className="flex max-w-[62%] items-center gap-1 rounded-full border border-white/20 bg-neutral-950/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#D4FF00] backdrop-blur-md">
            <Tag className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{priceLabel}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full border border-white/20 bg-neutral-950/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
            <CalendarIcon className="h-3 w-3 text-neutral-300" />
            {formattedDate}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end space-y-2 p-4 sm:p-5">
          <span className="w-fit rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-neutral-300 backdrop-blur-md">
            {event.genre?.trim() || "Sin especificar"}
          </span>

          <h3 className="line-clamp-2 text-base font-black uppercase leading-snug tracking-tight text-white drop-shadow-md sm:text-lg">
            {event.title}
          </h3>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-neutral-300">
            <div className="flex min-w-0 items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[#D4FF00]" />
              <span className="truncate text-[10px] font-semibold uppercase tracking-wide">
                {event.location}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[9px] font-extrabold uppercase">
              <span className="flex items-center gap-1 text-[#D4FF00]">
                <CheckCircle2 className="h-3 w-3" /> {event.goingCount} Voy
              </span>
              <span className="flex items-center gap-1 text-neutral-400">
                <XCircle className="h-3 w-3" /> {event.notGoingCount} No
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

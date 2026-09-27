"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, CheckCircle2, MapPinIcon, Tag } from "lucide-react";
import type { Event } from "@/types/events";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

interface EventCardProps {
  event: Event;
  variant?: "swimlane" | "full" | "list";
  className?: string;
}

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

export function EventCard({ event, variant = "swimlane", className }: EventCardProps) {
  const pathname = usePathname();
  const date = new Date(event.date);
  const isValidDate = !Number.isNaN(date.getTime());
  const formattedDate = isValidDate
    ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(date)
    : event.date;

  const dayString = isValidDate ? date.getDate().toString() : "--";
  const monthString = isValidDate
    ? new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date).replace(".", "")
    : "";
  const weekdayString = isValidDate
    ? new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(date).replace(".", "")
    : "";

  const isSwimlane = variant === "swimlane";
  const isList = variant === "list";
  const image = event.cinematicBannerUrl?.trim() || fallbackBanner;
  const priceLabel =
    event.price == null
      ? "Precio no informado"
      : event.price === 0
        ? "Gratis"
        : `$${event.price.toLocaleString("es-AR")}`;

  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (linkRef.current) {
      observer.observe(linkRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (isList) {
    return (
      <Link
        ref={linkRef}
        href={`/events/${event.id}?origin=${pathname}`}
        className={cn(
          "block transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
          isVisible 
            ? "scale-100 opacity-100 translate-y-0 blur-none" 
            : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none",

          "block select-none transition-all duration-300 active:scale-[0.99] w-full",
          className,
        )}
      >
        <Card className="group relative overflow-hidden rounded-2xl md:rounded-3xl border-white/10 bg-[#14171F]/90 text-white shadow-md hover:border-[#D4FF00]/40 md:hover:-translate-y-0.5 hover:shadow-xl md:hover:shadow-lg md:hover:shadow-[#D4FF00]/10 transition-all duration-300 p-3 md:p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 md:gap-5">
            {/* Calendar Date Block */}
            <div className="flex flex-col items-center justify-center w-14 md:w-16 h-14 md:h-16 rounded-xl md:rounded-2xl bg-[#0B0D10] border border-white/10 shrink-0 text-center shadow-inner group-hover:border-[#D4FF00]/30 transition-colors">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-[#D4FF00]">
                {monthString}
              </span>
              <span className="text-base md:text-xl font-black text-white leading-none">
                {dayString}
              </span>
              <span className="text-[8px] md:text-[9px] font-extrabold uppercase text-neutral-400">
                {weekdayString}
              </span>
            </div>

            {/* Thumbnail Poster */}
            <div className="relative w-20 md:w-28 h-14 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-neutral-900">
              <div
                role="img"
                aria-label={`Imagen de ${event.title}`}
                className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 to-transparent pointer-events-none" />
            </div>

            {/* Main Information */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest text-neutral-300">
                  {event.genre?.trim() || "Sin especificar"}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-neutral-600">
                  •
                </span>
                <div className="hidden sm:flex items-center gap-1 text-neutral-400 text-[11px] truncate">
                  <MapPinIcon className="h-3 w-3 shrink-0 text-[#D4FF00]" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-white truncate group-hover:text-[#D4FF00] transition-colors">
                {event.title}
              </h3>

              <div className="flex sm:hidden items-center gap-1 text-neutral-400 text-[10px] truncate">
                <MapPinIcon className="h-3 w-3 shrink-0 text-[#D4FF00]" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>

            {/* Price & Social Attendance */}
            <div className="flex flex-col items-end justify-center shrink-0 pl-2 space-y-1">
              <span className="text-xs md:text-sm font-black text-[#D4FF00] tracking-wide">
                {priceLabel}
              </span>
              {event.goingCount > 0 && (
                <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-extrabold uppercase text-neutral-300">
                  <CheckCircle2 className="h-3 w-3 text-[#D4FF00] shrink-0" />
                  <span>{event.goingCount}</span>
                  <span className="hidden sm:inline">Voy</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      ref={linkRef}
      href={`/events/${event.id}?origin=${pathname}`}
      className={cn(
        "block select-none transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
        isVisible 
          ? "scale-100 opacity-100 translate-y-0 blur-none" 
          : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none",
        isSwimlane ? "w-[260px] sm:w-[280px] shrink-0 snap-start" : "w-full",
        className,
      )}
    >
      <Card
        className={cn(
          "group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-lg transition-all duration-300 ease-out hover:border-[#D4FF00]/50 hover:shadow-2xl hover:shadow-[#D4FF00]/10 md:hover:-translate-y-1.5",
          isSwimlane
            ? "aspect-[3/4]"
            : "mx-auto aspect-[4/5] w-full max-w-md md:max-w-none",
        )}
      >
        {/* Cover Artwork (Hero) */}
        <div
          role="img"
          aria-label={`Imagen de ${event.title}`}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${image})` }}
        />

        {/* Subtle Top Vignette (allows date/price badge legibility without darkening artwork) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-950/60 to-transparent" />

        {/* Smooth Bottom Gradient (covers only bottom 40% for high text readability) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-neutral-950 via-neutral-950/65 to-transparent" />

        {/* Floating Top Badges */}
        <div className="absolute inset-x-3.5 top-3.5 z-10 flex items-start justify-between gap-2">
          {/* Price / Free Badge */}
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border",
              event.price === 0
                ? "bg-[#D4FF00] text-neutral-950 border-[#D4FF00]"
                : "bg-neutral-950/75 text-[#D4FF00] border-white/15",
            )}
          >
            <Tag className="h-2.5 w-2.5 shrink-0" />
            <span>{priceLabel}</span>
          </span>

          {/* Date Badge */}
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/75 backdrop-blur-md px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white shadow-sm">
            <CalendarIcon className="h-3 w-3 text-[#D4FF00] shrink-0" />
            <span>{formattedDate}</span>
          </span>
        </div>

        {/* Bottom Metadata: Focused, Clean, and Impactful */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-4 sm:p-5 space-y-1.5">
          {/* Genre + Location + Social Attendees */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-300">
            {event.genre && (
              <span className="text-[#D4FF00] font-black tracking-widest">
                {event.genre}
              </span>
            )}
            {event.genre && event.location && (
              <span className="text-white/30">•</span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 truncate text-neutral-300 font-semibold">
                <MapPinIcon className="h-3 w-3 text-neutral-400 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            {event.goingCount > 0 && (
              <>
                <span className="text-white/30 hidden sm:inline">•</span>
                <span className="text-neutral-400 font-semibold hidden sm:inline">
                  {event.goingCount} van
                </span>
              </>
            )}
          </div>

          {/* Event Title */}
          <h3 className="text-base sm:text-lg md:text-xl font-black uppercase leading-tight tracking-tight text-white line-clamp-2 drop-shadow-md group-hover:text-[#D4FF00] transition-colors">
            {event.title}
          </h3>
        </div>
      </Card>
    </Link>
  );
}

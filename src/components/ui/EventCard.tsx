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
      ? null
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
          "block select-none transition-all duration-300 w-full group ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
          isVisible 
            ? "scale-100 opacity-100 translate-y-0 blur-none" 
            : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none",
          "block select-none transition-all duration-300 active:scale-[0.99] w-full",
          className,
        )}
      >
        <Card className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.08] via-neutral-950/80 to-[#0B0D10]/90 backdrop-blur-2xl text-white shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)] hover:border-[#D4FF00]/60 md:hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_25px_rgba(212,255,0,0.12)] transition-all duration-300 p-3 md:p-4">
          {/* Specular top rim light */}
          <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70" />

          <div className="flex items-center gap-3.5 md:gap-5 relative z-10">
            {/* Calendar Date Block en Liquid Glass */}
            <div className="flex flex-col items-center justify-center w-14 md:w-16 h-14 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-b from-white/[0.1] to-[#0B0D10] border border-white/[0.15] shrink-0 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:border-[#D4FF00]/40 transition-colors">
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
                <span className="w-fit rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md px-2.5 py-0.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest text-[#D4FF00]">
                  {event.genre?.trim() || "Clubbing"}
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
              {priceLabel && (
                <span className="text-xs md:text-sm font-black text-[#D4FF00] tracking-wide">
                  {priceLabel}
                </span>
              )}
              {event.goingCount > 0 && (
                <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-extrabold uppercase text-neutral-300">
                  <CheckCircle2 className="h-3 w-3 text-[#D4FF00] shrink-0" />
                  <span>{event.goingCount}</span>
                  <span className="hidden sm:inline">van</span>
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
        "block select-none transition-all duration-300 active:scale-[0.98] group ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
        isVisible 
          ? "scale-100 opacity-100 translate-y-0 blur-none" 
          : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none",
        isSwimlane ? "w-[260px] sm:w-[280px] shrink-0 snap-start" : "w-full",
        className,
      )}
    >
      <Card
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/[0.14] bg-gradient-to-b from-white/[0.08] via-neutral-950/80 to-[#0B0D10]/95 backdrop-blur-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300 ease-out hover:border-[#D4FF00]/70 hover:shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(212,255,0,0.18)] md:hover:-translate-y-1.5",
          isSwimlane
            ? "aspect-[3/4]"
            : "mx-auto aspect-[4/5] w-full max-w-md md:max-w-none",
        )}
      >
        {/* Specular top rim light */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 opacity-80" />

        {/* Cover Artwork (Hero) */}
        <div
          role="img"
          aria-label={`Imagen de ${event.title}`}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${image})` }}
        />

        {/* Ambient glow behind card */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent opacity-90" />

        {/* Floating Top Badges en Liquid Glass */}
        <div className={cn("absolute inset-x-3.5 top-3.5 z-10 flex items-start gap-2", priceLabel ? "justify-between" : "justify-end")}>
          {/* Price / Free Badge */}
          {priceLabel && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider backdrop-blur-xl shadow-md border",
                event.price === 0
                  ? "bg-[#D4FF00] text-neutral-950 border-[#D4FF00] shadow-[0_4px_15px_rgba(212,255,0,0.35)]"
                  : "bg-gradient-to-b from-white/[0.15] to-black/75 text-[#D4FF00] border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]",
              )}
            >
              <Tag className="h-2.5 w-2.5 shrink-0" />
              <span>{priceLabel}</span>
            </span>
          )}

          {/* Date Badge */}
          <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-gradient-to-b from-white/[0.15] to-black/75 backdrop-blur-xl px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
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
                <MapPinIcon className="h-3 w-3 text-[#D4FF00] shrink-0" />
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

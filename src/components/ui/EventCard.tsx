"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Event } from "@/types/events";
import { cn, isValidImageUrl } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";

interface EventCardProps {
  event: Event;
  /** "featured": tarjeta de la fila de destacados que se achica según la variable CSS --p (0 a 1). */
  variant?: "swimlane" | "full" | "list" | "featured";
  className?: string;
}

const fallbackBanner =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

const timeZone = "America/Montevideo";
const weekdayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone });
const monthFormat = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone });
const dayFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone });
const timeFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });

const clean = (value: string) => value.replace(".", "");
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function formatEventPrice(event: Pick<Event, "price" | "isFree">) {
  if (event.isFree || event.price === 0) return "Gratis";
  if (event.price == null) return null;
  return `$ ${event.price.toLocaleString("es-AR")}`;
}

export function EventCard({ event, variant = "swimlane", className }: EventCardProps) {
  const pathname = usePathname();
  const date = parseEventRealDate(event.date);
  const isValidDate = !Number.isNaN(date.getTime());

  const weekday = isValidDate ? capitalize(clean(weekdayFormat.format(date))) : "";
  const day = isValidDate ? dayFormat.format(date) : "--";
  const month = isValidDate ? clean(monthFormat.format(date)) : "";
  // "Vie 31 · 23:59": la fecha se lee en mono, como en el cartel.
  const whenLabel = isValidDate ? `${weekday} ${day} · ${timeFormat.format(date)}` : event.date;

  const image = isValidImageUrl(event.cinematicBannerUrl)
    ? event.cinematicBannerUrl.trim()
    : fallbackBanner;
  const priceLabel = formatEventPrice(event);
  const href = `/events/${event.id}?origin=${pathname}`;

  if (variant === "list") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-card bg-surface border border-line text-ink transition-[background-color,transform] duration-200 hover:bg-surface-2 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent",
          className,
        )}
      >
        <div className="w-12 shrink-0 flex flex-col items-center text-center">
          <span className="label-mono text-accent">{month}</span>
          <span className="num-mono text-xl font-semibold leading-tight">{day}</span>
          <span className="label-mono text-ink-3">{weekday}</span>
        </div>

        <div
          aria-hidden="true"
          className="size-14 shrink-0 rounded-thumb bg-surface-2 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-[15px] font-semibold leading-tight truncate">{event.title}</span>
          <span className="text-[13px] text-ink-2 truncate">{event.location}</span>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          {priceLabel && <span className="num-mono text-[13px] font-semibold">{priceLabel}</span>}
          {event.goingCount > 0 && (
            <span className="num-mono text-xs text-ink-2">{event.goingCount} van</span>
          )}
        </div>
      </Link>
    );
  }

  const isFeatured = variant === "featured";

  return (
    <Link
      href={href}
      aria-label={isFeatured ? event.title : undefined}
      className={cn(
        "group flex flex-col overflow-hidden bg-surface border border-line text-ink transition-[border-color,transform] duration-200 hover:border-line-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent",
        isFeatured ? "shrink-0 snap-start" : "rounded-card",
        variant === "swimlane" && "w-[200px] shrink-0 snap-start",
        className,
      )}
      style={isFeatured ? {
        // Ancho de una columna de la grilla → cuadrado de 56px.
        width: "calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols) * (1 - var(--p, 0)) + 56px * var(--p, 0))",
        borderRadius: "calc(16px - 4px * var(--p, 0))",
      } : undefined}
    >
      <div
        className="aspect-square p-3 flex items-start bg-surface-2 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      >
        {event.genre && (
          <span
            className="label-mono px-2 py-[5px] rounded-full bg-bg/80 text-ink"
            style={isFeatured ? { opacity: "calc(1 - var(--p, 0) * 3)" } : undefined}
          >
            {event.genre}
          </span>
        )}
      </div>

      <div
        aria-hidden={isFeatured ? true : undefined}
        className={cn("p-3 flex flex-col gap-[5px]", isFeatured ? "flex-none overflow-hidden" : "flex-1")}
        style={isFeatured ? {
          // El texto se cierra y se desvanece: al final solo queda la imagen.
          height: "calc(137px * (1 - var(--p, 0)))",
          paddingBlock: "calc(12px * (1 - var(--p, 0)))",
          opacity: "calc(1 - var(--p, 0) * 2.5)",
        } : undefined}
      >
        <span className="label-mono text-accent">{whenLabel}</span>
        <h3 className="m-0 text-[15px] font-semibold leading-tight line-clamp-2">{event.title}</h3>
        {event.location && (
          <span className="text-[13px] text-ink-2 truncate">{event.location}</span>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="num-mono text-[13px] font-semibold">{priceLabel ?? ""}</span>
          {event.goingCount > 0 && (
            <span className="num-mono text-xs text-ink-2">{event.goingCount} van</span>
          )}
        </div>
      </div>
    </Link>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Event } from "@/types/events";
import { cn, isValidImageUrl } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";

interface EventCardProps {
  event: Event;
  /** "featured": flyer 4:5 de la fila de destacados que se achica en 2 fases con el scroll (--p-footer y --p-card). */
  variant?: "swimlane" | "full" | "list" | "featured";
  priority?: boolean;
  loading?: "eager" | "lazy";
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

export function EventCard({
  event,
  variant = "swimlane",
  priority = false,
  loading,
  className,
}: EventCardProps) {
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

  const [imgSrc, setImgSrc] = React.useState(image);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    setImgSrc(image);
    setIsLoaded(false);
  }, [image]);

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const effectiveLoading = loading ?? (priority ? "eager" : "lazy");
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
          className="relative size-14 shrink-0 overflow-hidden rounded-thumb bg-surface-2"
        >
          <Image
            src={imgSrc}
            alt=""
            fill
            sizes="56px"
            priority={priority}
            loading={effectiveLoading}
            quality={70}
            decoding="async"
            onError={() => setImgSrc(fallbackBanner)}
            className="object-cover object-center"
          />
        </div>

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

  if (variant === "full" || variant === "featured") {
    return (
      <FlyerCard
        event={event}
        href={href}
        featured={variant === "featured"}
        weekday={weekday}
        day={day}
        time={isValidDate ? timeFormat.format(date) : ""}
        imgSrc={imgSrc}
        isLoaded={isLoaded}
        imgRef={imgRef}
        priority={priority}
        loading={effectiveLoading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setImgSrc(fallbackBanner)}
        className={className}
      />
    );
  }

  // "swimlane": tarjeta compacta de las filas horizontales (búsqueda).
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden bg-surface border border-line text-ink transition-[border-color,transform] duration-200 hover:border-line-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent",
        "rounded-card w-[200px] shrink-0 snap-start",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2 p-3 flex items-start">
        {!isLoaded && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-surface-3/40 animate-pulse pointer-events-none"
          />
        )}
        <Image
          ref={imgRef}
          src={imgSrc}
          alt={event.title || ""}
          fill
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 280px"
          priority={priority}
          loading={effectiveLoading}
          quality={70}
          decoding="async"
          onError={() => setImgSrc(fallbackBanner)}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "object-cover object-center transition-all duration-300 group-hover:scale-105",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
        {event.genre && (
          <span
            className="relative z-10 label-mono px-2 py-[5px] rounded-full bg-bg/80 text-ink backdrop-blur-sm"
          >
            {event.genre}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-1 flex-col gap-[5px]">
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

/** Alto extra del flyer destacado sobre su ancho (≈ 4:5 en mobile). Se colapsa en la fase 1 del scroll. */
export const FEATURED_FLYER_EXTRA = 44;

interface FlyerCardProps {
  event: Event;
  href: string;
  featured: boolean;
  weekday: string;
  day: string;
  time: string;
  imgSrc: string;
  isLoaded: boolean;
  imgRef: React.RefObject<HTMLImageElement | null>;
  priority: boolean;
  loading: "eager" | "lazy";
  onLoad: () => void;
  onError: () => void;
  className?: string;
}

/** Fecha como sello sobre el flyer: día de la semana arriba, número grande abajo. */
function DateStamp({ weekday, day, style }: { weekday: string; day: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className="absolute top-2 left-2 z-10 min-w-10 px-2 pt-1.5 pb-[7px] rounded-[10px] bg-bg/80 backdrop-blur-md flex flex-col items-center gap-[3px]"
    >
      <i className="not-italic font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-ink-2 leading-none">
        {weekday}
      </i>
      <b className="font-display text-[19px] leading-[0.9]">{day}</b>
    </span>
  );
}

/**
 * Card de evento "el flyer es la card": sin caja alrededor del texto, fecha como sello sobre la imagen
 * y una sola línea de datos (hora · lugar). En destacados el texto va sobre el flyer con un degradado.
 */
function FlyerCard({
  event,
  href,
  featured,
  weekday,
  day,
  time,
  imgSrc,
  isLoaded,
  imgRef,
  priority,
  loading,
  onLoad,
  onError,
  className,
}: FlyerCardProps) {
  const meta = [time, event.location].filter(Boolean).join(" · ");
  const going = event.goingCount > 0 ? `${event.goingCount} ${event.goingCount === 1 ? "va" : "van"}` : null;
  const ariaLabel = [event.title, `${weekday} ${day}`, meta].filter(Boolean).join(", ") + (going ? `. ${going}` : "");

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group flex flex-col gap-2.5 text-ink outline-none transition-transform duration-[120ms] ease-out active:scale-[0.98] motion-reduce:transition-none",
        featured && "shrink-0 snap-start",
        className,
      )}
      style={featured ? {
        // Fase 2: el flyer se achica de ancho de columna → cuadrado de 56px.
        width: "calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols) * (1 - var(--p-card, 0)) + 56px * var(--p-card, 0))",
      } : undefined}
    >
      <span
        className="relative block overflow-hidden bg-surface-2 rounded-[14px] after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] after:pointer-events-none group-focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)]"
        style={featured ? { borderRadius: "calc(14px - 4px * var(--p-card, 0))" } : undefined}
      >
        <span aria-hidden="true" className="block aspect-square" />
        {featured && (
          // Fase 1: el alto extra (4:5) se colapsa hasta dejar solo el cuadrado.
          <span
            aria-hidden="true"
            className="block"
            style={{ height: `calc(${FEATURED_FLYER_EXTRA}px * (1 - var(--p-footer, 0)))` }}
          />
        )}
        {!isLoaded && (
          <span aria-hidden="true" className="absolute inset-0 bg-surface-3/40 animate-pulse pointer-events-none" />
        )}
        <Image
          ref={imgRef}
          src={imgSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 280px"
          priority={priority}
          loading={loading}
          quality={70}
          decoding="async"
          onError={onError}
          onLoad={onLoad}
          className={cn("object-cover object-center transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
        />
        <DateStamp
          weekday={weekday}
          day={day}
          style={featured ? { opacity: "calc(1 - var(--p-card, 0) * 3)" } : undefined}
        />
        {featured && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 pt-12 px-3 pb-3 flex flex-col gap-1 bg-gradient-to-b from-bg/0 via-bg/75 to-bg/95"
            style={{ opacity: "calc(1 - var(--p-footer, 0) * 2.5)" }}
          >
            <span className="text-[15px] font-semibold leading-[1.2] line-clamp-2">{event.title}</span>
            <span className="flex items-center justify-between gap-2 text-[12px] text-[#C9CDD3]">
              <span className="truncate">{meta}</span>
              {going && <span className="shrink-0">{going}</span>}
            </span>
          </span>
        )}
      </span>

      {!featured && (
        <span className="flex flex-col gap-1 px-0.5">
          <span className="text-[15px] font-semibold leading-[1.25] line-clamp-2">{event.title}</span>
          {meta && <span className="text-[13px] text-ink-2 truncate">{meta}</span>}
          {going && <span className="mt-0.5 text-[12px] text-ink-2">{going}</span>}
        </span>
      )}
    </Link>
  );
}

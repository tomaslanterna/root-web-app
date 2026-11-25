"use client";

import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Clock3, UserPlus, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, isValidImageUrl } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import type { TempCrewEventRef, TempCrewJoinRequest, TempCrewPerson, TempCrewSummary } from "@/types/tempCrews";

const TIME_ZONE = "America/Montevideo";

export function formatTempCrewEventDate(date: string, withTime = false) {
  const parsed = parseEventRealDate(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE })
    .format(parsed)
    .replace(/\./g, "")
    .replace(/^\w/, (c) => c.toUpperCase());
  if (!withTime) return day;
  const time = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE }).format(parsed);
  return `${day} · ${time}`;
}

export const freeSpots = (crew: Pick<TempCrewSummary, "capacity" | "memberCount">) => Math.max(0, crew.capacity - crew.memberCount);
export const freeSpotsLabel = (spots: number) => (spots === 1 ? "Queda 1 lugar" : `Quedan ${spots} lugares`);
export const firstName = (person: Pick<TempCrewPerson, "name" | "username">) => person.name?.split(" ")[0] || person.username;

export function FacePile({ people, size = "size-7", ring = "ring-surface" }: { people: TempCrewPerson[]; size?: string; ring?: string }) {
  return (
    <span className="flex -space-x-2 shrink-0" aria-hidden="true">
      {people.slice(0, 3).map((person) => (
        <Avatar key={person.userId} src={person.avatarUrl || undefined} fallback={person.name || person.username} className={cn(size, "rounded-full ring-2", ring)} />
      ))}
    </span>
  );
}

export function AdmittingPill({ children = "Admitiendo", small }: { children?: React.ReactNode; small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-accent/12 text-accent font-semibold whitespace-nowrap", small ? "h-6 px-2.5 text-[11px]" : "h-7 px-2.5 text-xs")}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(212,255,0,0.25)]" />
      {children}
    </span>
  );
}

export function TemporalTag() {
  return <span className="label-mono inline-flex items-center h-6 px-2 rounded-lg border border-accent/50 text-accent text-[10px]">Temporal</span>;
}

export function EventMiniCard({ event, href, className }: { event: TempCrewEventRef; href?: string; className?: string }) {
  const banner = isValidImageUrl(event.cinematicBannerUrl) ? event.cinematicBannerUrl.trim() : null;
  const body = (
    <>
      <span
        aria-hidden="true"
        className="w-11 h-14 shrink-0 rounded-lg bg-surface-2 bg-cover bg-center"
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
      />
      <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <span className="text-sm font-semibold truncate">{event.title}</span>
        <span className="text-xs text-ink-2 truncate">
          {[formatTempCrewEventDate(event.date, true), event.location].filter(Boolean).join(" · ")}
        </span>
      </span>
      {href && <ChevronRight className="size-[18px] text-ink-3 shrink-0" aria-hidden="true" />}
    </>
  );
  const classes = cn("flex items-center gap-3 p-2.5 rounded-card bg-surface-2 border border-line", href && "hover:bg-[#23272D] transition-colors", className);
  return href ? <Link href={href} className={classes}>{body}</Link> : <div className={classes}>{body}</div>;
}

/** Tarjeta chica del carrusel del evento: abre el detalle de la crew. */
export function TempCrewLaneCard({ crew }: { crew: TempCrewSummary }) {
  const spots = freeSpots(crew);
  return (
    <Link
      href={`/crews/${crew.id}`}
      className="w-[236px] shrink-0 snap-start p-3.5 rounded-card bg-surface border border-line flex flex-col gap-2.5 hover:bg-surface-2 transition-colors lg:w-auto lg:min-w-0"
    >
      <span className="flex items-center justify-between gap-2">
        <FacePile people={crew.membersPreview} />
        <span className="num-mono text-[13px] text-ink-2"><span className="text-ink">{crew.memberCount}/{crew.capacity}</span></span>
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-base font-semibold truncate">{crew.name}</span>
        <span className="text-xs text-ink-2 truncate">por @{crew.host.username}</span>
      </span>
      <span className="text-[13px] leading-snug text-ink-2 line-clamp-2 min-h-[2.6em]">{crew.plan}</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
        {freeSpotsLabel(spots)}
      </span>
    </Link>
  );
}

/** Última tarjeta del carrusel: lleva a todas las crews del evento. */
export function TempCrewLaneEnd({ href, total }: { href: string; total: number }) {
  return (
    <Link
      href={href}
      className="w-[160px] shrink-0 snap-end p-4 rounded-card border border-dashed border-accent/55 bg-accent/[0.05] flex flex-col justify-center gap-3 hover:bg-accent/10 transition-colors lg:w-auto"
    >
      <span className="size-11 rounded-full bg-accent text-on-accent flex items-center justify-center">
        <ArrowUpRight className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-base font-bold leading-tight">Unirme a una crew</span>
        <span className="text-[13px] text-ink-2">Ver {total === 1 ? "la crew" : `las ${total}`}</span>
      </span>
    </Link>
  );
}

interface TempCrewCardProps {
  crew: TempCrewSummary;
  onRequest?: (crew: TempCrewSummary) => void;
  onCancelRequest?: (crew: TempCrewSummary) => void;
  isBusy?: boolean;
}

/** Tarjeta completa (lista de crews del evento y Explorar), con la acción según el estado. */
export function TempCrewCard({ crew, onRequest, onCancelRequest, isBusy }: TempCrewCardProps) {
  const spots = freeSpots(crew);
  let action: React.ReactNode;
  if (crew.viewerRole) {
    action = (
      <Link href={`/crews/${crew.id}`} className="h-10 px-3.5 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold flex items-center gap-1.5 hover:bg-[#23272D] transition-colors">
        {crew.viewerRole === "host" ? "Tu crew" : "Ver crew"}
      </Link>
    );
  } else if (crew.viewerRequestStatus === "pending") {
    action = (
      <button
        type="button"
        onClick={() => onCancelRequest?.(crew)}
        disabled={isBusy || !onCancelRequest}
        aria-label={`Solicitud enviada a ${crew.name}. Tocar para cancelarla`}
        className="h-10 px-3.5 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold text-ink-2 flex items-center gap-1.5 disabled:opacity-60"
      >
        <Clock3 className="size-4" aria-hidden="true" /> Solicitud enviada
      </button>
    );
  } else if (!crew.isAdmitting || spots === 0) {
    action = <span className="h-10 px-1 flex items-center text-[13px] font-semibold text-ink-3">Completa</span>;
  } else {
    action = (
      <button
        type="button"
        onClick={() => onRequest?.(crew)}
        disabled={isBusy}
        className="h-10 px-3.5 rounded-control border border-accent/50 text-accent text-sm font-semibold flex items-center gap-1.5 hover:bg-accent/10 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <UserPlus className="size-4" aria-hidden="true" /> Pedir unirme
      </button>
    );
  }

  return (
    <article className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <FacePile people={crew.membersPreview} size="size-[30px]" />
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <Link href={`/crews/${crew.id}`} className="text-[15px] font-semibold truncate hover:underline">{crew.name}</Link>
          <span className="text-xs text-ink-2 truncate">Creada por @{crew.host.username}</span>
        </div>
        {crew.isAdmitting && spots > 0 ? <AdmittingPill small /> : <span className="h-6 px-2.5 rounded-full bg-surface-2 text-[11px] font-semibold text-ink-3 flex items-center">Sin lugares</span>}
      </div>
      <p className="m-0 text-[13px] leading-normal text-ink-2">{crew.plan}</p>
      <div className="flex items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
          <Users className="size-[15px]" aria-hidden="true" />
          <span className="num-mono text-ink">{crew.memberCount}/{crew.capacity}</span> lugares
        </span>
        {action}
      </div>
    </article>
  );
}

const timeAgo = (iso: string) => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (Number.isNaN(minutes)) return "";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
};

/** Solicitud para entrar a la crew, con Aceptar / Rechazar (vista de quien la creó). */
export function TempCrewRequestCard({
  request,
  onRespond,
  isBusy,
  canAccept,
}: {
  request: TempCrewJoinRequest;
  onRespond: (decision: "accept" | "reject") => void;
  isBusy: boolean;
  canAccept: boolean;
}) {
  const facts = [
    request.isGoingToEvent ? "Va al evento" : null,
    request.mutualFriendsCount ? `${request.mutualFriendsCount} ${request.mutualFriendsCount === 1 ? "amigo" : "amigos"} en común` : null,
  ].filter(Boolean);
  return (
    <article className="w-[292px] shrink-0 snap-start p-3.5 rounded-card bg-surface border border-line flex flex-col gap-3 lg:w-[320px]">
      <div className="flex items-center gap-3">
        <Avatar src={request.user.avatarUrl || undefined} fallback={request.user.name} username={request.user.username} className="size-11 rounded-full shrink-0" />
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <Link href={`/profile/${request.user.username}`} className="text-[15px] font-semibold truncate hover:underline">
            {request.user.name} <span className="font-normal text-ink-2">@{request.user.username}</span>
          </Link>
          {facts.length > 0 && <span className="text-xs text-ink-2 truncate">{facts.join(" · ")}</span>}
        </span>
        <span className="text-xs text-ink-3 whitespace-nowrap">{timeAgo(request.createdAt)}</span>
      </div>
      <div className="flex-1 flex flex-col">
        {request.message ? (
          <p className="m-0 px-3 py-2.5 rounded-xl bg-surface-2 text-sm leading-snug text-ink break-words">“{request.message}”</p>
        ) : (
          <p className="m-0 py-2.5 text-[13px] text-ink-3">Sin mensaje.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onRespond("reject")}
          disabled={isBusy}
          aria-label={`Rechazar a ${request.user.name}`}
          className="h-11 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#23272D] transition-colors disabled:opacity-60"
        >
          <X className="size-4" aria-hidden="true" /> Rechazar
        </button>
        <button
          type="button"
          onClick={() => onRespond("accept")}
          disabled={isBusy || !canAccept}
          aria-label={`Aceptar a ${request.user.name}`}
          className="h-11 rounded-control bg-accent text-on-accent text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          <Check className="size-4" aria-hidden="true" /> Aceptar
        </button>
      </div>
    </article>
  );
}

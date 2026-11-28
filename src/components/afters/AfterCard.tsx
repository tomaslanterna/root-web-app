"use client";

import Link from "next/link";
import { ArrowUpRight, CircleCheckBig, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { attendanceText } from "@/lib/afters";
import { AfterCover } from "@/components/afters/AfterCover";
import { AccessPill, AfterTimeBadge, TagAfter } from "@/components/afters/AfterBits";
import type { AfterSummary } from "@/types/afters";

/** "Oficial · The Cube" para el oficial, "por @usuario" para el resto. */
export function AfterHostLine({ after, className }: { after: AfterSummary; className?: string }) {
  if (after.isOfficial) {
    return (
      <span className={cn("inline-flex items-center gap-[5px] text-xs text-accent truncate", className)}>
        <CircleCheckBig className="size-[13px] shrink-0" strokeWidth={2} aria-hidden="true" /> Oficial · {after.host.name}
      </span>
    );
  }
  return <span className={cn("text-xs text-ink-2 truncate", className)}>por @{after.host.username}</span>;
}

function Attendance({ after }: { after: AfterSummary }) {
  const text = attendanceText(after);
  const [count, ...rest] = text.split(" ");
  return (
    <span className="text-xs text-ink-2 whitespace-nowrap">
      <span className="num-mono text-ink">{count}</span>
      {rest.length > 0 && ` ${rest.join(" ")}`}
    </span>
  );
}

/**
 * Tarjeta del after para carruseles (`lane`) y grillas (`grid`). Muestra la zona, nunca la dirección:
 * los listados ni siquiera la reciben.
 */
export function AfterCard({ after, variant = "lane", className }: { after: AfterSummary; variant?: "lane" | "grid"; className?: string }) {
  return (
    <Link
      href={`/afters/${after.id}`}
      role="listitem"
      className={cn(
        "rounded-card bg-surface border border-line overflow-hidden flex flex-col text-ink hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent",
        variant === "lane" ? "w-[236px] shrink-0 snap-start xl:w-auto xl:min-w-0" : "min-w-0",
        className,
      )}
    >
      <AfterCover after={after} className={variant === "grid" ? "h-[132px] lg:h-[170px]" : "h-[132px] xl:h-[150px]"}>
        <span className="absolute left-2.5 top-2.5"><TagAfter official={after.isOfficial} /></span>
        <AfterTimeBadge startsAt={after.startsAt} className="absolute right-2.5 top-2.5" />
      </AfterCover>
      <span className="px-3.5 pt-3 pb-3.5 flex flex-col gap-2 min-w-0">
        <span className="flex flex-col gap-[3px] min-w-0">
          <span className="text-base font-semibold truncate">{after.name}</span>
          <AfterHostLine after={after} />
          {after.event && <span className="text-xs text-ink-2 truncate">Después de {after.event.title}</span>}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/80 min-w-0">
          <MapPin className="size-3.5 text-ink-2 shrink-0" aria-hidden="true" />
          <span className="truncate">{after.zone}</span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <AccessPill access={after.access} price={after.price} />
          <Attendance after={after} />
        </span>
      </span>
    </Link>
  );
}

/** Fila de la lista del filtro Afters (mobile). Tampoco muestra la dirección. */
export function AfterRow({ after }: { after: AfterSummary }) {
  return (
    <Link
      href={`/afters/${after.id}`}
      className="flex gap-3 p-2.5 rounded-card bg-surface border border-line text-ink hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
    >
      <AfterCover after={after} size="row" className="w-[92px] h-[116px] rounded-xl">
        <AfterTimeBadge startsAt={after.startsAt} size="sm" className="absolute left-1.5 bottom-1.5" />
      </AfterCover>
      <span className="flex-1 min-w-0 flex flex-col gap-[5px] pt-0.5 pr-0.5">
        <span className="flex items-center gap-1.5 min-w-0">
          {after.isOfficial && <TagAfter official className="shrink-0" />}
          <span className="text-[15px] font-semibold truncate">{after.name}</span>
        </span>
        <span className="text-xs text-ink-2 truncate">{after.event ? `Después de ${after.event.title}` : "After suelto"}</span>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/80 min-w-0">
          <MapPin className="size-3.5 text-ink-2 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {after.zone} · <span className="text-ink-2">{after.isOfficial ? `@${after.host.username}` : `por @${after.host.username}`}</span>
          </span>
        </span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <AccessPill access={after.access} price={after.price} />
          <Attendance after={after} />
        </span>
      </span>
    </Link>
  );
}

/** Última tarjeta del carrusel: "Ver todos". Con `onClick` es un botón (activa el filtro); con `href`, un link. */
export function AftersLaneEnd({ total, href, onClick, className }: { total: number; href?: string; onClick?: () => void; className?: string }) {
  const classes = cn(
    "w-[150px] shrink-0 snap-end p-4 rounded-card border border-dashed border-white/20 bg-surface/50 flex flex-col justify-center gap-3 text-left text-ink hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-accent xl:w-auto",
    className,
  );
  const body = (
    <>
      <span className="size-11 rounded-full bg-ink text-bg flex items-center justify-center">
        <ArrowUpRight className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-base font-bold leading-tight">Ver todos</span>
        <span className="text-[13px] text-ink-2">{total === 1 ? "El after" : `Los ${total} afters`}</span>
      </span>
    </>
  );
  if (href) return <Link href={href} className={classes}>{body}</Link>;
  return <button type="button" onClick={onClick} className={classes}>{body}</button>;
}

"use client";

import { CircleCheckBig, Lock, Moon, Ticket, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { accessLabel, formatAfterTime } from "@/lib/afters";
import type { AfterAccess } from "@/types/afters";

/** Etiqueta del after: lima para el oficial (organizador o RRPP del evento), oscura para el resto. */
export function TagAfter({ official, className }: { official: boolean; className?: string }) {
  return official ? (
    <span className={cn("label-mono inline-flex items-center gap-[5px] h-6 px-[9px] rounded-lg bg-accent text-on-accent text-[10px] font-semibold", className)}>
      <CircleCheckBig className="size-3" strokeWidth={2.2} aria-hidden="true" /> After oficial
    </span>
  ) : (
    <span className={cn("label-mono inline-flex items-center gap-[5px] h-6 px-[9px] rounded-lg bg-bg/80 text-ink border border-white/20 text-[10px]", className)}>
      <Moon className="size-3" aria-hidden="true" /> After
    </span>
  );
}

const ACCESS_ICONS: Record<AfterAccess, typeof Users> = { free: Users, approval: Lock, ticket: Ticket };

/** Cómo se entra: Libre, Con aprobación o Entrada (con precio). */
export function AccessPill({ access, price, className }: { access: AfterAccess; price?: string | null; className?: string }) {
  const Icon = ACCESS_ICONS[access];
  return (
    <span className={cn("inline-flex items-center gap-[5px] h-6 px-[9px] rounded-full bg-surface-2 text-ink/80 text-xs font-semibold whitespace-nowrap", className)}>
      <Icon className="size-[13px]" aria-hidden="true" />
      {accessLabel(access, price)}
    </span>
  );
}

/** "Desde 06:00" sobre la portada. */
export function AfterTimeBadge({ startsAt, size = "md", className }: { startsAt: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col items-center px-[9px] py-[5px] rounded-[11px] bg-bg/85", className)}>
      <span className="label-mono text-[9px] text-ink-2">Desde</span>
      <span className={cn("num-mono font-semibold leading-[1.1]", size === "sm" ? "text-[15px]" : size === "lg" ? "text-[22px]" : "text-lg")}>
        {formatAfterTime(startsAt)}
      </span>
    </span>
  );
}

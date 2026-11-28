"use client";

import type { ReactNode } from "react";
import { cn, isValidImageUrl } from "@/lib/utils";
import type { AfterSummary } from "@/types/afters";

type CoverSize = "row" | "card" | "hero";

const GENERATED_BACKGROUND =
  "radial-gradient(120% 90% at 85% 0%, color-mix(in srgb, var(--color-accent) 35%, transparent), transparent 55%), linear-gradient(160deg, var(--color-surface-2), var(--color-bg))";

const WORD_SIZE: Record<CoverSize, string> = { row: "text-[17px]", card: "text-[40px]", hero: "text-[60px] lg:text-[84px]" };
const ZONE_SIZE: Record<CoverSize, string> = { row: "", card: "text-[20px]", hero: "text-[26px] lg:text-[32px]" };

/**
 * Portada del after: la foto que subió el host o, si no hay, una portada de root con "AFTER" y la zona.
 * `children` va encima (etiquetas, hora).
 */
export function AfterCover({
  after,
  size = "card",
  className,
  children,
}: {
  after: Pick<AfterSummary, "coverUrl" | "name" | "zone">;
  size?: CoverSize;
  className?: string;
  children?: ReactNode;
}) {
  const photo = isValidImageUrl(after.coverUrl) ? after.coverUrl.trim() : null;
  return (
    <div className={cn("relative overflow-hidden bg-surface shrink-0", className)}>
      {photo ? (
        <>
          <span
            role="img"
            aria-label={`Foto de ${after.name}`}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(photo)})` }}
          />
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-bg/10 via-transparent via-40% to-bg/55" />
        </>
      ) : (
        <span
          aria-hidden="true"
          className={cn("absolute inset-0 flex flex-col", size === "row" ? "justify-start p-2" : size === "hero" ? "justify-end px-5 pt-5 pb-[76px]" : "justify-end p-3.5 lg:p-5")}
          style={{ background: GENERATED_BACKGROUND }}
        >
          <span className={cn("font-display text-transparent leading-[0.9] [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--color-accent)_75%,transparent)]", WORD_SIZE[size])}>
            After
          </span>
          {/* En la fila, la hora va abajo: alcanza con la palabra (la zona está al lado). */}
          {size !== "row" && <span className={cn("font-display text-ink mt-1.5 truncate", ZONE_SIZE[size])}>{after.zone}</span>}
        </span>
      )}
      {children}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { badgeProgress, badgeStepValue } from "@/lib/badgeAppearance";
import type { EventBadge } from "@/types/badges";
import { badgeArtistImageUrl, badgeFlyerUrl } from "@/services/badges";
import { cn } from "@/lib/utils";

// Arco abierto abajo: se llena según la nota (0–5) de la noche.
const ARC = "M 18.5 73.8 A 39.5 39.5 0 1 1 81.5 73.8";

const ratingFormat = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

export function badgeRatingLabel(rating: number) {
  return ratingFormat.format(rating);
}

export function BadgeCrown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 18" fill="currentColor" aria-hidden="true" className={cn("text-accent", className)}>
      <path d="M2 16h20L23 4l-6 4.5L12 1 7 8.5 1 4z" />
    </svg>
  );
}

export function BadgeArc({ percent, strokeWidth, className }: { percent: number; strokeWidth: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path d={ARC} fill="none" stroke="#2A2E35" strokeWidth={strokeWidth} strokeLinecap="round" />
      {percent > 0 && (
        <path
          d={ARC}
          pathLength={100}
          strokeDasharray={`${percent} 100`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-300"
        />
      )}
    </svg>
  );
}

interface BadgeMedalProps {
  badge: EventBadge;
  size?: "tile" | "hero";
  /** Nota en edición: el arco y el chip la siguen antes de guardar. */
  ratingOverride?: number | null;
  /** Las reseñas son privadas: quien visita no ve "Reseñar" ni flyers atenuados. */
  isOwner?: boolean;
}

export function BadgeMedal({ badge, size = "tile", ratingOverride, isOwner = true }: BadgeMedalProps) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const imageUrl = [
    badge.imageUrl ? badgeFlyerUrl(badge.eventId) : undefined,
    badge.headliner?.imageUrl ? badgeArtistImageUrl(badge.eventId, badge.headliner.id) : undefined,
  ].find((url) => url && !failedUrls.includes(url));

  const rating = ratingOverride !== undefined ? ratingOverride : badge.review?.generalRating ?? null;
  // Cero es una nota guardada, no una insignia sin reseñar.
  const reviewed = rating != null;
  const isHero = size === "hero";
  const showSteps = badge.mostDanced && badge.steps != null;
  const chip = !isOwner
    ? showSteps ? `${badgeStepValue(badge.steps)} pasos` : null
    : !reviewed
      ? "Reseñar"
      : showSteps
        ? `${badgeStepValue(badge.steps)} pasos`
        : `Nota ${badgeRatingLabel(rating)}`;

  return (
    <div className={cn("relative shrink-0", isHero ? "size-[248px]" : "size-[104px]")}>
      {badge.mostDanced && (
        <BadgeCrown className={cn("absolute left-1/2 -translate-x-1/2 z-10", isHero ? "-top-6 w-12" : "-top-3 w-[26px]")} />
      )}
      <BadgeArc percent={badgeProgress(rating)} strokeWidth={isHero ? 3.5 : 5} className="absolute inset-0 size-full" />
      <div
        className={cn(
          "absolute rounded-full overflow-hidden bg-surface-2 flex items-center justify-center motion-safe:transition-opacity motion-safe:duration-300",
          isHero ? "inset-[44px]" : "inset-5",
          isOwner && !reviewed && "opacity-45",
        )}
      >
        {imageUrl ? (
          <Image
            key={imageUrl}
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes={isHero ? "160px" : "64px"}
            className="object-cover"
            onError={() => setFailedUrls((previous) => [...previous, imageUrl])}
          />
        ) : (
          <span aria-hidden="true" className={cn("font-display text-center", isHero ? "text-3xl" : "text-xs")}>
            {badge.title.slice(0, 4)}
          </span>
        )}
      </div>
      {chip && <span
        className={cn(
          "num-mono absolute left-1/2 -translate-x-1/2 rounded-full font-semibold whitespace-nowrap",
          isHero ? "bottom-1 px-3 py-[5px] text-[13px]" : "bottom-0 px-2 py-[3px] text-[11px]",
          isOwner && !reviewed
            ? "bg-accent text-on-accent"
            : badge.mostDanced
              ? "bg-surface-2 text-accent"
              : "bg-surface-2 text-ink",
        )}
      >
        {chip}
      </span>}
    </div>
  );
}

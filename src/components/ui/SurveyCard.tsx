"use client";

import Link from "next/link";
import type { Event } from "@/types/events";
import { cn, isValidImageUrl } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";

interface SurveyCardProps {
  surveyEvent: Event;
  className?: string;
}

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "America/Montevideo",
});

export function SurveyCard({ surveyEvent, className }: SurveyCardProps) {
  const date = parseEventRealDate(surveyEvent.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : dateFormat.format(date).replace(/\./g, "").replace(/^\w/, (c) => c.toUpperCase());
  const initials = surveyEvent.title.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3);
  const hasImage = isValidImageUrl(surveyEvent.cinematicBannerUrl);

  return (
    <div
      className={cn(
        "w-[300px] shrink-0 snap-start p-3.5 rounded-card bg-surface border border-line flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="font-display size-12 shrink-0 rounded-thumb bg-[#2B2F36] bg-cover bg-center text-ink text-[11px] flex items-center justify-center"
          style={hasImage ? { backgroundImage: `url(${surveyEvent.cinematicBannerUrl.trim()})` } : undefined}
        >
          {!hasImage && initials}
        </div>
        <div className="min-w-0 flex flex-col gap-[3px]">
          <span className="text-[15px] font-semibold truncate">{surveyEvent.title}</span>
          <span className="text-[13px] text-ink-2">
            {dateLabel ? `${dateLabel} · ` : ""}Calificá sonido, lugar y lineup
          </span>
        </div>
      </div>
      <Link
        href={`/events/${surveyEvent.id}/survey`}
        className="h-11 rounded-xl bg-surface-2 border border-white/10 text-ink text-sm font-semibold flex items-center justify-center transition-colors hover:bg-[#23272D] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
      >
        Responder · 1 min
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Clock3, ImageOff, XCircle } from "lucide-react";
import { cn, isValidImageUrl } from "@/lib/utils";
import { formatAfterDay } from "@/lib/afters";
import type { EventSubmission } from "@/types/eventSubmissions";

const sentLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Enviado hoy";
  const day = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(date).replace(/\./g, "");
  return `Enviado el ${day}`;
};

/** Estado del envío: En revisión, Publicado o No publicado. */
export function SubmissionStatusPill({ status }: { status: EventSubmission["status"] }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-accent/12 text-accent text-[11px] font-semibold whitespace-nowrap">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(212,255,0,0.25)]" /> Publicado
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-[5px] h-6 px-[9px] rounded-full bg-live/14 text-danger text-xs font-semibold whitespace-nowrap">
        <XCircle className="size-[13px]" aria-hidden="true" /> No publicado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[5px] h-6 px-[9px] rounded-full bg-surface-2 text-ink/80 text-xs font-semibold whitespace-nowrap">
      <Clock3 className="size-[13px]" aria-hidden="true" /> En revisión
    </span>
  );
}

export function EventSubmissionCard({ submission }: { submission: EventSubmission }) {
  const flyer = isValidImageUrl(submission.flyerUrl) ? submission.flyerUrl.trim() : null;
  const footer =
    submission.status === "published" && submission.eventId ? (
      <Link href={`/events/${submission.eventId}`} className="text-[13px] font-semibold text-accent hover:text-accent-hover">Ver evento</Link>
    ) : submission.status === "rejected" && submission.rejectReason ? (
      <span className="text-[13px] leading-snug text-ink-2">{submission.rejectReason}</span>
    ) : null;
  return (
    <li className="p-3 rounded-card bg-surface border border-line flex flex-col gap-2">
      <div className="flex gap-3 items-center">
        <span
          aria-hidden="true"
          className={cn("w-12 h-[60px] shrink-0 rounded-[10px] bg-surface-2 bg-cover bg-center flex items-center justify-center")}
          style={flyer ? { backgroundImage: `url(${JSON.stringify(flyer)})` } : undefined}
        >
          {!flyer && <ImageOff className="size-4 text-ink-3" />}
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
          <span className="font-semibold truncate">{submission.name}</span>
          <span className="text-xs text-ink-2 truncate">{[formatAfterDay(submission.startsAt, false), sentLabel(submission.createdAt)].filter(Boolean).join(" · ")}</span>
        </span>
      </div>
      <div><SubmissionStatusPill status={submission.status} /></div>
      {footer && <div className="pt-2.5 mt-0.5 border-t border-line">{footer}</div>}
    </li>
  );
}

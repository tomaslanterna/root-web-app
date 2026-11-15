"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  EventLiveRankingContent,
  LiveRankingHeader,
} from "@/components/events/EventLiveRankingModal";
import { useDanceContext } from "@/context/DanceContext";
import { eventsApi } from "@/services/events";
import type { Event } from "@/types/events";

export default function EventLiveRankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { liveEvent, isAtVenue, attendanceConfirmed } = useDanceContext();
  const [event, setEvent] = useState<Event | null>(null);

  const isUserAtThisEvent = Boolean(
    liveEvent?.id === id && (isAtVenue || attendanceConfirmed),
  );

  useEffect(() => {
    eventsApi
      .getEventById(id)
      .then((res) => setEvent(res))
      .catch(() => undefined);
  }, [id]);

  if (!isUserAtThisEvent) {
    return (
      <div className="min-h-[100dvh] bg-bg text-ink flex flex-col">
        <LiveRankingHeader onBack={() => router.back()} />
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 flex flex-col items-center justify-center gap-3 text-center">
          <span className="size-14 rounded-card bg-surface border border-line flex items-center justify-center">
            <Lock className="size-6 text-accent" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl m-0 text-balance">Solo para quienes están en el evento</h2>
          <p className="m-0 text-[15px] text-ink-2 max-w-xs">
            El ranking de pasos en tiempo real se abre cuando estás en el predio del evento.
          </p>
          <Link
            href={`/events/${id}`}
            className="mt-2 min-h-11 px-5 rounded-control bg-accent text-on-accent text-sm font-semibold flex items-center hover:bg-accent-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Volver al evento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EventLiveRankingContent
      eventId={id}
      eventTitle={event?.title}
      eventLocation={event?.location}
      eventBannerUrl={event?.cinematicBannerUrl}
      onClose={() => router.back()}
    />
  );
}

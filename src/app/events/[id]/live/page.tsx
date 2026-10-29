"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trophy } from "lucide-react";
import { EventLiveRankingContent } from "@/components/events/EventLiveRankingModal";
import { DetailHeader } from "@/components/ui/DetailHeader";
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
      <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col">
        <DetailHeader
          position="sticky"
          onBack={() => router.back()}
          icon={<Trophy className="w-4 h-4 text-[#D4FF00]" />}
          title="Ranking del Evento"
          showSave={false}
          showShare={false}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#111114] flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#D4FF00]" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            Exclusivo para personas en el evento
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs font-medium">
            El ranking de pasos en tiempo real solo está disponible para quienes se encuentran presentes en el evento.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/events/${id}`)}
            className="mt-2 rounded-full bg-[#D4FF00] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black cursor-pointer"
          >
            Volver al evento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10]">
      <EventLiveRankingContent
        eventId={id}
        eventTitle={event?.title}
        eventLocation={event?.location}
        eventBannerUrl={event?.cinematicBannerUrl}
        eventDate={event?.date}
        eventLineup={event?.lineup}
        eventGenre={event?.genre}
        onClose={() => router.back()}
      />
    </div>
  );
}

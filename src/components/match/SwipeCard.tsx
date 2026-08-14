"use client";

import React from "react";
import { Event, UserVibeProfile } from "@/lib/mocks";
import { Calendar, MapPin, Users, Sparkles, Flame, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  event: Event;
  isTopCard: boolean;
  dragOffset?: { x: number; y: number };
  vibeProfile: UserVibeProfile;
}

export function SwipeCard({
  event,
  isTopCard,
  dragOffset = { x: 0, y: 0 },
  vibeProfile,
}: SwipeCardProps) {
  const dateObj = new Date(event.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })
    : event.date;

  // Calculate dynamic match score based on user profile and event
  const seed = event.id.charCodeAt(event.id.length - 1) * 7;
  const matchScore = 88 + (seed % 11);

  // Drag stamp opacity and transform
  const dragX = dragOffset.x;
  const dragY = dragOffset.y;

  const showLikeStamp = isTopCard && dragX > 25 && Math.abs(dragY) < 60;
  const showPassStamp = isTopCard && dragX < -25 && Math.abs(dragY) < 60;
  const showSuperStamp = isTopCard && dragY < -30;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-950 select-none group">
      {/* Background Poster Image */}
      <img
        src={event.cinematicBannerUrl}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Cinematic Dark Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950/70 via-neutral-950/20 to-transparent pointer-events-none" />

      {/* Top Badges Bar */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
        {/* Match Score Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14171F]/90 backdrop-blur-xl border border-[#D4FF00]/40 text-[#D4FF00] text-xs font-black uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 fill-[#D4FF00]" />
          <span>{matchScore}% Match Musical</span>
        </div>

        {/* Date Badge */}
        <div className="px-3 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-xl border border-white/20 text-white text-xs font-black uppercase tracking-wider shadow-md">
          {formattedDate}
        </div>
      </div>

      {/* Drag Visual Feedback Stamps */}
      {showLikeStamp && (
        <div className="absolute top-16 left-6 -rotate-12 px-4 py-2 rounded-2xl border-3 border-[#D4FF00] bg-neutral-950/90 backdrop-blur-md text-[#D4FF00] text-lg font-black uppercase tracking-widest shadow-2xl animate-fade-in pointer-events-none z-20">
          CREW 💚
        </div>
      )}

      {showPassStamp && (
        <div className="absolute top-16 right-6 rotate-12 px-4 py-2 rounded-2xl border-3 border-rose-500 bg-neutral-950/90 backdrop-blur-md text-rose-500 text-lg font-black uppercase tracking-widest shadow-2xl animate-fade-in pointer-events-none z-20">
          PASS ❌
        </div>
      )}

      {showSuperStamp && (
        <div className="absolute top-1/3 inset-x-0 mx-auto w-fit px-5 py-2.5 rounded-2xl border-3 border-[#D4FF00] bg-[#D4FF00] text-neutral-950 text-base font-black uppercase tracking-widest shadow-2xl animate-bounce pointer-events-none z-20 flex items-center gap-1.5">
          <Flame className="w-5 h-5 fill-neutral-950" /> SUPER CREW ⚡
        </div>
      )}

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 inset-x-0 p-5 space-y-3 pointer-events-none z-10">
        {/* Live Squad seekers counter */}
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-ping" />
          <Users className="w-3.5 h-3.5 text-[#D4FF00]" />
          <span>{35 + (seed % 25)} personas buscando Crew en tu zona</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
          {event.title}
        </h2>

        {/* Location */}
        <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide">
          <MapPin className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />
          <span>{event.location}</span>
        </p>

        {/* Lineup Badges */}
        {event.lineup && event.lineup.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {event.lineup.slice(0, 4).map((artist) => (
              <span
                key={artist}
                className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-[10px] font-black uppercase tracking-wider"
              >
                {artist}
              </span>
            ))}
            {event.lineup.length > 4 && (
              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-[10px] font-bold">
                +{event.lineup.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

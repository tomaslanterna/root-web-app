"use client";

import React, { useState } from "react";
import { useMatch } from "@/context/MatchContext";
import { MOCK_EVENTS, MOCK_USERS } from "@/lib/mocks";
import { EventSwipeDeck } from "@/components/match/EventSwipeDeck";
import { VibePreferencesDrawer } from "@/components/match/VibePreferencesDrawer";
import { SquadMatchModal } from "@/components/match/SquadMatchModal";
import { Sparkles, Users, SlidersHorizontal, Flame, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export default function MatchPage() {
  const {
    vibeProfile,
    swipedEventIds,
    swipeEvent,
    resetSwipes,
    squads,
    setIsPreferencesOpen,
  } = useMatch();

  const [activeTab, setActiveTab] = useState<"deck" | "squads">("deck");

  // User squads
  const userSquads = squads.filter((s) =>
    s.members.some((m) => m.userId === vibeProfile.userId)
  );

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white">
      {/* Sticky Obsidian Header */}
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15">
            <Flame className="w-4 h-4 fill-neutral-950" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              <span>Crews Matcher</span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              {vibeProfile.departureZone.split("/")[0]} • {vibeProfile.favoriteGenres[0]}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPreferencesOpen(true)}
          className="p-2 px-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-[#D4FF00] border border-white/10 cursor-pointer shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Vibra</span>
        </button>
      </header>

      {/* Main Sub-nav Mode Switcher (Solo Móvil) */}
      <div className="p-4 pb-2 md:hidden">
        <div className="w-full bg-[#14171F]/90 p-1 rounded-full border border-white/10 shadow-lg flex items-center gap-1">
          <button
            onClick={() => setActiveTab("deck")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none",
              activeTab === "deck"
                ? "bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/15 scale-[1.01]"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Descubrir</span>
          </button>

          <button
            onClick={() => setActiveTab("squads")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none",
              activeTab === "squads"
                ? "bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/15 scale-[1.01]"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mis Crews</span>
            {userSquads.length > 0 && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                  activeTab === "squads"
                    ? "bg-neutral-950/20 text-neutral-950"
                    : "bg-[#D4FF00]/20 text-[#D4FF00]"
                )}
              >
                {userSquads.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-12 md:gap-8 lg:gap-16 p-4 md:py-8 items-start">
        
        {/* Columna Izquierda: Swipe Deck (Siempre visible en desktop, según tab en móvil) */}
        <div className={cn("w-full md:col-span-5 lg:col-span-5 flex-col", activeTab === "deck" ? "flex" : "hidden md:flex")}>
          <div className="hidden md:flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4FF00]" /> Descubrir Eventos
            </h2>
          </div>
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <EventSwipeDeck
              events={MOCK_EVENTS}
              vibeProfile={vibeProfile}
              onSwipe={swipeEvent}
              onOpenPreferences={() => setIsPreferencesOpen(true)}
              onResetSwipes={resetSwipes}
              swipedIds={swipedEventIds}
            />
          </div>
        </div>

        {/* Columna Derecha: User Squads List (Siempre visible en desktop, según tab en móvil) */}
        <div className={cn("w-full md:col-span-7 lg:col-span-7 flex-col space-y-4", activeTab === "squads" ? "flex" : "hidden md:flex")}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <Users className="w-4 h-4 hidden md:block text-[#D4FF00]" />
              Crews Formados
            </h2>
            <span className="text-[10px] md:text-xs font-extrabold uppercase text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-1 rounded-full border border-[#D4FF00]/20">
              {userSquads.length} ACTIVOS
            </span>
          </div>

          {userSquads.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-[#14171F] border border-white/10 space-y-3 mt-4">
              <Users className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-bold text-neutral-300">Aún no tienes ningún Crew activo</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Empieza a deslizar eventos a la derecha en la pestaña Descubrir para que el sistema te empareje automáticamente en un Crew con otros asistentes compatibles.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("deck")}
                className="md:hidden mt-2 py-2.5 px-5 rounded-full bg-[#D4FF00] text-neutral-950 text-xs font-black uppercase tracking-wider"
              >
                Descubrir Eventos
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {userSquads.map((sq) => {
                const event = MOCK_EVENTS.find((e) => e.id === sq.eventId);
                const members = sq.members.map(
                  (m) => MOCK_USERS.find((u) => u.id === m.userId) || MOCK_USERS[0]
                );

                return (
                  <Link
                    key={sq.id}
                    href={`/chat/squad/${sq.id}`}
                    className="block p-4 rounded-3xl bg-[#14171F] border border-white/10 hover:border-[#D4FF00]/40 transition-all duration-300 shadow-lg hover:shadow-[#D4FF00]/5 group"
                  >
                    <div className="flex items-center gap-4">
                      {event && (
                        <img
                          src={event.cinematicBannerUrl}
                          alt={event.title}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-white/10 shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs md:text-sm font-black uppercase tracking-tight text-white group-hover:text-[#D4FF00] transition-colors truncate">
                            {sq.name}
                          </h3>
                          <span className="text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/20 shrink-0">
                            {sq.matchScore}% Match
                          </span>
                        </div>

                        <p className="text-[10px] md:text-xs text-neutral-400 font-bold truncate">
                          {event?.title} • {sq.departureZone}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center -space-x-2 md:-space-x-1.5">
                            {members.map((u) => (
                              <Avatar
                                key={u.id}
                                src={u.avatarUrl}
                                fallback={u.name}
                                size="sm"
                                className="ring-2 ring-[#14171F] w-6 h-6 md:w-7 md:h-7"
                              />
                            ))}
                            <span className="text-[10px] md:text-[11px] text-neutral-400 font-bold pl-3">
                              {sq.members.length} miembros
                            </span>
                          </div>

                          <span className="text-neutral-400 group-hover:text-white flex items-center gap-1 text-[11px] font-extrabold uppercase transition-colors">
                            <MessageSquare className="w-3.5 h-3.5 text-[#D4FF00]" /> <span className="hidden sm:inline">Chat</span> →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Global Vibe Preferences Drawer */}
      <VibePreferencesDrawer />

      {/* Global Squad Match Modal */}
      <SquadMatchModal />
    </div>
  );
}

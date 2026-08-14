"use client";

import React from "react";
import { useMatch } from "@/context/MatchContext";
import { MOCK_EVENTS, MOCK_USERS } from "@/lib/mocks";
import { Sparkles, MessageSquare, ArrowRight, X, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export function SquadMatchModal() {
  const { activeMatchedSquad, isMatchModalOpen, closeMatchModal } = useMatch();

  if (!isMatchModalOpen || !activeMatchedSquad) return null;

  const event = MOCK_EVENTS.find((e) => e.id === activeMatchedSquad.eventId);
  const memberUsers = activeMatchedSquad.members.map((m) =>
    MOCK_USERS.find((u) => u.id === m.userId) || {
      id: m.userId,
      name: "Usuario",
      username: "user",
      role: "USER" as const,
      avatarUrl: "https://i.pravatar.cc/150",
      isKycVerified: true,
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={closeMatchModal} />

      <div className="relative w-full max-w-sm bg-[#14171F] border border-[#D4FF00]/40 rounded-3xl p-6 text-center space-y-6 shadow-2xl shadow-[#D4FF00]/10 z-10 animate-fade-in overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4FF00]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeMatchModal}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="space-y-1.5 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4FF00] text-neutral-950 text-[10px] font-black uppercase tracking-widest shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-neutral-950" /> ¡Crew Formado!
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
            Tienes Match de Crew
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            Se ha creado un grupo automático para este evento
          </p>
        </div>

        {/* Event Preview Mini-Card */}
        {event && (
          <div className="p-3 rounded-2xl bg-[#0B0D10] border border-white/10 flex items-center gap-3 text-left">
            <img
              src={event.cinematicBannerUrl}
              alt={event.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
            />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-xs font-black uppercase text-white truncate">
                {event.title}
              </p>
              <p className="text-[10px] text-neutral-400 font-bold flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-[#D4FF00]" /> {event.location}
              </p>
              <span className="text-[9px] font-black uppercase text-[#D4FF00] tracking-wider">
                {activeMatchedSquad.matchScore}% Compatibilidad
              </span>
            </div>
          </div>
        )}

        {/* Squad Members Avatars Row */}
        <div className="space-y-2 py-1">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#D4FF00]" /> {activeMatchedSquad.members.length} Integrantes Conectados
          </p>

          <div className="flex items-center justify-center -space-x-3">
            {memberUsers.map((user, idx) => (
              <div key={user.id} className="relative group">
                <Avatar
                  src={user.avatarUrl}
                  fallback={user.name}
                  size="md"
                  className="ring-3 ring-[#14171F] shadow-lg"
                />
                {idx === 0 && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase bg-[#D4FF00] text-neutral-950 px-1.5 py-0.2 rounded-full shadow-xs">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] text-neutral-300 font-medium pt-1">
            Salida coordinada desde <span className="font-extrabold text-[#D4FF00]">{activeMatchedSquad.departureZone}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Link
            href={`/chat/squad/${activeMatchedSquad.id}`}
            onClick={closeMatchModal}
            className="w-full py-3.5 px-4 rounded-full bg-[#D4FF00] text-neutral-950 font-black uppercase tracking-wider text-xs shadow-lg shadow-[#D4FF00]/20 flex items-center justify-center gap-2 hover:bg-[#bce400] active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4 fill-neutral-950" />
            <span>Entrar al Chat del Crew</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>

          <button
            type="button"
            onClick={closeMatchModal}
            className="w-full py-2.5 px-4 rounded-full text-neutral-400 hover:text-white font-extrabold uppercase tracking-wider text-xs transition-colors"
          >
            Seguir Explorando Eventos
          </button>
        </div>
      </div>
    </div>
  );
}

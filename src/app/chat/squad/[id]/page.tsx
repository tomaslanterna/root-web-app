"use client";

import React, { useState, use } from "react";
import { useMatch } from "@/context/MatchContext";
import { MOCK_EVENTS, MOCK_USERS } from "@/lib/mocks";
import { Avatar } from "@/components/ui/Avatar";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Ticket,
  MapPin,
  Car,
  Users,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SquadChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { squads, squadMessages, sendMessageToSquad, vibeProfile } = useMatch();

  const [inputMessage, setInputMessage] = useState("");
  const [meetingPoint, setMeetingPoint] = useState<string | null>(null);

  const squad = squads.find((s) => s.id === id) || squads[0];
  const event = squad ? MOCK_EVENTS.find((e) => e.id === squad.eventId) : null;
  const messages = squad ? squadMessages[squad.id] || [] : [];

  if (!squad || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#0B0D10] text-white">
        <p className="text-sm font-bold uppercase text-neutral-400">Crew no encontrado</p>
        <Link href="/match" className="mt-4 px-4 py-2 rounded-full bg-[#D4FF00] text-neutral-950 font-black text-xs uppercase">
          Volver a Crews Matcher
        </Link>
      </div>
    );
  }

  const memberUsers = squad.members.map(
    (m) => MOCK_USERS.find((u) => u.id === m.userId) || MOCK_USERS[0]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessageToSquad(squad.id, inputMessage.trim());
    setInputMessage("");
  };

  const handleSetMeetingPoint = () => {
    const point = "📍 Carpa de Hidratación Principal (Frente a Escenario 1)";
    setMeetingPoint(point);
    sendMessageToSquad(squad.id, `Punto de encuentro fijado en el evento: ${point}`, "meeting_point");
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0D10] text-white overflow-hidden">
      {/* Sticky Header with Event Banner info */}
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/match"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-neutral-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <img
              src={event.cinematicBannerUrl}
              alt={event.title}
              className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
            />
            <div className="leading-tight">
              <h1 className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[170px]">
                {squad.name}
              </h1>
              <p className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                <span className="text-[#D4FF00]">{squad.members.length} miembros</span> • {squad.departureZone.split("/")[0]}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/events/${event.id}`}
          className="px-2.5 py-1 rounded-full bg-[#D4FF00]/15 border border-[#D4FF00]/30 text-[#D4FF00] text-[10px] font-black uppercase tracking-wider hover:bg-[#D4FF00] hover:text-neutral-950 transition-colors shrink-0"
        >
          Ver Evento
        </Link>
      </header>

      {/* Squad Utility Bar */}
      <div className="bg-[#14171F]/90 border-b border-white/10 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar text-xs">
        <Link
          href="/resale"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-extrabold uppercase text-white whitespace-nowrap transition-colors"
        >
          <Ticket className="w-3 h-3 text-[#D4FF00]" />
          <span>Tickets Reventa</span>
        </Link>

        <button
          onClick={handleSetMeetingPoint}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-extrabold uppercase text-white whitespace-nowrap transition-colors cursor-pointer"
        >
          <MapPin className="w-3 h-3 text-[#D4FF00]" />
          <span>Punto de Encuentro</span>
        </button>

        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#0B0D10] text-[10px] font-bold text-neutral-400 whitespace-nowrap">
          <ShieldCheck className="w-3 h-3 text-[#D4FF00]" />
          <span>Crew KYC</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar">
        {/* Event Date reminder header card */}
        <div className="p-3 rounded-2xl bg-[#14171F]/60 border border-white/5 text-center space-y-1 my-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#D4FF00] flex items-center justify-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {event.title}
          </p>
          <p className="text-[10px] text-neutral-400 font-bold">
            {event.location} • Salida coordinada desde {squad.departureZone}
          </p>
        </div>

        {messages.map((msg) => {
          const isSystem = msg.type === "system_icebreaker";
          const isMeetingPoint = msg.type === "meeting_point";
          const isCurrentUser = msg.senderId === vibeProfile.userId;
          const sender = isSystem ? null : MOCK_USERS.find((u) => u.id === msg.senderId) || MOCK_USERS[0];

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/25 text-neutral-200 text-xs font-medium leading-relaxed space-y-1.5 shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-[#D4FF00] font-black text-[10px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Bot de Match Root
                </div>
                <p>{msg.content}</p>
              </div>
            );
          }

          if (isMeetingPoint) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-2xl bg-[#14171F] border border-[#D4FF00]/40 text-white text-xs space-y-1 shadow-md"
              >
                <div className="flex items-center gap-1 text-[#D4FF00] font-black text-[10px] uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Punto de Encuentro Fijado
                </div>
                <p className="font-bold text-neutral-200">{msg.content}</p>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-2.5 max-w-[85%]",
                isCurrentUser ? "ml-auto flex-row-reverse" : ""
              )}
            >
              {!isCurrentUser && (
                <Avatar
                  src={sender?.avatarUrl}
                  fallback={sender?.name || "U"}
                  size="sm"
                  className="ring-2 ring-white/10 shrink-0 mt-1"
                />
              )}

              <div className="space-y-1">
                {!isCurrentUser && (
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 pl-1">
                    {sender?.name}
                  </p>
                )}

                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-md",
                    isCurrentUser
                      ? "bg-[#D4FF00] text-neutral-950 font-bold rounded-tr-xs"
                      : "bg-[#14171F] text-white border border-white/10 rounded-tl-xs"
                  )}
                >
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "text-[9px] text-right mt-1 font-semibold",
                      isCurrentUser ? "text-neutral-950/70" : "text-neutral-500"
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Message Input Footer */}
      <div className="p-3 bg-[#0B0D10] border-t border-white/10">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe al Crew..."
            className="flex-1 py-2.5 px-4 rounded-full bg-[#14171F] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#D4FF00] transition-colors placeholder:text-neutral-500"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2.5 rounded-full bg-[#D4FF00] text-neutral-950 disabled:opacity-40 disabled:pointer-events-none hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/20 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 fill-neutral-950" />
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useMatch } from "@/context/MatchContext";
import { MOCK_CHATS, MOCK_EVENTS, MOCK_USERS } from "@/lib/mocks";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSquare, Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";

export default function ChatListPage() {
  const { squads, vibeProfile } = useMatch();

  const userSquads = squads.filter((s) =>
    s.members.some((m) => m.userId === vibeProfile.userId)
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-28">
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Mensajes</h1>
        </div>
        <div className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-neutral-300">
          <Search className="w-4 h-4" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* 1. Crews de Eventos Section */}
        {userSquads.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Crews de Eventos
              </h2>
              <Link
                href="/match"
                className="text-[10px] font-black uppercase text-[#D4FF00] tracking-wider hover:underline"
              >
                Buscar más →
              </Link>
            </div>

            <div className="space-y-2.5">
              {userSquads.map((sq) => {
                const event = MOCK_EVENTS.find((e) => e.id === sq.eventId);
                const members = sq.members.map(
                  (m) => MOCK_USERS.find((u) => u.id === m.userId) || MOCK_USERS[0]
                );

                return (
                  <Link
                    key={sq.id}
                    href={`/chat/squad/${sq.id}`}
                    className="p-3.5 rounded-3xl bg-[#14171F] hover:bg-[#1f2431] border border-white/10 hover:border-[#D4FF00]/40 flex items-center gap-3.5 transition-all active:scale-[0.99] shadow-md group"
                  >
                    {event && (
                      <img
                        src={event.cinematicBannerUrl}
                        alt={event.title}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black uppercase tracking-wider text-white group-hover:text-[#D4FF00] transition-colors truncate">
                          {sq.name}
                        </p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/20 shrink-0">
                          {sq.matchScore}% Match
                        </span>
                      </div>

                      <p className="text-[10px] text-neutral-400 font-bold truncate">
                        {event?.title} • {sq.departureZone.split("/")[0]}
                      </p>

                      <div className="flex items-center -space-x-1.5 pt-1">
                        {members.map((u) => (
                          <Avatar
                            key={u.id}
                            src={u.avatarUrl}
                            fallback={u.name}
                            size="sm"
                            className="ring-2 ring-[#14171F] w-5 h-5 text-[9px]"
                          />
                        ))}
                        <span className="text-[9px] text-neutral-400 font-bold pl-2">
                          {sq.members.length} miembros en chat
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Direct Messages Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-400" /> Mensajes Directos
          </h2>

          <div className="space-y-2.5">
            {MOCK_CHATS.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="p-3.5 rounded-3xl bg-[#14171F] hover:bg-[#1f2431] border border-white/10 flex items-center gap-4 transition-all active:scale-[0.99] shadow-md"
              >
                <div className="relative">
                  <Avatar
                    src={chat.participants[1].avatarUrl}
                    fallback={chat.participants[1].name}
                    className="ring-2 ring-[#D4FF00]/40"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#D4FF00] rounded-full ring-2 ring-neutral-950" />
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs font-black uppercase tracking-wider text-white">
                      {chat.participants[1].name}
                    </p>
                    <span className="text-[10px] font-bold text-neutral-400">
                      {new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate font-medium">{chat.lastMessage}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



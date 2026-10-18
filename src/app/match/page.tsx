"use client";

import React, { useState } from "react";
import { useMatch } from "@/context/MatchContext";
import Image from "next/image";
import { useMatcherCatalog } from "@/hooks/useMatcherCatalog";
import { CreateCrewModal } from "@/components/match/CreateCrewModal";
import {
  Users,
  Flame,
  MessageSquare,
  ArrowRight,
  Loader2,
  Plus,
  Trophy,
  Crown,
  Search,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { useRouter } from "next/navigation";

export default function MatchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { squads, isLoadingSquads, squadsError, refreshSquads } = useMatch();

  const [activeTab, setActiveTab] = useState<"squads" | "crews">("squads");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchCrewsQuery, setSearchCrewsQuery] = useState("");

  const {
    events,
    permanentCrews,
    allCrews,
    crewsLoading,
    createCrew,
  } = useMatcherCatalog();

  // User event-based squads from matcher
  const userSquads = squads.filter((s) =>
    s.members?.some((m) => m.userId === user?.id),
  );

  const totalMyCrews = permanentCrews.length + userSquads.length;

  // Filtered country crews
  const filteredCountryCrews = allCrews.filter((crew) =>
    crew.name.toLowerCase().includes(searchCrewsQuery.toLowerCase()) ||
    (crew.location && crew.location.toLowerCase().includes(searchCrewsQuery.toLowerCase())),
  );

  if (!authLoading && !user) {
    return <LoginRequired />;
  }

  const handleCreateCrewSubmit = async (data: {
    name: string;
    memberIds: string[];
    eventIds: string[];
    friends: Array<{ id: string; name: string; username: string; avatarUrl?: string }>;
  }) => {
    const createdId = await createCrew({
      name: data.name,
      memberIds: data.memberIds,
      eventIds: data.eventIds,
      friends: data.friends,
    });
    if (createdId) {
      router.push(`/crews/${createdId}`);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white pb-20">
      {/* Sticky Obsidian Header (sin filtros) */}
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 pb-3 pt-safe-header flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15">
            <Flame className="w-4 h-4 fill-neutral-950" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              <span>Crews</span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              Comunidad & Equipos en el País
            </p>
          </div>
        </div>
      </header>

      {/* Mode Switcher (Mis Crews vs Crews) */}
      <div className="p-4 pb-2 w-full max-w-lg mx-auto">
        <div className="w-full bg-black/60 p-1 rounded-full border-0 shadow-md flex items-center gap-1">
          <button
            onClick={() => setActiveTab("squads")}
            className={cn(
              "flex-1 py-2 px-3 rounded-full tech-label text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none",
              activeTab === "squads"
                ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)] scale-[1.01]"
                : "text-neutral-400 hover:text-white",
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mis Crews</span>
            {totalMyCrews > 0 && (
              <span
                className={cn(
                  "num-display text-[11px] px-1.5 py-0.2 rounded-full",
                  activeTab === "squads"
                    ? "bg-neutral-950/20 text-neutral-950"
                    : "bg-[#D4FF00]/20 text-[#D4FF00]",
                )}
              >
                {totalMyCrews}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("crews")}
            className={cn(
              "flex-1 py-2 px-3 rounded-full tech-label text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none",
              activeTab === "crews"
                ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)] scale-[1.01]"
                : "text-neutral-400 hover:text-white",
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Crews</span>
            {allCrews.length > 0 && (
              <span
                className={cn(
                  "num-display text-[11px] px-1.5 py-0.2 rounded-full",
                  activeTab === "crews"
                    ? "bg-neutral-950/20 text-neutral-950"
                    : "bg-white/10 text-neutral-300",
                )}
              >
                {allCrews.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:py-6">
        {/* Tab 1: Mis Crews */}
        {activeTab === "squads" && (
          <div className="space-y-4 animate-fade-in">
            {/* Header with Crear Crew Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4FF00]" />
                <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-white">
                  Mis Crews
                </h2>
                <span className="text-[10px] md:text-xs font-extrabold uppercase text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-0.5 rounded-full">
                  {totalMyCrews} ACTIVOS
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-950 bg-[#D4FF00] hover:bg-[#c2eb00] active:scale-95 px-3.5 py-2 rounded-full shadow-[0_4px_20px_rgba(212,255,0,0.16)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Crear Crew
              </button>
            </div>

            {squadsError && (
              <button
                onClick={() => void refreshSquads().catch(() => undefined)}
                className="text-xs text-red-300"
              >
                {squadsError} Reintentar
              </button>
            )}

            {crewsLoading && totalMyCrews === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#D4FF00]" />
              </div>
            ) : totalMyCrews === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[#111114] border-0 space-y-4 mt-2 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                  <Users className="w-7 h-7 text-neutral-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-200">
                    Aún no tienes ningún Crew activo
                  </p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Creá una crew con tus amigos o sumate a una crew del país para competir en el ranking de pasos y disfrutar los eventos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 py-2.5 px-5 rounded-full bg-[#D4FF00] text-neutral-950 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[0_4px_20px_rgba(212,255,0,0.16)] hover:bg-[#c2eb00] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Crear una Crew
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Permanent crews user belongs to */}
                {permanentCrews.map((crew) => (
                  <Link
                    key={crew.id}
                    href={`/crews/${crew.id}`}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-[#111114] hover:bg-[#16171D] border-0 transition-all group shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  >
                    <div className="w-14 h-14 aspect-square rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center shrink-0">
                      <Flame className="w-7 h-7 text-[#D4FF00] stroke-[1.8] fill-none" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-[#D4FF00] transition-colors truncate">
                          {crew.name}
                        </h3>
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] shrink-0">
                          Tu Crew
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                          <Users className="w-3 h-3 text-neutral-500" /> {crew.memberCount} miembros
                        </span>
                        <span className="text-[10px] text-[#D4FF00] font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3" /> {crew.topSteps.toLocaleString()} pasos top
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-[#D4FF00] group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                ))}

                {/* Event squads formed */}
                {userSquads.map((sq) => {
                  const event = events.find((e) => e.id === sq.eventId);
                  const members = sq.members;

                  return (
                    <Link
                      key={sq.id}
                      href={`/chat/squad/${sq.id}`}
                      className="block p-4 rounded-3xl bg-[#111114] hover:bg-[#16171D] border-0 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] group"
                    >
                      <div className="flex items-center gap-4">
                        {(sq.eventImage || event?.cinematicBannerUrl) && (
                          <Image
                            width={80}
                            height={80}
                            unoptimized
                            src={sq.eventImage || event?.cinematicBannerUrl || ""}
                            alt={sq.eventTitle || event?.title || "Evento"}
                            className="w-14 h-14 md:w-16 md:h-16 aspect-square rounded-2xl object-cover shrink-0 shadow-md"
                          />
                        )}

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs md:text-sm font-black uppercase tracking-tight text-white group-hover:text-[#D4FF00] transition-colors truncate">
                              {sq.name}
                            </h3>
                            {sq.matchScore != null && (
                              <span className="num-display text-[11px] px-2.5 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] shrink-0">
                                {sq.matchScore}% <span className="tech-label text-[8px] text-[#D4FF00]/80">Match</span>
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] md:text-xs text-neutral-400 font-bold truncate">
                            {sq.eventTitle || event?.title}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center -space-x-2 md:-space-x-1.5">
                              {members.map((u) => (
                                <Avatar
                                  key={u.userId}
                                  src={u.avatarUrl || undefined}
                                  fallback={u.name || "Integrante"}
                                  size="sm"
                                  className="ring-2 ring-[#111114] w-6 h-6 md:w-7 md:h-7 aspect-square"
                                />
                              ))}
                              <span className="tech-label text-neutral-400 pl-3">
                                <span className="num-display text-xs text-white">{sq.members.length}</span> miembros
                              </span>
                            </div>

                            <span className="tech-label text-neutral-400 group-hover:text-white flex items-center gap-1 transition-colors">
                              <MessageSquare className="w-3.5 h-3.5 text-[#D4FF00]" />{" "}
                              <span className="hidden sm:inline">Chat</span> →
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
        )}

        {/* Tab 2: Crews (Todas las crews existentes en el país, sin botón Nueva Crew) */}
        {activeTab === "crews" && (
          <div className="space-y-4 animate-fade-in">
            {/* Header: muestra todas las crews existentes en el país (sin botón Nueva Crew) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D4FF00]" />
                <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-white">
                  Crews en el País
                </h2>
              </div>
              <span className="tech-label text-neutral-400 bg-white/[0.05] px-2.5 py-1 rounded-full">
                <span className="num-display text-xs text-white">{allCrews.length}</span> Crews registradas
              </span>
            </div>

            {/* Buscador de crews en el país */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchCrewsQuery}
                onChange={(e) => setSearchCrewsQuery(e.target.value)}
                placeholder="Buscar crew por nombre o ciudad..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#111114] border-0 text-white placeholder-neutral-500 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#D4FF00]/60 transition-colors shadow-sm"
              />
            </div>

            {crewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4FF00]" />
              </div>
            ) : filteredCountryCrews.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[#111114] border-0 space-y-3 shadow-xl">
                <Trophy className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="text-sm font-bold text-neutral-300">
                  No se encontraron crews
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {searchCrewsQuery
                    ? `No hay crews que coincidan con "${searchCrewsQuery}".`
                    : "Aún no hay crews registradas en el país."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCountryCrews.map((crew) => {
                  const isMyCrew = permanentCrews.some((c) => c.id === crew.id);

                  return (
                    <Link
                      key={crew.id}
                      href={`/crews/${crew.id}`}
                      className="flex items-center gap-4 p-4 rounded-3xl bg-[#111114] hover:bg-[#16171D] border-0 transition-all group shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                    >
                      <div className="w-14 h-14 aspect-square rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center shrink-0">
                        <Flame className="w-7 h-7 text-[#D4FF00] stroke-[1.8] fill-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-[#D4FF00] transition-colors truncate">
                            {crew.name}
                          </h3>
                          {isMyCrew && (
                            <span className="tech-label text-[9px] px-2.5 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] shrink-0">
                              Miembro
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="tech-label text-neutral-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-neutral-500" /> <span className="num-display text-xs text-white">{crew.memberCount}</span> miembros
                          </span>
                          <span className="text-[10px] text-[#D4FF00] font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> <span className="num-display text-xs">{crew.topSteps.toLocaleString()}</span> <span className="tech-label text-[9px] text-[#D4FF00]/80">pasos top</span>
                          </span>
                          {crew.location && (
                            <span className="tech-label text-neutral-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-500" /> {crew.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-[#D4FF00] group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Crear Crew y añadir amigos */}
      <CreateCrewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        events={events}
        onSubmit={handleCreateCrewSubmit}
      />
    </div>
  );
}

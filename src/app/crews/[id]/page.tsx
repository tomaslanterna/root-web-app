"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { matchApi } from "@/services/match";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeft,
  Trophy,
  Medal,
  MessageSquare,
  UserPlus,
  Activity,
  Users,
  Copy,
  Check,
  Flame,
  Crown,
  Loader2,
  Plus,
  Calendar,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role?: string;
  steps: number;
}

interface CrewData {
  id: string;
  name: string;
  inviteCode?: string;
  memberCount: number;
  topSteps?: number;
  totalSteps?: number;
  members?: LeaderboardEntry[];
  leaderboardAllTime: LeaderboardEntry[];
  events?: any[];
}

export default function CrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"ranking" | "members">("ranking");
  const [rankingType, setRankingType] = useState<"allTime" | "event">("allTime");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [crew, setCrew] = useState<CrewData | null>(null);
  const [eventLeaderboard, setEventLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [crewEvents, setCrewEvents] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCrewData = useCallback(async () => {
    if (!id) return;
    try {
      const [crewRes, rankingsRes, eventsRes] = await Promise.all([
        api.get(`/v1/crews/${id}`),
        api.get(`/v1/crews/${id}/rankings`),
        api.get(`/v1/crews/${id}/events`),
      ]);
      const crewData: CrewData = crewRes.data;
      const evList: any[] = eventsRes.data?.data || crewData.events || [];
      setCrew(crewData);
      setCrewEvents(evList);
      setEventLeaderboard(
        rankingsRes.data?.byEvent ||
          rankingsRes.data?.allTime ||
          crewData.leaderboardAllTime ||
          [],
      );
      if (rankingsRes.data?.eventId) {
        setSelectedEventId(rankingsRes.data.eventId);
      } else if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
      }
    } catch (err) {
      console.error("Error fetching crew data:", err);
      setCrew(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    void loadCrewData();
  }, [loadCrewData]);

  const handleSelectEventRanking = async (eventId: string) => {
    setSelectedEventId(eventId);
    setRankingType("event");
    if (!id || !eventId) return;
    try {
      const res = await api.get(`/v1/crews/${id}/rankings?eventId=${eventId}`);
      if (res.data?.byEvent) {
        setEventLeaderboard(res.data.byEvent);
      }
    } catch (err) {
      console.error("Error fetching event ranking:", err);
    }
  };

  const handleCopyInvite = async () => {
    const code = crew?.inviteCode || "";
    await navigator.clipboard.writeText(`Unite a mi Crew en root! Codigo: ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinCrew = async () => {
    if (!id || isJoining) return;
    setIsJoining(true);
    try {
      await matchApi.joinPermanentCrew(crew?.inviteCode || String(id));
      await loadCrewData();
    } catch (err) {
      console.error("Error joining crew:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenAddEvent = async () => {
    setIsAddEventOpen((prev) => !prev);
    if (availableEvents.length === 0) {
      try {
        const allEvs = await matchApi.getEvents();
        setAvailableEvents(allEvs);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    }
  };

  const handleAssociateEvent = async (eventId: string) => {
    if (!id) return;
    try {
      const updated = await matchApi.addCrewEvent(String(id), eventId);
      setCrewEvents(updated);
      setIsAddEventOpen(false);
      await handleSelectEventRanking(eventId);
    } catch (err) {
      console.error("Error associating event:", err);
    }
  };

  const allTimeMembers: LeaderboardEntry[] =
    crew?.leaderboardAllTime || crew?.members || [];

  const leaderboard: LeaderboardEntry[] =
    rankingType === "allTime" ? allTimeMembers : eventLeaderboard;

  const totalCrewSteps =
    crew?.totalSteps ??
    allTimeMembers.reduce((sum, m) => sum + (Number(m.steps) || 0), 0);

  const isMember =
    !!user?.id && allTimeMembers.some((m) => m.userId === user.id);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0D10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" />
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col items-center justify-center gap-3">
        <p className="text-neutral-400 font-bold">Crew no encontrada</p>
        <button
          onClick={() => router.push("/match")}
          className="px-4 py-2 rounded-full bg-[#D4FF00] text-neutral-950 text-xs font-black uppercase cursor-pointer"
        >
          Volver a Crews
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md px-4 pb-3 pt-safe-header border-b border-white/5">
        <div className="flex h-9 items-center">
          <Link href="/events" className="flex items-center gap-2" aria-label="Ir a eventos de root">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4FF00] text-sm font-black italic tracking-tighter text-neutral-950 shadow-md shadow-[#D4FF00]/15">
              r
            </span>
            <span className="text-xl font-black italic tracking-tighter text-white">root</span>
          </Link>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => router.back()}
              className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black uppercase tracking-widest flex items-center gap-2">
                <Flame className="h-4 w-4 shrink-0 text-[#D4FF00]" /> {crew.name}
              </h1>
              <p className="text-[10px] text-neutral-400 font-bold">
                {crew.memberCount || allTimeMembers.length} miembros •{" "}
                <span className="text-[#D4FF00]">{totalCrewSteps.toLocaleString()} pasos totales</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user && !isMember && (
              <button
                onClick={handleJoinCrew}
                disabled={isJoining}
                className="px-3 py-1.5 rounded-full bg-[#D4FF00] text-neutral-950 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                {isJoining ? "Uniéndote..." : "Unirme"}
              </button>
            )}
            <button
              onClick={() => router.push(`/chat/squad/${id}`)}
              className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-[#D4FF00] cursor-pointer"
              aria-label="Abrir chat de la crew"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 animate-fade-in">
        {/* Invite Banner */}
        {crew.inviteCode && (
          <button
            onClick={handleCopyInvite}
            className="w-full flex items-center justify-between bg-[#111114] hover:bg-[#16171D] border-0 rounded-2xl p-4 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 aspect-square rounded-xl bg-[#D4FF00]/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-[#D4FF00] stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">Invitar amigos</p>
                <p className="text-[10px] font-mono text-[#D4FF00] tracking-widest">{crew.inviteCode}</p>
              </div>
            </div>
            {copied ? (
              <Check className="w-5 h-5 text-[#D4FF00]" />
            ) : (
              <Copy className="w-4 h-4 text-neutral-400 group-hover:text-[#D4FF00] transition-colors" />
            )}
          </button>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1.5 bg-black/50 border-0 p-1 rounded-2xl">
          {(["ranking", "members"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === tab
                  ? "bg-[#D4FF00] text-neutral-950 shadow-[0_4px_16px_rgba(212,255,0,0.16)]"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {tab === "ranking" ? (
                <>
                  <Trophy className="w-3.5 h-3.5 stroke-[2]" />
                  Ranking de Pasos
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 stroke-[2]" />
                  Miembros ({allTimeMembers.length})
                </>
              )}
            </button>
          ))}
        </div>

        {activeTab === "ranking" && (
          <>
            {/* Ranking type toggle */}
            <div className="flex gap-2">
              {(["allTime", "event"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRankingType(type)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer",
                    rankingType === type
                      ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                      : "text-neutral-400 hover:text-neutral-300",
                  )}
                >
                  {type === "allTime" ? "Ranking General (All Time)" : "Ranking por Evento"}
                </button>
              ))}
            </div>

            {rankingType === "event" && crewEvents.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {crewEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => void handleSelectEventRanking(ev.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer",
                      selectedEventId === ev.id
                        ? "bg-[#D4FF00] text-neutral-950"
                        : "bg-[#111114] text-neutral-300 hover:text-white",
                    )}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-3 py-4">
                {/* 2nd */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Avatar
                    src={leaderboard[1].avatarUrl}
                    fallback={leaderboard[1].name}
                    size="sm"
                    className="ring-2 ring-neutral-300/30 aspect-square"
                  />
                  <p className="tech-label text-white truncate max-w-[80px]">
                    {leaderboard[1].name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]">
                    <span className="num-display text-neutral-300">
                      {(leaderboard[1].steps || 0).toLocaleString()}
                    </span>{" "}
                    <span className="text-[9px]">👟</span>
                  </p>
                  <div className="w-full h-16 rounded-t-2xl bg-neutral-300/10 border-0 flex items-end justify-center pb-2">
                    <Medal className="w-5 h-5 text-neutral-300 stroke-[1.8]" />
                  </div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Avatar
                    src={leaderboard[0].avatarUrl}
                    fallback={leaderboard[0].name}
                    size="md"
                    className="ring-2 ring-yellow-400/40 aspect-square"
                  />
                  <p className="tech-label text-white truncate max-w-[80px]">
                    {leaderboard[0].name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]">
                    <span className="num-display text-[#D4FF00]">
                      {(leaderboard[0].steps || 0).toLocaleString()}
                    </span>{" "}
                    <span className="text-[9px]">👟</span>
                  </p>
                  <div className="w-full h-28 rounded-t-2xl bg-yellow-400/10 border-0 flex items-end justify-center pb-2">
                    <Crown className="w-5 h-5 text-yellow-400 stroke-[1.8]" />
                  </div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Avatar
                    src={leaderboard[2].avatarUrl}
                    fallback={leaderboard[2].name}
                    size="sm"
                    className="ring-2 ring-amber-600/30 aspect-square"
                  />
                  <p className="tech-label text-white truncate max-w-[80px]">
                    {leaderboard[2].name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]">
                    <span className="num-display text-neutral-300">
                      {(leaderboard[2].steps || 0).toLocaleString()}
                    </span>{" "}
                    <span className="text-[9px]">👟</span>
                  </p>
                  <div className="w-full h-14 rounded-t-2xl bg-amber-600/10 border-0 flex items-end justify-center pb-2">
                    <Medal className="w-5 h-5 text-amber-600 stroke-[1.8]" />
                  </div>
                </div>
              </div>
            )}

            {/* Full ranking list of all crew users */}
            <div className="space-y-2">
              {leaderboard.map((member, idx) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#111114] hover:bg-[#16171D] border-0 shadow-sm transition-all"
                >
                  <span
                    className={cn(
                      "num-display text-xs w-5 text-center shrink-0",
                      idx === 0
                        ? "text-yellow-400"
                        : idx === 1
                          ? "text-neutral-300"
                          : idx === 2
                            ? "text-amber-600"
                            : "text-neutral-600",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <Avatar
                    src={member.avatarUrl}
                    fallback={member.name}
                    size="sm"
                    className="shrink-0 aspect-square"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">@{member.username}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#D4FF00] shrink-0">
                    <Activity className="w-3.5 h-3.5 stroke-[1.8]" />
                    <span className="num-display text-xs">
                      {(member.steps || 0).toLocaleString()}
                    </span>
                    <span className="tech-label text-[9px] text-neutral-400">pasos</span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-6 text-center text-neutral-400 text-sm font-medium">
                  Aún no hay miembros registrados en esta crew
                </div>
              )}
            </div>

            {/* Associated Crew Events Section */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-300 ml-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4FF00] stroke-[1.8]" /> Eventos de la Crew
                </h3>
                {user && (
                  <button
                    onClick={() => void handleOpenAddEvent()}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs font-black uppercase text-[#D4FF00] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Asociar Evento
                  </button>
                )}
              </div>

              {isAddEventOpen && (
                <div className="p-3 rounded-2xl bg-[#111114] space-y-2 max-h-56 overflow-y-auto">
                  <p className="text-[11px] font-bold text-neutral-400">
                    Seleccioná un evento para asociarlo a {crew.name}:
                  </p>
                  {availableEvents
                    .filter((ev) => !crewEvents.some((ce) => ce.id === ev.id))
                    .map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => void handleAssociateEvent(ev.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-black text-white truncate">{ev.title}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{ev.location}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#D4FF00] text-neutral-950 text-[10px] font-black uppercase shrink-0">
                          + Asociar
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {crewEvents.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#111114] text-center text-xs text-neutral-400 font-bold">
                  Esta crew aún no tiene eventos asociados. Asociá un evento o asistí con tu crew para sumar pasos.
                </div>
              ) : (
                <div className="space-y-2">
                  {crewEvents.map((ev) => {
                    const d = new Date(ev.date);
                    const isDateValid = !Number.isNaN(d.getTime());
                    const shortDate = isDateValid
                      ? new Intl.DateTimeFormat("es-AR", {
                          day: "numeric",
                          month: "short",
                        }).format(d)
                      : "";

                    return (
                      <div
                        key={ev.id}
                        onClick={() => router.push(`/events/${ev.id}`)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[#111114] hover:bg-[#16171D] border-0 transition-all cursor-pointer group shadow-sm"
                      >
                        <div
                          className="w-12 h-12 aspect-square rounded-xl bg-neutral-900 shrink-0 bg-cover bg-center overflow-hidden border-0 shadow-sm"
                          style={{
                            backgroundImage: `url(${
                              ev.cinematicBannerUrl ||
                              "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop"
                            })`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black uppercase tracking-wider text-white truncate group-hover:text-[#D4FF00] transition-colors">
                            {ev.title}
                          </h4>
                          <p className="tech-label text-neutral-400 truncate">
                            {shortDate} • {ev.location}
                          </p>
                        </div>
                        {typeof ev.crewSteps === "number" && ev.crewSteps > 0 && (
                          <div className="flex items-center gap-1 text-[#D4FF00] shrink-0 mr-1">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="num-display text-xs">
                              {ev.crewSteps.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <ChevronLeft className="w-4 h-4 text-neutral-500 rotate-180 group-hover:text-[#D4FF00] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "members" && (
          <div className="space-y-2 pt-2">
            {allTimeMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#111114] border-0 shadow-sm"
              >
                <Avatar
                  src={member.avatarUrl}
                  fallback={member.name}
                  size="sm"
                  className="shrink-0 aspect-square"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-white truncate">{member.name}</p>
                    {member.role === "host" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] text-[9px] font-black uppercase">
                        Creador
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">@{member.username}</p>
                </div>
                <span className="text-[10px] text-[#D4FF00] shrink-0">
                  <span className="num-display text-xs">
                    {(member.steps || 0).toLocaleString()}
                  </span>{" "}
                  <span className="tech-label text-[9px]">pasos</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

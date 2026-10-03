"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ChevronLeft, Trophy, Medal, MessageSquare, UserPlus,
  Activity, Users, Copy, Check, Flame, Crown, Loader2
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  steps: number;
}

interface CrewData {
  id: string;
  name: string;
  inviteCode?: string;
  memberCount: number;
  leaderboardAllTime: LeaderboardEntry[];
}

export default function CrewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ranking" | "members">("ranking");
  const [rankingType, setRankingType] = useState<"allTime" | "event">("allTime");
  const [copied, setCopied] = useState(false);
  const [crew, setCrew] = useState<CrewData | null>(null);
  const [eventLeaderboard, setEventLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [crewEvents, setCrewEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    
    Promise.all([
      api.get(`/v1/crews/${id}`),
      api.get(`/v1/crews/${id}/rankings`),
      api.get(`/v1/crews/${id}/events`)
    ])
      .then(([crewRes, rankingsRes, eventsRes]) => {
        setCrew(crewRes.data);
        setEventLeaderboard(rankingsRes.data?.byEvent || rankingsRes.data?.allTime || []);
        setCrewEvents(eventsRes.data?.data || []);
      })
      .catch((err) => console.error("Error fetching crew data:", err))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCopyInvite = async () => {
    const code = crew?.inviteCode || "";
    await navigator.clipboard.writeText(`Unite a mi Crew en root! Codigo: ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaderboard: LeaderboardEntry[] = rankingType === "allTime"
    ? (crew?.leaderboardAllTime || [])
    : eventLeaderboard;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0D10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" />
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex items-center justify-center">
        <p className="text-neutral-400">Crew no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md px-4 pb-3 pt-safe-header border-b border-white/5">
        <div className="flex h-9 items-center">
          <Link href="/feed" className="flex items-center gap-2" aria-label="Ir al feed de root">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4FF00] text-sm font-black italic tracking-tighter text-neutral-950 shadow-md shadow-[#D4FF00]/15">
              r
            </span>
            <span className="text-xl font-black italic tracking-tighter text-white">root</span>
          </Link>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button onClick={() => router.back()} className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="truncate text-base font-black uppercase tracking-widest flex items-center gap-2">
              <Flame className="h-4 w-4 shrink-0 text-[#D4FF00]" /> {crew.name}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/chat/squad/${id}`)}
            className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-[#D4FF00]"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4 animate-fade-in">

        {/* Invite Banner */}
        {crew.inviteCode && (
          <button
            onClick={handleCopyInvite}
            className="w-full flex items-center justify-between bg-[#14171F] border border-[#D4FF00]/20 hover:border-[#D4FF00]/50 rounded-2xl p-4 transition-all group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-[#D4FF00]/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-[#D4FF00]" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">Invitar amigos</p>
                <p className="text-[10px] font-mono text-[#D4FF00] tracking-widest">{crew.inviteCode}</p>
              </div>
            </div>
            {copied
              ? <Check className="w-5 h-5 text-[#D4FF00]" />
              : <Copy className="w-4 h-4 text-neutral-500 group-hover:text-[#D4FF00] transition-colors" />
            }
          </button>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2 bg-[#14171F] border border-white/5 p-1 rounded-2xl">
          {(["ranking", "members"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5",
                activeTab === tab
                  ? "bg-[#D4FF00] text-neutral-950"
                  : "text-neutral-500 hover:text-white"
              )}
            >
              {tab === "ranking"
                ? <><Trophy className="w-3.5 h-3.5" />Ranking</>
                : <><Users className="w-3.5 h-3.5" />Miembros</>
              }
            </button>
          ))}
        </div>

        {activeTab === "ranking" && (
          <>
            {/* Ranking type toggle */}
            <div className="flex gap-2">
              {(["allTime", "event"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setRankingType(type)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border",
                    rankingType === type
                      ? "bg-white/10 border-white/20 text-white"
                      : "border-white/5 text-neutral-600 hover:text-neutral-400"
                  )}
                >
                  {type === "allTime" ? "All Time" : "Último Evento"}
                </button>
              ))}
            </div>

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-3 py-4">
                {/* 2nd */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Avatar fallback={leaderboard[1].name} size="sm" className="ring-2 ring-neutral-300/30" />
                  <p className="text-[10px] font-black uppercase">{leaderboard[1].name.split(" ")[0]}</p>
                  <p className="text-[9px] text-neutral-400 font-bold">{leaderboard[1].steps.toLocaleString()} 👟</p>
                  <div className="w-full h-16 rounded-t-2xl bg-neutral-300/10 border border-neutral-300/30 flex items-end justify-center pb-2">
                    <Medal className="w-5 h-5 text-neutral-300" />
                  </div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Avatar fallback={leaderboard[0].name} size="md" className="ring-2 ring-yellow-400/40" />
                  <p className="text-[10px] font-black uppercase">{leaderboard[0].name.split(" ")[0]}</p>
                  <p className="text-[9px] text-[#D4FF00] font-bold">{leaderboard[0].steps.toLocaleString()} 👟</p>
                  <div className="w-full h-28 rounded-t-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-end justify-center pb-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Avatar fallback={leaderboard[2].name} size="sm" className="ring-2 ring-amber-600/30" />
                  <p className="text-[10px] font-black uppercase">{leaderboard[2].name.split(" ")[0]}</p>
                  <p className="text-[9px] text-neutral-400 font-bold">{leaderboard[2].steps.toLocaleString()} 👟</p>
                  <div className="w-full h-14 rounded-t-2xl bg-amber-600/10 border border-amber-600/30 flex items-end justify-center pb-2">
                    <Medal className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="space-y-2">
              {leaderboard.map((member, idx) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#14171F] border border-white/10"
                >
                  <span className={cn(
                    "text-xs font-black w-5 text-center shrink-0",
                    idx === 0 ? "text-yellow-400" : idx === 1 ? "text-neutral-300" : idx === 2 ? "text-amber-600" : "text-neutral-600"
                  )}>
                    {idx + 1}
                  </span>
                  <Avatar fallback={member.name} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-neutral-500">@{member.username}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#D4FF00] shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">{member.steps.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-6 text-center text-neutral-500 text-sm">
                  Aún no hay pasos registrados en esta crew
                </div>
              )}
            </div>

            {/* Crew Events List */}
            {crewEvents.length > 0 && (
              <div className="pt-6 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-300 ml-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D4FF00]" /> Eventos asistidos
                </h3>
                <div className="space-y-2">
                  {crewEvents.map((ev) => {
                    const d = new Date(ev.date);
                    const isDateValid = !Number.isNaN(d.getTime());
                    const shortDate = isDateValid ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(d) : "";
                    
                    return (
                      <div 
                        key={ev.id}
                        onClick={() => router.push(`/events/${ev.id}`)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[#14171F] border border-white/5 hover:border-[#D4FF00]/30 transition-colors cursor-pointer group"
                      >
                        <div 
                          className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/10 shrink-0 bg-cover bg-center overflow-hidden"
                          style={{ backgroundImage: `url(${ev.cinematicBannerUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop'})` }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black uppercase tracking-wider text-white truncate group-hover:text-[#D4FF00] transition-colors">{ev.title}</h4>
                          <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase truncate">{shortDate} • {ev.location}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-neutral-600 rotate-180 group-hover:text-[#D4FF00] transition-colors shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "members" && (
          <div className="space-y-2 pt-2">
            {(crew.leaderboardAllTime || []).map((member) => (
              <div key={member.userId} className="flex items-center gap-3 p-3 rounded-2xl bg-[#14171F] border border-white/10">
                <Avatar fallback={member.name} size="sm" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{member.name}</p>
                  <p className="text-[10px] text-neutral-500">@{member.username}</p>
                </div>
                <span className="text-[10px] text-[#D4FF00] font-bold shrink-0">
                  {member.steps.toLocaleString()} pasos
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

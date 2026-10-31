"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { matchApi } from "@/services/match";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Plus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CrewMonogram } from "@/components/match/CrewMonogram";
import { cn } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import { AddCrewMembersModal, type FriendToInvite } from "@/components/match/AddCrewMembersModal";

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

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

export default function CrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<"ranking" | "members">("ranking");
  // Referencia fija para separar eventos próximos de finalizados.
  const [now] = useState(() => Date.now());
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [rankingType, setRankingType] = useState<"allTime" | "event">("allTime");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [crew, setCrew] = useState<CrewData | null>(null);
  const [eventLeaderboard, setEventLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [crewEvents, setCrewEvents] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const enrichCrewEventsImages = useCallback(async (eventsList: any[]) => {
    return Promise.all(
      eventsList.map(async (ev) => {
        const rawUrl = typeof ev?.cinematicBannerUrl === "string" ? ev.cinematicBannerUrl.trim() : "";
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
          return ev;
        }
        if (!ev?.id) return ev;
        try {
          const { data: fullEvent } = await api.get(`/v1/events/${ev.id}`);
          if (fullEvent?.cinematicBannerUrl) {
            return { ...ev, cinematicBannerUrl: fullEvent.cinematicBannerUrl };
          }
        } catch {
          // Fallback to default image if event fetch fails
        }
        return ev;
      }),
    );
  }, []);

  const loadCrewData = useCallback(async () => {
    if (!id) return;
    try {
      const [crewRes, rankingsRes, eventsRes] = await Promise.all([
        api.get(`/v1/crews/${id}`),
        api.get(`/v1/crews/${id}/rankings`),
        api.get(`/v1/crews/${id}/events`),
      ]);
      const crewData: CrewData = crewRes.data;
      const rawEvList: any[] = eventsRes.data?.data || crewData.events || [];
      const evList = await enrichCrewEventsImages(rawEvList);
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
  }, [id, enrichCrewEventsImages]);

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

  const handleAddMembers = async (friends: FriendToInvite[]) => {
    if (!id || friends.length === 0) return;

    const newEntries: LeaderboardEntry[] = friends.map((f) => ({
      userId: f.id,
      name: f.name,
      username: f.username,
      avatarUrl: f.avatarUrl,
      role: "member",
      steps: 0,
    }));

    // Optimistic update so new members appear immediately
    setCrew((prev) => {
      if (!prev) return prev;
      const existing = prev.leaderboardAllTime || prev.members || [];
      const toAdd = newEntries.filter((ne) => !existing.some((m) => m.userId === ne.userId));
      const updatedList = [...existing, ...toAdd];
      return {
        ...prev,
        memberCount: updatedList.length,
        members: updatedList,
        leaderboardAllTime: updatedList,
      };
    });

    try {
      await matchApi.addCrewMembers(
        String(id),
        friends.map((f) => f.id),
      );
      await loadCrewData();
    } catch (err) {
      console.warn("Endpoint /members fallback local:", err);
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
      const enriched = await enrichCrewEventsImages(updated);
      setCrewEvents(enriched);
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
      <div className="min-h-[100dvh] bg-bg flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-accent" aria-label="Cargando crew" />
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="min-h-[100dvh] bg-bg text-ink flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">No encontramos esta crew</p>
        <Button variant="secondary" onClick={() => router.push("/match")}>Volver a crews</Button>
      </div>
    );
  }

  const podium = leaderboard.length >= 3 ? [leaderboard[1], leaderboard[0], leaderboard[2]] : [];
  const rest = leaderboard.length >= 3 ? leaderboard.slice(3) : leaderboard;
  const podiumStyle = [
    { place: 2, bar: "h-24 bg-surface-2", num: "text-[26px] text-ink-2", avatar: "size-[52px]" },
    { place: 1, bar: "h-[132px] bg-accent text-on-accent", num: "text-[34px]", avatar: "size-16 ring-[3px] ring-accent ring-offset-[3px] ring-offset-bg" },
    { place: 3, bar: "h-[72px] bg-surface-2", num: "text-[22px] text-ink-2", avatar: "size-[52px]" },
  ];
  const firstName = (member: LeaderboardEntry) => member.username || member.name.split(" ")[0];
  const isMe = (member: LeaderboardEntry) => member.userId === user?.id;
  const timeZone = "America/Montevideo";

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver a crews"
            className="size-11 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <Link
            href={`/chat/squad/${id}`}
            aria-label="Abrir chat de la crew"
            className="h-11 px-3.5 rounded-control bg-surface border border-line flex items-center gap-2 text-sm font-semibold hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <MessageSquare className="size-[18px]" aria-hidden="true" /> Chat
          </Link>
        </header>

        <div className="pt-5 flex items-center gap-4">
          <CrewMonogram name={crew.name} className="size-[72px] rounded-[18px] text-2xl" />
          <div className="min-w-0 flex flex-col gap-1.5">
            <h1 className="font-display text-[26px] m-0">{crew.name}</h1>
            <span className="text-sm text-ink-2">
              {crew.memberCount || allTimeMembers.length} integrantes ·{" "}
              <span className="num-mono">{totalCrewSteps.toLocaleString("es-AR")}</span> pasos
            </span>
          </div>
        </div>

        {isMember && (
          <button
            type="button"
            onClick={() => setIsAddMembersOpen(true)}
            className="mt-4 w-full p-3.5 flex items-center gap-3 rounded-card bg-surface border border-dashed border-accent/45 text-left hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="size-10 shrink-0 rounded-xl bg-accent/12 text-accent flex items-center justify-center">
              <UserPlus className="size-5" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">Invitar amigos</span>
              <span className="text-[13px] text-ink-2">Buscalos por nombre o @usuario</span>
            </span>
            <ChevronRight className="size-5 text-ink-2 shrink-0" aria-hidden="true" />
          </button>
        )}

        <div role="tablist" aria-label="Crew" className="mt-5 flex p-[3px] rounded-xl bg-surface border border-line">
          {(["ranking", "members"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              onClick={() => setView(tab)}
              className={cn(
                "flex-1 h-10 rounded-[9px] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                view === tab ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
              )}
            >
              {tab === "ranking" ? "Ranking" : "Integrantes"}
            </button>
          ))}
        </div>

        {view === "ranking" ? (
          <>
            <div className="pt-4 flex items-center justify-between gap-2">
              <div role="radiogroup" aria-label="Tipo de ranking" className="flex gap-1.5">
                {(["allTime", "event"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={rankingType === type}
                    onClick={() => setRankingType(type)}
                    className={cn(
                      "h-10 px-3.5 rounded-full text-[13px] font-semibold border transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                      rankingType === type
                        ? "border-accent/40 bg-accent/12 text-accent"
                        : "border-white/10 bg-surface text-ink-2 hover:text-ink",
                    )}
                  >
                    {type === "allTime" ? "General" : "Por evento"}
                  </button>
                ))}
              </div>
              <span className="label-mono text-ink-3">Pasos</span>
            </div>

            {rankingType === "event" && crewEvents.length > 0 && (
              <div className="-mx-4 px-4 pt-3 flex gap-2 overflow-x-auto hide-scrollbar">
                {crewEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    aria-pressed={selectedEventId === ev.id}
                    onClick={() => void handleSelectEventRanking(ev.id)}
                    className={cn(
                      "h-10 px-3.5 shrink-0 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors",
                      selectedEventId === ev.id
                        ? "bg-ink text-bg border-ink"
                        : "bg-surface text-ink-2 border-white/10 hover:text-ink",
                    )}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}

            {podium.length === 3 && (
              <section aria-label="Podio" className="mt-5 grid grid-cols-3 gap-2 items-end">
                {podium.map((member, i) => {
                  const style = podiumStyle[i];
                  return (
                    <div key={member.userId} className="flex flex-col items-center gap-2 min-w-0">
                      <Avatar src={member.avatarUrl} fallback={member.name} className={cn("rounded-full", style.avatar)} />
                      <span className="text-sm font-semibold truncate max-w-full">
                        {firstName(member)}
                        {isMe(member) && <span className="font-normal text-ink-3"> (vos)</span>}
                      </span>
                      <div className={cn("w-full rounded-t-[14px] rounded-b-md flex flex-col items-center justify-center gap-0.5", style.bar)}>
                        <span className={cn("font-display", style.num)}>{style.place}</span>
                        <span className="num-mono text-[13px] font-semibold">
                          {(member.steps || 0).toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {rest.length > 0 && (
              <ol
                start={podium.length + 1}
                className="mt-4 p-0 list-none rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]"
              >
                {rest.map((member, idx) => (
                  <li key={member.userId} className="flex items-center gap-3 p-3.5">
                    <span className="num-mono w-6 text-sm text-ink-3">{podium.length + idx + 1}</span>
                    <Avatar src={member.avatarUrl} fallback={member.name} className="size-9 rounded-full" />
                    <span className="flex-1 min-w-0 text-[15px] font-semibold truncate">
                      {firstName(member)}
                      {isMe(member) && <span className="font-normal text-ink-3"> (vos)</span>}
                    </span>
                    <span className="num-mono text-sm font-semibold">{(member.steps || 0).toLocaleString("es-AR")}</span>
                  </li>
                ))}
              </ol>
            )}

            {leaderboard.length === 0 && (
              <p className="py-8 text-center text-[15px] text-ink-2">Todavía no hay pasos registrados en esta crew.</p>
            )}

            <section aria-labelledby="crew-events" className="mt-7">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <h2 id="crew-events" className="label-mono text-ink-2 m-0">Eventos de la crew</h2>
                {user && (
                  <button
                    type="button"
                    aria-expanded={isAddEventOpen}
                    onClick={() => void handleOpenAddEvent()}
                    className="min-h-11 flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
                  >
                    <Plus className="size-4" aria-hidden="true" /> Asociar evento
                  </button>
                )}
              </div>

              {isAddEventOpen && (
                <div className="mb-2.5 p-2 rounded-card bg-surface border border-line max-h-64 overflow-y-auto flex flex-col">
                  {availableEvents
                    .filter((ev) => !crewEvents.some((ce) => ce.id === ev.id))
                    .map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => void handleAssociateEvent(ev.id)}
                        className="min-h-12 px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 text-left hover:bg-surface-2 transition-colors"
                      >
                        <span className="min-w-0 flex flex-col">
                          <span className="text-[15px] font-semibold truncate">{ev.title}</span>
                          <span className="text-[13px] text-ink-2 truncate">{ev.location}</span>
                        </span>
                        <Plus className="size-5 text-accent shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                </div>
              )}

              {crewEvents.length === 0 ? (
                <p className="m-0 p-4 rounded-card bg-surface border border-line text-[15px] text-ink-2">
                  Esta crew todavía no tiene eventos. Asociá uno para competir en pasos.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {crewEvents.map((ev) => {
                    const d = parseEventRealDate(ev.date);
                    const isDateValid = !Number.isNaN(d.getTime());
                    const isUpcoming = isDateValid && d.getTime() > now;
                    const shortDate = isDateValid
                      ? new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone })
                          .format(d)
                          .replace(/\./g, "")
                      : "";
                    const rawBanner = typeof ev.cinematicBannerUrl === "string" ? ev.cinematicBannerUrl.trim() : "";
                    const bannerSrc =
                      rawBanner.startsWith("http://") || rawBanner.startsWith("https://") ? rawBanner : FALLBACK_EVENT_IMAGE;

                    return (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        className="flex items-center gap-3 p-3 rounded-card bg-surface border border-line hover:bg-surface-2 transition-colors"
                      >
                        <span
                          aria-hidden="true"
                          className="size-[52px] shrink-0 rounded-thumb bg-surface-2 bg-cover bg-center"
                          style={{ backgroundImage: `url(${bannerSrc})` }}
                        />
                        <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                          <span className="text-[15px] font-semibold truncate">{ev.title}</span>
                          <span className={cn("label-mono truncate", isUpcoming ? "text-accent" : "text-ink-3")}>
                            {shortDate} · {isUpcoming ? "próximo" : "finalizado"}
                          </span>
                        </span>
                        {typeof ev.crewSteps === "number" && ev.crewSteps > 0 && (
                          <span className="num-mono text-[13px] text-ink-2 shrink-0">
                            {ev.crewSteps.toLocaleString("es-AR")}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <ul className="mt-4 p-0 list-none rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
            {allTimeMembers.map((member) => (
              <li key={member.userId}>
                <Link
                  href={member.username ? `/profile/${member.username}` : "#"}
                  className="flex items-center gap-3 p-3.5 hover:bg-surface-2 transition-colors"
                >
                  <Avatar src={member.avatarUrl} fallback={member.name} className="size-10 rounded-full" />
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold truncate">
                      {member.name}
                      {member.role === "host" && <span className="label-mono text-accent ml-2">Creador</span>}
                    </span>
                    <span className="text-[13px] text-ink-2 truncate">@{member.username}</span>
                  </span>
                  <span className="num-mono text-sm text-ink-2 shrink-0">
                    {(member.steps || 0).toLocaleString("es-AR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddCrewMembersModal
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        crewName={crew.name}
        existingMemberIds={allTimeMembers.map((m) => m.userId)}
        onSubmit={handleAddMembers}
      />
    </div>
  );
}

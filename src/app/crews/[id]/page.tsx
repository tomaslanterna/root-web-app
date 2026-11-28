"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { matchApi } from "@/services/match";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Clock3, Loader2, Lock, MessageSquare, Plus, Share2, UserPlus } from "lucide-react";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CrewMonogram } from "@/components/match/CrewMonogram";
import { cn } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import { AddCrewMembersModal, type FriendToInvite } from "@/components/match/AddCrewMembersModal";
import { CrewDetailSkeleton } from "@/components/match/CrewDetailSkeleton";
import { CrewInviteLink } from "@/components/match/CrewInviteLink";
import { TabIndicator } from "@/components/ui/TabIndicator";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useMutation } from "@/hooks/useMutation";
import { useTempCrewRequests } from "@/hooks/useTempCrews";
import { tempCrewsApi } from "@/services/tempCrews";
import { isDemoTempCrewId, isTempCrewsDemo, tempCrewsDemo } from "@/services/tempCrewsDemo";
import { AdmittingPill, EventMiniCard, TempCrewRequestCard, TemporalTag, freeSpots, freeSpotsLabel } from "@/components/match/TempCrewCards";
import { JoinTempCrewSheet } from "@/components/match/TempCrewSheets";
import { copyTextToClipboard } from "@/lib/utils";
import type { TempCrewDetailExtras, TempCrewSummary } from "@/types/tempCrews";
import { eventPath } from "@/lib/eventPath";

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
  /** Pública: aparece en Crews y cualquiera se une. Privada: solo con el link de invitación. */
  isPublic?: boolean;
  memberCount: number;
  topSteps?: number;
  totalSteps?: number;
  members?: LeaderboardEntry[];
  leaderboardAllTime: LeaderboardEntry[];
  events?: any[];
  /** "temporary": crew armada para ir a un evento puntual (ver root-backend-service/TEMP_CREWS.md). */
  type?: string;
  tempCrew?: TempCrewDetailExtras;
}

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";

export default function CrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const goBack = useBackNavigation("/match");
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
    if (isTempCrewsDemo() && isDemoTempCrewId(String(id))) {
      try {
        const demo = await tempCrewsDemo.getCrewDetail(String(id));
        setCrew(demo as CrewData);
        setCrewEvents(demo.events);
        setEventLeaderboard(demo.leaderboardAllTime);
        setSelectedEventId(demo.events[0]?.id ?? "");
      } catch {
        setCrew(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    try {
      const [crewRes, rankingsRes, eventsRes] = await Promise.all([
        api.get(`/v1/crews/${id}`),
        // El ranking de una crew temporal es solo para integrantes (403 para el resto): no es motivo para no mostrar
        // la crew. Sin ranking se usa la lista de integrantes del detalle.
        api.get(`/v1/crews/${id}/rankings`).catch(() => null),
        api.get(`/v1/crews/${id}/events`),
      ]);
      const crewData: CrewData = crewRes.data;
      const rawEvList: any[] = eventsRes.data?.data || crewData.events || [];
      const evList = await enrichCrewEventsImages(rawEvList);
      setCrew(crewData);
      setCrewEvents(evList);
      setEventLeaderboard(
        rankingsRes?.data?.byEvent ||
          rankingsRes?.data?.allTime ||
          crewData.leaderboardAllTime ||
          [],
      );
      if (rankingsRes?.data?.eventId) {
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
  const isHost =
    !!user?.id && allTimeMembers.some((m) => m.userId === user.id && m.role === "host");

  // Crew temporal: atada a un evento, con cupo y solicitudes que aprueba quien la creó.
  const temp = crew?.type === "temporary" && crew.tempCrew ? crew.tempCrew : null;
  const isTempHost = !!temp && !!user?.id && (temp.hostId === user.id || isHost);
  const [joinTarget, setJoinTarget] = useState<TempCrewSummary | null>(null);
  const [tempToast, setTempToast] = useState<string | null>(null);
  const reloadCrew = useCallback(() => void loadCrewData(), [loadCrewData]);
  const tempRequests = useTempCrewRequests(String(id ?? ""), isTempHost, reloadCrew);
  const { mutate: saveAdmitting, isLoading: isSavingAdmitting, error: admittingError } = useMutation(tempCrewsApi.setAdmitting, {
    onError: (_err, { isAdmitting }) =>
      setCrew((prev) => (prev?.tempCrew ? { ...prev, tempCrew: { ...prev.tempCrew, isAdmitting: !isAdmitting } } : prev)),
  });
  const { mutate: cancelRequest, isLoading: isCancellingRequest } = useMutation(tempCrewsApi.cancelMyRequest, {
    onSuccess: () => void loadCrewData(),
  });
  useEffect(() => {
    if (!tempToast) return;
    const timer = setTimeout(() => setTempToast(null), 3200);
    return () => clearTimeout(timer);
  }, [tempToast]);

  const { mutate: joinCrew, isLoading: isJoining, error: joinError } = useMutation(matchApi.joinPublicCrew, {
    onSuccess: () => void loadCrewData(),
  });
  const { mutate: saveVisibility, isLoading: isSavingVisibility, error: visibilityError } = useMutation(
    ({ crewId, isPublic }: { crewId: string; isPublic: boolean }) => matchApi.setCrewVisibility(crewId, isPublic),
    {
      // Si falla, el switch vuelve a como estaba.
      onError: (_err, { isPublic }) => setCrew((prev) => (prev ? { ...prev, isPublic: !isPublic } : prev)),
    },
  );
  const toggleVisibility = () => {
    if (!crew) return;
    const next = !crew.isPublic;
    setCrew((prev) => (prev ? { ...prev, isPublic: next } : prev));
    void saveVisibility({ crewId: String(id), isPublic: next }).catch(() => undefined);
  };

  if (isLoading) {
    return <CrewDetailSkeleton />;
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

  const tempHost = temp ? allTimeMembers.find((m) => m.userId === temp.hostId) ?? allTimeMembers.find((m) => m.role === "host") : undefined;
  const tempMemberCount = crew.memberCount || allTimeMembers.length;
  const tempSpots = temp ? freeSpots({ capacity: temp.capacity, memberCount: tempMemberCount }) : 0;
  const tempSummary: TempCrewSummary | null =
    temp && tempHost
      ? {
          id: crew.id,
          name: crew.name,
          plan: temp.plan,
          capacity: temp.capacity,
          memberCount: tempMemberCount,
          isAdmitting: temp.isAdmitting,
          host: { userId: tempHost.userId, name: tempHost.name, username: tempHost.username, avatarUrl: tempHost.avatarUrl },
          membersPreview: allTimeMembers.slice(0, 4).map((m) => ({ userId: m.userId, name: m.name, username: m.username, avatarUrl: m.avatarUrl })),
          event: temp.event,
          viewerRole: null,
          viewerRequestStatus: temp.viewerRequestStatus,
        }
      : null;
  const toggleAdmitting = () => {
    if (!temp) return;
    const next = !temp.isAdmitting;
    setCrew((prev) => (prev?.tempCrew ? { ...prev, tempCrew: { ...prev.tempCrew, isAdmitting: next } } : prev));
    void saveAdmitting({ crewId: String(id), isAdmitting: next }).catch(() => undefined);
  };
  const shareCrew = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: crew.name, text: `Sumate a ${crew.name} en Root`, url });
        return;
      } catch {
        // se copia el link
      }
    }
    if (await copyTextToClipboard(url)) setTempToast("Link copiado");
  };
  const endedNotice = temp?.eventEnded ? "El evento terminó. La crew sigue acá, con su chat y sus pasos, pero ya no admite gente." : "";
  // En escritorio la crew temporal va en dos columnas; en mobile los envoltorios no cambian nada (display: contents).
  const leftColumnClass = temp ? "contents lg:flex lg:flex-col lg:col-start-1 lg:row-start-2 lg:self-start lg:sticky lg:top-28" : "contents";
  const rightColumnClass = temp ? "contents lg:block lg:col-start-2 lg:row-start-2 lg:min-w-0" : "contents";

  return (
    <div className={cn("min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16", temp && !isMember && "pb-[calc(7rem+var(--root-safe-bottom))]")}>
      <div className={cn("w-full max-w-2xl mx-auto px-4", temp && "lg:max-w-none lg:px-0 lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-x-8 lg:items-start")}>
        {/* Header fijo: volver y chat quedan a mano mientras se scrollea el ranking. */}
        <header className={cn("sticky top-0 z-30 -mx-4 px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 bg-bg/95 backdrop-blur-md flex items-center justify-between", temp && "lg:static lg:mx-0 lg:px-0 lg:pt-2 lg:pb-6 lg:bg-transparent lg:backdrop-blur-none lg:col-span-2")}>
          <SwipeBack onBack={goBack} />
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver a crews"
            className="size-11 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          {temp ? (
            <button
              type="button"
              onClick={() => void shareCrew()}
              aria-label="Compartir crew"
              className="h-11 px-3.5 rounded-control bg-surface border border-line flex items-center gap-2 text-sm font-semibold hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Share2 className="size-[18px]" aria-hidden="true" /> <span className="hidden lg:inline">Compartir</span>
            </button>
          ) : (
            <Link
              href={`/chat/squad/${id}`}
              aria-label="Abrir chat de la crew"
              className="h-11 px-3.5 rounded-control bg-surface border border-line flex items-center gap-2 text-sm font-semibold hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            >
              <MessageSquare className="size-[18px]" aria-hidden="true" /> Chat
            </Link>
          )}
        </header>

        <div className={leftColumnClass}>
        <div className={cn("pt-2 flex items-center gap-4", temp && "lg:pt-0")}>
          <CrewMonogram
            name={crew.name}
            imageUrl={temp?.event.cinematicBannerUrl?.trim() || undefined}
            className={cn("size-[72px] rounded-[18px] text-2xl", temp && "lg:size-[96px] lg:rounded-[24px]")}
          />
          <div className="min-w-0 flex flex-col gap-1.5">
            <h1 className="font-display text-[26px] m-0">{crew.name}</h1>
            {temp ? (
              <span className="text-sm text-ink-2">
                <span className="num-mono text-ink">{tempMemberCount}/{temp.capacity}</span> integrantes ·{" "}
                {isTempHost ? "creada por vos" : `de ${tempHost?.name ?? "su creador"}`}
              </span>
            ) : (
              <span className="text-sm text-ink-2">
                {crew.memberCount || allTimeMembers.length} integrantes ·{" "}
                <span className="num-mono">{totalCrewSteps.toLocaleString("es-AR")}</span> pasos
              </span>
            )}
            {temp ? (
              <span className="flex flex-wrap gap-1.5">
                <TemporalTag />
                {temp.isAdmitting && tempSpots > 0 ? (
                  <AdmittingPill small />
                ) : (
                  <span className="h-6 px-2.5 rounded-full bg-surface-2 text-[11px] font-semibold text-ink-2 flex items-center">
                    {tempSpots === 0 ? "Completa" : "Cerrada"}
                  </span>
                )}
              </span>
            ) : (
              <span
                className={cn(
                  "self-start label-mono px-2 py-1 rounded-full",
                  crew.isPublic ? "bg-accent/12 text-accent" : "bg-surface-2 text-ink-2",
                )}
              >
                {crew.isPublic ? "Pública" : "Privada"}
              </span>
            )}
          </div>
        </div>

        {temp && (
          <>
            <EventMiniCard event={temp.event} href={eventPath(temp.event)} className="mt-4" />
            {temp.plan && <p className="mt-3 mb-0 text-sm leading-normal text-ink-2 break-words">{temp.plan}</p>}
            {isMember && (
              <Link
                href={`/chat/squad/${id}`}
                className="mt-4 h-[50px] rounded-control bg-accent text-on-accent text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <MessageSquare className="size-[18px]" aria-hidden="true" /> Abrir chat
              </Link>
            )}
            {isTempHost && (
              <div className="mt-4 p-3.5 flex items-center gap-3 rounded-card bg-surface border border-line">
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span id="crew-admitting-label" className="text-[15px] font-semibold">Admitiendo solicitudes</span>
                  <span className="text-[13px] text-ink-2">
                    {!temp.isAdmitting
                      ? "La crew no aparece en el evento ni recibe solicitudes."
                      : tempSpots > 0
                        ? `La crew aparece en el evento. ${freeSpotsLabel(tempSpots)}.`
                        : "Está completa: no aparece en el evento."}
                  </span>
                  {admittingError && <span role="alert" className="text-[13px] text-rose-400">No se pudo guardar el cambio.</span>}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={temp.isAdmitting}
                  aria-labelledby="crew-admitting-label"
                  disabled={isSavingAdmitting}
                  onClick={toggleAdmitting}
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    temp.isAdmitting ? "bg-accent" : "bg-surface-2 border border-line-strong",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200",
                      temp.isAdmitting ? "left-[26px] bg-on-accent" : "left-1 bg-ink-2",
                    )}
                  />
                </button>
              </div>
            )}
            {!isMember && (
              <div className="mt-4 p-3.5 flex items-center gap-3 rounded-card bg-surface-2 border border-line">
                <Lock className="size-[18px] text-ink-2 shrink-0" aria-hidden="true" />
                <span className="text-sm leading-snug text-ink-2">
                  El chat y el ranking se abren cuando {tempHost ? tempHost.name.split(" ")[0] : "quien la creó"} te acepta.
                </span>
              </div>
            )}
          </>
        )}

        {/* Quien no es miembro: a una pública se suma con un toque; a una privada solo con invitación. */}
        {!temp && !isMember && user && crew.isPublic && (
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={() => void joinCrew(String(id)).catch(() => undefined)} disabled={isJoining} className="h-11 w-full">
              {isJoining ? "Uniendo…" : "Unirme a la crew"}
            </Button>
            {joinError && <p role="alert" className="m-0 text-sm text-rose-400">No pudimos sumarte. Probá de nuevo.</p>}
          </div>
        )}
        {!temp && !isMember && !crew.isPublic && (
          <p className="mt-4 mb-0 text-sm text-ink-2">Es una crew privada: para sumarte te tienen que pasar su link de invitación.</p>
        )}

        {/* Solo quien la creó decide si es pública o privada. */}
        {isHost && !temp && (
          <div className="mt-4 p-3.5 flex items-center gap-3 rounded-card bg-surface border border-line">
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span id="crew-visibility-label" className="text-[15px] font-semibold">Crew pública</span>
              <span className="text-[13px] text-ink-2">
                {crew.isPublic ? "Aparece en Crews y cualquiera se puede sumar." : "Solo se suman con tu link de invitación."}
              </span>
              {visibilityError && <span role="alert" className="text-[13px] text-rose-400">No se pudo guardar el cambio.</span>}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!!crew.isPublic}
              aria-labelledby="crew-visibility-label"
              disabled={isSavingVisibility}
              onClick={toggleVisibility}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                crew.isPublic ? "bg-accent" : "bg-surface-2 border border-line-strong",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200",
                  crew.isPublic ? "left-[26px] bg-on-accent" : "left-1 bg-ink-2",
                )}
              />
            </button>
          </div>
        )}

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

        {isMember && crew.inviteCode && (
          <CrewInviteLink
            crewId={String(id)}
            crewName={crew.name}
            inviteCode={crew.inviteCode}
            onCodeChange={(inviteCode) => setCrew((prev) => (prev ? { ...prev, inviteCode } : prev))}
          />
        )}

        {temp && endedNotice && (
          <p className="hidden lg:block mt-4 mb-0 text-[13px] text-ink-3">{endedNotice}</p>
        )}
        </div>

        <div className={rightColumnClass}>
        {isTempHost && (
          <section
            aria-labelledby="crew-requests"
            className="mt-6 flex flex-col gap-3 lg:mt-0 lg:mb-6 lg:p-[22px] lg:rounded-hero lg:border lg:border-accent/25 lg:overflow-hidden lg:bg-[linear-gradient(180deg,rgba(212,255,0,0.07),rgba(212,255,0,0)_160px)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="crew-requests" className="font-display text-[22px] m-0 lg:text-[30px]">
                Solicitudes <span className="num-mono text-accent">{tempRequests.requests.length}</span>
              </h2>
              <span className="text-xs text-ink-3">{tempSpots > 0 ? freeSpotsLabel(tempSpots) : "Crew completa"}</span>
            </div>
            {tempRequests.respondError && (
              <p role="alert" className="m-0 text-[13px] text-rose-400">No se pudo responder la solicitud. Probá de nuevo.</p>
            )}
            {tempRequests.status === "loading" ? (
              <div className="h-[220px] rounded-card bg-surface border border-line animate-pulse" aria-hidden="true" />
            ) : tempRequests.requests.length === 0 ? (
              <p className="m-0 p-4 rounded-card bg-surface border border-line text-[15px] text-ink-2">
                {tempRequests.status === "unavailable" ? "No pudimos cargar las solicitudes." : "No hay solicitudes pendientes."}
              </p>
            ) : (
              <div className="-mx-4 px-4 scroll-px-4 pb-1 flex gap-3 items-stretch overflow-x-auto overscroll-x-contain snap-x snap-mandatory hide-scrollbar lg:-mx-[22px] lg:px-[22px] lg:scroll-px-[22px]">
                {tempRequests.requests.map((request) => (
                  <TempCrewRequestCard
                    key={request.id}
                    request={request}
                    isBusy={tempRequests.respondingId === request.id}
                    canAccept={tempSpots > 0}
                    onRespond={(decision) => void tempRequests.respond(request.id, decision).catch(() => undefined)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div role="tablist" aria-label="Crew" className={cn("relative mt-5 flex p-[2px] rounded-lg bg-surface border border-line", temp && "lg:mt-0")}>
          <TabIndicator variant="pill" />
          {(["ranking", "members"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              onClick={() => setView(tab)}
              className={cn(
                "relative z-[1] flex-1 h-7 rounded-[6px] text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                view === tab ? "text-bg" : "text-ink-2 hover:text-ink",
              )}
            >
              {tab === "ranking" ? "Ranking" : "Integrantes"}
            </button>
          ))}
        </div>

        {view === "ranking" ? (
          <div key="ranking" className="tab-panel-in">
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
                      "h-8 px-2.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-2 focus-visible:outline-accent",
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
                      "h-8 px-2.5 shrink-0 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
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
                      <Avatar src={member.avatarUrl} fallback={member.name} username={member.username} className={cn("rounded-full", style.avatar)} />
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
                    <Avatar src={member.avatarUrl} fallback={member.name} username={member.username} className="size-9 rounded-full" />
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

            {/* Las crews temporales ya están atadas a un evento: no hace falta la lista de eventos. */}
            {!temp && (
            <section aria-labelledby="crew-events" className="mt-7">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <h2 id="crew-events" className="label-mono text-ink-2 m-0">Eventos de la crew</h2>
                {user && !temp && (
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
                        href={eventPath(ev)}
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
            )}
          </div>
        ) : (
          <ul key="members" className="tab-panel-in mt-4 p-0 list-none rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
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
        {temp && endedNotice && (
          <p className="mt-6 mb-0 text-center text-[13px] text-ink-3 lg:hidden">{endedNotice}</p>
        )}
        </div>
      </div>

      {/* Quien no está en la crew temporal: pedir unirse (o ver/cancelar su solicitud). */}
      {temp && !isMember && user && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-3.5 pb-[calc(0.875rem+var(--root-safe-bottom))] bg-bg/95 backdrop-blur-md border-t border-line flex items-center gap-3 lg:bottom-6 lg:inset-x-auto lg:right-8 lg:w-[400px] lg:rounded-card lg:border lg:shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">
              {temp.viewerRequestStatus === "pending" ? "Solicitud enviada" : tempSpots > 0 && temp.isAdmitting ? freeSpotsLabel(tempSpots) : "No admite gente ahora"}
            </span>
            <span className="text-xs text-ink-2">
              {temp.viewerRequestStatus === "pending"
                ? `Esperando a ${tempHost?.name.split(" ")[0] ?? "quien la creó"}`
                : `${tempHost?.name.split(" ")[0] ?? "Quien la creó"} aprueba cada solicitud`}
            </span>
          </span>
          {temp.viewerRequestStatus === "pending" ? (
            <button
              type="button"
              onClick={() => void cancelRequest(String(id)).catch(() => undefined)}
              disabled={isCancellingRequest}
              className="h-12 px-4 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
            >
              <Clock3 className="size-4" aria-hidden="true" /> Cancelar
            </button>
          ) : (
            <Button
              onClick={() => tempSummary && setJoinTarget(tempSummary)}
              disabled={!temp.isAdmitting || tempSpots === 0 || !tempSummary}
              className="h-12"
            >
              <UserPlus className="size-[17px]" aria-hidden="true" /> Pedir unirme
            </Button>
          )}
        </div>
      )}

      {tempToast && (
        <div role="status" className="fixed left-4 right-4 bottom-[calc(6.5rem+var(--root-safe-bottom))] z-40 mx-auto max-w-sm h-12 px-4 rounded-2xl bg-ink text-bg text-sm font-semibold flex items-center gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-fade-in">
          <Check className="size-[18px]" aria-hidden="true" /> {tempToast}
        </div>
      )}

      <JoinTempCrewSheet
        crew={joinTarget}
        onClose={() => setJoinTarget(null)}
        onSent={(target) => {
          setJoinTarget(null);
          setTempToast(`Solicitud enviada a ${target.name}`);
          void loadCrewData();
        }}
      />

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

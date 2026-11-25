"use client";

import React, { useState } from "react";
import { useMatch } from "@/context/MatchContext";
import { useMatcherCatalog } from "@/hooks/useMatcherCatalog";
import { CreateCrewModal } from "@/components/match/CreateCrewModal";
import { ChevronRight, Loader2, MessageSquare, Plus, Search } from "lucide-react";
import Link from "next/link";
import { CrewMonogram } from "@/components/match/CrewMonogram";
import { SearchButton } from "@/components/ui/SearchButton";
import { DanceStatsWidget } from "@/components/profile/DanceStatsWidget";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { MatchSkeleton } from "@/components/match/MatchSkeleton";
import { useRouter } from "next/navigation";
import { TabIndicator } from "@/components/ui/TabIndicator";
import { useDiscoverTempCrews, useMyTempCrews } from "@/hooks/useTempCrews";
import { EventMiniCard, TempCrewCard, TemporalTag, formatTempCrewEventDate } from "@/components/match/TempCrewCards";
import { JoinTempCrewSheet } from "@/components/match/TempCrewSheets";
import type { TempCrewSummary } from "@/types/tempCrews";

/** Crews temporales agrupadas por evento, en el orden en que llegan. */
function groupByEvent(crews: TempCrewSummary[]) {
  const groups = new Map<string, { event: TempCrewSummary["event"]; crews: TempCrewSummary[] }>();
  for (const crew of crews) {
    const group = groups.get(crew.event.id) ?? { event: crew.event, crews: [] };
    group.crews.push(crew);
    groups.set(crew.event.id, group);
  }
  return [...groups.values()];
}

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
    joinPublicCrew,
  } = useMatcherCatalog();
  const [joiningCrewId, setJoiningCrewId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const myTempCrews = useMyTempCrews(!!user);
  const discoverTempCrews = useDiscoverTempCrews(!!user);
  const [tempJoinTarget, setTempJoinTarget] = useState<TempCrewSummary | null>(null);
  const [tempToast, setTempToast] = useState<string | null>(null);
  React.useEffect(() => {
    if (!tempToast) return;
    const timer = setTimeout(() => setTempToast(null), 3200);
    return () => clearTimeout(timer);
  }, [tempToast]);

  const handleJoinCrew = async (crewId: string) => {
    setJoiningCrewId(crewId);
    setJoinError(null);
    try {
      const id = await joinPublicCrew(crewId);
      router.push(`/crews/${id}`);
    } catch {
      setJoinError("No pudimos sumarte a la crew. Probá de nuevo.");
    } finally {
      setJoiningCrewId(null);
    }
  };

  // User event-based squads from matcher
  const userSquads = squads.filter((s) =>
    s.members?.some((m) => m.userId === user?.id),
  );

  const tempCrewsMine = myTempCrews.status === "ready" ? myTempCrews.crews : [];
  const tempCrewGroups = discoverTempCrews.status === "ready" ? groupByEvent(discoverTempCrews.crews) : [];
  const totalMyCrews = permanentCrews.length + userSquads.length + tempCrewsMine.length;

  // Filtered country crews
  const filteredCountryCrews = allCrews.filter((crew) =>
    crew.name.toLowerCase().includes(searchCrewsQuery.toLowerCase()) ||
    (crew.location && crew.location.toLowerCase().includes(searchCrewsQuery.toLowerCase())),
  );

  if (authLoading) {
    return <MatchSkeleton />;
  }

  if (!user) {
    return <LoginRequired />;
  }

  if (crewsLoading || (isLoadingSquads && squads.length === 0)) {
    return <MatchSkeleton />;
  }

  const handleCreateCrewSubmit = async (data: {
    name: string;
    memberIds: string[];
    eventIds: string[];
    isPublic: boolean;
    friends: Array<{ id: string; name: string; username: string; avatarUrl?: string }>;
  }) => {
    const createdId = await createCrew({
      name: data.name,
      isPublic: data.isPublic,
      memberIds: data.memberIds,
      eventIds: data.eventIds,
      friends: data.friends,
    });
    if (createdId) {
      router.push(`/crews/${createdId}`);
    }
  };

  const tabs = [
    { id: "squads", label: "Mis crews" },
    { id: "crews", label: "Explorar" },
  ] as const;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center justify-between gap-3 lg:max-w-none lg:px-0 lg:pt-2 lg:pb-6">
          <h1 className="font-display text-[32px] m-0 lg:text-[44px]">Crews</h1>
          {/* Escritorio: búsqueda y mensajes ya están en la barra flotante; acá va la acción principal. */}
          <button
            data-dsk
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden lg:flex h-11 px-4 rounded-control bg-accent text-on-accent text-sm font-semibold items-center gap-1.5 hover:bg-accent-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" /> Crear crew
          </button>
          <div className="flex items-center gap-2 lg:hidden">
          <SearchButton />
          <Link
            href="/chat"
            aria-label="Mensajes de crews"
            className="size-11 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <MessageSquare className="size-5" aria-hidden="true" />
          </Link>
          </div>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 pt-4 lg:max-w-none lg:px-0 lg:pt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-8 lg:items-start">
        <div className="mb-4 lg:mb-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-28">
          <DanceStatsWidget />
        </div>

        <div role="tablist" aria-label="Crews" className="relative flex p-[2px] rounded-lg bg-surface border border-line lg:col-start-1 lg:row-start-1 lg:self-start">
          <TabIndicator variant="pill" />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative z-[1] flex-1 h-7 rounded-[6px] text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                activeTab === tab.id ? "text-bg" : "text-ink-2 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "squads" && (
          <div className="animate-fade-in lg:col-start-1 lg:row-start-2">
            <div className="mt-4 px-3.5 py-3 rounded-2xl bg-black text-white border-[1.5px] border-white grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
              <span className="font-display text-base whitespace-nowrap">Armá tu crew</span>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                aria-label="Crear crew"
                className="col-start-2 row-span-2 row-start-1 self-center shrink-0 h-10 px-3 rounded-xl bg-white text-black text-[13px] font-semibold flex items-center gap-1 whitespace-nowrap hover:bg-ink active:scale-[0.97] transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              >
                <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" /> Crear
              </button>
              <span className="col-start-1 text-sm font-medium leading-snug text-white">
                De 2 a 10 personas a competir
              </span>
            </div>

            {squadsError && (
              <button
                type="button"
                onClick={() => void refreshSquads().catch(() => undefined)}
                className="mt-4 min-h-11 text-sm text-danger"
              >
                {squadsError} Reintentar
              </button>
            )}

            {totalMyCrews === 0 ? (
              <p className="mt-7 text-center text-[15px] text-ink-2">
                Todavía no tenés crews. Creá una con tus amigos o sumate a una desde Explorar.
              </p>
            ) : (
              <>
                {tempCrewsMine.length > 0 && (
                  <section aria-labelledby="crews-temp" className="mt-7">
                    <div className="flex items-baseline justify-between gap-3 mb-2.5">
                      <h2 id="crews-temp" className="label-mono text-ink-2 m-0">Temporales · {tempCrewsMine.length}</h2>
                      <span className="text-xs text-ink-3">Duran hasta el evento</span>
                    </div>
                    <div className="flex flex-col rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06] lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:overflow-visible lg:bg-transparent lg:border-0">
                      {tempCrewsMine.map((crew) => {
                        const pending = crew.pendingRequestsCount ?? 0;
                        const banner = crew.event.cinematicBannerUrl?.trim();
                        return (
                          <Link
                            key={crew.id}
                            href={`/crews/${crew.id}`}
                            className={cn(
                              "flex items-center gap-3 p-3.5 hover:bg-surface-2 transition-colors lg:p-4 lg:rounded-card lg:bg-surface lg:border lg:border-line",
                              crew.viewerRole === "host" && pending > 0 && "lg:border-accent/50",
                            )}
                          >
                            <CrewMonogram name={crew.name} imageUrl={banner || undefined} className="w-12 h-[60px] rounded-[10px]" />
                            <span className="flex-1 min-w-0 flex flex-col gap-1">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="text-base font-semibold truncate">{crew.name}</span>
                                <span className="hidden lg:inline-flex"><TemporalTag /></span>
                              </span>
                              <span className="text-[13px] text-ink-2 truncate">
                                {crew.event.title} · {formatTempCrewEventDate(crew.event.date)}
                              </span>
                              <span className="flex flex-wrap items-center gap-2">
                                {crew.viewerRole === "host" && pending > 0 && (
                                  <span className="h-6 px-2.5 rounded-full bg-accent text-on-accent text-xs font-semibold flex items-center">
                                    {pending} {pending === 1 ? "solicitud" : "solicitudes"}
                                  </span>
                                )}
                                {crew.viewerRequestStatus === "pending" && (
                                  <span className="h-6 px-2.5 rounded-full bg-surface-2 text-ink-2 text-xs font-semibold flex items-center">Solicitud pendiente</span>
                                )}
                                {crew.viewerRole && (
                                  <span className="text-xs text-ink-2">{crew.viewerRole === "host" ? "Creada por vos" : "Integrante"}</span>
                                )}
                              </span>
                            </span>
                            <span className="flex flex-col items-end gap-0.5 shrink-0">
                              <span className="num-mono text-[15px] font-semibold">{crew.memberCount}/{crew.capacity}</span>
                              <span className="label-mono text-ink-3">lugares</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                {permanentCrews.length > 0 && (
                  <section aria-labelledby="crews-mine" className="mt-7">
                    <h2 id="crews-mine" className="label-mono text-ink-2 m-0 mb-2.5">
                      Tus crews · {permanentCrews.length}
                    </h2>
                    <div className="flex flex-col rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06] lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:overflow-visible lg:bg-transparent lg:border-0">
                      {permanentCrews.map((crew) => (
                        <Link
                          key={crew.id}
                          href={`/crews/${crew.id}`}
                          className="flex items-center gap-3 p-3.5 hover:bg-surface-2 transition-colors lg:p-4 lg:rounded-card lg:bg-surface lg:border lg:border-line"
                        >
                          <CrewMonogram name={crew.name} />
                          <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                            <span className="text-base font-semibold truncate">{crew.name}</span>
                            <span className="text-[13px] text-ink-2 truncate">
                              {crew.memberCount} integrantes{crew.location ? ` · ${crew.location}` : ""}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-0.5 shrink-0">
                            <span className="num-mono text-[15px] font-semibold text-accent">
                              {crew.topSteps.toLocaleString("es-AR")}
                            </span>
                            <span className="label-mono text-ink-3">pasos top</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {userSquads.length > 0 && (
                  <section aria-labelledby="crews-squads" className="mt-7">
                    <div className="flex items-baseline justify-between mb-2.5">
                      <h2 id="crews-squads" className="label-mono text-ink-2 m-0">Squads de eventos</h2>
                      <span className="label-mono text-ink-3">Por match</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {userSquads.map((sq) => {
                        const event = events.find((e) => e.id === sq.eventId);
                        const title = sq.eventTitle || event?.title || sq.name;
                        return (
                          <div key={sq.id} className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-3.5">
                            <div className="flex items-center gap-3">
                              <CrewMonogram
                                name={title}
                                imageUrl={sq.eventImage || event?.cinematicBannerUrl || undefined}
                                className="size-14 text-xs"
                              />
                              <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                                <span className="text-base font-semibold truncate">{title}</span>
                                <span className="label-mono text-accent truncate">{sq.name}</span>
                                {sq.location && (
                                  <span className="text-[13px] text-ink-2 truncate">Salida desde {sq.location}</span>
                                )}
                              </span>
                              {sq.matchScore != null && (
                                <span className="w-16 h-14 shrink-0 rounded-xl bg-accent/10 flex flex-col items-center justify-center">
                                  <span className="num-mono text-xl font-semibold text-accent">{sq.matchScore}%</span>
                                  <span className="label-mono text-ink-2">match</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="flex -space-x-2">
                                  {sq.members.slice(0, 4).map((member) => (
                                    <Avatar
                                      key={member.userId}
                                      src={member.avatarUrl || undefined}
                                      fallback={member.name || "Integrante"}
                                      username={member.username}
                                      size="sm"
                                      className="size-7 ring-2 ring-surface"
                                    />
                                  ))}
                                </span>
                                <span className="text-[13px] text-ink-2">{sq.members.length} integrantes</span>
                              </span>
                              <Link
                                href={`/chat/squad/${sq.id}`}
                                className="h-11 px-4 shrink-0 rounded-xl bg-surface-2 border border-line-strong text-sm font-semibold flex items-center hover:bg-[#23272D] transition-colors"
                              >
                                Abrir chat
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "crews" && (
          <div className="pt-4 flex flex-col gap-3.5 animate-fade-in lg:col-start-1 lg:row-start-2">
            {tempCrewGroups.length > 0 && (
              <section aria-labelledby="crews-looking" className="flex flex-col gap-3 pb-4 mb-1 border-b border-line">
                <div className="flex flex-col gap-1">
                  <h2 id="crews-looking" className="font-display text-[22px] m-0">Buscando gente</h2>
                  <p className="m-0 text-sm text-ink-2">Crews temporales de los eventos a los que vas.</p>
                </div>
                {tempCrewGroups.map((group) => (
                  <div key={group.event.id} className="flex flex-col gap-2.5">
                    <EventMiniCard
                      event={{
                        ...group.event,
                        location: `${group.event.location} · ${group.crews.length} ${group.crews.length === 1 ? "crew" : "crews"}`,
                      }}
                      href={`/events/${group.event.id}/crews`}
                      className="bg-surface"
                    />
                    <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
                      {group.crews.slice(0, 2).map((crew) => (
                        <TempCrewCard key={crew.id} crew={crew} onRequest={setTempJoinTarget} />
                      ))}
                    </div>
                    {group.crews.length > 2 && (
                      <Link
                        href={`/events/${group.event.id}/crews`}
                        className="h-11 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold flex items-center justify-center hover:bg-[#23272D] transition-colors"
                      >
                        Ver las {group.crews.length} crews de este evento
                      </Link>
                    )}
                  </div>
                ))}
              </section>
            )}
            <label htmlFor="crews-search" className="sr-only">Buscar crew</label>
            <div className="h-9 md:h-10 px-3 flex items-center gap-2 rounded-xl bg-surface border border-white/10 text-ink-3 focus-within:border-accent">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <input
                id="crews-search"
                type="search"
                value={searchCrewsQuery}
                onChange={(e) => setSearchCrewsQuery(e.target.value)}
                placeholder="Buscar crew por nombre o ciudad"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-ink text-xs md:text-sm placeholder:text-ink-3"
              />
            </div>
            <span className="label-mono text-ink-3">Crews públicas · {allCrews.length}</span>
            {joinError && <p role="alert" className="m-0 text-sm text-rose-400">{joinError}</p>}

            {filteredCountryCrews.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-ink-2">
                {searchCrewsQuery
                  ? `No hay crews que coincidan con "${searchCrewsQuery}".`
                  : "Todavía no hay crews públicas. Las privadas se suman solo con invitación."}
              </p>
            ) : (
              filteredCountryCrews.map((crew) => {
                const isMyCrew = permanentCrews.some((c) => c.id === crew.id);
                return (
                  <Link
                    key={crew.id}
                    href={`/crews/${crew.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-card bg-surface border border-line hover:bg-surface-2 transition-colors"
                  >
                    <CrewMonogram name={crew.name} />
                    <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                      <span className="text-base font-semibold truncate">{crew.name}</span>
                      <span className="text-[13px] text-ink-2 truncate">
                        {crew.memberCount} integrantes{crew.location ? ` · ${crew.location}` : ""}
                      </span>
                    </span>
                    {isMyCrew ? (
                      <span className="label-mono text-accent shrink-0">Miembro</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleJoinCrew(crew.id);
                        }}
                        disabled={joiningCrewId === crew.id}
                        aria-label={`Unirme a ${crew.name}`}
                        className="h-9 shrink-0 px-3.5 rounded-xl bg-accent text-on-accent text-[13px] font-semibold active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {joiningCrewId === crew.id ? "Uniendo…" : "Unirme"}
                      </button>
                    )}
                    <ChevronRight className="size-5 text-ink-3 shrink-0" aria-hidden="true" />
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      <JoinTempCrewSheet
        crew={tempJoinTarget}
        onClose={() => setTempJoinTarget(null)}
        onSent={(crew) => {
          setTempJoinTarget(null);
          setTempToast(`Solicitud enviada a ${crew.name}`);
          void discoverTempCrews.reload();
          void myTempCrews.reload();
        }}
      />
      {tempToast && (
        <div role="status" className="fixed left-4 right-4 bottom-[calc(var(--root-mobile-nav-clearance)+1rem)] z-40 mx-auto max-w-sm h-12 px-4 rounded-2xl bg-ink text-bg text-sm font-semibold flex items-center shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-fade-in md:bottom-8">
          {tempToast}
        </div>
      )}

      <CreateCrewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        events={events}
        onSubmit={handleCreateCrewSubmit}
      />
    </div>
  );
}

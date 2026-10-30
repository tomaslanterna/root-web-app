"use client";

import React, { useState } from "react";
import { useMatch } from "@/context/MatchContext";
import { useMatcherCatalog } from "@/hooks/useMatcherCatalog";
import { CreateCrewModal } from "@/components/match/CreateCrewModal";
import { ChevronRight, Loader2, MessageSquare, Plus, Search } from "lucide-react";
import Link from "next/link";
import { CrewMonogram } from "@/components/match/CrewMonogram";
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

  const tabs = [
    { id: "squads", label: "Mis crews" },
    { id: "crews", label: "Explorar" },
  ] as const;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[32px] m-0">Crews</h1>
          <Link
            href="/chat"
            aria-label="Mensajes de crews"
            className="size-11 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <MessageSquare className="size-5" aria-hidden="true" />
          </Link>
        </header>

        <div role="tablist" aria-label="Crews" className="mt-4 flex p-[3px] rounded-xl bg-surface border border-line">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 h-10 rounded-[9px] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                activeTab === tab.id ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "squads" && (
          <div className="animate-fade-in">
            <div className="mt-4 p-[18px] rounded-[18px] bg-accent text-on-accent flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[22px]">Armá tu crew</span>
                <span className="text-[15px] leading-snug text-[#2A2F12]">
                  Juntate con 3 a 5 personas de tu zona para salir juntos y competir en pasos.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="self-start h-11 px-4 rounded-xl bg-bg text-ink text-[15px] font-semibold flex items-center gap-1.5 active:scale-[0.97] transition-transform focus-visible:outline-2 focus-visible:outline-bg focus-visible:outline-offset-2"
              >
                <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" /> Crear crew
              </button>
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

            {crewsLoading && totalMyCrews === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-accent" aria-label="Cargando crews" />
              </div>
            ) : totalMyCrews === 0 ? (
              <p className="mt-7 text-center text-[15px] text-ink-2">
                Todavía no tenés crews. Creá una con tus amigos o sumate a una desde Explorar.
              </p>
            ) : (
              <>
                {permanentCrews.length > 0 && (
                  <section aria-labelledby="crews-mine" className="mt-7">
                    <h2 id="crews-mine" className="label-mono text-ink-2 m-0 mb-2.5">
                      Tus crews · {permanentCrews.length}
                    </h2>
                    <div className="flex flex-col rounded-card overflow-hidden bg-surface border border-line divide-y divide-white/[0.06]">
                      {permanentCrews.map((crew) => (
                        <Link
                          key={crew.id}
                          href={`/crews/${crew.id}`}
                          className="flex items-center gap-3 p-3.5 hover:bg-surface-2 transition-colors"
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
          <div className="pt-4 flex flex-col gap-3.5 animate-fade-in">
            <label htmlFor="crews-search" className="sr-only">Buscar crew</label>
            <div className="h-12 px-3.5 flex items-center gap-2.5 rounded-control bg-surface border border-white/10 text-ink-3 focus-within:border-accent">
              <Search className="size-5 shrink-0" aria-hidden="true" />
              <input
                id="crews-search"
                type="search"
                value={searchCrewsQuery}
                onChange={(e) => setSearchCrewsQuery(e.target.value)}
                placeholder="Buscar crew por nombre o ciudad"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-ink text-[15px] placeholder:text-ink-3"
              />
            </div>
            <span className="label-mono text-ink-3">Crews registradas · {allCrews.length}</span>

            {crewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-accent" aria-label="Cargando crews" />
              </div>
            ) : filteredCountryCrews.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-ink-2">
                {searchCrewsQuery
                  ? `No hay crews que coincidan con "${searchCrewsQuery}".`
                  : "Todavía no hay crews registradas."}
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
                    {isMyCrew && <span className="label-mono text-accent shrink-0">Miembro</span>}
                    <ChevronRight className="size-5 text-ink-3 shrink-0" aria-hidden="true" />
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      <CreateCrewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        events={events}
        onSubmit={handleCreateCrewSubmit}
      />
    </div>
  );
}

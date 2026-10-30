"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BroadcastChannel } from "@/components/communities/BroadcastChannel";
import { CommunityHeader } from "@/components/communities/CommunityHeader";
import { CommunityInfoPanel } from "@/components/communities/CommunityInfoPanel";
import { CommunityWall } from "@/components/communities/CommunityWall";
import { CommunityLockedContent } from "@/components/communities/CommunityLockedContent";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  useCommunityDetail,
  useCommunityRole,
} from "@/hooks/useCommunities";
import { useCommunityContact } from "@/hooks/useCommunityModeration";
import type { CommunityTab } from "@/types/communities";
import { cn } from "@/lib/utils";

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>;
}

const TABS: { id: CommunityTab; label: string }[] = [
  { id: "wall", label: "Muro" },
  { id: "channel", label: "Canal" },
];

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");
  const tabParam = searchParams.get("tab");

  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    community,
    refresh,
    membership,
    isLoading,
    isChangingMembership,
    error,
    membershipError,
    setMuted,
    isMuting,
    muteError,
  } = useCommunityDetail(id);

  const contact = useCommunityContact();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<CommunityTab>(
    tabParam === "wall" ? "wall" : "channel",
  );
  const [isInfoOpen, setIsInfoOpen] = useState(
    tabParam === "events" || tabParam === "members",
  );

  // Role resolution
  const { isRRPP, isMember, isGuest } = useCommunityRole(community, user);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  const changeMembership = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!community) return;
    void membership(community.isMember ? "leave" : "join").catch(() => undefined);
  };

  if (isLoading && !community) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-bg text-ink">
        <Loader2 className="size-8 animate-spin text-accent" aria-hidden="true" />
        <p className="label-mono text-ink-2">Cargando comunidad</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg p-6 text-center text-ink">
        <p className="text-lg font-semibold">
          {error
            ? "No pudimos cargar esta comunidad"
            : "Comunidad no encontrada"}
        </p>
        <div className="mt-4 flex gap-2">
          {error && (
            <Button
              size="sm"
              onClick={() => void refresh().catch(() => undefined)}
            >
              Reintentar
            </Button>
          )}
          <Link
            href="/communities"
            className="h-11 px-4 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold flex items-center"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full overflow-x-hidden bg-bg text-ink",
        activeTab === "channel" && !isGuest
          ? "-mb-24 md:-mb-16"
          : "pb-6 sm:pb-10",
      )}
    >
      <CommunityHeader
        community={community}
        onBack={() => router.push(origin || "/communities")}
        onOpenInfo={() => setIsInfoOpen(true)}
        isInfoOpen={isInfoOpen}
        onJoin={changeMembership}
        isJoining={isChangingMembership}
      />

      <div className="sticky top-[var(--root-safe-top)] md:top-20 z-20 bg-bg/95 backdrop-blur-md">
        <nav aria-label="Navegación de la comunidad" className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6">
          <div role="tablist" className="flex p-[3px] rounded-xl bg-surface border border-line">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`community-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "h-10 flex-1 rounded-[9px] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    isActive ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Tab Content Area */}
      <main className="mx-auto w-full max-w-4xl px-4 pt-1 sm:px-6">
        {activeTab === "channel" && (
          <div id="community-tab-channel" role="tabpanel" aria-label="Canal">
            {isGuest ? (
              <CommunityLockedContent
                sectionName="el Canal de Difusión"
                membersCount={community.membersCount}
                onJoin={changeMembership}
                isJoining={isChangingMembership}
                onViewMembers={() => setIsInfoOpen(true)}
                isLoggedIn={Boolean(user)}
              />
            ) : (
              <BroadcastChannel
                communityId={community.id}
                communityName={community.name}
                isRRPP={isRRPP}
                isMember={isMember}
              />
            )}
          </div>
        )}

        {activeTab === "wall" && (
          <div id="community-tab-wall" role="tabpanel" aria-label="Muro">
            {isGuest ? (
              <CommunityLockedContent
                sectionName="el Muro de Publicaciones"
                membersCount={community.membersCount}
                onJoin={changeMembership}
                isJoining={isChangingMembership}
                onViewMembers={() => setIsInfoOpen(true)}
                isLoggedIn={Boolean(user)}
              />
            ) : (
              <CommunityWall
                communityId={community.id}
                isRRPP={isRRPP}
                isMember={isMember}
              />
            )}
          </div>
        )}

      </main>

      <CommunityInfoPanel
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        community={community}
        isRRPP={isRRPP}
        isMember={isMember}
        isGuest={isGuest}
        isLoggedIn={Boolean(user)}
        isAuthLoading={isAuthLoading}
        isChangingMembership={isChangingMembership}
        hasMembershipError={Boolean(membershipError)}
        isMuting={isMuting}
        hasMuteError={Boolean(muteError)}
        isContacting={contact.isLoading}
        canContact={Boolean(community.contact && community.contact.id !== user?.id)}
        onChangeMembership={changeMembership}
        onToggleMuted={() => void setMuted(!community.muted).catch(() => undefined)}
        onContact={() => {
          if (!user) {
            router.push("/login");
            return;
          }
          if (!community.contact || community.contact.id === user.id) return;
          void contact
            .mutate(community.contact.id)
            .then((chat) => router.push(`/chat/${chat.id}`))
            .catch(() => undefined);
        }}
      />
    </div>
  );
}

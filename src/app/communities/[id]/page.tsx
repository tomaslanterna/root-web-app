"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Megaphone,
  Radio,
} from "lucide-react";
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

const TABS: { id: CommunityTab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "channel", label: "Canal", icon: Radio },
  { id: "wall", label: "Muro", icon: Megaphone },
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0D10] text-white">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#D4FF00]" />
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Cargando comunidad
        </p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0D10] p-6 text-center text-white">
        <Radio className="mb-4 h-10 w-10 text-neutral-600" />
        <p className="text-sm font-bold uppercase text-neutral-300">
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
          <Link href="/communities">
            <Button variant="outline" size="sm">
              Volver
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full overflow-x-hidden bg-[#0B0D10] text-white",
        activeTab === "channel" && !isGuest
          ? "-mb-24 md:-mb-16"
          : "pb-6 sm:pb-10",
      )}
    >
      <CommunityHeader
        name={community.name}
        onBack={() => router.push(origin || "/communities")}
        onOpenInfo={() => setIsInfoOpen(true)}
        isInfoOpen={isInfoOpen}
      />

      <div className="sticky top-[calc(4.25rem+var(--root-safe-top,env(safe-area-inset-top,0px)))] z-20 w-full border-b border-white/[0.06] bg-[#0B0D10]/95 backdrop-blur-md md:top-[4.25rem]">
        <nav
          aria-label="Navegación de la comunidad"
          className="mx-auto w-full max-w-4xl"
        >
          <div className="flex w-full items-center justify-around" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`community-tab-${tab.id}`}
                  aria-label={tab.label}
                  title={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className="group relative flex min-h-11 flex-1 cursor-pointer select-none flex-col items-center justify-center py-3.5 transition-colors sm:py-4"
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200",
                      isActive
                        ? "text-[#D4FF00] scale-105"
                        : "text-neutral-500 group-hover:text-neutral-300",
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#D4FF00]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Tab Content Area */}
      <main className="mx-auto w-full max-w-4xl px-3.5 pt-4 sm:px-6">
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

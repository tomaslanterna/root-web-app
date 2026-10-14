"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  Loader2,
  MapPin,
  Megaphone,
  Radio,
  UserMinus,
  UserPlus,
  Users,
  BellOff,
  Bell,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { BroadcastChannel } from "@/components/communities/BroadcastChannel";
import { CommunityWall } from "@/components/communities/CommunityWall";
import { PromotedEvents } from "@/components/communities/PromotedEvents";
import { MembersList } from "@/components/communities/MembersList";
import { CommunityLockedContent } from "@/components/communities/CommunityLockedContent";
import { CommunityModeration } from "@/components/communities/CommunityModeration";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DetailHeader } from "@/components/ui/DetailHeader";
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
  { id: "events", label: "Eventos", icon: CalendarDays },
  { id: "members", label: "Miembros", icon: Users },
];

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");
  const tabParam = searchParams.get("tab") as CommunityTab | null;

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
    markRead,
    readError,
  } = useCommunityDetail(id);

  const contact = useCommunityContact();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<CommunityTab>(
    tabParam && ["channel", "wall", "events", "members"].includes(tabParam)
      ? tabParam
      : "channel",
  );

  // Mobile description expand/collapse
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);

  // Role resolution
  const { role, isRRPP, isMember, isGuest } = useCommunityRole(community, user);

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
      {/* Top Floating App Header with Back button */}
      <DetailHeader showBrand onBack={() => router.push(origin || "/communities")} />

      {/* Hero Cover (Optimized for Mobile Viewport) */}
      <header className="relative h-44 w-full overflow-hidden bg-neutral-950 sm:h-56 md:h-72">
        {community.coverImageUrl ? (
          <Image
            src={community.coverImageUrl}
            alt={community.name}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(212,255,0,0.28),transparent_30%),linear-gradient(140deg,#1a2028,#07080a)]">
            <Radio className="absolute right-[8%] top-[20%] h-32 w-32 text-[#D4FF00]/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-black/30 to-transparent" />

        {/* Floating details inside cover */}
        <div className="absolute inset-x-3.5 bottom-3.5 mx-auto max-w-4xl space-y-1.5 sm:inset-x-6 sm:bottom-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border-0 bg-[#D4FF00]/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#D4FF00] backdrop-blur-md shadow-sm">
              {community.category}
            </span>

            {community.zone && (
              <span className="flex items-center gap-1 rounded-full border-0 bg-black/60 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-200 backdrop-blur-md shadow-sm">
                <MapPin className="h-2.5 w-2.5 text-[#D4FF00]" /> {community.zone}
              </span>
            )}

            {isRRPP && (
              <span className="flex items-center gap-1 rounded-full border-0 bg-[#D4FF00]/25 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#D4FF00] backdrop-blur-md shadow-sm">
                <Crown className="h-2.5 w-2.5" /> RRPP
              </span>
            )}
          </div>

          <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white line-clamp-2 sm:text-3xl md:text-4xl">
            {community.name}
          </h1>
        </div>
      </header>

      {/* Mobile-First Header Info Bar (Bio, Members & Quick Actions) */}
      <section className="mx-auto w-full max-w-4xl px-3.5 pt-3 sm:px-6">
        <div className="rounded-3xl border-0 bg-[#111114] p-4 sm:p-6 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
          {/* Top row: Member count + status badge */}
          <div className="flex items-center justify-between gap-3">
            {/* Clickable members pill -> navigates to members tab */}
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className="group flex items-center gap-2 rounded-full border-0 bg-[#D4FF00]/15 px-3 py-1 transition-transform active:scale-95 hover:bg-[#D4FF00]/25 shadow-sm"
              title="Ver directorio de miembros"
            >
              <Users className="h-3.5 w-3.5 text-[#D4FF00]" />
              <span className="flex items-center gap-1.5">
                <span className="num-display text-xs text-white">{community.membersCount}</span>
                <span className="tech-label text-[9px] text-[#D4FF00]">miembros</span>
              </span>
            </button>

            {isRRPP ? (
              <span className="inline-flex items-center gap-1 tech-label text-[9px] text-[#D4FF00]">
                <Crown className="h-3 w-3" /> Eres Administrador
              </span>
            ) : isMember ? (
              <span className="inline-flex items-center gap-1 tech-label text-[9px] text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Eres Miembro
              </span>
            ) : null}
          </div>

          {/* Bio / Description */}
          {community.description && (
            <div className="mt-2.5">
              <p
                className={cn(
                  "text-xs leading-relaxed text-neutral-300 sm:text-sm",
                  !isBioExpanded && "line-clamp-2",
                )}
              >
                {community.description}
              </p>
              {community.description.length > 100 && (
                <button
                  type="button"
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="mt-1 flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4FF00]"
                >
                  {isBioExpanded ? (
                    <>
                      Ver menos <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Ver más <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Action buttons row */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06]">
            {/* Main Join / Leave Button */}
            {!isRRPP && (
              <Button
                variant={isMember ? "outline" : "primary"}
                size="sm"
                onClick={changeMembership}
                disabled={isChangingMembership || isAuthLoading}
                className="flex-1 h-10 text-xs font-black uppercase tracking-wider"
              >
                {isChangingMembership ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : isMember ? (
                  <UserMinus className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                )}
                {!user
                  ? "Iniciá sesión para unirte"
                  : isMember
                    ? "Salir de la comunidad"
                    : "Unirme a la comunidad"}
              </Button>
            )}

            {/* Notification Bell toggle (if member) */}
            {isMember && (
              <Button
                variant="outline"
                size="sm"
                disabled={isMuting}
                onClick={() => void setMuted(!community.muted).catch(() => undefined)}
                className="h-10 px-3 shrink-0"
                title={community.muted ? "Activar avisos" : "Silenciar avisos"}
              >
                {community.muted ? (
                  <BellOff className="h-4 w-4 text-neutral-400" />
                ) : (
                  <Bell className="h-4 w-4 text-[#D4FF00]" />
                )}
              </Button>
            )}

            {/* RRPP Contact button */}
            {community.contact && community.contact.id !== user?.id && (
              <Button
                variant="outline"
                size="sm"
                disabled={contact.isLoading}
                onClick={() => {
                  if (!user) router.push("/login");
                  else
                    void contact
                      .mutate(community.contact!.id)
                      .then((chat) => router.push(`/chat/${chat.id}`))
                      .catch(() => undefined);
                }}
                className="h-10 px-3 shrink-0 gap-1 text-xs"
                title="Contactar al RRPP"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">RRPP</span>
              </Button>
            )}

            {/* RRPP Moderation quick button */}
            {isRRPP && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModerationModal(!showModerationModal)}
                className="h-10 px-3 shrink-0 gap-1 text-xs border-[#D4FF00]/30 text-[#D4FF00]"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Moderación</span>
              </Button>
            )}
          </div>

          {membershipError && (
            <p className="mt-2 text-xs font-bold text-red-400">
              No pudimos actualizar tu membresía. Intentá nuevamente.
            </p>
          )}

          {/* RRPP Moderation expandable drawer/box */}
          {isRRPP && showModerationModal && (
            <div className="mt-3.5 pt-3 border-t border-white/[0.06]">
              <CommunityModeration communityId={community.id} />
            </div>
          )}
        </div>
      </section>

      {/* Sticky Tabs Navigation estilo Instagram: solo iconos, sin contenedor visible, con línea horizontal inferior */}
      <div className="sticky top-[calc(3.5rem+var(--root-safe-top,env(safe-area-inset-top,0px)))] md:top-14 z-20 mt-3.5 w-full bg-[#0B0D10]/95 backdrop-blur-md">
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
                  className="relative flex-1 flex flex-col items-center justify-center py-3.5 sm:py-4 transition-colors group select-none cursor-pointer"
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
        {/* Tab 1: Canal de Difusión (Chat) */}
        {activeTab === "channel" && (
          <div>
            {isGuest ? (
              <CommunityLockedContent
                sectionName="el Canal de Difusión"
                membersCount={community.membersCount}
                onJoin={changeMembership}
                isJoining={isChangingMembership}
                onViewMembers={() => setActiveTab("members")}
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

        {/* Tab 2: Muro (Feed de Anuncios y Publicaciones) */}
        {activeTab === "wall" && (
          <div>
            {isGuest ? (
              <CommunityLockedContent
                sectionName="el Muro de Publicaciones"
                membersCount={community.membersCount}
                onJoin={changeMembership}
                isJoining={isChangingMembership}
                onViewMembers={() => setActiveTab("members")}
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

        {/* Tab 3: Listado de Eventos Promocionados */}
        {activeTab === "events" && (
          <div>
            {isGuest ? (
              <CommunityLockedContent
                sectionName="los Eventos Promocionados"
                membersCount={community.membersCount}
                onJoin={changeMembership}
                isJoining={isChangingMembership}
                onViewMembers={() => setActiveTab("members")}
                isLoggedIn={Boolean(user)}
              />
            ) : (
              <PromotedEvents
                communityId={community.id}
                isRRPP={isRRPP}
                isMember={isMember}
              />
            )}
          </div>
        )}

        {/* Tab 4: Listado de Miembros (Directorio - Vista Universal para Todos) */}
        {activeTab === "members" && (
          <MembersList
            communityId={community.id}
            community={community}
            isRRPP={isRRPP}
            isMember={isMember}
            isGuest={isGuest}
          />
        )}
      </main>
    </div>
  );
}

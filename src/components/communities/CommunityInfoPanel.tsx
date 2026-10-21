"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Crown,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldAlert,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CommunityCover } from "./CommunityCover";
import { CommunityLockedContent } from "./CommunityLockedContent";
import { CommunityModeration } from "./CommunityModeration";
import { MembersList } from "./MembersList";
import { PromotedEvents } from "./PromotedEvents";
import type { Community } from "@/types/communities";

interface CommunityInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
  isRRPP: boolean;
  isMember: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  isChangingMembership: boolean;
  hasMembershipError: boolean;
  isMuting: boolean;
  hasMuteError: boolean;
  isContacting: boolean;
  canContact: boolean;
  onChangeMembership: () => void;
  onToggleMuted: () => void;
  onContact: () => void;
}

export function CommunityInfoPanel({
  isOpen,
  onClose,
  community,
  isRRPP,
  isMember,
  isGuest,
  isLoggedIn,
  isAuthLoading,
  isChangingMembership,
  hasMembershipError,
  isMuting,
  hasMuteError,
  isContacting,
  canContact,
  onChangeMembership,
  onToggleMuted,
  onContact,
}: CommunityInfoPanelProps) {
  const [showModeration, setShowModeration] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Información de ${community.name}`}
      presentation="screen"
      header={
        <div className="flex min-h-16 items-center gap-3 border-b border-white/[0.06] bg-[#0B0D10]/95 px-4 py-2 backdrop-blur-xl">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#15181d] ring-1 ring-white/10">
            <CommunityCover
              coverImageUrl={community.coverImageUrl}
              category={community.category}
              sizes="40px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold tracking-tight text-white">
              {community.name}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4FF00]">
              Información de la comunidad
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar información de la comunidad"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-neutral-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-reduce:transform-none motion-reduce:transition-none">
        <section aria-labelledby="community-overview-heading" className="space-y-5">
          <div className="relative h-44 overflow-hidden rounded-[1.75rem] bg-[#111318]">
            <CommunityCover
              coverImageUrl={community.coverImageUrl}
              category={community.category}
              sizes="(min-width: 768px) 432px, 100vw"
              className="opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-black/15 to-transparent" />
            <div className="absolute inset-x-4 bottom-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4FF00]">
                {community.category}
              </p>
              <h2
                id="community-overview-heading"
                className="mt-1 line-clamp-2 text-2xl font-black uppercase leading-none tracking-tight text-white"
              >
                {community.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-300">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#D4FF00]" />
              <strong className="num-display text-sm text-white">{community.membersCount}</strong>
              {community.membersCount === 1 ? "miembro" : "miembros"}
            </span>
            {community.zone && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#D4FF00]" />
                {community.zone}
              </span>
            )}
            {isRRPP ? (
              <span className="inline-flex items-center gap-1.5 text-[#D4FF00]">
                <Crown className="h-4 w-4" /> Administrás esta comunidad
              </span>
            ) : isMember ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Sos miembro
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">
              Acerca de
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              {community.description || "Esta comunidad todavía no agregó una descripción."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            {!isRRPP && (
              <Button
                variant={isMember ? "outline" : "primary"}
                size="sm"
                onClick={onChangeMembership}
                disabled={isChangingMembership || isAuthLoading}
                className="min-h-11 flex-1 text-xs font-black uppercase tracking-wider"
              >
                {isChangingMembership ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isMember ? (
                  <UserMinus className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {!isLoggedIn
                  ? "Iniciá sesión para unirte"
                  : isMember
                    ? "Salir de la comunidad"
                    : "Unirme a la comunidad"}
              </Button>
            )}

            {isMember && (
              <Button
                variant="outline"
                size="sm"
                disabled={isMuting}
                onClick={onToggleMuted}
                className="h-11 min-w-11 px-3"
                title={community.muted ? "Activar avisos" : "Silenciar avisos"}
              >
                {community.muted ? (
                  <BellOff className="h-4 w-4 text-neutral-400" />
                ) : (
                  <Bell className="h-4 w-4 text-[#D4FF00]" />
                )}
              </Button>
            )}

            {community.contact && canContact && (
              <Button
                variant="outline"
                size="sm"
                disabled={isContacting}
                onClick={onContact}
                className="h-11 min-w-11 gap-1.5 px-3 text-xs"
                title="Contactar al RRPP"
              >
                <MessageSquare className="h-4 w-4" />
                <span>RRPP</span>
              </Button>
            )}

            {isRRPP && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModeration((current) => !current)}
                aria-expanded={showModeration}
                className="h-11 gap-1.5 border-[#D4FF00]/30 px-3 text-xs text-[#D4FF00]"
              >
                <ShieldAlert className="h-4 w-4" /> Moderación
              </Button>
            )}
          </div>

          {(hasMembershipError || hasMuteError) && (
            <p role="alert" className="text-xs font-bold text-red-400">
              No pudimos actualizar la comunidad. Intentá nuevamente.
            </p>
          )}

          {isRRPP && showModeration && (
            <div className="border-t border-white/[0.06] pt-4">
              <CommunityModeration communityId={community.id} />
            </div>
          )}
        </section>

        <section aria-labelledby="community-events-heading" className="border-t border-white/[0.06] pt-7">
          <h2 id="community-events-heading" className="sr-only">
            Eventos de la comunidad
          </h2>
          {isGuest ? (
            <CommunityLockedContent
              sectionName="los Eventos Promocionados"
              membersCount={community.membersCount}
              onJoin={onChangeMembership}
              isJoining={isChangingMembership}
              onViewMembers={() => undefined}
              isLoggedIn={isLoggedIn}
              showMembersActions={false}
            />
          ) : (
            <PromotedEvents
              communityId={community.id}
              isRRPP={isRRPP}
              isMember={isMember}
            />
          )}
        </section>

        <section aria-labelledby="community-members-heading" className="border-t border-white/[0.06] pt-7">
          <h2 id="community-members-heading" className="sr-only">
            Miembros de la comunidad
          </h2>
          <MembersList
            communityId={community.id}
            community={community}
            isRRPP={isRRPP}
            isGuest={isGuest}
          />
        </section>
      </div>
    </Modal>
  );
}

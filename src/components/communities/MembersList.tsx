"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Crown,
  Loader2,
  Search,
  UserX,
  Users,
  ShieldAlert,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useCommunityMembers } from "@/hooks/useCommunities";
import type { Community, CommunityMember } from "@/types/communities";
import { cn } from "@/lib/utils";

interface MembersListProps {
  communityId: string;
  community?: Community | null;
  isRRPP: boolean;
  isGuest: boolean;
}

export function MembersList({
  communityId,
  community,
  isRRPP,
  isGuest,
}: MembersListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    members,
    totalCount,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRemoving,
    error,
    loadMembers,
    removeMember,
  } = useCommunityMembers(communityId, community);

  const [memberToKick, setMemberToKick] = useState<CommunityMember | null>(null);
  const currentCommunityUrl = `${pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const confirmKick = async () => {
    if (!memberToKick) return;
    await removeMember(memberToKick.id);
    setMemberToKick(null);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Directory Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="tech-label text-xs text-neutral-300">
              Directorio de Miembros
            </h2>
            <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00]/10 px-2.5 py-0.5">
              <span className="num-display text-xs text-white">{totalCount}</span>
              <span className="tech-label text-[9px] text-[#D4FF00]">{totalCount === 1 ? "miembro" : "miembros"}</span>
            </span>
          </div>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-neutral-500">
            {isGuest
              ? "Prueba social: personas reales que forman parte de esta comunidad"
              : "Comunidad activa de clubbers, DJs y ravers"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar miembros..."
            className="h-10 w-full rounded-full border-0 bg-[#111114] pl-9 pr-4 text-xs font-medium text-white placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-[#D4FF00]/40 shadow-sm"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Directory Grid */}
      {isLoading && members.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#D4FF00]" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-3xl border-0 bg-[#111114] p-8 text-center shadow-xl">
          <Users className="mx-auto mb-2 h-7 w-7 text-neutral-600" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {searchQuery
              ? `No encontramos miembros para "${searchQuery}"`
              : "No hay miembros en esta comunidad"}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const memberRoleUpper = member.role?.toUpperCase();
            const isMemberRRPP =
              memberRoleUpper === "RRPP" ||
              memberRoleUpper === "ADMIN" ||
              (community?.prOwnerId && community.prOwnerId === member.id) ||
              (community?.contact?.id && community.contact.id === member.id);

            const isSelf = user && member.id === user.id;
            const canKick = isRRPP && !isMemberRRPP && !isSelf;

            return (
              <div
                key={member.id}
                className={cn(
                  "relative flex items-center justify-between gap-3 rounded-2xl border-0 p-3.5 transition-all shadow-sm",
                  isMemberRRPP
                    ? "bg-[#151922] shadow-[0_0_15px_rgba(212,255,0,0.06)]"
                    : "bg-[#111114] hover:bg-[#16171D]",
                )}
              >
                {/* Member Identity */}
                <Link
                  href={`/profile/${encodeURIComponent(member.username)}?from=communities&returnTo=${encodeURIComponent(currentCommunityUrl)}`}
                  aria-label={`Ver perfil de ${member.name}`}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#D4FF00]/70"
                >
                  <Avatar
                    src={member.avatarUrl}
                    fallback={member.name}
                    size="md"
                    className={cn(
                      "shrink-0",
                      isMemberRRPP && "ring-2 ring-[#D4FF00]/50",
                    )}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-black uppercase text-white">
                        {member.name}
                      </p>
                      {member.isKycVerified && (
                        <span title="Usuario Verificado">
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#D4FF00]" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="truncate text-[10px] text-neutral-500">
                        @{member.username}
                      </p>

                      {isMemberRRPP && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#D4FF00]/20 px-1.5 py-0.2 text-[8px] font-black uppercase text-[#D4FF00]">
                          <Crown className="h-2 w-2" /> RRPP
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* RRPP Management Action (Kick Member) */}
                {canKick && (
                  <button
                    type="button"
                    disabled={isRemoving === member.id}
                    onClick={() => setMemberToKick(member)}
                    title="Expulsar de la comunidad"
                    aria-label={`Expulsar a ${member.name}`}
                    className="rounded-xl border-0 bg-white/5 p-2 text-neutral-400 shadow-sm transition-colors hover:bg-red-500/15 hover:text-red-400"
                  >
                    {isRemoving === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal to Kick Member */}
      {memberToKick && (
        <Modal
          isOpen={Boolean(memberToKick)}
          onClose={() => setMemberToKick(null)}
          title="Expulsar miembro"
          footer={
            <div className="flex justify-end gap-2 w-full pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToKick(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white border-none"
                onClick={confirmKick}
              >
                Confirmar Expulsión
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-black uppercase text-white">
              ¿Expulsar a {memberToKick.name}?
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              El usuario ya no tendrá acceso al canal de difusión ni al muro de la
              comunidad. Podrá volver a solicitar unirse si la comunidad es pública.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}

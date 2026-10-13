"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { compressImageToJpeg } from "@/lib/compressImage";
import {
  createCommunityAnnouncement,
  getCommunities,
  getCommunity,
  getCommunityAnnouncements,
  joinCommunity,
  leaveCommunity,
  uploadCommunityAnnouncementImage,
  setCommunityMuted,
  setAnnouncementPinned,
  markCommunityRead,
  getCommunityChatSettings,
  updateCommunityChatMode,
  getCommunityMessages,
  sendCommunityMessage,
  toggleMessageReaction,
  getCommunityMembers,
  removeCommunityMember,
  getCommunityPromotedEvents,
  updateCommunityPromotedEvents,
  getPlatformEventsCatalog,
} from "@/services/communities";
import type {
  Community,
  CommunityAnnouncementsResponse,
  CommunityFilters,
  CommunitiesResponse,
  CreateCommunityAnnouncementInput,
  PaginationMeta,
  CommunityChatMode,
  CommunityChatMessage,
  CommunityChatReaction,
  CommunityMember,
  CommunityRoleState,
} from "@/types/communities";
import type { Post } from "@/types/posts";
import type { Event } from "@/types/events";
import type { AuthUser } from "@/types/auth";

interface DirectoryRequest {
  filters: CommunityFilters;
  append: boolean;
  sequence: number;
}

const EMPTY_META: PaginationMeta = {
  total: 0,
  limit: 12,
  offset: 0,
  hasMore: false,
};

export function useCommunityDirectory() {
  const sequence = useRef(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);

  const mutation = useMutation<CommunitiesResponse, DirectoryRequest>(
    ({ filters }) => getCommunities(filters),
    {
      onSuccess: (response, variables) => {
        if (variables.sequence !== sequence.current) return;
        setCommunities((current) =>
          variables.append ? [...current, ...response.data] : response.data,
        );
        setMeta(response.meta);
      },
    },
  );

  const mutateDirectory = mutation.mutate;

  const load = useCallback(
    (filters: CommunityFilters, append = false) => {
      if (!append) { sequence.current++; setCommunities([]); setMeta(EMPTY_META); }
      return mutateDirectory({ filters, append, sequence: sequence.current });
    },
    [mutateDirectory],
  );

  return {
    communities,
    meta,
    load,
    isLoading: mutation.isLoading,
    error: mutation.error,
  };
}

export function useCommunityDetail(identifier: string) {
  const [community, setCommunity] = useState<Community | null>(null);

  const detailMutation = useMutation<Community, void>(
    () => getCommunity(identifier),
    { onSuccess: setCommunity },
  );

  const membershipMutation = useMutation<
    { isMember: boolean; membersCount: number },
    "join" | "leave"
  >(
    (action) =>
      action === "join"
        ? joinCommunity(identifier)
        : leaveCommunity(identifier),
    {
      onSuccess: (membership) => {
        setCommunity((current) =>
          current
            ? {
                ...current,
                isMember: membership.isMember,
                membersCount: membership.membersCount,
              }
            : current,
        );
        // Membership preferences and the read marker belong to the persisted
        // membership; reload them after leaving or joining again.
        void detailMutation.mutate().catch(() => undefined);
      },
    },
  );

  const muteMutation = useMutation((muted: boolean) => setCommunityMuted(identifier, muted), {
    onSuccess: (_, muted) => setCommunity((current) => current ? { ...current, muted } : current),
  });
  const readMutation = useMutation((postId: string) => markCommunityRead(identifier, postId));

  return {
    community,
    refresh: detailMutation.mutate,
    membership: membershipMutation.mutate,
    isLoading: detailMutation.isLoading,
    isChangingMembership: membershipMutation.isLoading,
    error: detailMutation.error,
    membershipError: membershipMutation.error,
    setMuted: muteMutation.mutate,
    isMuting: muteMutation.isLoading,
    muteError: muteMutation.error,
    markRead: readMutation.mutate,
    readError: readMutation.error,
  };
}

interface AnnouncementPageRequest {
  offset: number;
  append: boolean;
}

interface CreateAnnouncementRequest {
  input: CreateCommunityAnnouncementInput;
  image?: File;
}

export function useCommunityAnnouncements(identifier: string) {
  const [readThroughPostId, setReadThroughPostId] = useState<string>();
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ ...EMPTY_META, limit: 10 });

  const listMutation = useMutation<
    CommunityAnnouncementsResponse,
    AnnouncementPageRequest
  >(
    ({ offset }) => getCommunityAnnouncements(identifier, 10, offset),
    {
      onSuccess: (response, variables) => {
        setAnnouncements((current) =>
          variables.append ? [...current, ...response.data] : response.data,
        );
        setMeta(response.meta);
        setReadThroughPostId(response.readThroughPostId);
      },
    },
  );

  const createMutation = useMutation<Post, CreateAnnouncementRequest>(
    async ({ input, image }) => {
      const headerImageUrl = image
        ? await uploadCommunityAnnouncementImage(
            await compressImageToJpeg(image),
          )
        : input.headerImageUrl;
      return createCommunityAnnouncement(identifier, {
        ...input,
        headerImageUrl,
      });
    },
    {
      onSuccess: () => {
        void listMutation.mutate({ offset: 0, append: false }).catch(() => undefined);
      },
    },
  );

  const pinMutation = useMutation(async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
    await setAnnouncementPinned(identifier, postId, pinned);
    // A pin changes server pagination order: restart the page instead of sorting locally.
    return getCommunityAnnouncements(identifier, 10, 0);
  }, { onSuccess: (response) => { setAnnouncements(response.data); setMeta(response.meta); setReadThroughPostId(response.readThroughPostId); } });

  return {
    announcements,
    meta,
    load: listMutation.mutate,
    publish: createMutation.mutate,
    isLoading: listMutation.isLoading,
    isPublishing: createMutation.isLoading,
    error: listMutation.error,
    publishError: createMutation.error,
    pin: pinMutation.mutate,
    isPinning: pinMutation.isLoading,
    pinError: pinMutation.error,
    readThroughPostId,
  };
}

// ==========================================
// ROLE HOOK
// ==========================================

export function useCommunityRole(
  community: Community | null | undefined,
  user: AuthUser | null | undefined,
): CommunityRoleState {
  if (!user) {
    return {
      role: "GUEST",
      isRRPP: false,
      isMember: false,
      isGuest: true,
    };
  }

  const userRole = user.role?.toUpperCase();
  const isRRPP = Boolean(
    community?.canPublish ||
      userRole === "RRPP" ||
      userRole === "ADMIN" ||
      (community?.prOwnerId && community.prOwnerId === user.id) ||
      (community?.contact?.id && community.contact.id === user.id),
  );

  if (isRRPP) {
    return {
      role: "RRPP",
      isRRPP: true,
      isMember: true, // RRPP has member privileges
      isGuest: false,
    };
  }

  const isMember = Boolean(community?.isMember);
  if (isMember) {
    return {
      role: "MEMBER",
      isRRPP: false,
      isMember: true,
      isGuest: false,
    };
  }

  return {
    role: "GUEST",
    isRRPP: false,
    isMember: false,
    isGuest: true,
  };
}

// ==========================================
// CHAT HOOK (CANAL DE DIFUSIÓN)
// ==========================================

export function useCommunityChat(
  communityId: string,
  user: AuthUser | null | undefined,
  isRRPP: boolean,
) {
  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [chatMode, setChatModeState] = useState<CommunityChatMode>("broadcast_only");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChat = useCallback(async () => {
    if (!communityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [settings, msgList] = await Promise.all([
        getCommunityChatSettings(communityId),
        getCommunityMessages(communityId),
      ]);
      setChatModeState(settings.mode || "broadcast_only");
      setMessages(msgList);
    } catch {
      setError("No pudimos cargar los mensajes del canal.");
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  const toggleChatMode = useCallback(async (newMode: CommunityChatMode) => {
    if (!isRRPP) return;
    setIsUpdatingMode(true);
    try {
      const res = await updateCommunityChatMode(communityId, newMode);
      setChatModeState(res.mode);
    } catch {
      setError("No pudimos cambiar el modo del canal.");
    } finally {
      setIsUpdatingMode(false);
    }
  }, [communityId, isRRPP]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !user) return;
      if (!isRRPP && chatMode === "broadcast_only") {
        setError("Solo el administrador puede enviar mensajes.");
        return;
      }

      setIsSending(true);
      setError(null);
      try {
        const senderRole = isRRPP
          ? "RRPP"
          : user.role === "ADMIN"
            ? "ADMIN"
            : "MEMBER";

        const newMsg = await sendCommunityMessage(communityId, trimmed, {
          id: user.id,
          name: user.name || "Usuario",
          username: user.username || "usuario",
          avatarUrl: user.avatarUrl,
          role: senderRole,
        });

        setMessages((current) => [...current, newMsg]);
        return newMsg;
      } catch {
        setError("No pudimos enviar tu mensaje. Intenta nuevamente.");
      } finally {
        setIsSending(false);
      }
    },
    [communityId, user, isRRPP, chatMode],
  );

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;

      // Optimistic update
      setMessages((current) =>
        current.map((msg) => {
          if (msg.id !== messageId) return msg;
          const currentReactions = msg.reactions || [];
          const existingReaction = currentReactions.find((r) => r.emoji === emoji);

          let updatedReactions: CommunityChatReaction[];
          if (existingReaction) {
            const hasReacted = existingReaction.users.includes(user.id);
            if (hasReacted) {
              const nextUsers = existingReaction.users.filter((id) => id !== user.id);
              if (nextUsers.length === 0 && existingReaction.count <= 1) {
                updatedReactions = currentReactions.filter((r) => r.emoji !== emoji);
              } else {
                updatedReactions = currentReactions.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: Math.max(0, r.count - 1), users: nextUsers }
                    : r,
                );
              }
            } else {
              updatedReactions = currentReactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, user.id] }
                  : r,
              );
            }
          } else {
            updatedReactions = [
              ...currentReactions,
              { emoji, count: 1, users: [user.id] },
            ];
          }

          return { ...msg, reactions: updatedReactions };
        }),
      );

      try {
        await toggleMessageReaction(communityId, messageId, emoji, user.id);
      } catch {
        // Fallback / ignore
      }
    },
    [communityId, user],
  );

  return {
    messages,
    chatMode,
    isLoading,
    isSending,
    isUpdatingMode,
    error,
    loadChat,
    toggleChatMode,
    sendMessage,
    reactToMessage,
  };
}

// ==========================================
// PROMOTED EVENTS HOOK
// ==========================================

export function useCommunityPromotedEvents(communityId: string) {
  const [promotedEvents, setPromotedEvents] = useState<Event[]>([]);
  const [catalog, setCatalog] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!communityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [promoted, allEvents] = await Promise.all([
        getCommunityPromotedEvents(communityId),
        getPlatformEventsCatalog(),
      ]);
      setPromotedEvents(promoted);
      setCatalog(allEvents);
    } catch {
      setError("No pudimos cargar los eventos promocionados.");
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  const updatePromoted = useCallback(
    async (eventIds: string[]) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await updateCommunityPromotedEvents(communityId, eventIds);
        setPromotedEvents(updated);
        return updated;
      } catch {
        setError("No pudimos actualizar los eventos de la comunidad.");
      } finally {
        setIsSaving(false);
      }
    },
    [communityId],
  );

  return {
    promotedEvents,
    catalog,
    isLoading,
    isSaving,
    error,
    loadEvents,
    updatePromoted,
  };
}

// ==========================================
// MEMBERS HOOK
// ==========================================

export function useCommunityMembers(
  communityId: string,
  community?: Community | null,
) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!communityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await getCommunityMembers(communityId, community);
      setMembers(list);
    } catch {
      setError("No pudimos cargar el directorio de miembros.");
    } finally {
      setIsLoading(false);
    }
  }, [communityId, community]);

  const removeMember = useCallback(
    async (memberId: string) => {
      setIsRemoving(memberId);
      setError(null);
      try {
        await removeCommunityMember(communityId, memberId);
        setMembers((current) => current.filter((m) => m.id !== memberId));
      } catch {
        setError("No pudimos expulsar al miembro. Intenta nuevamente.");
      } finally {
        setIsRemoving(null);
      }
    },
    [communityId],
  );

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(q) ||
      member.username.toLowerCase().includes(q)
    );
  });

  return {
    members: filteredMembers,
    totalCount: members.length,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRemoving,
    error,
    loadMembers,
    removeMember,
  };
}

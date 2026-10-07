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
} from "@/services/communities";
import type {
  Community,
  CommunityAnnouncementsResponse,
  CommunityFilters,
  CommunitiesResponse,
  CreateCommunityAnnouncementInput,
  PaginationMeta,
} from "@/types/communities";
import type { Post } from "@/types/posts";

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

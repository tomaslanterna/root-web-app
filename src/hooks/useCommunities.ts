"use client";

import { useCallback, useState } from "react";
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
}

const EMPTY_META: PaginationMeta = {
  total: 0,
  limit: 12,
  offset: 0,
  hasMore: false,
};

export function useCommunityDirectory() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);

  const mutation = useMutation<CommunitiesResponse, DirectoryRequest>(
    ({ filters }) => getCommunities(filters),
    {
      onSuccess: (response, variables) => {
        setCommunities((current) =>
          variables.append ? [...current, ...response.data] : response.data,
        );
        setMeta(response.meta);
      },
    },
  );

  const mutateDirectory = mutation.mutate;

  const load = useCallback(
    (filters: CommunityFilters, append = false) =>
      mutateDirectory({ filters, append }),
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
      },
    },
  );

  return {
    community,
    refresh: detailMutation.mutate,
    membership: membershipMutation.mutate,
    isLoading: detailMutation.isLoading,
    isChangingMembership: membershipMutation.isLoading,
    error: detailMutation.error,
    membershipError: membershipMutation.error,
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
      onSuccess: (post) => {
        setAnnouncements((current) => [post, ...current]);
        setMeta((current) => ({ ...current, total: current.total + 1 }));
      },
    },
  );

  return {
    announcements,
    meta,
    load: listMutation.mutate,
    publish: createMutation.mutate,
    isLoading: listMutation.isLoading,
    isPublishing: createMutation.isLoading,
    error: listMutation.error,
    publishError: createMutation.error,
  };
}

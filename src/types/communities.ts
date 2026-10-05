import type { Post } from "@/types/posts";

export interface Community {
  id: string;
  name: string;
  slug: string;
  category: string;
  zone: string;
  prOwnerId?: string;
  countryId: string;
  coverImageUrl: string;
  description: string;
  createdAt: string;
  membersCount: number;
  isMember: boolean;
  canPublish: boolean;
  isActive: boolean;
}

export interface CommunityFilters {
  query?: string;
  category?: string;
  country?: string;
  department?: string;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CommunitiesResponse {
  data: Community[];
  meta: PaginationMeta;
}

export interface CommunityMembershipResponse {
  isMember: boolean;
  membersCount: number;
}

export interface CommunityAnnouncementsResponse {
  data: Post[];
  meta: PaginationMeta;
}

export interface CreateCommunityAnnouncementInput {
  title?: string;
  content: string;
  longContent?: string;
  headerImageUrl?: string;
  eventId?: string;
}

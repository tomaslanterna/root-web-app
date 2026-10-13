import { api } from "@/lib/api";
import type {
  CommunitiesResponse,
  Community,
  CommunityAnnouncementsResponse,
  CommunityFilters,
  CommunityMembershipResponse,
  CreateCommunityAnnouncementInput,
  CommunityReportInput,
  CommunityReportsResponse,
  CommunityChatMode,
  CommunityChatMessage,
  CommunityChatReaction,
  CommunityChatSettings,
  CommunityMember,
} from "@/types/communities";
import type { Post } from "@/types/posts";
import type { Event } from "@/types/events";

export async function getCommunities(
  filters: CommunityFilters,
): Promise<CommunitiesResponse> {
  const { data } = await api.get<CommunitiesResponse>("/v1/communities", {
    params: filters,
  });
  return data;
}

export async function getCommunity(identifier: string): Promise<Community> {
  const { data } = await api.get<Community>(
    `/v1/communities/${encodeURIComponent(identifier)}`,
  );
  return data;
}

export async function joinCommunity(
  identifier: string,
): Promise<CommunityMembershipResponse> {
  const { data } = await api.post<CommunityMembershipResponse>(
    `/v1/communities/${encodeURIComponent(identifier)}/join`,
  );
  return data;
}

export async function leaveCommunity(
  identifier: string,
): Promise<CommunityMembershipResponse> {
  const { data } = await api.delete<CommunityMembershipResponse>(
    `/v1/communities/${encodeURIComponent(identifier)}/membership`,
  );
  return data;
}

export async function getMyCommunities(): Promise<Community[]> {
  const { data } = await api.get<{ data: Community[] }>(
    "/v1/users/me/communities",
  );
  return data.data;
}

export async function getCommunityAnnouncements(
  identifier: string,
  limit = 10,
  offset = 0,
): Promise<CommunityAnnouncementsResponse> {
  const { data } = await api.get<CommunityAnnouncementsResponse>(
    `/v1/communities/${encodeURIComponent(identifier)}/announcements`,
    { params: { limit, offset } },
  );
  return data;
}

export async function createCommunityAnnouncement(
  identifier: string,
  input: CreateCommunityAnnouncementInput,
): Promise<Post> {
  const { data } = await api.post<Post>(
    `/v1/communities/${encodeURIComponent(identifier)}/announcements`,
    input,
  );
  return data;
}

export async function uploadCommunityAnnouncementImage(
  image: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", image);
  const { data } = await api.post<{ key: string }>("/v1/posts/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.key;
}

const communityPath = (id: string) => `/v1/communities/${encodeURIComponent(id)}`;
export async function setCommunityMuted(id: string, muted: boolean): Promise<void> {
  await api.put(`${communityPath(id)}/membership/preferences`, { muted });
}
export async function markCommunityRead(id: string, postId: string): Promise<void> {
  await api.post(`${communityPath(id)}/read`, { postId });
}
export async function setAnnouncementPinned(id: string, postId: string, pinned: boolean): Promise<void> {
  await api.put(`${communityPath(id)}/announcements/${encodeURIComponent(postId)}/pin`, { pinned });
}
export async function reportCommunityContent(id: string, input: CommunityReportInput): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>(`${communityPath(id)}/reports`, input);
  return data;
}
export async function getCommunityReports(id: string, offset = 0): Promise<CommunityReportsResponse> {
  const { data } = await api.get<CommunityReportsResponse>(`${communityPath(id)}/reports`, { params: { limit: 10, offset } });
  return data;
}
export async function reviewCommunityReport(id: string, reportId: string, status: "reviewed" | "dismissed"): Promise<void> {
  await api.patch(`${communityPath(id)}/reports/${encodeURIComponent(reportId)}`, { status });
}

// ==========================================
// CANAL DE DIFUSIÓN (CHAT)
// ==========================================

export async function getCommunityChatSettings(
  communityId: string,
): Promise<CommunityChatSettings> {
  const { data } = await api.get<CommunityChatSettings>(
    `${communityPath(communityId)}/chat-settings`,
  );
  return data;
}

export async function updateCommunityChatMode(
  communityId: string,
  mode: CommunityChatMode,
): Promise<CommunityChatSettings> {
  const { data } = await api.put<CommunityChatSettings>(
    `${communityPath(communityId)}/chat-settings`,
    { mode },
  );
  return data;
}

export async function getCommunityMessages(
  communityId: string,
  limit = 50,
  before?: string,
): Promise<CommunityChatMessage[]> {
  const params: Record<string, unknown> = { limit };
  if (before) params.before = before;
  const { data } = await api.get<
    CommunityChatMessage[] | { data: CommunityChatMessage[] }
  >(`${communityPath(communityId)}/messages`, { params });
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function sendCommunityMessage(
  communityId: string,
  content: string,
  _sender?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    role: "RRPP" | "ADMIN" | "MEMBER";
  },
): Promise<CommunityChatMessage> {
  const { data } = await api.post<CommunityChatMessage>(
    `${communityPath(communityId)}/messages`,
    { content },
  );
  return data;
}

export async function toggleMessageReaction(
  communityId: string,
  messageId: string,
  emoji: string,
  _userId?: string,
): Promise<{ messageId: string; reactions: CommunityChatReaction[] }> {
  const { data } = await api.post<{ messageId: string; reactions: CommunityChatReaction[] }>(
    `${communityPath(communityId)}/messages/${encodeURIComponent(messageId)}/reactions`,
    { emoji },
  );
  return data;
}

// ==========================================
// MIEMBROS DE LA COMUNIDAD (DIRECTORIO)
// ==========================================

export async function getCommunityMembers(
  communityId: string,
  _currentCommunity?: Community | null,
  limit = 50,
  offset = 0,
  query?: string,
): Promise<CommunityMember[]> {
  const params: Record<string, unknown> = { limit, offset };
  if (query) params.query = query;
  const { data } = await api.get<
    CommunityMember[] | { data: CommunityMember[]; meta?: unknown }
  >(`${communityPath(communityId)}/members`, { params });
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function removeCommunityMember(
  communityId: string,
  memberId: string,
): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(
    `${communityPath(communityId)}/members/${encodeURIComponent(memberId)}`,
  );
  return data ?? { success: true };
}

// ==========================================
// EVENTOS PROMOCIONADOS
// ==========================================

export async function getCommunityPromotedEvents(
  communityId: string,
): Promise<Event[]> {
  const { data } = await api.get<{ data: Event[] } | Event[]>(
    `${communityPath(communityId)}/promoted-events`,
  );
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function updateCommunityPromotedEvents(
  communityId: string,
  eventIds: string[],
): Promise<Event[]> {
  const { data } = await api.put<{ data: Event[] } | Event[]>(
    `${communityPath(communityId)}/promoted-events`,
    { eventIds },
  );
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getPlatformEventsCatalog(): Promise<Event[]> {
  const { data } = await api.get<{ data: Event[] } | Event[]>("/v1/events");
  return Array.isArray(data) ? data : data?.data ?? [];
}

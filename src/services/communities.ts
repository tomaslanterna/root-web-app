import { api } from "@/lib/api";
import type {
  CommunitiesResponse,
  Community,
  CommunityAnnouncementsResponse,
  CommunityFilters,
  CommunityMembershipResponse,
  CreateCommunityAnnouncementInput,
} from "@/types/communities";
import type { Post } from "@/types/posts";

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

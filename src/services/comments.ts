import { api } from "@/lib/api";
import type { EventComment, PaginatedResponse } from "@/types/events";

export async function getComments(type: "events" | "posts", id: string, offset: number): Promise<PaginatedResponse<EventComment>> {
  const { data } = await api.get<PaginatedResponse<EventComment>>(`/v1/${type}/${encodeURIComponent(id)}/comments`, { params: { limit: 20, offset } });
  return data;
}
export async function createComment(type: "events" | "posts", id: string, content: string): Promise<EventComment> {
  const { data } = await api.post<EventComment>(`/v1/${type}/${encodeURIComponent(id)}/comments`, { content });
  return data;
}

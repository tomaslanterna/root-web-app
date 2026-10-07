import { api } from "@/lib/api";
import type { Event, PaginatedResponse } from "@/types/events";

export async function getUpcomingFeedEvents(): Promise<Event[]> {
  const { data } = await api.get<PaginatedResponse<Event>>("/v1/events");
  return data.data;
}

import { api } from "@/lib/api";
import type { EventSquad } from "@/types/match";
import type { UserVibeProfile } from "@/lib/mocks";
import type { Event, EventListResponse } from "@/types/events";

export interface PermanentCrew {
  id: string; name: string; inviteCode: string | null;
  memberCount: number; topSteps: number; status: string;
}

export type SwipeDirection = "like" | "pass" | "superlike";
export type SwipeResponse = { status: "queued" } | { status: "matched"; crew: EventSquad };

export const matchApi = {
  getEvents: async (): Promise<Event[]> => {
    const { data } = await api.get<EventListResponse>("/v1/events");
    return data.data ?? [];
  },
  getPermanentCrews: async (): Promise<PermanentCrew[]> => {
    const { data } = await api.get<{ data: PermanentCrew[] }>("/v1/crews");
    return data.data ?? [];
  },
  createPermanentCrew: async (): Promise<string> => {
    const { data } = await api.post<{ crew: { id: string } }>("/v1/crews", { name: "Nueva Crew", type: "permanent" });
    return data.crew.id;
  },
  getMatches: async (): Promise<EventSquad[]> => {
    const { data } = await api.get<{ data: EventSquad[] }>("/v1/crews/matches");
    return data.data ?? [];
  },
  swipe: async (eventId: string, direction: SwipeDirection, preferences: UserVibeProfile): Promise<SwipeResponse> => {
    const { data } = await api.post<SwipeResponse>(`/v1/events/${eventId}/swipes`, { direction, preferences });
    return data;
  },
  ensureSquadChat: async (squadId: string): Promise<string> => {
    const { data } = await api.post<{ chatId: string }>(`/v1/crews/${squadId}/chat`);
    return data.chatId;
  },
};

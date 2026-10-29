import { api } from "@/lib/api";
import type { EventSquad } from "@/types/match";
import type { UserVibeProfile } from "@/lib/mocks";
import type { Event, EventListResponse } from "@/types/events";

export interface PermanentCrewMember {
  userId: string;
  name?: string;
  username?: string;
  avatarUrl?: string | null;
  role?: string;
  steps?: number;
}

export interface PermanentCrew {
  id: string;
  name: string;
  inviteCode: string | null;
  memberCount: number;
  topSteps: number;
  totalSteps?: number;
  userRank?: number;
  status: string;
  chatRoomId?: string;
  location?: string;
  country?: string;
  members?: PermanentCrewMember[];
  leaderboardAllTime?: PermanentCrewMember[];
  events?: any[];
}

export const DEFAULT_ARGENTINA_CREWS: PermanentCrew[] = [];

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
  getAllPermanentCrews: async (): Promise<PermanentCrew[]> => {
    try {
      const { data } = await api.get<{ data: PermanentCrew[] }>("/v1/crews?scope=all");
      return data.data ?? [];
    } catch {
      return [];
    }
  },
  createPermanentCrew: async (payload?: {
    name?: string;
    memberIds?: string[];
    eventIds?: string[];
  }): Promise<PermanentCrew> => {
    const { data } = await api.post<{ crew: PermanentCrew }>("/v1/crews", {
      name: payload?.name || "Nueva Crew",
      type: "permanent",
      member_ids: payload?.memberIds || [],
      event_ids: payload?.eventIds || [],
    });
    return data.crew;
  },
  joinPermanentCrew: async (codeOrId: string): Promise<PermanentCrew> => {
    const { data } = await api.post<{ crew: PermanentCrew }>(
      `/v1/crews/join/${encodeURIComponent(codeOrId.trim())}`,
    );
    return data.crew;
  },
  addCrewMembers: async (crewId: string, memberIds: string[]): Promise<PermanentCrew> => {
    const { data } = await api.post<{ crew: PermanentCrew }>(`/v1/crews/${crewId}/members`, {
      member_ids: memberIds,
      memberIds,
    });
    return data.crew;
  },
  addCrewEvent: async (crewId: string, eventId: string): Promise<any[]> => {
    const { data } = await api.post<{ data: any[] }>(`/v1/crews/${crewId}/events`, {
      eventId,
    });
    return data.data ?? [];
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

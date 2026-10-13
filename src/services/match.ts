import { api } from "@/lib/api";
import type { EventSquad } from "@/types/match";
import type { UserVibeProfile } from "@/lib/mocks";
import type { Event, EventListResponse } from "@/types/events";

export interface PermanentCrewMember {
  userId: string;
  name?: string;
  username?: string;
  avatarUrl?: string | null;
}

export interface PermanentCrew {
  id: string;
  name: string;
  inviteCode: string | null;
  memberCount: number;
  topSteps: number;
  status: string;
  location?: string;
  country?: string;
  members?: PermanentCrewMember[];
}

export const DEFAULT_ARGENTINA_CREWS: PermanentCrew[] = [
  {
    id: "crew_ba_underground",
    name: "Underground BA Crew",
    inviteCode: "UBA841",
    memberCount: 28,
    topSteps: 64200,
    status: "active",
    location: "Buenos Aires, Argentina",
  },
  {
    id: "crew_afterlife_melodic",
    name: "Afterlife Melodic BA",
    inviteCode: "ALBA99",
    memberCount: 22,
    topSteps: 51800,
    status: "active",
    location: "CABA, Argentina",
  },
  {
    id: "crew_cba_ravers",
    name: "Córdoba Rave Collective",
    inviteCode: "CBA202",
    memberCount: 19,
    topSteps: 43100,
    status: "active",
    location: "Córdoba, Argentina",
  },
  {
    id: "crew_rosario_techno",
    name: "Rosario Groove Club",
    inviteCode: "ROS774",
    memberCount: 15,
    topSteps: 34900,
    status: "active",
    location: "Rosario, Argentina",
  },
  {
    id: "crew_mdz_sunset",
    name: "Mendoza Sunset Beats",
    inviteCode: "MDZ115",
    memberCount: 14,
    topSteps: 29800,
    status: "active",
    location: "Mendoza, Argentina",
  },
  {
    id: "crew_lp_electronic",
    name: "La Plata Night Squad",
    inviteCode: "LP902",
    memberCount: 12,
    topSteps: 26400,
    status: "active",
    location: "La Plata, Argentina",
  },
];

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
      const list = data.data ?? [];
      if (list.length > 0) return list;
    } catch {
      // Fallback if network or unauthenticated
    }
    return DEFAULT_ARGENTINA_CREWS;
  },
  createPermanentCrew: async (payload?: { name?: string; memberIds?: string[] }): Promise<string> => {
    const { data } = await api.post<{ crew: { id: string } }>("/v1/crews", {
      name: payload?.name || "Nueva Crew",
      type: "permanent",
      member_ids: payload?.memberIds || [],
    });
    return data.crew?.id ?? "";
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

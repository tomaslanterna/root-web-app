import { api } from "@/lib/api";

export interface DanceSession {
  id: string;
  eventId: string;
  eventTitle: string;
  stepsCount: number;
  startTime: string;
  endTime: string;
  isValidated: boolean;
}

export interface DanceCrew {
  id: string;
  name: string;
  memberCount: number;
  topSteps: number;
  userRank: number;
}

export interface CrewRankingEntry {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  steps: number;
}

export const danceApi = {
  getSessions: async (): Promise<DanceSession[]> => {
    const { data } = await api.get("/v1/dance/sessions");
    return data?.data || [];
  },
  getMyCrews: async (): Promise<DanceCrew[]> => {
    const { data } = await api.get("/v1/crews");
    return data?.data || [];
  },
  getCrewEventRanking: async (crewId: string, eventId: string): Promise<CrewRankingEntry[]> => {
    const { data } = await api.get(`/v1/crews/${encodeURIComponent(crewId)}/rankings`, { params: { eventId } });
    return data?.byEvent || [];
  },
};

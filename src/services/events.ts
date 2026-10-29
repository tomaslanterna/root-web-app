import { api } from "@/lib/api";

export interface EventLiveRankingEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  steps: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface EventLiveRankingResponse {
  eventId: string;
  totalDancers: number;
  activeDancers: number;
  totalEventSteps: number;
  data: EventLiveRankingEntry[];
}

export const eventsApi = {
  getEvents: async (params?: Record<string, any>): Promise<any> => {
    const { data } = await api.get("/v1/events", { params });
    return data;
  },

  getEventById: async (id: string): Promise<any> => {
    const { data } = await api.get(`/v1/events/${id}`);
    return data;
  },

  getFeaturedEvents: async (): Promise<any> => {
    const { data } = await api.get("/v1/events/featured");
    return data;
  },

  rsvpEvent: async (eventId: string, status: string): Promise<any> => {
    const { data } = await api.post(`/v1/events/${eventId}/rsvp`, { status });
    return data;
  },

  getFollowedAttendees: async (eventId: string, params?: Record<string, any>): Promise<any> => {
    const { data } = await api.get(`/v1/events/${eventId}/attendees/followed`, { params });
    return data;
  },

  getEventComments: async (eventId: string, params?: Record<string, any>): Promise<any> => {
    const { data } = await api.get(`/v1/events/${eventId}/comments`, { params });
    return data;
  },

  postEventComment: async (eventId: string, content: string): Promise<any> => {
    const { data } = await api.post(`/v1/events/${eventId}/comments`, { content });
    return data;
  },

  getEventLiveRanking: async (eventId: string): Promise<EventLiveRankingResponse> => {
    try {
      const { data } = await api.get<EventLiveRankingResponse>(`/v1/events/${eventId}/live-ranking`);
      return {
        eventId: data?.eventId || eventId,
        totalDancers: data?.totalDancers ?? (data?.data?.length || 0),
        activeDancers: data?.activeDancers ?? 0,
        totalEventSteps: data?.totalEventSteps ?? 0,
        data: data?.data || [],
      };
    } catch {
      return {
        eventId,
        totalDancers: 0,
        activeDancers: 0,
        totalEventSteps: 0,
        data: [],
      };
    }
  },
};

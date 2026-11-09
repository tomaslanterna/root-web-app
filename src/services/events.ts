import { api } from "@/lib/api";
import type { Event, EventAttendee, EventComment, EventListResponse, EventRSVPStatus, PaginatedResponse, RSVPResponse } from "@/types/events";

type EventQuery = Record<string, string | number | boolean | undefined>;

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
  getEvents: async (params?: EventQuery): Promise<EventListResponse> => {
    const { data } = await api.get<EventListResponse>("/v1/events", { params });
    return data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const { data } = await api.get<Event>(`/v1/events/${id}`);
    return data;
  },

  getFeaturedEvents: async (): Promise<{ data: Event[] }> => {
    const { data } = await api.get<{ data: Event[] }>("/v1/events/featured");
    return data;
  },

  rsvpEvent: async (eventId: string, status: EventRSVPStatus): Promise<RSVPResponse> => {
    const { data } = await api.post<RSVPResponse>(`/v1/events/${eventId}/rsvp`, { status });
    return data;
  },

  clearRsvp: async (eventId: string): Promise<RSVPResponse> => {
    const { data } = await api.delete<RSVPResponse>(`/v1/events/${eventId}/rsvp`);
    return data;
  },

  getFollowedAttendees: async (eventId: string, params?: EventQuery): Promise<PaginatedResponse<EventAttendee>> => {
    const { data } = await api.get<PaginatedResponse<EventAttendee>>(`/v1/events/${eventId}/attendees/followed`, { params });
    return data;
  },

  getEventComments: async (eventId: string, params?: EventQuery): Promise<PaginatedResponse<EventComment>> => {
    const { data } = await api.get<PaginatedResponse<EventComment>>(`/v1/events/${eventId}/comments`, { params });
    return data;
  },

  postEventComment: async (eventId: string, content: string): Promise<EventComment> => {
    const { data } = await api.post<EventComment>(`/v1/events/${eventId}/comments`, { content });
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

import { api } from "@/lib/api";
import type {
  Event,
  EventAttendee,
  EventComment,
  EventListResponse,
  EventRSVPStatus,
  PaginatedResponse,
  RSVPResponse,
} from "@/types/events";

export type EventQueryParams = Record<string, string | number | boolean | undefined>;

export const eventsApi = {
  getEvents: async (params?: EventQueryParams): Promise<EventListResponse> => {
    const { data } = await api.get<EventListResponse>("/v1/events", { params });
    return data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const { data } = await api.get<Event>(`/v1/events/${id}`);
    return data;
  },

  getFeaturedEvents: async (): Promise<Event[]> => {
    const { data } = await api.get<{ data: Event[] }>("/v1/events/featured");
    return data.data;
  },

  rsvpEvent: async (eventId: string, status: EventRSVPStatus): Promise<RSVPResponse> => {
    const { data } = await api.post(`/v1/events/${eventId}/rsvp`, { status });
    return data;
  },

  clearEventRsvp: async (eventId: string): Promise<RSVPResponse> => {
    const { data } = await api.delete(`/v1/events/${eventId}/rsvp`);
    return data;
  },

  getFollowedAttendees: async (
    eventId: string,
    params?: EventQueryParams,
  ): Promise<PaginatedResponse<EventAttendee>> => {
    const { data } = await api.get<PaginatedResponse<EventAttendee>>(
      `/v1/events/${eventId}/attendees/followed`,
      { params },
    );
    return data;
  },

  getEventComments: async (
    eventId: string,
    params?: EventQueryParams,
  ): Promise<PaginatedResponse<EventComment>> => {
    const { data } = await api.get<PaginatedResponse<EventComment>>(
      `/v1/events/${eventId}/comments`,
      { params },
    );
    return data;
  },

  postEventComment: async (eventId: string, content: string): Promise<EventComment> => {
    const { data } = await api.post<EventComment>(`/v1/events/${eventId}/comments`, { content });
    return data;
  }
};

import { api } from "@/lib/api";

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
  }
};

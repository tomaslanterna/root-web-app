import { api } from "@/lib/api";
import { aftersDemo, isAftersDemo } from "@/services/aftersDemo";
import { isEventUuid } from "@/lib/eventPath";
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

/** slug → id de los eventos ya pedidos: las subpáginas (/events/<slug>/afters) no repiten el pedido del detalle. */
const idsBySlug = new Map<string, string>();

function rememberEventSlug(event: Pick<Event, "id" | "slug"> | null | undefined) {
  if (event?.id && event.slug) idsBySlug.set(event.slug.toLowerCase(), event.id);
}

/** El id ya conocido para lo que viene en la URL (UUID o slug), sin ir a la red. */
export function knownEventId(idOrSlug: string): string | null {
  if (isEventUuid(idOrSlug)) return idOrSlug;
  return idsBySlug.get(idOrSlug.toLowerCase()) ?? null;
}

export const eventsApi = {
  /** El id del evento para lo que viene en la URL. Con un slug desconocido pide el detalle. */
  resolveEventId: async (idOrSlug: string): Promise<string> => {
    return knownEventId(idOrSlug) ?? (await eventsApi.getEventById(idOrSlug)).id;
  },

  getEvents: async (params?: EventQuery): Promise<EventListResponse> => {
    const { data } = await api.get<EventListResponse>("/v1/events", { params });
    return data;
  },

  /** `id` puede ser el UUID o el slug (/events/danzeria-presenta-greggio): el backend acepta los dos. */
  getEventById: async (id: string): Promise<Event> => {
    const { data } = await api.get<Event>(`/v1/events/${encodeURIComponent(id)}`);
    rememberEventSlug(data);
    // Modo de ejemplo de afters: se suma el resumen que el backend va a mandar en esta misma respuesta.
    if (isAftersDemo() && data && !data.afters) return { ...data, afters: await aftersDemo.embedForEvent(data) };
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

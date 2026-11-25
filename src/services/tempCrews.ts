import { api } from "@/lib/api";
import type {
  CreateTempCrewInput,
  TempCrewJoinRequest,
  TempCrewListResponse,
  TempCrewSummary,
  TempCrewEventRef,
} from "@/types/tempCrews";
import { tempCrewsDemo, isTempCrewsDemo } from "@/services/tempCrewsDemo";

/**
 * Crews temporales (contrato en `root-backend-service/TEMP_CREWS.md`).
 * Fuera de producción, `localStorage["root:temp-crews-demo"] = "1"` usa datos de ejemplo locales
 * para poder probar las pantallas antes de que exista el backend.
 */
export const tempCrewsApi = {
  /** Crews del evento que están admitiendo gente, con más lugares libres primero. */
  listForEvent: async (
    eventId: string,
    params: { limit?: number; offset?: number } = {},
    /** Solo para el modo de ejemplo: datos del evento para armar las tarjetas. */
    eventForDemo?: TempCrewEventRef | null,
  ): Promise<TempCrewListResponse> => {
    if (isTempCrewsDemo()) {
      return tempCrewsDemo.listForEvent(eventForDemo ?? { id: eventId, title: "", date: "", location: "" }, params);
    }
    const { data } = await api.get<TempCrewListResponse>(`/v1/events/${encodeURIComponent(eventId)}/temp-crews`, {
      params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
    });
    return data;
  },

  create: async (event: TempCrewEventRef, input: CreateTempCrewInput): Promise<TempCrewSummary> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.create(event, input);
    const { data } = await api.post<{ crew: TempCrewSummary }>(`/v1/events/${encodeURIComponent(event.id)}/temp-crews`, input);
    return data.crew;
  },

  /** Crews temporales del usuario: las que creó, en las que está y a las que pidió entrar. */
  getMine: async (): Promise<TempCrewSummary[]> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.getMine();
    const { data } = await api.get<{ data: TempCrewSummary[] }>("/v1/users/me/temp-crews");
    return data.data ?? [];
  },

  /** Crews que admiten gente en eventos a los que el usuario marcó Voy. */
  discover: async (params: { limit?: number } = {}): Promise<TempCrewSummary[]> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.discover();
    const { data } = await api.get<{ data: TempCrewSummary[] }>("/v1/temp-crews/discover", {
      params: { limit: params.limit ?? 20 },
    });
    return data.data ?? [];
  },

  requestToJoin: async ({ crewId, message }: { crewId: string; message?: string }): Promise<TempCrewJoinRequest> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.requestToJoin(crewId, message);
    const { data } = await api.post<{ request: TempCrewJoinRequest }>(
      `/v1/crews/${encodeURIComponent(crewId)}/join-requests`,
      { message: message?.trim() || undefined },
    );
    return data.request;
  },

  cancelMyRequest: async (crewId: string): Promise<void> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.cancelMyRequest(crewId);
    await api.delete(`/v1/crews/${encodeURIComponent(crewId)}/join-requests/me`);
  },

  /** Solo quien creó la crew. */
  listRequests: async (crewId: string, status: "pending" | "rejected" = "pending"): Promise<TempCrewJoinRequest[]> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.listRequests(crewId, status);
    const { data } = await api.get<{ data: TempCrewJoinRequest[] }>(
      `/v1/crews/${encodeURIComponent(crewId)}/join-requests`,
      { params: { status } },
    );
    return data.data ?? [];
  },

  respondToRequest: async ({
    crewId,
    requestId,
    decision,
  }: {
    crewId: string;
    requestId: string;
    decision: "accept" | "reject";
  }): Promise<TempCrewJoinRequest> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.respondToRequest(crewId, requestId, decision);
    const { data } = await api.post<{ request: TempCrewJoinRequest }>(
      `/v1/crews/${encodeURIComponent(crewId)}/join-requests/${encodeURIComponent(requestId)}/${decision}`,
    );
    return data.request;
  },

  /** Abre o cierra las solicitudes (solo quien la creó). */
  setAdmitting: async ({ crewId, isAdmitting }: { crewId: string; isAdmitting: boolean }): Promise<boolean> => {
    if (isTempCrewsDemo()) return tempCrewsDemo.setAdmitting(crewId, isAdmitting);
    const { data } = await api.patch<{ isAdmitting: boolean }>(`/v1/crews/${encodeURIComponent(crewId)}`, { isAdmitting });
    return data.isAdmitting;
  },
};

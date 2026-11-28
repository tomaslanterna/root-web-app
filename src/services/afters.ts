import { api } from "@/lib/api";
import type {
  AfterDetail,
  AfterInput,
  AfterJoinRequest,
  AfterListParams,
  AfterListResponse,
  AfterUpdateInput,
  UploadedImage,
} from "@/types/afters";
import { aftersDemo, isAftersDemo } from "@/services/aftersDemo";

/**
 * Afters (contrato en `root-backend-service/AFTERS.md`).
 * Fuera de producción, `localStorage["root:afters-demo"] = "1"` usa datos de ejemplo locales.
 * Los listados nunca traen la dirección; solo `get` la incluye cuando quien mira la puede ver.
 */
export const aftersApi = {
  listForEvent: async (eventId: string, params: { limit?: number; offset?: number } = {}): Promise<AfterListResponse> => {
    if (isAftersDemo()) return aftersDemo.listForEvent(eventId, params);
    const { data } = await api.get<AfterListResponse>(`/v1/events/${encodeURIComponent(eventId)}/afters`, {
      params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
    });
    return data;
  },

  /** Próximos o en curso, ordenados por hora. */
  list: async (params: AfterListParams = {}): Promise<AfterListResponse> => {
    if (isAftersDemo()) return aftersDemo.list(params);
    const { data } = await api.get<AfterListResponse>("/v1/afters", {
      params: {
        from: params.from ?? new Date().toISOString(),
        until: params.until,
        zone: params.zone?.trim() || undefined,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    });
    return data;
  },

  get: async (id: string): Promise<AfterDetail> => {
    if (isAftersDemo()) return aftersDemo.get(id);
    const { data } = await api.get<AfterDetail>(`/v1/afters/${encodeURIComponent(id)}`);
    return data;
  },

  /** La imagen ya tiene que venir comprimida en JPEG. */
  uploadCover: async (image: File): Promise<UploadedImage> => {
    if (isAftersDemo()) return aftersDemo.uploadImage(image);
    const form = new FormData();
    form.append("image", image);
    const { data } = await api.post<UploadedImage>("/v1/afters/cover", form, { timeout: 30000 });
    return data;
  },

  create: async (input: AfterInput): Promise<AfterDetail> => {
    if (isAftersDemo()) return aftersDemo.create(input);
    const { data } = await api.post<AfterDetail>("/v1/afters", input);
    return data;
  },

  update: async ({ id, input }: { id: string; input: AfterUpdateInput }): Promise<AfterDetail> => {
    if (isAftersDemo()) return aftersDemo.update(id, input);
    const { data } = await api.patch<AfterDetail>(`/v1/afters/${encodeURIComponent(id)}`, input);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    if (isAftersDemo()) return aftersDemo.remove(id);
    await api.delete(`/v1/afters/${encodeURIComponent(id)}`);
  },

  /**
   * Con aprobación queda "requested"; libre o con entrada, "going". Responde el AfterDetail actualizado
   * (con la dirección si ahora la puede ver), así no hace falta otro GET.
   */
  join: async ({ id, message }: { id: string; message?: string }): Promise<AfterDetail> => {
    if (isAftersDemo()) return aftersDemo.join(id, message);
    const { data } = await api.post<AfterDetail>(`/v1/afters/${encodeURIComponent(id)}/join`, {
      message: message?.trim() || undefined,
    });
    return data;
  },

  leave: async (id: string): Promise<void> => {
    if (isAftersDemo()) return aftersDemo.leave(id);
    await api.delete(`/v1/afters/${encodeURIComponent(id)}/join`);
  },

  /** Solo el host. */
  listRequests: async (id: string): Promise<AfterJoinRequest[]> => {
    if (isAftersDemo()) return aftersDemo.listRequests(id);
    const { data } = await api.get<{ data: AfterJoinRequest[] }>(`/v1/afters/${encodeURIComponent(id)}/requests`, {
      params: { status: "requested" },
    });
    return data.data ?? [];
  },

  respond: async ({ id, userId, decision }: { id: string; userId: string; decision: "accept" | "reject" }): Promise<void> => {
    if (isAftersDemo()) return aftersDemo.respond(id, userId, decision);
    await api.post(`/v1/afters/${encodeURIComponent(id)}/requests/${encodeURIComponent(userId)}/${decision}`);
  },

  report: async ({ id, reason }: { id: string; reason: string }): Promise<void> => {
    if (isAftersDemo()) return aftersDemo.report(id);
    await api.post(`/v1/afters/${encodeURIComponent(id)}/report`, { reason: reason.trim() });
  },
};

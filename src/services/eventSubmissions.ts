import { api } from "@/lib/api";
import type { Event } from "@/types/events";
import type { UploadedImage } from "@/types/afters";
import type { EventSubmission, EventSubmissionInput } from "@/types/eventSubmissions";
import { aftersDemo, isAftersDemo } from "@/services/aftersDemo";

/** "Mandanos tu evento" (contrato en `root-backend-service/AFTERS.md`). Usa el mismo modo de ejemplo que los afters. */
export const eventSubmissionsApi = {
  /** Hasta 3 eventos parecidos, para el "¿Es este?". */
  similar: async ({ name, date }: { name: string; date?: string }): Promise<Event[]> => {
    if (isAftersDemo()) return aftersDemo.similarEvents(name);
    const { data } = await api.get<{ data: Event[] }>("/v1/events/similar", {
      params: { name: name.trim(), date: date || undefined },
    });
    return data.data ?? [];
  },

  /** La imagen ya tiene que venir comprimida en JPEG. */
  uploadFlyer: async (image: File): Promise<UploadedImage> => {
    if (isAftersDemo()) return aftersDemo.uploadImage(image);
    const form = new FormData();
    form.append("image", image);
    const { data } = await api.post<UploadedImage>("/v1/event-submissions/flyer", form, { timeout: 30000 });
    return data;
  },

  create: async (input: EventSubmissionInput): Promise<EventSubmission> => {
    if (isAftersDemo()) return aftersDemo.createSubmission(input);
    const { data } = await api.post<EventSubmission>("/v1/event-submissions", input);
    return data;
  },

  /** Más nuevos primero. */
  listMine: async (): Promise<EventSubmission[]> => {
    if (isAftersDemo()) return aftersDemo.mySubmissions();
    const { data } = await api.get<{ data: EventSubmission[] }>("/v1/users/me/event-submissions");
    return data.data ?? [];
  },
};

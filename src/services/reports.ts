import { api } from "@/lib/api";
import type { ReportInput } from "@/types/moderation";

/** Denuncia un post, comentario, mensaje o cuenta. Repetir la misma denuncia no crea otra (el backend responde 200). */
export async function createReport(input: ReportInput): Promise<{ id: string }> {
  const details = input.details?.trim();
  const body: ReportInput = { targetType: input.targetType, targetId: input.targetId, reason: input.reason };
  if (details) body.details = details;
  const { data } = await api.post<{ id: string }>("/v1/reports", body);
  return data;
}

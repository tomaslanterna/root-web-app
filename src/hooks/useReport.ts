"use client";

import { useMutation } from "@/hooks/useMutation";
import { createReport } from "@/services/reports";
import { reportCommunityContent } from "@/services/communities";
import type { ReportReason, ReportTarget } from "@/types/moderation";

export interface ReportSubmission {
  reason: ReportReason;
  details?: string;
}

/**
 * Denuncia `target`. Posts y comentarios de una comunidad van a su administración (endpoint de la comunidad);
 * todo lo demás va al equipo de root (`POST /v1/reports`).
 */
export function useReport(target: ReportTarget) {
  return useMutation(({ reason, details }: ReportSubmission) => {
    const { communityId, targetType, targetId } = target;
    if (communityId && (targetType === "post" || targetType === "comment")) {
      return reportCommunityContent(communityId, { targetType, targetId, reason, details: details?.trim() ?? "" });
    }
    return createReport({ targetType, targetId, reason, details });
  });
}

"use client";

import { useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { chatApi } from "@/services/chat";
import { getCommunityReports, reportCommunityContent, reviewCommunityReport } from "@/services/communities";
import type { CommunityReport, CommunityReportInput, PaginationMeta } from "@/types/communities";

export function useCommunityContact() { return useMutation(chatApi.createDirect); }

export function useCommunityReport(communityId: string) {
  return useMutation((input: CommunityReportInput) => reportCommunityContent(communityId, input));
}

export function useCommunityModeration(communityId: string) {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, offset: 0, limit: 10, hasMore: false });
  const list = useMutation((offset: number) => getCommunityReports(communityId, offset), {
    onSuccess: (response, offset) => { setReports((current) => offset ? [...current, ...response.data] : response.data); setMeta(response.meta); },
  });
  const review = useMutation(async ({ id, status }: { id: string; status: "reviewed" | "dismissed" }) => {
    await reviewCommunityReport(communityId, id, status);
    return getCommunityReports(communityId, 0);
  }, { onSuccess: (response) => { setReports(response.data); setMeta(response.meta); } });
  return { reports, meta, load: list.mutate, review: review.mutate, isLoading: list.isLoading, isReviewing: review.isLoading, error: list.error || review.error };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "./useMutation";
import { getBadges, getBadgeLineup, getMyEventBadge } from "@/services/badges";
import { surveysApi, type SubmitSurveyPayload } from "@/services/surveys";
import type { BadgePage, BadgeLineup, EventBadge } from "@/types/badges";
import { eventsApi } from "@/services/events";
import type { Event } from "@/types/events";

export function useBadgeCollection(username: string) {
  const [page, setPage] = useState<BadgePage | null>(null);
  const revision = useRef(0);
  const list = useMutation(
    ({ offset }: { offset: number; revision: number }) => getBadges(username, offset),
    { onSuccess: (result, request) => {
      if (request.revision !== revision.current) return;
      setPage(current => ({ ...result, data: request.offset && current ? [...current.data, ...result.data.filter(b => !current.data.some(existing => existing.eventId === b.eventId))] : result.data }));
    } },
  );
  const mutate = list.mutate;
  const load = useCallback((offset = 0) => {
    if (!offset) revision.current++;
    return mutate({ offset, revision: revision.current });
  }, [mutate]);
  useEffect(() => {
    const requestRevision = revision;
    void load().catch(() => undefined);
    return () => { requestRevision.current++; };
  }, [username, load]);
  const update = (badge: EventBadge) => setPage(current => current ? { ...current, data: current.data.map(b => b.eventId === badge.eventId ? badge : b) } : current);
  return { page, load, update, isLoading: list.isLoading, error: list.error };
}

export function useEventReview(eventId: string) {
  const detail = useMutation<EventBadge, void>(() => getMyEventBadge(eventId));
  const save = useMutation<EventBadge, SubmitSurveyPayload>(async input => {
    await surveysApi.submitSurvey(eventId, input);
    return getMyEventBadge(eventId);
  });
  return { load: detail.mutate, badge: save.data || detail.data, isLoading: detail.isLoading, error: detail.error,
    save: save.mutate, isSaving: save.isLoading, saveError: save.error };
}

export function useSurveyDetail(eventId: string) {
  return useMutation<{ event: Event; badge: EventBadge }, void>(async () => {
    const badge = await getMyEventBadge(eventId);
    const event: Event = await eventsApi.getEventById(eventId);
    return { event, badge };
  });
}

export function useBadgeLineup(eventId: string | null, isOwner: boolean, username: string) {
  const [cache, setCache] = useState<Record<string, BadgeLineup>>({});
  const key = `${username}:${isOwner}:${eventId}`;
  const request = useMutation(({ id }: { id: string; key: string }) => getBadgeLineup(id, isOwner), {
    onSuccess: (result, input) => setCache(current => ({ ...current, [input.key]: result })),
  });
  const mutate = request.mutate;
  const cached = cache[key];
  const load = useCallback(() => eventId ? mutate({ id: eventId, key }) : Promise.resolve(), [eventId, key, mutate]);
  useEffect(() => { if (eventId && !cached) void load().catch(() => undefined); }, [eventId, cached, load]);
  return { data: cached, load, isLoading: !cached && request.isLoading, error: cached ? null : request.error };
}

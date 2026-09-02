import { useCallback, useEffect, useMemo } from "react";
import { eventsApi, type EventQueryParams } from "@/services/events";
import type { Event, EventListResponse } from "@/types/events";
import { useMutation } from "./useMutation";

export function useEvents(params?: EventQueryParams) {
  const serializedParams = JSON.stringify(params ?? {});
  const stableParams = useMemo<EventQueryParams>(
    () => JSON.parse(serializedParams) as EventQueryParams,
    [serializedParams],
  );
  const { mutate, data, error, isLoading } = useMutation<EventListResponse, EventQueryParams>(
    eventsApi.getEvents,
  );

  const fetchEvents = useCallback(() => mutate(stableParams), [mutate, stableParams]);

  useEffect(() => {
    void mutate(stableParams).catch(() => undefined);
  }, [mutate, stableParams]);

  return {
    events: data?.data ?? [],
    isLoading: isLoading || (data === undefined && error === null),
    error,
    fetchEvents,
  };
}

export function useEvent(id: string) {
  const { mutate, data, error, isLoading } = useMutation<Event, string>(eventsApi.getEventById);

  const fetchEvent = useCallback(() => mutate(id), [id, mutate]);

  useEffect(() => {
    if (id) {
      void mutate(id).catch(() => undefined);
    }
  }, [id, mutate]);

  return {
    event: data ?? null,
    isLoading: isLoading || (Boolean(id) && data === undefined && error === null),
    error,
    fetchEvent,
  };
}

export function useFeaturedEvents() {
  const { mutate, data, error, isLoading } = useMutation<Event[], void>(() =>
    eventsApi.getFeaturedEvents(),
  );

  const fetchFeaturedEvents = useCallback(() => mutate(), [mutate]);

  useEffect(() => {
    void mutate().catch(() => undefined);
  }, [mutate]);

  return {
    events: data ?? [],
    isLoading: isLoading || (data === undefined && error === null),
    error,
    fetchFeaturedEvents,
  };
}

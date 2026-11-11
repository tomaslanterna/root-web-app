import { useCallback, useEffect, useState } from "react";
import { eventsApi } from "@/services/events";
import { useMutation } from "@/hooks/useMutation";
import type { Event, EventListResponse } from "@/types/events";

type EventQuery = Record<string, string | number | boolean | undefined>;

export function useEvents(params?: EventQuery) {
  const [events, setEvents] = useState<Event[]>([]);
  const paramsKey = JSON.stringify(params ?? {});
  const request = useMutation<EventListResponse, EventQuery>(eventsApi.getEvents, {
    onSuccess: (response) => setEvents(response.data || []),
  });
  const mutate = request.mutate;

  useEffect(() => {
    const query = JSON.parse(paramsKey) as EventQuery;
    void mutate(query).catch(() => undefined);
  }, [mutate, paramsKey]);

  const fetchEvents = useCallback(
    () => mutate(JSON.parse(paramsKey) as EventQuery),
    [mutate, paramsKey],
  );

  return { events, isLoading: request.isLoading, fetchEvents };
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const request = useMutation<Event, string>(eventsApi.getEventById, {
    onSuccess: setEvent,
  });
  const mutate = request.mutate;

  useEffect(() => {
    if (id) void mutate(id).catch(() => undefined);
  }, [id, mutate]);

  return {
    event,
    isLoading: request.isLoading,
    error: request.error,
    fetchEvent: () => mutate(id),
    setEvent,
  };
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const request = useMutation<{ data: Event[] }, void>(eventsApi.getFeaturedEvents, {
    onSuccess: (response) => setEvents(response.data || []),
  });
  const mutate = request.mutate;

  useEffect(() => {
    void mutate().catch(() => undefined);
  }, [mutate]);

  return {
    events,
    isLoading: request.isLoading,
    fetchFeaturedEvents: () => mutate(),
  };
}

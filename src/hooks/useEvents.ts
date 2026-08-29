import { useState, useCallback, useEffect } from "react";
import { eventsApi } from "@/services/events";
import { useMutation } from "@/hooks/useMutation";

export function useEvents(params?: Record<string, any>) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await eventsApi.getEvents(params);
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, fetchEvents };
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await eventsApi.getEventById(id);
      setEvent(data);
    } catch (err: any) {
      setError(err);
      console.error("Error fetching event:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, isLoading, error, fetchEvent, setEvent };
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeaturedEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await eventsApi.getFeaturedEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching featured events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedEvents();
  }, [fetchFeaturedEvents]);

  return { events, isLoading, fetchFeaturedEvents };
}

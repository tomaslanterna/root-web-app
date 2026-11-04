"use client";

import { useEffect } from "react";
import { eventsApi } from "@/services/events";
import { useMutation } from "@/hooks/useMutation";
import type { Event } from "@/types/events";

/** Eventos marcados como destacados (isFeatured), independientes de los filtros del listado. */
export function useFeaturedEvents() {
  const load = useMutation<Event[], void>(async () => {
    const response = await eventsApi.getFeaturedEvents();
    const events: Event[] = response?.data ?? [];
    return events.filter((event) => event.isFeatured);
  });
  const { mutate } = load;

  useEffect(() => {
    void mutate().catch(() => undefined);
  }, [mutate]);

  return {
    featuredEvents: load.data ?? [],
    isLoading: load.isLoading,
    refresh: () => mutate().catch(() => undefined),
  };
}

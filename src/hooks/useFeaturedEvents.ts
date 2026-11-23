"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { INTERESTS_UPDATED } from "@/hooks/useInterests";
import { eventsApi } from "@/services/events";
import { useMutation } from "@/hooks/useMutation";
import type { Event } from "@/types/events";

/** Últimos destacados cargados, por usuario: al volver a la pantalla se muestran al instante y se refrescan por detrás. */
let featuredCache: { userId: string; events: Event[] } | null = null;

/**
 * Eventos marcados como destacados (isFeatured), independientes de los filtros del listado. Con sesión vienen
 * ordenados según los intereses musicales: se vuelven a pedir al iniciar sesión y al guardar intereses.
 */
export function useFeaturedEvents() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const load = useMutation<Event[], void>(async () => {
    const response = await eventsApi.getFeaturedEvents();
    const events: Event[] = response?.data ?? [];
    const featured = events.filter((event) => event.isFeatured);
    featuredCache = { userId, events: featured };
    return featured;
  });
  const cached = featuredCache && featuredCache.userId === userId ? featuredCache.events : undefined;
  const { mutate } = load;

  useEffect(() => {
    void mutate().catch(() => undefined);
  }, [mutate, user?.id]);

  useEffect(() => {
    const reload = () => void mutate().catch(() => undefined);
    window.addEventListener(INTERESTS_UPDATED, reload);
    return () => window.removeEventListener(INTERESTS_UPDATED, reload);
  }, [mutate]);

  return {
    featuredEvents: load.data ?? cached ?? [],
    isLoading: load.isLoading,
    refresh: () => mutate().catch(() => undefined),
  };
}

"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { eventsApi, knownEventId } from "@/services/events";
import { canonicalEventUrl, type EventLinkRef } from "@/lib/eventPath";

/**
 * El id del evento para lo que viene en la URL (`/events/[id]`), que puede ser el UUID o el slug.
 * Con el UUID o un slug ya visto responde al instante; si no, pide el detalle una vez.
 * Las llamadas a la API (crews, afters, ranking…) siempre van con este id, nunca con el slug.
 */
export function useEventId(idOrSlug: string) {
  const [resolved, setResolved] = useState<{ key: string; id: string | null; failed: boolean }>(() => ({
    key: idOrSlug,
    id: knownEventId(idOrSlug),
    failed: false,
  }));
  const { mutate: resolve } = useMutation((key: string) => eventsApi.resolveEventId(key));

  const current = resolved.key === idOrSlug ? resolved : { key: idOrSlug, id: knownEventId(idOrSlug), failed: false };

  useEffect(() => {
    if (current.id || current.failed) return;
    let alive = true;
    void resolve(idOrSlug).then(
      (id) => alive && setResolved({ key: idOrSlug, id, failed: false }),
      () => alive && setResolved({ key: idOrSlug, id: null, failed: true }),
    );
    return () => {
      alive = false;
    };
  }, [idOrSlug, current.id, current.failed, resolve]);

  return { eventId: current.id, failed: current.failed };
}

/**
 * Cuando llega el evento y la URL tiene el UUID (un link viejo, una notificación), la cambia por la del slug
 * sin recargar ni sumar una entrada al historial. Así lo que se comparte desde ahí ya sale con el nombre.
 */
export function useCanonicalEventUrl(param: string, event: EventLinkRef | null | undefined) {
  const eventId = event?.id;
  const slug = event?.slug;
  useEffect(() => {
    if (!eventId || !slug || typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;
    const next = canonicalEventUrl(pathname, param, { id: eventId, slug }, `${search}${hash}`);
    // Con `null`, como dicen los docs de Next: así el router se entera de la URL nueva (con el state propio de
    // Next, la deja pasar sin sincronizar y los links siguientes quedan con la ruta vieja).
    if (next) window.history.replaceState(null, "", next);
  }, [param, eventId, slug]);
}

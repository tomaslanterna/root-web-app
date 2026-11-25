"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { tempCrewsApi } from "@/services/tempCrews";
import type { TempCrewEventRef, TempCrewJoinRequest, TempCrewSummary, TempCrewsEventSummary } from "@/types/tempCrews";

type LoadStatus = "loading" | "ready" | "unavailable";

type EventListState = {
  crews: TempCrewSummary[];
  total: number;
  viewerCrewId: string | null;
  status: LoadStatus;
};

/** Última respuesta por evento: al volver a entrar, la sección aparece al instante y se actualiza por detrás. */
const eventListCache = new Map<string, Omit<EventListState, "status">>();
/** Si la última vez el backend respondió, mientras carga se reserva el lugar de la sección (sin saltos). */
const AVAILABLE_KEY = "root:temp-crews-available";

function readAvailable() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AVAILABLE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAvailable(value: boolean) {
  try {
    if (value) window.localStorage.setItem(AVAILABLE_KEY, "1");
    else window.localStorage.removeItem(AVAILABLE_KEY);
  } catch {
    // sin almacenamiento: solo no se reserva el lugar
  }
}

/** El backend ya manda el resumen dentro del evento: no hace falta pedirlo aparte. */
const EMBEDS_KEY = "root:event-embeds-temp-crews";

function readEmbeds() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EMBEDS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeEmbeds(value: boolean) {
  try {
    if (value) window.localStorage.setItem(EMBEDS_KEY, "1");
    else window.localStorage.removeItem(EMBEDS_KEY);
  } catch {
    // sin almacenamiento: se sigue pidiendo en paralelo
  }
}

/**
 * Crews de un evento que admiten gente.
 * - Si el evento trae `tempCrews` (detalle), se usa eso y no hay otra llamada.
 * - Si no, se piden con el id; en paralelo con el evento mientras el backend no las incluya.
 * Si el backend no responde, queda "unavailable" y la pantalla no muestra la sección.
 */
export function useEventTempCrews(
  eventId: string,
  event: TempCrewEventRef | null,
  limit = 20,
  embedded?: TempCrewsEventSummary | null,
) {
  const cacheKey = `${eventId}|${limit}`;
  const [state, setState] = useState<EventListState>(() => {
    const cached = eventListCache.get(cacheKey);
    return cached ? { ...cached, status: "ready" } : { crews: [], total: 0, viewerCrewId: null, status: "loading" };
  });
  const [likelyAvailable] = useState(readAvailable);
  // El modo de ejemplo usa los datos del evento para armar las tarjetas; la API real solo necesita el id.
  const demoEventRef = useRef(event);
  useEffect(() => {
    demoEventRef.current = event;
  }, [event]);
  const { mutate: fetchList } = useMutation((id: string) => tempCrewsApi.listForEvent(id, { limit }, demoEventRef.current));

  const load = useCallback(
    (id: string) =>
      fetchList(id).then(
        (response) => {
          const next = {
            crews: response.data ?? [],
            total: response.meta?.total ?? response.data?.length ?? 0,
            viewerCrewId: response.meta?.viewerCrewId ?? null,
          };
          eventListCache.set(`${id}|${limit}`, next);
          writeAvailable(true);
          setState({ ...next, status: "ready" });
        },
        () => {
          writeAvailable(false);
          setState((current) => (current.status === "ready" ? current : { ...current, status: "unavailable" }));
        },
      ),
    [fetchList, limit],
  );

  // Si la última vez el resumen vino en el evento, se espera al evento en lugar de pedirlo aparte.
  const [waitForEvent] = useState(readEmbeds);
  const eventLoaded = event != null;
  const hasEmbedded = embedded != null;
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    if (hasEmbedded) {
      writeEmbeds(true);
      return;
    }
    if (waitForEvent && !eventLoaded) return;
    if (waitForEvent && eventLoaded) writeEmbeds(false); // el backend dejó de incluirlo
    if (fetchedFor.current === eventId) return;
    fetchedFor.current = eventId;
    void load(eventId);
  }, [eventId, hasEmbedded, eventLoaded, waitForEvent, load]);

  // Después de un cambio (pedir unirse, crear) manda la respuesta nueva, no el resumen que vino con el evento.
  const [preferFetched, setPreferFetched] = useState(false);
  const reload = useCallback(() => load(eventId).then(() => setPreferFetched(true)), [eventId, load]);

  if (embedded && !(preferFetched && state.status === "ready")) {
    return {
      crews: embedded.preview ?? [],
      total: embedded.total ?? 0,
      viewerCrewId: embedded.viewerCrewId ?? null,
      status: "ready" as LoadStatus,
      reload,
      showPlaceholder: false,
    };
  }

  return {
    ...state,
    reload,
    /** true mientras carga y la última vez hubo respuesta: conviene mostrar un esqueleto en su lugar. */
    showPlaceholder: state.status === "loading" && likelyAvailable,
  };
}

export function useMyTempCrews(enabled = true) {
  const [crews, setCrews] = useState<TempCrewSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const { mutate: fetchMine } = useMutation(() => tempCrewsApi.getMine());

  const reload = useCallback(
    () =>
      fetchMine(undefined).then(
        (data) => {
          setCrews(data);
          setStatus("ready");
        },
        () => setStatus("unavailable"),
      ),
    [fetchMine],
  );

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { crews, status, reload };
}

export function useDiscoverTempCrews(enabled = true) {
  const [crews, setCrews] = useState<TempCrewSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const { mutate: fetchDiscover } = useMutation(() => tempCrewsApi.discover());

  const reload = useCallback(
    () =>
      fetchDiscover(undefined).then(
        (data) => {
          setCrews(data);
          setStatus("ready");
        },
        () => setStatus("unavailable"),
      ),
    [fetchDiscover],
  );

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { crews, status, reload };
}

/** Solicitudes pendientes de una crew (solo para quien la creó). */
export function useTempCrewRequests(crewId: string, enabled: boolean, onChange?: () => void) {
  const [requests, setRequests] = useState<TempCrewJoinRequest[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { mutate: fetchRequests } = useMutation((id: string) => tempCrewsApi.listRequests(id, "pending"));
  const respondMutation = useMutation(tempCrewsApi.respondToRequest);

  const reload = useCallback(
    () =>
      fetchRequests(crewId).then(
        (data) => {
          setRequests(data);
          setStatus("ready");
        },
        () => setStatus("unavailable"),
      ),
    [crewId, fetchRequests],
  );

  useEffect(() => {
    if (enabled && crewId) void reload();
  }, [enabled, crewId, reload]);

  const respond = useCallback(
    async (requestId: string, decision: "accept" | "reject") => {
      setRespondingId(requestId);
      try {
        await respondMutation.mutate({ crewId, requestId, decision });
        setRequests((current) => current.filter((request) => request.id !== requestId));
        onChange?.();
      } finally {
        setRespondingId(null);
      }
    },
    // respondMutation.mutate es estable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crewId, onChange],
  );

  return { requests, status, reload, respond, respondingId, respondError: respondMutation.error };
}

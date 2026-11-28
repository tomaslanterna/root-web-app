"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { useKycGate } from "@/context/KycGateContext";
import { aftersApi } from "@/services/afters";
import { eventsApi } from "@/services/events";
import { compressImageToJpeg } from "@/lib/compressImage";
import { apiErrorCode, apiErrorStatus } from "@/lib/apiErrors";
import { tonightRange } from "@/lib/afters";
import type { Event } from "@/types/events";
import type { AfterDetail, AfterInput, AfterJoinRequest, AfterListParams, AfterSummary, AfterUpdateInput } from "@/types/afters";

type LoadStatus = "loading" | "ready" | "unavailable";

interface ListState {
  afters: AfterSummary[];
  total: number;
  status: LoadStatus;
}

/** Última respuesta por consulta: al volver a Eventos la franja aparece al instante (sin mover el scroll). */
const listCache = new Map<string, { afters: AfterSummary[]; total: number }>();

/**
 * Afters próximos o en curso (`GET /v1/afters`). Si el backend no responde queda "unavailable"
 * y la pantalla no muestra nada de afters.
 */
export function useAftersList(params: AfterListParams, enabled = true) {
  const { from, until, zone, limit = 50 } = params;
  const cacheKey = `${until ?? ""}|${zone ?? ""}|${limit}`;
  const [state, setState] = useState<ListState>(() => {
    const cached = listCache.get(cacheKey);
    return cached ? { ...cached, status: "ready" } : { afters: [], total: 0, status: "loading" };
  });
  const { mutate: fetchList } = useMutation((query: AfterListParams) => aftersApi.list(query));

  const reload = useCallback(
    () =>
      fetchList({ from, until, zone, limit }).then(
        (response) => {
          const next = { afters: response.data ?? [], total: response.meta?.total ?? response.data?.length ?? 0 };
          listCache.set(cacheKey, next);
          setState({ ...next, status: "ready" });
        },
        () => setState((current) => (current.status === "ready" ? current : { ...current, status: "unavailable" })),
      ),
    [fetchList, from, until, zone, limit, cacheKey],
  );

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { ...state, reload };
}

/** "Afters de esta noche": desde ahora hasta las próximas 12:00 de Montevideo. */
export function useTonightAfters(enabled: boolean, zone?: string) {
  const [range] = useState(() => tonightRange());
  return useAftersList({ ...range, zone, limit: 20 }, enabled);
}

/** Todos los afters de un evento (pantalla "Ver todos" del detalle). */
export function useEventAftersList(eventId: string) {
  const [state, setState] = useState<ListState>({ afters: [], total: 0, status: "loading" });
  const { mutate: fetchList } = useMutation((id: string) => aftersApi.listForEvent(id, { limit: 50 }));

  const reload = useCallback(
    () =>
      fetchList(eventId).then(
        (response) => setState({ afters: response.data ?? [], total: response.meta?.total ?? 0, status: "ready" }),
        () => setState((current) => ({ ...current, status: "unavailable" })),
      ),
    [fetchList, eventId],
  );

  useEffect(() => {
    if (eventId) void reload();
  }, [eventId, reload]);

  return { ...state, reload };
}

export type AfterDetailStatus = "loading" | "ready" | "not_found" | "error";

/** Detalle de un after y lo que se puede hacer desde ahí (pedir entrar, Voy, ya no voy, aviso, borrar, denunciar). */
export function useAfterDetail(id: string) {
  const { handleKycError } = useKycGate();
  const [after, setAfter] = useState<AfterDetail | null>(null);
  const [status, setStatus] = useState<AfterDetailStatus>("loading");
  const { mutate: fetchAfter } = useMutation((afterId: string) => aftersApi.get(afterId));

  const reload = useCallback(
    () =>
      fetchAfter(id).then(
        (data) => {
          setAfter(data);
          setStatus("ready");
        },
        (error) => {
          setStatus((current) => {
            if (apiErrorStatus(error) === 404 || apiErrorCode(error) === "not_found") return "not_found";
            return current === "ready" ? current : "error";
          });
        },
      ),
    [fetchAfter, id],
  );

  useEffect(() => {
    if (id) void reload();
  }, [id, reload]);

  // Después de cada acción se vuelve a pedir el detalle: el backend decide qué se ve (dirección, aviso, cupo).
  // join responde el detalle actualizado (con la dirección si ahora se puede ver): no hace falta otro GET.
  const join = useMutation(aftersApi.join, { onSuccess: (data) => setAfter(data) });
  const leave = useMutation(aftersApi.leave, { onSuccess: () => void reload() });
  const remove = useMutation(aftersApi.remove);
  const report = useMutation(aftersApi.report);
  const update = useMutation(aftersApi.update, {
    onSuccess: (data) => setAfter(data),
    onError: (error) => void handleKycError(error),
  });

  const { mutate: updateAfter } = update;
  const saveNotice = useCallback((notice: string) => updateAfter({ id, input: { notice } }), [updateAfter, id]);

  return { after, status, reload, join, leave, remove, report, saveNotice, savingNotice: update.isLoading, noticeError: update.error };
}

/** Solicitudes pendientes de un after con aprobación (solo para quien lo organiza). */
export function useAfterRequests(afterId: string, enabled: boolean, onChange?: () => void) {
  const [requests, setRequests] = useState<AfterJoinRequest[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { mutate: fetchRequests } = useMutation((id: string) => aftersApi.listRequests(id));
  const { mutate: respondTo, error: respondError } = useMutation(aftersApi.respond);

  const reload = useCallback(
    () =>
      fetchRequests(afterId).then(
        (data) => {
          setRequests(data);
          setStatus("ready");
        },
        () => setStatus("unavailable"),
      ),
    [afterId, fetchRequests],
  );

  useEffect(() => {
    if (enabled && afterId) void reload();
  }, [enabled, afterId, reload]);

  const respond = useCallback(
    async (userId: string, decision: "accept" | "reject") => {
      setRespondingId(userId);
      try {
        await respondTo({ id: afterId, userId, decision });
        setRequests((current) => current.filter((request) => request.userId !== userId));
        onChange?.();
      } finally {
        setRespondingId(null);
      }
    },
    [afterId, respondTo, onChange],
  );

  return { requests, status, reload, respond, respondingId, respondError };
}

/** Detalle para editar (solo el host): trae la dirección. */
export function useEditableAfter(id: string | null) {
  const [after, setAfter] = useState<AfterDetail | null>(null);
  const [status, setStatus] = useState<AfterDetailStatus>(id ? "loading" : "ready");
  const { mutate: fetchAfter } = useMutation((afterId: string) => aftersApi.get(afterId));

  useEffect(() => {
    if (!id) return;
    void fetchAfter(id).then(
      (data) => {
        setAfter(data);
        setStatus("ready");
      },
      (error) => setStatus(apiErrorStatus(error) === 404 ? "not_found" : "error"),
    );
  }, [id, fetchAfter]);

  return { after, status };
}

/**
 * Publica o edita un after. La foto se comprime y se pasa a JPEG con Canvas antes de subirla.
 * Si el backend responde kyc_required, abre la hoja de verificación.
 */
export function useSaveAfter() {
  const { handleKycError } = useKycGate();
  const save = useMutation(
    async ({ id, input, cover }: { id?: string; input: AfterInput | AfterUpdateInput; cover?: File | null }): Promise<AfterDetail> => {
      let coverKey: string | undefined;
      if (cover) {
        const jpeg = await compressImageToJpeg(cover, 1600, 0.82);
        coverKey = (await aftersApi.uploadCover(jpeg)).key;
      }
      const body = coverKey ? { ...input, coverKey } : input;
      return id ? aftersApi.update({ id, input: body }) : aftersApi.create(body as AfterInput);
    },
    { onError: (error) => void handleKycError(error) },
  );
  return save;
}

/**
 * Fiestas para el "Después de" del formulario: la que viene en `?eventId=` (prellenada) y las próximas
 * para elegir si se sube desde el menú +.
 */
export function useAfterEventChoices(initialEventId: string | null) {
  const [initial, setInitial] = useState<Event | null>(null);
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [upcomingStatus, setUpcomingStatus] = useState<LoadStatus>("loading");
  const { mutate: fetchEvent } = useMutation((eventId: string) => eventsApi.getEventById(eventId));
  const { mutate: fetchUpcoming } = useMutation(() => eventsApi.getEvents({ limit: 30, offset: 0 }));

  useEffect(() => {
    if (!initialEventId) return;
    void fetchEvent(initialEventId).then(setInitial, () => undefined);
  }, [initialEventId, fetchEvent]);

  const loadUpcoming = useCallback(
    () =>
      fetchUpcoming(undefined).then(
        (response) => {
          setUpcoming(response.data ?? []);
          setUpcomingStatus("ready");
        },
        () => setUpcomingStatus("unavailable"),
      ),
    [fetchUpcoming],
  );

  return { initial, upcoming, upcomingStatus, loadUpcoming };
}

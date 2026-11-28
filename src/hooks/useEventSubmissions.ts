"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { useKycGate } from "@/context/KycGateContext";
import { eventSubmissionsApi } from "@/services/eventSubmissions";
import { compressImageToJpeg } from "@/lib/compressImage";
import type { Event } from "@/types/events";
import type { EventSubmission, EventSubmissionInput } from "@/types/eventSubmissions";

const SIMILAR_DEBOUNCE_MS = 400;

/** "¿Es este?": eventos parecidos mientras se escribe el nombre (400 ms después de la última tecla). */
export function useSimilarEvents(name: string, date?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const { mutate: fetchSimilar } = useMutation(eventSubmissionsApi.similar);
  const query = name.trim();

  useEffect(() => {
    if (query.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void fetchSimilar({ name: query, date }).then(
        (data) => {
          if (!cancelled) setEvents(data.slice(0, 3));
        },
        () => {
          if (!cancelled) setEvents([]);
        },
      );
    }, SIMILAR_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, date, fetchSimilar]);

  return query.length < 3 ? [] : events;
}

/** Sube el flyer (comprimido a JPEG con Canvas) y manda el evento. kyc_required abre la hoja. */
export function useSubmitEvent() {
  const { handleKycError } = useKycGate();
  return useMutation(
    async ({ input, flyer }: { input: Omit<EventSubmissionInput, "flyerKey">; flyer: File }): Promise<EventSubmission> => {
      const jpeg = await compressImageToJpeg(flyer, 1600, 0.85);
      const { key } = await eventSubmissionsApi.uploadFlyer(jpeg);
      return eventSubmissionsApi.create({ ...input, flyerKey: key });
    },
    { onError: (error) => void handleKycError(error) },
  );
}

export function useMySubmissions(enabled = true) {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const { mutate: fetchMine } = useMutation(() => eventSubmissionsApi.listMine());

  const reload = useCallback(
    () =>
      fetchMine(undefined).then(
        (data) => {
          setSubmissions(data);
          setStatus("ready");
        },
        () => setStatus("unavailable"),
      ),
    [fetchMine],
  );

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { submissions, status, reload };
}

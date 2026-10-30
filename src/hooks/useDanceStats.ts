"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { danceApi, type CrewRankingEntry, type DanceCrew, type DanceSession } from "@/services/dance";

/** Una entrada por fiesta (las sesiones de un mismo evento se suman), de la más reciente a la más vieja. */
function aggregateByEvent(sessions: DanceSession[]) {
  const byEvent = new Map<string, DanceSession>();
  for (const session of sessions) {
    const existing = byEvent.get(session.eventId);
    if (existing) existing.stepsCount += session.stepsCount;
    else byEvent.set(session.eventId, { ...session });
  }
  return [...byEvent.values()].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );
}

export function useDanceStats() {
  const load = useMutation(async () => {
    const [sessions, crews] = await Promise.all([danceApi.getSessions(), danceApi.getMyCrews()]);
    return { parties: aggregateByEvent(sessions), crews };
  });
  const [rankings, setRankings] = useState<Record<string, CrewRankingEntry[]>>({});
  const ranking = useMutation(async ({ crewId, eventId }: { crewId: string; eventId: string }) => ({
    crewId,
    entries: await danceApi.getCrewEventRanking(crewId, eventId),
  }), {
    onSuccess: ({ crewId, entries }) => setRankings((current) => ({ ...current, [crewId]: entries })),
  });

  const { mutate } = load;
  useEffect(() => {
    void mutate(undefined).catch(() => undefined);
  }, [mutate]);

  const { mutate: loadRanking } = ranking;
  const loadCrewRankings = useCallback((crews: DanceCrew[], eventId: string) => {
    for (const crew of crews) void loadRanking({ crewId: crew.id, eventId }).catch(() => undefined);
  }, [loadRanking]);

  return {
    parties: load.data?.parties ?? [],
    crews: load.data?.crews ?? [],
    isLoading: load.isLoading || (!load.data && !load.error),
    error: load.error,
    retry: () => void mutate(undefined).catch(() => undefined),
    rankings,
    isLoadingRankings: ranking.isLoading,
    loadCrewRankings,
  };
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { matchApi, type PermanentCrew } from "@/services/match";

export function useMatcherCatalog() {
  const { user } = useAuth();
  const { mutate: loadEvents, data: events, isLoading } = useMutation(matchApi.getEvents);
  const { mutate: loadMyCrews, data: myCrewsData, isLoading: myCrewsLoading } = useMutation(matchApi.getPermanentCrews);
  const { mutate: loadAllCrews, data: allCrewsData, isLoading: allCrewsLoading } = useMutation(matchApi.getAllPermanentCrews);
  const { mutate: mutateCreateCrew, isLoading: isCreatingCrew } = useMutation(matchApi.createPermanentCrew);

  const [localCreatedCrews, setLocalCreatedCrews] = useState<PermanentCrew[]>([]);

  const fetchCrews = useCallback(async () => {
    const tasks: Promise<unknown>[] = [loadAllCrews(undefined)];
    if (user?.id) {
      tasks.push(loadMyCrews(undefined));
    }
    await Promise.allSettled(tasks);
  }, [user?.id, loadMyCrews, loadAllCrews]);

  useEffect(() => {
    void loadEvents(undefined).catch(() => undefined);
  }, [loadEvents]);

  useEffect(() => {
    void fetchCrews();
  }, [fetchCrews]);

  // Combine user's permanent crews deduplicating by id
  const fetchedMyCrews = myCrewsData ?? [];
  const permanentCrews = [
    ...fetchedMyCrews,
    ...localCreatedCrews.filter((lc) => !fetchedMyCrews.some((mc) => mc.id === lc.id)),
  ];

  // All crews in the country: fetched list merged with any locally created crews
  const baseAllCrews = allCrewsData ?? [];
  const allCrews = [
    ...baseAllCrews,
    ...localCreatedCrews.filter((lc) => !baseAllCrews.some((c) => c.id === lc.id)),
  ];

  const createCrew = async (payload?: {
    name?: string;
    memberIds?: string[];
    eventIds?: string[];
    friends?: Array<{ id: string; name: string; username: string; avatarUrl?: string }>;
  }) => {
    const crewName = payload?.name?.trim() || "Nueva Crew";
    const createdCrew = await mutateCreateCrew({
      name: crewName,
      memberIds: payload?.memberIds,
      eventIds: payload?.eventIds,
    });

    if (createdCrew?.id) {
      setLocalCreatedCrews((prev) => [
        createdCrew,
        ...prev.filter((c) => c.id !== createdCrew.id),
      ]);
      void fetchCrews();
      return createdCrew.id;
    }

    return "";
  };

  return {
    events: events ?? [],
    permanentCrews: user ? permanentCrews : [],
    allCrews,
    isLoading,
    crewsLoading: myCrewsLoading || allCrewsLoading,
    isCreatingCrew,
    createCrew,
    refreshCrews: fetchCrews,
  };
}

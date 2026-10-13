"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { matchApi, type PermanentCrew, DEFAULT_ARGENTINA_CREWS } from "@/services/match";

export function useMatcherCatalog() {
  const { user } = useAuth();
  const { mutate: loadEvents, data: events, isLoading } = useMutation(matchApi.getEvents);
  const { mutate: loadMyCrews, data: myCrewsData, isLoading: myCrewsLoading } = useMutation(matchApi.getPermanentCrews);
  const { mutate: loadAllCrews, data: allCrewsData, isLoading: allCrewsLoading } = useMutation(matchApi.getAllPermanentCrews);
  const { mutate: mutateCreateCrew, isLoading: isCreatingCrew } = useMutation(matchApi.createPermanentCrew);

  const [localCreatedCrews, setLocalCreatedCrews] = useState<PermanentCrew[]>([]);

  const fetchCrews = useCallback(async () => {
    if (user?.id) {
      await Promise.allSettled([
        loadMyCrews(undefined),
        loadAllCrews(undefined),
      ]);
    }
  }, [user?.id, loadMyCrews, loadAllCrews]);

  useEffect(() => {
    void loadEvents(undefined).catch(() => undefined);
  }, [loadEvents]);

  useEffect(() => {
    void fetchCrews();
  }, [fetchCrews]);

  // Combine user's permanent crews
  const permanentCrews = [
    ...localCreatedCrews,
    ...(myCrewsData ?? []),
  ];

  // All crews in the country: fetched list merged with any locally created crews, falling back to default list
  const baseAllCrews = allCrewsData && allCrewsData.length > 0 ? allCrewsData : DEFAULT_ARGENTINA_CREWS;
  const allCrews = [
    ...localCreatedCrews,
    ...baseAllCrews.filter((c) => !localCreatedCrews.some((lc) => lc.id === c.id)),
  ];

  const createCrew = async (payload?: {
    name?: string;
    memberIds?: string[];
    friends?: Array<{ id: string; name: string; username: string; avatarUrl?: string }>;
  }) => {
    const crewName = payload?.name?.trim() || "Nueva Crew";
    const resId = await mutateCreateCrew({
      name: crewName,
      memberIds: payload?.memberIds,
    });
    const finalId = resId || `perm_crew_${Date.now()}`;
    const newCrew: PermanentCrew = {
      id: finalId,
      name: crewName,
      inviteCode: "CREW" + Math.floor(1000 + Math.random() * 9000),
      memberCount: 1 + (payload?.friends?.length || 0),
      topSteps: 0,
      status: "active",
      location: "Buenos Aires, Argentina",
      members: [
        {
          userId: user?.id || "me",
          name: user?.name,
          username: user?.username,
          avatarUrl: user?.avatarUrl,
        },
        ...(payload?.friends || []).map((f) => ({
          userId: f.id,
          name: f.name,
          username: f.username,
          avatarUrl: f.avatarUrl,
        })),
      ],
    };

    setLocalCreatedCrews((prev) => [newCrew, ...prev]);
    return finalId;
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

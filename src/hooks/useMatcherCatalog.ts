"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { matchApi } from "@/services/match";

export function useMatcherCatalog() {
  const { user } = useAuth();
  const { mutate: loadEvents, data: events, isLoading } = useMutation(matchApi.getEvents);
  const { mutate: loadCrews, data: permanentCrews, isLoading: crewsLoading } = useMutation(matchApi.getPermanentCrews);
  const { mutate: createCrew } = useMutation(matchApi.createPermanentCrew);
  useEffect(() => { void loadEvents(undefined).catch(() => undefined); }, [loadEvents]);
  useEffect(() => { if (user?.id) void loadCrews(undefined).catch(() => undefined); }, [user?.id, loadCrews]);
  return { events: events ?? [], permanentCrews: user ? permanentCrews ?? [] : [], isLoading, crewsLoading, createCrew };
}

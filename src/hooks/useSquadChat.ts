"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { matchApi } from "@/services/match";

export function useSquadChat(squadId: string) {
  const { user } = useAuth();
  const [result, setResult] = useState<{ squadId: string; userId: string; chatId: string }>();
  const { mutate, isLoading, error } = useMutation(matchApi.ensureSquadChat);
  const userId = user?.id;
  const load = useCallback(async () => {
    if (!userId) return;
    const chatId = await mutate(squadId);
    setResult({ squadId, userId, chatId });
  }, [mutate, squadId, userId]);
  useEffect(() => {
    let active = true;
    if (userId) void mutate(squadId).then((chatId) => {
      if (active) setResult({ squadId, userId, chatId });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [squadId, userId, mutate]);
  return {
    chatId: result?.squadId === squadId && result.userId === userId ? result.chatId : undefined,
    isLoading, error, retry: load,
  };
}

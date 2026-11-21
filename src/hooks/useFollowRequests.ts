"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users";
import type { FollowListUser } from "@/types/follows";

/** Solicitudes de seguimiento pendientes (perfil privado): listar, aceptar y rechazar. */
export function useFollowRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FollowListUser[]>([]);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const { mutate: load, isLoading, error } = useMutation(usersApi.getFollowRequests, { onSuccess: setRequests });
  const { mutate: accept } = useMutation(usersApi.acceptFollowRequest);
  const { mutate: reject } = useMutation(usersApi.rejectFollowRequest);

  useEffect(() => {
    if (!user?.id) return;
    void load(undefined).catch(() => undefined);
  }, [user?.id, load]);

  const answer = useCallback(
    async (username: string, action: "accept" | "reject") => {
      setPending((p) => ({ ...p, [username]: true }));
      try {
        await (action === "accept" ? accept(username) : reject(username));
        setRequests((prev) => prev.filter((r) => r.username !== username));
      } finally {
        setPending((p) => ({ ...p, [username]: false }));
      }
    },
    [accept, reject],
  );

  return {
    requests,
    isLoading,
    error,
    pending,
    retry: () => void load(undefined).catch(() => undefined),
    accept: (username: string) => answer(username, "accept"),
    reject: (username: string) => answer(username, "reject"),
  };
}

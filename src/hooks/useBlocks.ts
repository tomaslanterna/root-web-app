"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users";
import type { BlockedUser } from "@/types/moderation";

/** Bloquear y desbloquear una cuenta, con un estado `pending` por username para deshabilitar el botón. */
export function useBlockActions() {
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const { mutate: block } = useMutation(usersApi.blockUser);
  const { mutate: unblock } = useMutation(usersApi.unblockUser);

  const run = useCallback(
    async (username: string, action: "block" | "unblock") => {
      setPending((p) => ({ ...p, [username]: true }));
      try {
        await (action === "block" ? block(username) : unblock(username));
      } finally {
        setPending((p) => ({ ...p, [username]: false }));
      }
    },
    [block, unblock],
  );

  return {
    pending,
    block: useCallback((username: string) => run(username, "block"), [run]),
    unblock: useCallback((username: string) => run(username, "unblock"), [run]),
  };
}

/** Cuentas que bloqueaste (/settings/blocked): listar y desbloquear. */
export function useBlocks() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const { mutate: load, isLoading, error } = useMutation(usersApi.getBlockedUsers, { onSuccess: setBlocked });
  const actions = useBlockActions();
  const { unblock: unblockUser } = actions;

  useEffect(() => {
    if (!user?.id) return;
    void load(undefined).catch(() => undefined);
  }, [user?.id, load]);

  const unblock = useCallback(
    async (username: string) => {
      await unblockUser(username);
      setBlocked((prev) => prev.filter((b) => b.username !== username));
    },
    [unblockUser],
  );

  return {
    blocked,
    isLoading,
    error,
    pending: actions.pending,
    retry: () => void load(undefined).catch(() => undefined),
    block: actions.block,
    unblock,
  };
}

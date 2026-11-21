"use client";

import { useCallback, useEffect, useState } from "react";
import { usersApi } from "@/services/users";
import { useMutation } from "@/hooks/useMutation";
import type { FollowListKind, FollowListUser } from "@/types/follows";

const PAGE_SIZE = 30;

interface ListState {
  /** Perfil + pestaña a los que corresponde esta lista ("" mientras carga la primera página). */
  key: string;
  users: FollowListUser[];
  total: number;
  hasMore: boolean;
  error: string | null;
}

const EMPTY: ListState = { key: "", users: [], total: 0, hasMore: false, error: null };

/**
 * Seguidores o seguidos de un perfil, paginados. También permite seguir / dejar de seguir
 * a cada persona de la lista con actualización optimista.
 */
export function useFollowList(username: string, kind: FollowListKind) {
  const key = `${kind}:${username}`;
  const [state, setState] = useState<ListState>(EMPTY);
  const [reload, setReload] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const errorText = kind === "followers" ? "No pudimos cargar los seguidores" : "No pudimos cargar los seguidos";

  // Primera página: cada vez que cambia el perfil, la pestaña o se reintenta.
  useEffect(() => {
    let cancelled = false;
    usersApi
      .getFollowList(username, kind, { limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        if (!cancelled) setState({ key, users: res.data, total: res.meta.total, hasMore: res.meta.hasMore, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY, key, error: errorText });
      });
    return () => {
      cancelled = true;
    };
  }, [key, username, kind, reload, errorText]);

  const isLoading = state.key !== key;
  const users = isLoading ? [] : state.users;

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !state.hasMore) return;
    const requestKey = key;
    setIsLoadingMore(true);
    try {
      const res = await usersApi.getFollowList(username, kind, { limit: PAGE_SIZE, offset: state.users.length });
      setState((prev) =>
        prev.key === requestKey
          ? { ...prev, users: [...prev.users, ...res.data], total: res.meta.total, hasMore: res.meta.hasMore }
          : prev,
      );
    } catch {
      // Se reintenta solo la próxima vez que el final de la lista vuelva a verse.
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, state.hasMore, state.users.length, key, username, kind]);

  const setFollowing = (targetUsername: string, value: boolean) =>
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.username === targetUsername ? { ...u, isFollowing: value } : u)),
    }));

  const { mutate: toggle } = useMutation(
    async ({ target, follow }: { target: string; follow: boolean }) => {
      if (follow) await usersApi.followUser(target);
      else await usersApi.unfollowUser(target);
    },
    {
      // Si falla, el botón vuelve al estado anterior.
      onError: (_err, { target, follow }) => setFollowing(target, !follow),
    },
  );

  const toggleFollow = useCallback(
    async (user: FollowListUser) => {
      if (pending[user.username]) return;
      const follow = !user.isFollowing;
      setFollowing(user.username, follow);
      setPending((p) => ({ ...p, [user.username]: true }));
      try {
        await toggle({ target: user.username, follow });
      } catch {
        // onError ya revirtió el botón.
      } finally {
        setPending((p) => ({ ...p, [user.username]: false }));
      }
    },
    [pending, toggle],
  );

  const retry = useCallback(() => {
    setState(EMPTY);
    setReload((n) => n + 1);
  }, []);

  return {
    users,
    total: state.total,
    hasMore: !isLoading && state.hasMore,
    isLoading,
    isLoadingMore,
    error: isLoading ? null : state.error,
    pending,
    loadMore: () => void loadMore(),
    retry,
    toggleFollow,
  };
}

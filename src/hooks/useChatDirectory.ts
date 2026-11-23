"use client";

import { useCallback, useEffect, useState } from "react";
import { chatApi, type ChatInfo } from "@/services/chat";
import { searchApi } from "@/services/search";
import { useMutation } from "@/hooks/useMutation";
import { useAuth } from "@/context/AuthContext";
import { useChatRealtime } from "@/context/ChatRealtimeContext";

/**
 * Última lista de chats cargada, por usuario. Al volver a abrir la bandeja o una conversación se muestra al instante
 * lo que ya se tenía y se actualiza por detrás, en vez de pasar por el skeleton cada vez.
 */
let directoryCache: { userId: string; chats: ChatInfo[] } | null = null;
const cachedChats = (userId?: string) => (userId && directoryCache?.userId === userId ? directoryCache.chats : undefined);

export interface ChatSearchUser { id: string; name: string; username: string; avatarUrl?: string }

export function useChatDirectory() {
  const { user } = useAuth();
  const { subscribe } = useChatRealtime();
  const [chats, setChats] = useState<ChatInfo[]>(() => cachedChats(user?.id) ?? []);
  const [isLoading, setIsLoading] = useState(() => !cachedChats(user?.id));
  const [error, setError] = useState<string>();
  const { mutate: getChats } = useMutation(chatApi.getChats);
  const { mutate: createDirect } = useMutation(chatApi.createDirect);
  const { mutate: searchUsers, isLoading: isSearching } = useMutation(async (query: string): Promise<ChatSearchUser[]> => searchApi.searchUsers(query));
  const refresh = useCallback(async () => {
    try {
      const list = await getChats(undefined);
      if (user?.id) directoryCache = { userId: user.id, chats: list };
      setChats(list);
      setError(undefined);
    }
    catch { setError("No pudimos cargar tus conversaciones."); }
    finally { setIsLoading(false); }
  }, [getChats, user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let running = false;
    let requested = false;
    const synchronize = async () => {
      if (running) { requested = true; return; }
      running = true;
      try { do { requested = false; await refresh(); } while (requested && !disposed); }
      finally { running = false; }
    };
    const unsubscribe = subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void synchronize(), 100);
    });
    void synchronize();
    return () => { disposed = true; clearTimeout(timer); unsubscribe(); };
  }, [user?.id, subscribe, refresh]);
  return { chats, isLoading, error, refresh, createDirect, searchUsers, isSearching };
}

export function useChatInfo(id: string) {
  const { user } = useAuth();
  // Si la conversación ya estaba en la lista, el header aparece al instante; igual se pide la versión fresca.
  const [info, setInfo] = useState<{ id: string; data: ChatInfo | null } | undefined>(() => {
    const known = cachedChats(user?.id)?.find((chat) => chat.id === id);
    return known && known.type !== "TRANSFER" ? { id, data: known } : undefined;
  });
  const { mutate: load } = useMutation(async (chatId: string) => {
    const data = await chatApi.getChat(chatId);
    if (data.type === "TRANSFER") {
      const transfer = await chatApi.findTransfer(chatId);
      if (transfer) window.location.href = `/transfers/${transfer}`;
    }
    return data;
  });
  useEffect(() => {
    let active = true;
    void load(id).then((data) => { if (active) setInfo({ id, data }); })
      .catch(() => { if (active) setInfo({ id, data: null }); });
    return () => { active = false; };
  }, [id, load]);
  return { chatInfo: info?.id === id ? info.data : null, isLoadingInfo: info?.id !== id };
}

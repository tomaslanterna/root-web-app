"use client";

import { useState, useEffect, useCallback, useRef, useMemo, type RefObject } from "react";
import { chatApi, messageCursor, type ChatMessage, type MessageType } from "@/services/chat";
import { useChatRealtime } from "@/context/ChatRealtimeContext";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { mergeChatMessages, messageSortKey } from "@/lib/chatMessages";
import { isAxiosError } from "axios";

export type { ChatMessage } from "@/services/chat";

export function useChat(chatId: string | undefined, currentUserId?: string) {
  const { user } = useAuth();
  const userId = currentUserId ?? user?.id;
  const { subscribe, state: connectionState } = useChatRealtime();
  const [snapshot, setSnapshot] = useState<{ chatId?: string; messages: ChatMessage[] }>({ messages: [] });
  const [loadedChat, setLoadedChat] = useState<string>();
  const [error, setError] = useState<string>();
  const [hasMore, setHasMore] = useState(false);
  const messages = useMemo(() => snapshot.chatId === chatId ? snapshot.messages : [], [snapshot, chatId]);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const activeChatRef = useRef(chatId);
  useEffect(() => { activeChatRef.current = chatId; }, [chatId]);
  const { mutate: getPage, isLoading: isLoadingMore } = useMutation(
    ({ id, before }: { id: string; before?: string }) => chatApi.getMessages(id, before),
  );
  const { mutate: acknowledge } = useMutation(
    ({ id, ids, read = false }: { id: string; ids: string[]; read?: boolean }) => chatApi.acknowledge(id, ids, read),
  );
  const { mutate: postMessage } = useMutation(
    ({ id, content, type, clientId }: { id: string; content: string; type: MessageType; clientId: string }) =>
      chatApi.sendMessage(id, { content, type, client_message_id: clientId }),
  );
  const merge = useCallback((id: string, incoming: ChatMessage[]) => {
    if (activeChatRef.current !== id) return;
    setSnapshot((previous) => ({
      chatId: id,
      messages: mergeChatMessages(previous.chatId === id ? previous.messages : [], incoming),
    }));
  }, []);

  const acknowledgeDelivery = useCallback(async (id: string, page: ChatMessage[]) => {
    const ids = page.filter((m) => m.sender_id !== userId && m.status === "sent").map((m) => m.id);
    if (ids.length) await acknowledge({ id, ids });
  }, [acknowledge, userId]);

  const refreshMessages = useCallback(async () => {
    if (!chatId) return;
    const oldest = messagesRef.current.find((m) => m.status !== "sending" && m.status !== "failed");
    let before: string | undefined;
    let firstPage = true;
    // Recover every missed message, even if more than one page arrived offline,
    // and refresh receipts for the history already loaded in this conversation.
    while (activeChatRef.current === chatId) {
      const page = await getPage({ id: chatId, before });
      merge(chatId, page);
      if (firstPage) { setHasMore(page.length === 50); firstPage = false; }
      await acknowledgeDelivery(chatId, page);
      if (page.length < 50 || !oldest || messageSortKey(page[0]) <= messageSortKey(oldest)) break;
      before = messageCursor(page[0]);
    }
    if (activeChatRef.current === chatId) { setLoadedChat(chatId); setError(undefined); }
  }, [chatId, getPage, merge, acknowledgeDelivery]);

  useEffect(() => {
    if (!chatId || !userId) return;
    let disposed = false;
    let running = false;
    let requested = false;
    const synchronize = async () => {
      if (running) { requested = true; return; }
      running = true;
      try {
        do { requested = false; await refreshMessages(); } while (requested && !disposed);
      } catch {
        if (!disposed) { setError("No pudimos cargar los mensajes. Intentá nuevamente."); setLoadedChat(chatId); }
      } finally { running = false; }
    };
    // Subscribe before HTTP history so messages arriving during its request are merged.
    const unsubscribe = subscribe((event) => {
      if (disposed) return;
      if (event.type === "ready" || event.type === "resync") { void synchronize(); return; }
      if ("message" in event && event.chat_id === chatId) merge(chatId, [event.message]);
    });
    void synchronize();
    const onVisible = () => { if (document.visibilityState === "visible") void synchronize(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [chatId, userId, subscribe, refreshMessages, merge]);

  const loadMore = useCallback(async () => {
    if (!chatId || isLoadingMore || !messagesRef.current.length) return;
    const page = await getPage({ id: chatId, before: messageCursor(messagesRef.current[0]) });
    if (activeChatRef.current !== chatId) return;
    merge(chatId, page);
    setHasMore(page.length === 50);
    await acknowledgeDelivery(chatId, page);
  }, [chatId, isLoadingMore, getPage, merge, acknowledgeDelivery]);

  const transmit = useCallback(async (optimistic: ChatMessage) => {
    const id = optimistic.chat_id;
    merge(id, [{ ...optimistic, status: "sending" }]);
    try {
      const variables = { id, content: optimistic.content, type: optimistic.type, clientId: optimistic.id };
      let real: ChatMessage;
      try { real = await postMessage(variables); }
      catch (failure) {
        // A response may have been lost after commit. Retry using exactly the same UUID.
        if (isAxiosError(failure) && failure.response && failure.response.status < 500) throw failure;
        real = await postMessage(variables);
      }
      merge(id, [real]);
      return real;
    } catch (failure) {
      if (activeChatRef.current === id) {
        setSnapshot((previous) => ({
          ...previous,
          messages: previous.messages.map((m) => m.id === optimistic.id && (m.status === "sending" || m.status === "failed")
            ? { ...m, status: "failed" } : m),
        }));
      }
      throw failure;
    }
  }, [merge, postMessage]);

  const sendMessage = async (content: string, type: MessageType = "text", senderHint?: string) => {
    if (!chatId || !userId || !content.trim() || (senderHint && senderHint !== userId)) return null;
    return transmit({
      id: crypto.randomUUID(), chat_id: chatId, sender_id: userId,
      content: content.trim(), type, metadata: null,
      timestamp: new Date().toISOString(), status: "sending",
    });
  };
  const retryMessage = async (id: string) => {
    const message = messagesRef.current.find((candidate) => candidate.id === id);
    if (message) return transmit(message);
  };

  return {
    messages, isLoading: loadedChat !== chatId, isLoadingMore, hasMore, error,
    sendMessage, retryMessage, refreshMessages, loadMore, connectionState,
  };
}

// Read only the incoming bubbles actually visible in the active, focused tab.
// Delivery and read acknowledgements are intentionally separate.
export function useVisibleMessageReceipts(
  chatId: string, messages: ChatMessage[], userId: string | undefined,
  viewport: RefObject<HTMLDivElement | null>, enabled = true,
) {
  const pending = useRef(new Set<string>());
  const { mutate: acknowledge } = useMutation((ids: string[]) => chatApi.acknowledge(chatId, ids, true));
  useEffect(() => {
    const root = viewport.current;
    if (!root || !userId || !enabled) return;
    const visible = new Set<string>();
    const unread = new Set(messages.filter((m) => m.sender_id !== userId && m.status !== "read").map((m) => m.id));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      const ids = [...visible].filter((id) => unread.has(id) && !pending.current.has(id)).slice(0, 100);
      if (!ids.length) return;
      ids.forEach((id) => pending.current.add(id));
      void acknowledge(ids).catch(() => ids.forEach((id) => pending.current.delete(id)));
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(flush, 80); };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.messageId;
        if (!id) continue;
        if (entry.isIntersecting && entry.intersectionRect.height >= Math.min(entry.boundingClientRect.height * 0.6, root.clientHeight * 0.6)) visible.add(id); else visible.delete(id);
      }
      schedule();
    }, { root, threshold: [0, 0.2, 0.4, 0.6, 1] });
    root.querySelectorAll("[data-message-id]").forEach((element) => observer.observe(element));
    window.addEventListener("focus", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("focus", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [chatId, messages, userId, viewport, enabled, acknowledge]);
}

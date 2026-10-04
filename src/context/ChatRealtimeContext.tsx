"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { chatApi, connectChatSocket, type ChatRealtimeEvent } from "@/services/chat";

type Listener = (event: ChatRealtimeEvent) => void;
const ChatRealtimeContext = createContext<{
  subscribe: (listener: Listener) => () => void;
  state: "connecting" | "connected" | "disconnected";
} | null>(null);

export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { token, user, logout } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const listeners = useRef(new Set<Listener>());
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);
  const { mutate: acknowledge } = useMutation(({ chatId, ids }: { chatId: string; ids: string[] }) => chatApi.acknowledge(chatId, ids));
  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => { listeners.current.delete(listener); };
  }, []);
  useEffect(() => {
    if (!token || !userId) return;
    return connectChatSocket(token, (event) => {
      if (event.type === "message.created" && event.message.sender_id !== userId) {
        void acknowledge({ chatId: event.chat_id, ids: [event.message.id] }).catch(() => undefined);
      }
      for (const listener of listeners.current) listener(event);
    }, setState, () => { void logoutRef.current().catch(() => undefined); });
  }, [token, userId, acknowledge]);
  return <ChatRealtimeContext.Provider value={{ subscribe, state: token ? state : "disconnected" }}>{children}</ChatRealtimeContext.Provider>;
}

export function useChatRealtime() {
  const value = useContext(ChatRealtimeContext);
  if (!value) throw new Error("useChatRealtime requires ChatRealtimeProvider");
  return value;
}

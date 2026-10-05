import { api } from "@/lib/api";

export type MessageType = "text" | "image" | "system";
export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  metadata: unknown;
  timestamp: string;
  status?: MessageDeliveryStatus;
  read_at?: string | null;
  delivered_at?: string | null;
}

export interface SendMessageRequest {
  content: string;
  type: MessageType;
  client_message_id?: string;
}

export interface ChatParticipant { id: string; name: string; username?: string; avatarUrl?: string }
export interface ChatInfo {
  id: string;
  type: "DIRECT" | "TRANSFER" | "CREWS";
  participants?: ChatParticipant[];
  last_message: string;
  updated_at: string;
  unread_count?: number;
  squad_id?: string;
  name?: string;
  event_id?: string;
}

export type ChatRealtimeEvent =
  | { type: "ready" | "resync" }
  | { type: "chat.created"; chat_id: string }
  | { type: "message.created" | "message.updated"; chat_id: string; message: ChatMessage };

export const messageCursor = (message: ChatMessage) => `${message.timestamp}|${message.id}`;

export const chatApi = {
  getMessages: async (chatId: string, before?: string | null): Promise<ChatMessage[]> => {
    const { data } = await api.get<ChatMessage[]>(`/v1/chats/${chatId}/messages`, {
      params: before ? { before } : undefined,
    });
    return data ?? [];
  },

  sendMessage: async (chatId: string, params: SendMessageRequest): Promise<ChatMessage> => {
    const { data } = await api.post<ChatMessage>(`/v1/chats/${chatId}/messages`, params);
    return data;
  },

  markMessagesRead: async (chatId: string): Promise<void> => {
    await api.patch(`/v1/chats/${chatId}/messages/read`);
  },
  acknowledge: async (chatId: string, message_ids: string[], read = false): Promise<void> => {
    await api.post(`/v1/chats/${chatId}/receipts`, { message_ids, read });
  },
  getChats: async (): Promise<ChatInfo[]> => {
    const { data } = await api.get<ChatInfo[]>("/v1/chats");
    return data ?? [];
  },
  getChat: async (id: string): Promise<ChatInfo> => {
    const { data } = await api.get<ChatInfo>(`/v1/chats/${id}`);
    return data;
  },
  createDirect: async (target_user_id: string): Promise<ChatInfo> => {
    const { data } = await api.post<ChatInfo>("/v1/chats/direct", { target_user_id });
    return data;
  },
  findTransfer: async (chatId: string): Promise<string | undefined> => {
    const { data } = await api.get<{ id: string; chat_id: string }[]>("/v1/transfers");
    return data?.find((transfer) => transfer.chat_id === chatId)?.id;
  },
};

// A single provider owns this connection. Authentication is the first frame,
// never a URL parameter, so access logs cannot contain the bearer token.
export function connectChatSocket(
  token: string,
  onEvent: (event: ChatRealtimeEvent) => void,
  onState: (state: "connecting" | "connected" | "disconnected") => void,
  onExpired: () => void,
): () => void {
  let stopped = false;
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  const open = () => {
    if (stopped) return;
    const url = new URL(api.defaults.baseURL || window.location.origin, window.location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/v1/chats/ws`;
    url.search = "";
    onState("connecting");
    const connection = new WebSocket(url);
    socket = connection;
    connection.onopen = () => connection.send(JSON.stringify({ type: "authenticate", token }));
    connection.onmessage = ({ data }) => {
      if (stopped) return;
      try {
        const event: ChatRealtimeEvent = JSON.parse(data);
        if (event.type === "ready") { attempts = 0; onState("connected"); }
        if (["ready", "resync", "chat.created", "message.created", "message.updated"].includes(event.type)) onEvent(event);
      } catch { connection.close(1002, "Invalid event"); }
    };
    connection.onclose = ({ code }) => {
      if (stopped) return;
      onState("disconnected");
      if (code === 4401) { stopped = true; onExpired(); return; }
      retry = setTimeout(open, Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) + Math.random() * 500);
    };
    connection.onerror = () => connection.close();
  };
  const online = () => {
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    clearTimeout(retry);
    open();
  };
  window.addEventListener("online", online);
  open();
  return () => {
    stopped = true;
    clearTimeout(retry);
    window.removeEventListener("online", online);
    if (socket) { socket.onclose = null; socket.onmessage = null; socket.close(); }
  };
}

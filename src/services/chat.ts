import { api } from "@/lib/api";

export interface SendMessageRequest {
  content: string;
  type: "text" | "image" | "system";
}

export const chatApi = {
  getMessages: async (chatId: string, afterTimestamp?: string | null): Promise<any[]> => {
    let url = `/v1/chats/${chatId}/messages`;
    if (afterTimestamp) {
      url += `?after_timestamp=${encodeURIComponent(afterTimestamp)}`;
    }
    const { data } = await api.get(url);
    return data;
  },

  sendMessage: async (chatId: string, params: SendMessageRequest): Promise<any> => {
    const { data } = await api.post(`/v1/chats/${chatId}/messages`, params);
    return data;
  }
};

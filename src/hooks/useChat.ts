import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export type MessageType = 'text' | 'image' | 'system';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  metadata: any;
  timestamp: string;
}

export function useChat(chatId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to keep track of the latest timestamp without triggering re-renders in the effect loop
  const lastTimestampRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      let url = `/v1/chats/${chatId}/messages`;
      if (lastTimestampRef.current) {
        url += `?after_timestamp=${encodeURIComponent(lastTimestampRef.current)}`;
      }

      const res = await api.get(url);
      const newMessages: ChatMessage[] = res.data;

      if (newMessages.length > 0) {
        // Update the last timestamp
        const latestMsg = newMessages[newMessages.length - 1];
        lastTimestampRef.current = latestMsg.timestamp;

        setMessages((prev) => {
          // Prevent duplicates just in case
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Initial fetch and Polling logic
  useEffect(() => {
    if (!chatId) return;

    // Fetch immediately on mount
    fetchMessages();

    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchMessages();
        }
      }, 10000); // 10 seconds short polling
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Fetch immediately when user comes back to the tab
        fetchMessages();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, fetchMessages]);

  const sendMessage = async (content: string, type: MessageType = 'text', currentUserId: string) => {
    if (!chatId || !content.trim()) return null;

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: currentUserId,
      content,
      type,
      metadata: null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api.post(`/v1/chats/${chatId}/messages`, {
        content,
        type,
      });
      
      const realMsg: ChatMessage = res.data;
      
      // Update lastTimestamp if this is the newest message
      if (!lastTimestampRef.current || realMsg.timestamp > lastTimestampRef.current) {
        lastTimestampRef.current = realMsg.timestamp;
      }

      // Replace optimistic message with the real one from server
      setMessages((prev) => 
        prev.map((msg) => (msg.id === optimisticMsg.id ? realMsg : msg))
      );
      
      return realMsg;
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMsg.id));
      throw error;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    setMessages, // exposed just in case it's needed for other optimistic updates
  };
}

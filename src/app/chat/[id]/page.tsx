"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.id;
  
  const { user: currentUser } = useAuth();
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  
  const [message, setMessage] = useState("");
  
  const { messages, isLoading: isLoadingChat, sendMessage } = useChat(chatId);

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const res = await api.get(`/v1/chats/${chatId}`);
        setChatInfo(res.data);
      } catch (err) {
        console.error("Error fetching chat info", err);
      } finally {
        setIsLoadingInfo(false);
      }
    };
    if (chatId) fetchChatInfo();
  }, [chatId]);

  if (isLoadingInfo) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0B0D10]">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }

  if (!chatInfo) {
    return <div className="p-6 text-center text-neutral-400 font-bold uppercase">Chat no encontrado</div>;
  }

  const otherUser = chatInfo.participants?.find((p: any) => p.id !== currentUser?.id) || chatInfo.participants?.[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;
    try {
      await sendMessage(message, "text", currentUser.id);
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0B0D10] text-white">
      <header className="px-4 py-3 border-b border-white/10 flex items-center gap-3 glass-header-obsidian sticky top-0 z-40 shrink-0">
        <Link href="/chat" className="p-1 rounded-full hover:bg-white/10 text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Avatar src={otherUser?.avatarUrl} fallback={otherUser?.name || "U"} size="sm" className="ring-2 ring-[#D4FF00]/40" />
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-white">{otherUser?.name}</p>
          <span className="text-[10px] text-[#D4FF00] font-bold uppercase">En línea</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoadingChat && messages.length === 0 ? (
           <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-[#D4FF00] animate-spin" /></div>
        ) : messages.length === 0 ? (
           <p className="text-center text-xs text-neutral-500 py-10 font-bold uppercase tracking-wider">No hay mensajes aún.</p>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-[#D4FF00] text-black rounded-br-sm font-medium"
                      : "bg-[#14171F] text-white rounded-bl-sm border border-white/10"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] font-bold text-neutral-500 mt-1 mx-1 uppercase tracking-wider">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 bg-[#0B0D10] border-t border-white/10">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-[#14171F] border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4FF00]/50 transition-colors"
          />
          <Button
            type="submit"
            disabled={!message.trim()}
            className="w-12 h-12 rounded-full bg-[#D4FF00] text-black hover:bg-[#b3d600] shrink-0 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 flex items-center justify-center p-0"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

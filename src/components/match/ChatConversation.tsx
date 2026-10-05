"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Check, CheckCheck, ChevronLeft, Send, Loader2, Clock3 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat, useVisibleMessageReceipts, type ChatMessage } from "@/hooks/useChat";
import { useChatInfo } from "@/hooks/useChatDirectory";

export function ChatConversation({ chatId }: { chatId: string }) {

  const { user: currentUser } = useAuth();
  const { chatInfo, isLoadingInfo } = useChatInfo(chatId);

  const [message, setMessage] = useState("");
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef(false);
  const nearBottomRef = useRef(true);
  const previousLastIdRef = useRef<string | undefined>(undefined);

  const { messages, isLoading: isLoadingChat, sendMessage, retryMessage, connectionState, hasMore, loadMore, isLoadingMore, error, refreshMessages } = useChat(chatId, currentUser?.id);
  useVisibleMessageReceipts(chatId, messages, currentUser?.id, chatAreaRef, !isLoadingInfo);

  useEffect(() => {
    hasScrolledToBottomRef.current = false;
    nearBottomRef.current = true;
    previousLastIdRef.current = undefined;
  }, [chatId]);

  useEffect(() => {
    if (isLoadingInfo || isLoadingChat || messages.length === 0) return;
    const lastId = messages[messages.length - 1]?.id;
    const shouldScroll = !hasScrolledToBottomRef.current || (nearBottomRef.current && previousLastIdRef.current !== lastId);
    previousLastIdRef.current = lastId;
    if (!shouldScroll) return;

    const animationFrame = requestAnimationFrame(() => {
      const chatArea = chatAreaRef.current;
      if (!chatArea) return;

      chatArea.scrollTop = chatArea.scrollHeight;
      hasScrolledToBottomRef.current = true;
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isLoadingInfo, isLoadingChat, messages]);

  const loadOlderMessages = async () => {
    const area = chatAreaRef.current;
    if (!area) return;
    const height = area.scrollHeight;
    const top = area.scrollTop;
    await loadMore();
    requestAnimationFrame(() => { area.scrollTop = top + area.scrollHeight - height; });
  };

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

  const otherUser = chatInfo.participants?.find((participant) => participant.id !== currentUser?.id) || chatInfo.participants?.[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;
    try {
      const content = message;
      setMessage("");
      await sendMessage(content, "text", currentUser.id);
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
      <header className="px-4 pb-3 pt-safe-header border-b border-white/10 flex items-center gap-3 glass-header-obsidian sticky top-0 z-40 shrink-0">
        <Link href="/chat" className="p-1 rounded-full hover:bg-white/10 text-white transition-colors md:hidden">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Avatar src={otherUser?.avatarUrl} fallback={otherUser?.name || "U"} size="sm" className="ring-2 ring-[#D4FF00]/40" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-white truncate">{chatInfo.type === "CREWS" ? chatInfo.name || `Crew · ${chatInfo.participants?.length ?? 0} integrantes` : otherUser?.name}</p>
          <span className="text-[10px] text-[#D4FF00] font-bold uppercase">{connectionState === "connected" ? "Conectado" : "Reconectando…"}</span>
        </div>
        {chatInfo.event_id && <Link href={`/events/${chatInfo.event_id}`} className="shrink-0 text-[10px] font-bold text-[#D4FF00] uppercase">Ver evento</Link>}
      </header>

      {/* Chat Area */}
      <div ref={chatAreaRef} onScroll={() => {
        const area = chatAreaRef.current;
        if (area) nearBottomRef.current = area.scrollHeight - area.scrollTop - area.clientHeight < 100;
      }} className="flex-1 overflow-y-auto px-4 py-4">
        {hasMore && <button onClick={() => void loadOlderMessages().catch(() => undefined)} disabled={isLoadingMore} className="mb-4 w-full text-xs text-neutral-400">{isLoadingMore ? "Cargando…" : "Cargar mensajes anteriores"}</button>}
        {error && <button onClick={() => void refreshMessages().catch(() => undefined)} className="mb-3 text-xs text-red-300">{error}</button>}
        {isLoadingChat && messages.length === 0 ? (
           <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-[#D4FF00] animate-spin" /></div>
        ) : messages.length === 0 ? (
           <p className="text-center text-xs text-neutral-500 py-10 font-bold uppercase tracking-wider">No hay mensajes aún.</p>
        ) : (
          messages.map((msg: ChatMessage, index) => {
            const isMe = msg.sender_id === currentUser?.id;
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const hasPreviousFromSameSender = previousMessage?.sender_id === msg.sender_id;
            const hasNextFromSameSender = nextMessage?.sender_id === msg.sender_id;
            const spacingClass = index === 0 ? "" : hasPreviousFromSameSender ? "mt-1" : "mt-4";
            const deliveryStatus = msg.status ?? "sent";
            const deliveryLabel = { sending: "Enviando", sent: "Enviado", delivered: "Entregado", read: "Leído", failed: "No enviado" }[deliveryStatus];
            const bubbleShapeClass = isMe
              ? hasPreviousFromSameSender && hasNextFromSameSender
                ? "rounded-r-sm"
                : hasPreviousFromSameSender
                  ? "rounded-tr-sm"
                  : "rounded-br-sm"
              : hasPreviousFromSameSender && hasNextFromSameSender
                ? "rounded-l-sm"
                : hasPreviousFromSameSender
                  ? "rounded-tl-sm"
                  : "rounded-bl-sm";

            return (
              <div
                key={msg.id}
                data-message-id={msg.id}
                className={`flex flex-col max-w-[85%] ${spacingClass} ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-[#D4FF00] text-black font-medium"
                      : "bg-[#14171F] text-white border border-white/10"
                  } ${bubbleShapeClass}`}
                >
                  {!isMe && chatInfo.type === "CREWS" && !hasPreviousFromSameSender && (
                    <p className="mb-1 text-[10px] font-bold text-[#D4FF00]">{chatInfo.participants?.find((p) => p.id === msg.sender_id)?.name || "Integrante"}</p>
                  )}
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                </div>
                {msg.status === "failed" && <button onClick={() => void retryMessage(msg.id).catch(() => undefined)} className="mt-1 text-[10px] text-red-300">No se envió. Reintentar</button>}
                {!hasNextFromSameSender && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-neutral-500 mt-1 mx-1 uppercase tracking-wider">
                    {formatTime(msg.timestamp)}
                    {isMe && (
                      <span
                        aria-label={deliveryLabel}
                        title={deliveryLabel}
                        className={deliveryStatus === "read" ? "text-[#D4FF00]" : "text-neutral-500"}
                      >
                        {deliveryStatus === "sending" ? (
                          <Clock3 className="h-3 w-3 animate-pulse" aria-hidden="true" />
                        ) : deliveryStatus === "sent" || deliveryStatus === "failed" ? (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </span>
                )}
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
            maxLength={4000}
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

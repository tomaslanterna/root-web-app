"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Lock,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  Check,
  SmilePlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCommunityChat } from "@/hooks/useCommunities";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CommunityChatMode } from "@/types/communities";

const QUICK_REACTION_EMOJIS = ["🔥", "❤️", "⚡", "🙌", "🎧", "🚀", "👏", "🖤"];

interface BroadcastChannelProps {
  communityId: string;
  communityName: string;
  isRRPP: boolean;
  isMember: boolean;
}

export function BroadcastChannel({
  communityId,
  communityName,
  isRRPP,
  isMember,
}: BroadcastChannelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    messages,
    chatMode,
    isLoading,
    isSending,
    isUpdatingMode,
    error,
    loadChat,
    toggleChatMode,
    sendMessage,
    reactToMessage,
  } = useCommunityChat(communityId, user, isRRPP);

  const [inputText, setInputText] = useState("");
  const [pickerOpenMsgId, setPickerOpenMsgId] = useState<string | null>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isInitialScrollRef = useRef(true);

  useEffect(() => {
    void loadChat();
  }, [loadChat]);

  // Scroll to bottom inside the chat container without moving the window
  useEffect(() => {
    const area = chatAreaRef.current;
    if (!area) return;
    if (isInitialScrollRef.current) {
      area.scrollTop = area.scrollHeight;
      if (messages.length > 0) {
        isInitialScrollRef.current = false;
      }
    } else {
      area.scrollTo({ top: area.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    await sendMessage(trimmed);
    setInputText("");
    // Ensure scroll after sending
    requestAnimationFrame(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTo({
          top: chatAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  };

  const handleReactionClick = (messageId: string, emoji: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    void reactToMessage(messageId, emoji);
  };

  const isInputDisabled = !isRRPP && chatMode === "broadcast_only";

  const getPlaceholder = () => {
    if (isRRPP) {
      return "Enviar comunicado oficial como RRPP...";
    }
    if (chatMode === "broadcast_only") {
      return "Solo el administrador puede enviar mensajes";
    }
    return "Escribí un mensaje en la comunidad...";
  };

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-[#111114] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] h-[calc(100dvh-12rem-var(--root-safe-top,env(safe-area-inset-top,0px))-var(--root-safe-bottom,env(safe-area-inset-bottom,0px)))] sm:h-[calc(100dvh-13.5rem)] mb-[calc(5rem+var(--root-safe-bottom,env(safe-area-inset-bottom,0px)))] sm:mb-20">
        {/* Header */}
        <div className="shrink-0 flex flex-col gap-2.5 border-b border-white/[0.06] bg-[#0E1118]/80 p-3 sm:p-4 md:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-0 bg-[#D4FF00]/15 text-[#D4FF00] shadow-sm">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="tech-label text-xs sm:text-sm text-white truncate">
                  Canal de Difusión
                </h2>
                {chatMode === "broadcast_only" ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-0 bg-yellow-500/15 px-2 py-0.5 tech-label text-[8px] sm:text-[9px] text-yellow-400">
                    <Volume2 className="h-2.5 w-2.5" /> Solo Difusión
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-0 bg-emerald-500/15 px-2 py-0.5 tech-label text-[8px] sm:text-[9px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Chat Abierto
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
                {chatMode === "broadcast_only"
                  ? "Canal unidireccional administrado por RRPP"
                  : "Chat abierto para miembros"}
              </p>
            </div>
          </div>

          {/* RRPP Controls: Mode Switch Toggle */}
          {isRRPP && (
            <div className="flex items-center justify-between sm:justify-end gap-2.5 rounded-xl border-0 bg-white/[0.04] px-2.5 py-1 sm:px-3 sm:py-1.5 shrink-0">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-300">
                {chatMode === "broadcast_only" ? "Abrir chat a miembros" : "Chat abierto a miembros"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={chatMode === "open_chat"}
                disabled={isUpdatingMode}
                onClick={() =>
                  void toggleChatMode(
                    chatMode === "broadcast_only" ? "open_chat" : "broadcast_only",
                  )
                }
                className={cn(
                  "relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  chatMode === "open_chat" ? "bg-[#D4FF00]" : "bg-neutral-700",
                  isUpdatingMode && "opacity-60",
                )}
              >
                <span className="sr-only">Cambiar modo de canal</span>
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out",
                    chatMode === "open_chat" ? "translate-x-4 sm:translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div
          ref={chatAreaRef}
          className="flex flex-1 flex-col overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3 bg-gradient-to-b from-[#111114] to-[#0B0D10]"
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#D4FF00]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-6 text-neutral-500 py-14">
              <MessageSquare className="h-9 w-9 mb-2 text-neutral-600" />
              <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
                No hay mensajes en este canal
              </p>
              <p className="mt-1 text-[11px] text-neutral-500 max-w-xs">
                {isRRPP
                  ? "Inaugurá el canal compartiendo un primer comunicado para tus miembros."
                  : "El RRPP aún no ha compartido mensajes en este canal."}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const senderRoleUpper = message.senderRole?.toUpperCase();
              const isMsgRRPP = senderRoleUpper === "RRPP" || senderRoleUpper === "ADMIN";
              const isMine = user && message.senderId === user.id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-2 sm:gap-3 max-w-[92%] sm:max-w-[78%]",
                    isMine ? "ml-auto flex-row-reverse" : "mr-auto",
                  )}
                >
                  <Avatar
                    src={message.senderAvatar}
                    fallback={message.senderName || "U"}
                    size="sm"
                    className="mt-0.5 shrink-0 h-7 w-7 sm:h-8 sm:w-8 ring-1 ring-white/10"
                  />

                  <div
                    className={cn(
                      "group relative rounded-2xl p-2.5 sm:p-3.5 shadow-md transition-all min-w-0 break-words",
                      isMsgRRPP
                        ? "border-0 bg-[#1A1F2B] text-white shadow-sm"
                        : isMine
                          ? "border-0 bg-[#1D2230] text-white shadow-sm"
                          : "border-0 bg-[#16171D] text-neutral-200 shadow-sm",
                    )}
                  >
                    {/* Sender Header */}
                    <div className="mb-1 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">
                          {message.senderName}
                        </span>
                        {isMsgRRPP && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-[#D4FF00]/20 px-1.5 py-0.2 text-[8px] font-black uppercase text-[#D4FF00]">
                            <Crown className="h-2.5 w-2.5" /> RRPP
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 tech-mono text-[8px] sm:text-[9px] text-neutral-500">
                        {new Date(message.timestamp).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Message Content */}
                    <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-neutral-200">
                      {message.content}
                    </p>

                    {/* Emoji Reactions for RRPP messages */}
                    {isMsgRRPP && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/[0.06] relative">
                        {message.reactions &&
                          message.reactions.map((reaction) => {
                            const hasReacted = Boolean(
                              user && reaction.users.includes(user.id),
                            );

                            return (
                              <button
                                key={reaction.emoji}
                                type="button"
                                onClick={() =>
                                  handleReactionClick(message.id, reaction.emoji)
                                }
                                className={cn(
                                  "group/reaction inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all select-none active:scale-95 cursor-pointer",
                                  hasReacted
                                    ? "border-0 bg-[#D4FF00]/20 text-[#D4FF00] shadow-[0_0_12px_rgba(212,255,0,0.2)]"
                                    : "border-0 bg-white/5 text-neutral-300 hover:bg-white/10 shadow-sm",
                                )}
                                title={
                                  hasReacted
                                    ? "Quitar reacción"
                                    : `Reaccionar con ${reaction.emoji}`
                                }
                              >
                                <span className="text-xs transition-transform group-hover/reaction:scale-110">
                                  {reaction.emoji}
                                </span>
                                <span className="num-display text-[11px]">
                                  {reaction.count}
                                </span>
                              </button>
                            );
                          })}

                        {/* Add reaction trigger button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerOpenMsgId(
                                pickerOpenMsgId === message.id ? null : message.id,
                              )
                            }
                            className={cn(
                              "inline-flex items-center justify-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all active:scale-95 cursor-pointer",
                              pickerOpenMsgId === message.id
                                ? "border-0 bg-[#D4FF00]/20 text-[#D4FF00] shadow-sm"
                                : "border-0 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white shadow-sm",
                            )}
                            title="Reaccionar al comunicado del RRPP"
                            aria-label="Reaccionar"
                          >
                            <SmilePlus className="h-3 w-3 text-neutral-400" />
                            <span>+</span>
                          </button>

                          {/* Floating Emoji Picker Popover */}
                          {pickerOpenMsgId === message.id && (
                            <>
                              {/* Invisible backdrop to close picker when clicking outside */}
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setPickerOpenMsgId(null)}
                              />
                              <div className="absolute bottom-full left-0 mb-1.5 z-40 flex items-center gap-1 rounded-full border-0 bg-[#16171D] p-1 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                                {QUICK_REACTION_EMOJIS.map((emoji) => {
                                  const hasReacted = Boolean(
                                    user &&
                                      message.reactions
                                        ?.find((r) => r.emoji === emoji)
                                        ?.users.includes(user.id),
                                  );

                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        handleReactionClick(message.id, emoji);
                                        setPickerOpenMsgId(null);
                                      }}
                                      className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-transform hover:scale-125 active:scale-110 cursor-pointer",
                                        hasReacted &&
                                          "bg-[#D4FF00]/20 ring-1 ring-[#D4FF00]/40",
                                      )}
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Fixed Chat Input Footer */}
      <footer className="fixed bottom-0 inset-x-0 z-30 liquid-glass-bar shadow-[0_-12px_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Liquid Glass: Specular top edge highlight */}
        <div className="liquid-glass-specular" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-3.5 pt-2.5 pb-[calc(0.75rem+var(--root-safe-bottom,env(safe-area-inset-bottom,0px)))] sm:px-6 sm:py-3.5">
          {error && (
            <p className="mb-2 text-xs font-bold text-red-400" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={getPlaceholder()}
                disabled={isInputDisabled || isSending}
                maxLength={1000}
                className={cn(
                  "h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl border-0 px-3 sm:px-4 pr-9 text-xs sm:text-sm font-medium text-white outline-none transition-colors shadow-sm",
                  isInputDisabled
                    ? "cursor-not-allowed bg-black/40 text-neutral-500 placeholder:text-neutral-600"
                    : "bg-black/40 placeholder:text-neutral-500 focus:ring-1 focus:ring-[#D4FF00]/50 backdrop-blur-md",
                )}
              />
              {isInputDisabled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant={isInputDisabled ? "outline" : "primary"}
              disabled={isInputDisabled || !inputText.trim() || isSending}
              className="h-11 sm:h-12 px-3.5 sm:px-5 shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Enviar</span>
            </Button>
          </form>

          {isInputDisabled && (
            <p className="mt-1.5 text-center text-[10px] font-medium text-neutral-500">
              🔒 Solo el administrador puede enviar mensajes en este canal.
            </p>
          )}
        </div>
      </footer>
    </>
  );
}

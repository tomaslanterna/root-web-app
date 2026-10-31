"use client";

import { useMatch } from "@/context/MatchContext";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronLeft, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrewMonogram } from "@/components/match/CrewMonogram";
import Link from "next/link";
import { useState } from "react";
import {
  useChatDirectory,
  type ChatSearchUser,
} from "@/hooks/useChatDirectory";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useNativeBackHandler } from "@/hooks/useNativeBack";

export function ChatList({ className, onBack, backButtonRef }: { className?: string; embedded?: boolean; onBack?: () => void; backButtonRef?: React.Ref<HTMLButtonElement> }) {
  const { squads } = useMatch();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const {
    chats,
    isLoading,
    error,
    refresh,
    createDirect,
    searchUsers,
    isSearching,
  } = useChatDirectory();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  useNativeBackHandler(isSearchModalOpen, () => setIsSearchModalOpen(false));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSearchUser[]>([]);
  const [inboxFilter, setInboxFilter] = useState("");

  const userSquads = squads.filter(
    (s) =>
      s.members?.some((m) => m.userId === currentUser?.id) &&
      !chats.some((chat) => chat.id === s.chatRoomId),
  );

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const users = await searchUsers(searchQuery);
      setSearchResults(users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    try {
      const chat = await createDirect(targetUserId);
      setIsSearchModalOpen(false);
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Error creating chat", err);
    }
  };

  const query = inboxFilter.trim().toLowerCase();
  const visibleChats = chats
    .filter((chat) => chat.type !== "TRANSFER")
    .map((chat) => {
      const otherUser =
        chat.participants?.find((p) => p.id !== currentUser?.id) || chat.participants?.[0];
      const title =
        chat.type === "CREWS"
          ? chat.name || `Crew · ${chat.participants?.length ?? 0} integrantes`
          : otherUser?.name || "Usuario";
      return { chat, otherUser, title };
    })
    .filter(({ title, otherUser }) =>
      !query ||
      title.toLowerCase().includes(query) ||
      (otherUser?.username ?? "").toLowerCase().includes(query),
    );
  const visibleSquads = userSquads.filter(
    (sq) => !query || sq.name.toLowerCase().includes(query) || (sq.eventTitle ?? "").toLowerCase().includes(query),
  );

  const rowClass = "flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

  return (
    <div className={`flex flex-col h-full bg-bg text-ink ${className || ""}`}>
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md border-b border-line px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
        {onBack && (
          <button
            ref={backButtonRef}
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
        )}
        <h1 className="font-display text-[26px] m-0 flex-1">Mensajes</h1>
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          aria-label="Nuevo chat"
          className="size-11 shrink-0 rounded-control bg-accent text-on-accent flex items-center justify-center hover:bg-accent-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </header>

      <div className="mx-4 mt-4 h-12 px-3.5 flex items-center gap-2.5 rounded-control bg-surface border border-white/10 text-ink-3 focus-within:border-accent">
        <Search className="size-5 shrink-0" aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar conversaciones"
          placeholder="Buscar por nombre o @usuario"
          value={inboxFilter}
          onChange={(e) => setInboxFilter(e.target.value)}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-ink text-[15px] placeholder:text-ink-3"
        />
      </div>

      {error && (
        <button type="button" onClick={() => void refresh()} className="mx-4 mt-3 min-h-11 text-left text-sm text-danger">
          {error} Reintentar
        </button>
      )}

      {visibleSquads.length > 0 && (
        <section aria-labelledby="inbox-squads" className="mt-6">
          <h2 id="inbox-squads" className="label-mono text-ink-2 mx-4 mb-1.5">Crews de eventos</h2>
          {visibleSquads.map((sq) => (
            <Link key={sq.id} href={`/chat/squad/${sq.id}`} className={rowClass}>
              <CrewMonogram
                name={sq.eventTitle || sq.name}
                imageUrl={sq.eventImage || undefined}
                className="size-[52px] rounded-control text-[11px]"
              />
              <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span className="text-base font-semibold truncate">{sq.name}</span>
                <span className="text-sm text-ink-2 truncate">{sq.eventTitle}</span>
              </span>
            </Link>
          ))}
          <div className="h-px mx-4 mt-3 bg-line" />
        </section>
      )}

      <section aria-labelledby="inbox-direct" className="mt-6">
        <h2 id="inbox-direct" className="label-mono text-ink-2 mx-4 mb-1.5">Conversaciones</h2>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="size-6 animate-spin text-accent" aria-label="Cargando conversaciones" />
          </div>
        ) : visibleChats.length === 0 ? (
          <p className="mx-4 py-6 text-center text-[15px] text-ink-2">
            {query ? "No hay conversaciones con ese nombre." : "Todavía no tenés conversaciones."}
          </p>
        ) : (
          visibleChats.map(({ chat, otherUser, title }) => {
            const unread = chat.unread_count ?? 0;
            return (
              <Link key={chat.id} href={`/chat/${chat.id}`} className={rowClass}>
                <Avatar
                  src={otherUser?.avatarUrl}
                  fallback={otherUser?.name || "U"}
                  className="size-[52px] rounded-full shrink-0"
                />
                <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <span className="flex justify-between items-baseline gap-2">
                    <span className="text-base font-semibold truncate">
                      {title}
                      {chat.type !== "CREWS" && otherUser?.username && (
                        <span className="font-normal text-ink-3"> @{otherUser.username}</span>
                      )}
                    </span>
                    <span className={`num-mono text-xs shrink-0 ${unread ? "text-accent" : "text-ink-3"}`}>
                      {formatChatTime(chat.updated_at)}
                    </span>
                  </span>
                  <span className="flex justify-between items-center gap-2">
                    <span className={`text-sm truncate ${unread ? "text-ink font-medium" : "text-ink-2"}`}>
                      {chat.last_message || "Todavía no hay mensajes"}
                    </span>
                    {!!unread && (
                      <span
                        aria-label={`${unread} sin leer`}
                        className="num-mono min-w-[22px] h-[22px] px-1.5 shrink-0 rounded-full bg-accent text-on-accent text-xs font-semibold flex items-center justify-center"
                      >
                        {unread}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </section>

      {isSearchModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="new-chat-title" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/75">
          <div className="w-full sm:max-w-sm p-4 pb-[calc(1rem+var(--root-safe-bottom))] rounded-t-hero sm:rounded-hero bg-surface border border-line flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 id="new-chat-title" className="m-0 text-[17px] font-semibold">Nuevo chat</h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                aria-label="Cerrar"
                className="size-11 rounded-full flex items-center justify-center text-ink-2 hover:bg-white/10 hover:text-ink"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSearchUsers} className="flex gap-2">
              <label htmlFor="new-chat-search" className="sr-only">Buscar persona</label>
              <input
                id="new-chat-search"
                type="search"
                autoFocus
                placeholder="Nombre o @usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 h-12 px-3.5 rounded-control bg-bg border border-line-strong text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
              />
              <Button type="submit" variant="secondary" size="icon" className="size-12" aria-label="Buscar">
                {isSearching ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
              </Button>
            </form>

            <div className="flex flex-col max-h-[40vh] overflow-y-auto -mx-2">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <p className="py-4 text-center text-sm text-ink-2">No encontramos a nadie con ese nombre.</p>
              )}
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl">
                  <Avatar src={u.avatarUrl} fallback={u.name} className="size-10 rounded-full" />
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[15px] font-semibold truncate">{u.name}</span>
                    <span className="text-[13px] text-ink-2 truncate">@{u.username}</span>
                  </span>
                  <Button size="sm" onClick={() => handleStartChat(u.id)}>Escribir</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const chatTimeZone = "America/Montevideo";

// "21:14" hoy, "Ayer", día de la semana en los últimos 7 días, si no "20 oct".
function formatChatTime(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: chatTimeZone }).format(d);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (dayKey(date) === dayKey(today)) {
    return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: chatTimeZone }).format(date);
  }
  if (dayKey(date) === dayKey(yesterday)) return "Ayer";
  const clean = (value: string) => value.replace(/\./g, "").replace(/^\w/, (c) => c.toUpperCase());
  if (today.getTime() - date.getTime() < 7 * 86_400_000) {
    return clean(new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: chatTimeZone }).format(date));
  }
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: chatTimeZone }).format(date).replace(/\./g, "");
}

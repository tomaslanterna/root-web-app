"use client";

import { useMatch } from "@/context/MatchContext";
import { Avatar } from "@/components/ui/Avatar";
import {
  MessageSquare,
  Search,
  Sparkles,
  Users,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  useChatDirectory,
  type ChatSearchUser,
} from "@/hooks/useChatDirectory";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function ChatList({ className }: { className?: string }) {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSearchUser[]>([]);

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

  return (
    <div
      className={`flex flex-col h-full bg-[#0B0D10] text-white ${
        className || ""
      }`}
    >
      <header className="fixed top-0 inset-x-0 z-40 mx-auto w-full max-w-md glass-header-obsidian px-4 pb-3 pt-safe-header flex items-center justify-between md:static md:max-w-none">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">
            Mensajes
          </h1>
        </div>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2 rounded-full bg-[#D4FF00]/10 text-[#D4FF00] hover:bg-[#D4FF00]/20 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
            Nuevo Chat
          </span>
        </button>
      </header>

      {/* Espaciador para compensar el header fixed */}
      <div className="pt-safe-header opacity-0 pointer-events-none pb-3 md:hidden">
        <div className="h-10"></div>
      </div>

      <div className="p-4 space-y-6">
        {/* 1. Crews de Eventos Section */}
        {userSquads.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Crews de
                Eventos
              </h2>
            </div>
            <div className="space-y-2.5">
              {/* Squad items unchanged for brevity, reusing old render */}
              {userSquads.map((sq) => {
                return (
                  <Link
                    key={sq.id}
                    href={`/chat/squad/${sq.id}`}
                    className="p-3.5 rounded-3xl bg-[#14171F] border border-white/10 flex items-center gap-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase truncate">
                        {sq.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {sq.eventTitle}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Direct Messages Section */}
        <div className="space-y-3">
          {error && (
            <button
              onClick={() => void refresh()}
              className="text-xs text-red-300"
            >
              {error} Reintentar
            </button>
          )}
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-400" /> Conversaciones
          </h2>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4FF00]" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4 uppercase font-bold tracking-wider">
                No tienes chats aún.
              </p>
            ) : (
              chats
                .filter((chat) => chat.type !== "TRANSFER")
                .map((chat) => {
                  // Find the other participant
                  const otherUser =
                    chat.participants?.find((p) => p.id !== currentUser?.id) ||
                    chat.participants?.[0];
                  return (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      className="p-3.5 rounded-3xl bg-[#14171F] hover:bg-[#1f2431] border border-white/10 flex items-center gap-4 transition-all"
                    >
                      <div className="relative">
                        <Avatar
                          src={otherUser?.avatarUrl}
                          fallback={otherUser?.name || "U"}
                          className="ring-2 ring-[#D4FF00]/40"
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-xs font-black uppercase tracking-wider text-white">
                            {chat.type === "CREWS"
                              ? chat.name ||
                                `Crew · ${
                                  chat.participants?.length ?? 0
                                } integrantes`
                              : otherUser?.name || "Usuario"}
                          </p>
                          <span className="text-[10px] font-bold text-neutral-400">
                            {new Date(chat.updated_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate font-medium">
                          {chat.last_message ||
                            "Haz clic para iniciar la conversación"}
                        </p>
                        {!!chat.unread_count && (
                          <span className="mt-1 inline-flex rounded-full bg-[#D4FF00] px-2 text-[10px] font-bold text-black">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* New Chat Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14171F] rounded-3xl border border-white/10 w-full max-w-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider">
                Nuevo Chat
              </h3>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSearchUsers} className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o @usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4FF00]/50"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1 text-[#D4FF00]"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <p className="text-xs text-center text-neutral-500 py-4">
                  No se encontraron usuarios
                </p>
              )}
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatarUrl} fallback={u.name} size="sm" />
                    <div>
                      <p className="text-xs font-bold">{u.name}</p>
                      <p className="text-[10px] text-neutral-400">
                        @{u.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(u.id)}
                    className="px-3 py-1.5 rounded-full bg-[#D4FF00] text-black text-[10px] font-black uppercase"
                  >
                    Chatear
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

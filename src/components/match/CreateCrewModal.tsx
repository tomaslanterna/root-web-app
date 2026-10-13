"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Users, UserPlus, Search, Loader2, Check, Flame } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { searchApi } from "@/services/search";

interface FriendUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface CreateCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    memberIds: string[];
    friends: FriendUser[];
  }) => Promise<string | void>;
}

export function CreateCrewModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCrewModalProps) {
  const [crewName, setCrewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<FriendUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCrewName("");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFriends([]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Search users as user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    setIsSearching(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await searchApi.searchUsers(searchQuery.trim());
        const mapped: FriendUser[] = (results || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.username || "Usuario",
          username: u.username || "",
          avatarUrl: u.avatarUrl || u.avatar_url,
        }));
        setSearchResults(mapped);
      } catch (err) {
        console.error("Error buscando usuarios:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const toggleSelectFriend = (friend: FriendUser) => {
    const exists = selectedFriends.some((f) => f.id === friend.id);
    if (exists) {
      setSelectedFriends((prev) => prev.filter((f) => f.id !== friend.id));
    } else {
      setSelectedFriends((prev) => [...prev, friend]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewName.trim()) {
      setError("Por favor ingresá un nombre para tu crew");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: crewName.trim(),
        memberIds: selectedFriends.map((f) => f.id),
        friends: selectedFriends,
      });
      onClose();
    } catch (err: any) {
      console.error("Error creando crew:", err);
      setError(err?.message || "No se pudo crear la crew. Intentalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#14171F] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black">
              <Flame className="w-4 h-4 fill-neutral-950" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-white">
                Crear una Crew
              </h2>
              <p className="text-[11px] text-neutral-400 font-bold">
                Armá tu equipo y sumá amigos para romperla en los eventos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Nombre de la Crew */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4FF00]" /> Nombre de la Crew
            </label>
            <input
              type="text"
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="Ej: Los Manijas, Techno BA, Bresh Squad..."
              className="w-full px-4 py-3 rounded-2xl bg-[#0B0D10] border border-white/10 text-white placeholder-neutral-500 text-sm font-bold focus:outline-none focus:border-[#D4FF00] transition-colors"
              autoFocus
            />
          </div>

          {/* Añadir Amigos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#D4FF00]" /> Añadir Amigos
              </label>
              {selectedFriends.length > 0 && (
                <span className="text-[10px] font-black uppercase text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-0.5 rounded-full border border-[#D4FF00]/20">
                  {selectedFriends.length} {selectedFriends.length === 1 ? "amigo" : "amigos"}
                </span>
              )}
            </div>

            {/* Selected Friends Chips */}
            {selectedFriends.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#0B0D10]/50 border border-white/5 max-h-28 overflow-y-auto">
                {selectedFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-[#1A1F2C] border border-[#D4FF00]/30 text-xs font-bold text-white group"
                  >
                    <Avatar
                      src={friend.avatarUrl}
                      fallback={friend.name}
                      size="sm"
                      className="w-5 h-5 text-[9px]"
                    />
                    <span className="truncate max-w-[100px]">{friend.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectFriend(friend)}
                      className="p-0.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuarios por nombre o @usuario..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0B0D10] border border-white/10 text-white placeholder-neutral-500 text-xs font-bold focus:outline-none focus:border-[#D4FF00] transition-colors"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-[#D4FF00]" />
              )}
            </div>

            {/* Search Results List */}
            {searchQuery.trim().length >= 2 && (
              <div className="max-h-48 overflow-y-auto rounded-2xl bg-[#0B0D10] border border-white/10 divide-y divide-white/5">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-neutral-500 font-bold">
                    Buscando usuarios...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 font-bold">
                    No se encontraron usuarios con &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const isSelected = selectedFriends.some((f) => f.id === user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleSelectFriend(user)}
                        className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={user.avatarUrl}
                            fallback={user.name}
                            size="sm"
                            className="w-7 h-7"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">
                              {user.name}
                            </p>
                            {user.username && (
                              <p className="text-[10px] text-neutral-500 font-medium truncate">
                                @{user.username}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                            isSelected
                              ? "bg-[#D4FF00] text-neutral-950"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3 h-3" /> Añadido
                            </>
                          ) : (
                            "+ Añadir"
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full border border-white/10 text-neutral-400 hover:text-white text-xs font-black uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !crewName.trim()}
              className="px-6 py-2.5 rounded-full bg-[#D4FF00] hover:bg-[#c2eb00] active:scale-95 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-md shadow-[#D4FF00]/15 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  Creando...
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 fill-neutral-950" />
                  Crear Crew
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

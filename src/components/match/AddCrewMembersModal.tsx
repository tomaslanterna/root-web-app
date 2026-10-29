"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UserPlus, Search, Loader2, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { searchApi } from "@/services/search";

export interface FriendToInvite {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface AddCrewMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewName: string;
  existingMemberIds?: string[];
  onSubmit: (friends: FriendToInvite[]) => Promise<void>;
}

export function AddCrewMembersModal({
  isOpen,
  onClose,
  crewName,
  existingMemberIds = [],
  onSubmit,
}: AddCrewMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendToInvite[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<FriendToInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFriends([]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
        const mapped: FriendToInvite[] = (results || []).map((u: any) => ({
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

  const toggleSelectFriend = (friend: FriendToInvite) => {
    if (existingMemberIds.includes(friend.id)) return;
    const exists = selectedFriends.some((f) => f.id === friend.id);
    if (exists) {
      setSelectedFriends((prev) => prev.filter((f) => f.id !== friend.id));
    } else {
      setSelectedFriends((prev) => [...prev, friend]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFriends.length === 0) {
      setError("Seleccioná al menos un amigo para agregar a la crew");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(selectedFriends);
      onClose();
    } catch (err: any) {
      console.error("Error agregando amigos a la crew:", err);
      setError(err?.message || "No se pudo agregar a los usuarios. Intentalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-lg bg-[#12151D] border-0 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-2 border-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black shrink-0">
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-white">
                Agregar amigos
              </h2>
              <p className="text-[11px] text-neutral-400 font-bold truncate max-w-[240px] sm:max-w-xs">
                Sumá gente a {crewName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Añadir Amigos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="tech-label text-xs text-neutral-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#D4FF00]" /> Buscar amigos
              </label>
              {selectedFriends.length > 0 && (
                <span className="flex items-center gap-1 bg-[#D4FF00]/10 px-2.5 py-0.5 rounded-full">
                  <span className="num-display text-xs text-white">{selectedFriends.length}</span>
                  <span className="tech-label text-[9px] text-[#D4FF00]">
                    {selectedFriends.length === 1 ? "seleccionado" : "seleccionados"}
                  </span>
                </span>
              )}
            </div>

            {/* Selected Friends Chips */}
            {selectedFriends.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#0B0D10]/50 border-0 max-h-28 overflow-y-auto">
                {selectedFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-[#1A1F2C] border-0 text-xs font-bold text-white group shadow-sm"
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
                      className="p-0.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white cursor-pointer"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0B0D10] border-0 text-white placeholder-neutral-500 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#D4FF00]/60 transition-colors"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-[#D4FF00]" />
              )}
            </div>

            {/* Search Results List */}
            {searchQuery.trim().length >= 2 && (
              <div className="max-h-56 overflow-y-auto rounded-2xl bg-[#0B0D10] border-0">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-neutral-500 font-bold">
                    Buscando usuarios...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 font-bold">
                    No se encontraron usuarios con &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((u) => {
                    const isAlreadyMember = existingMemberIds.includes(u.id);
                    const isSelected = selectedFriends.some((f) => f.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => !isAlreadyMember && toggleSelectFriend(u)}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          isAlreadyMember
                            ? "opacity-55 cursor-default"
                            : "hover:bg-white/5 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={u.avatarUrl}
                            fallback={u.name}
                            size="sm"
                            className="w-7 h-7"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{u.name}</p>
                            {u.username && (
                              <p className="text-[10px] text-neutral-500 font-medium truncate">
                                @{u.username}
                              </p>
                            )}
                          </div>
                        </div>

                        {isAlreadyMember ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white/5 text-neutral-400">
                            Ya es miembro
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-[#D4FF00] text-neutral-950 shadow-sm"
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
                        )}
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
              className="px-5 py-2.5 rounded-full border-0 bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1] hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedFriends.length === 0}
              className="px-6 py-2.5 rounded-full bg-[#D4FF00] hover:bg-[#c2eb00] active:scale-95 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-md shadow-[#D4FF00]/25 hover:shadow-[0_0_20px_rgba(212,255,0,0.35)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Agregar a la Crew
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

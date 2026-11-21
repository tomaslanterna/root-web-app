"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Globe, Loader2, Lock, Search, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { TabIndicator } from "@/components/ui/TabIndicator";
import { initialsOf } from "@/components/match/CrewMonogram";
import { searchApi } from "@/services/search";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import { cn, isValidImageUrl } from "@/lib/utils";
import type { Event } from "@/types/events";

interface FriendUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface CreateCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: Event[];
  onSubmit: (data: {
    name: string;
    memberIds: string[];
    eventIds: string[];
    isPublic: boolean;
    friends: FriendUser[];
  }) => Promise<string | void>;
}

const NAME_MAX = 30;
const EVENTS_SHOWN = 12;
/** Distancia (px) que hay que arrastrar la hoja hacia abajo para cerrarla. */
const DISMISS_DRAG = 120;
/** Duración del cierre (la hoja baja y el fondo se desvanece). */
const CLOSE_MS = 240;

const timeZone = "America/Montevideo";
const weekdayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone });
const dayFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone });

function eventWhen(event: Event) {
  const date = parseEventRealDate(event.date);
  if (Number.isNaN(date.getTime())) return event.location;
  const weekday = weekdayFormat.format(date).replace(".", "");
  const when = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayFormat.format(date)}`;
  return event.location ? `${when} · ${event.location}` : when;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Círculo de selección de 44 px (amigos y eventos). */
function CheckCircle({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="size-11 shrink-0 flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span
        className={cn(
          "size-6 rounded-full flex items-center justify-center transition-[background-color,border-color,transform] duration-150",
          checked ? "bg-accent text-on-accent scale-100" : "border-2 border-[#5A6068]",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3.2} aria-hidden="true" />}
      </span>
    </button>
  );
}

/**
 * Crear crew: hoja que sube desde abajo con una sola acción ("Crear crew", fija abajo y apagada hasta que
 * haya nombre). El nombre arma el monograma, Privada/Pública es un selector de dos opciones y amigos y
 * eventos se marcan con un tilde. Se cierra con la X, con Escape o arrastrando la hoja hacia abajo.
 */
export function CreateCrewModal({ isOpen, onClose, events = [], onSubmit }: CreateCrewModalProps) {
  const [crewName, setCrewName] = useState("");
  // Privada por defecto: es como funcionaban las crews (solo con invitación).
  const [isPublic, setIsPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<FriendUser[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = useRef<number | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  /** Cierra deslizando la hoja hacia abajo (y desvaneciendo el fondo); después avisa a quien la abrió. */
  const requestClose = () => {
    if (closeTimer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, CLOSE_MS);
  };
  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  useEffect(() => {
    if (!isOpen) {
      setCrewName("");
      setIsPublic(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFriends([]);
      setSelectedEventIds([]);
      setError(null);
      setIsSubmitting(false);
      setDrag(0);
      setClosing(false);
      return;
    }
    // La hoja tapa la pantalla: la de abajo no scrollea mientras está abierta.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Búsqueda de usuarios mientras se escribe.
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
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

  const name = crewName.trim();
  const toggleFriend = (friend: FriendUser) =>
    setSelectedFriends((prev) =>
      prev.some((f) => f.id === friend.id) ? prev.filter((f) => f.id !== friend.id) : [...prev, friend],
    );
  const toggleEvent = (eventId: string) =>
    setSelectedEventIds((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Ponele un nombre a tu crew.");
      nameInputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name,
        memberIds: selectedFriends.map((f) => f.id),
        eventIds: selectedEventIds,
        isPublic,
        friends: selectedFriends,
      });
      onClose();
    } catch (err: any) {
      console.error("Error creando crew:", err);
      setError("No se pudo crear la crew. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Arrastrar la hoja hacia abajo (desde la manija o el encabezado) la cierra.
  const onDragStart = (event: React.TouchEvent) => {
    dragStart.current = event.touches[0].clientY;
    setDragging(true);
  };
  const onDragMove = (event: React.TouchEvent) => {
    if (dragStart.current === null) return;
    setDrag(Math.max(0, event.touches[0].clientY - dragStart.current));
  };
  const onDragEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    setDragging(false);
    if (drag > DISMISS_DRAG) requestClose();
    else setDrag(0);
  };

  const shownEvents = events.slice(0, EVENTS_SHOWN);
  const summary = [
    name,
    selectedFriends.length > 0 && plural(selectedFriends.length, "amigo", "amigos"),
    selectedEventIds.length > 0 && plural(selectedEventIds.length, "evento", "eventos"),
  ].filter(Boolean).join(" · ");

  const label = "text-sm font-semibold flex items-baseline justify-between gap-2 mb-2";
  const optional = <span className="text-xs font-medium text-ink-3">Opcional</span>;
  const help = "mt-1.5 mb-0 text-xs text-ink-3";
  const field =
    "h-[52px] rounded-[14px] bg-bg border border-white/10 flex items-center gap-2.5 px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(212,255,0,0.15)]";

  return (
    <div className="fixed inset-0 z-[90] md:flex md:items-center md:justify-center md:p-6">
      <div
        className="absolute inset-0 bg-black/60 motion-safe:animate-fade-in transition-opacity duration-200"
        style={{ opacity: closing ? 0 : 1 - Math.min(drag / 400, 0.6) }}
        aria-hidden="true"
        onClick={requestClose}
      />

      <form
        onSubmit={handleCreate}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-crew-title"
        className="crew-sheet absolute inset-x-0 bottom-0 top-14 flex flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[0_-1px_0_rgba(255,255,255,0.08)] md:relative md:inset-auto md:top-auto md:h-[min(820px,90dvh)] md:w-full md:max-w-lg md:rounded-[28px]"
        style={{
          // Sigue al dedo mientras se arrastra la barrita; al cerrar baja entera.
          transform: closing ? "translateY(100%)" : drag ? `translateY(${drag}px)` : undefined,
          opacity: closing ? 0.9 : undefined,
          transition: dragging ? "none" : `transform ${closing ? CLOSE_MS : 220}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${CLOSE_MS}ms`,
        }}
      >
        <div onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd} className="shrink-0 touch-none">
          <div aria-hidden="true" className="mx-auto mt-2 h-[5px] w-10 rounded-full bg-white/20" />
          <div className="flex items-start gap-3 pl-5 pr-4 pt-3 pb-2">
            <div className="min-w-0 flex-1 pt-1.5">
              <h2 id="create-crew-title" className="font-display m-0 text-2xl">Nueva crew</h2>
              <p className="m-0 mt-1.5 text-sm leading-[1.45] text-ink-2">Armá tu equipo y compitan en pasos en cada fiesta.</p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar"
              className="size-11 shrink-0 rounded-full bg-surface-2 text-ink-2 flex items-center justify-center hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-6 flex flex-col gap-6">
          {/* Nombre: arma el monograma de la crew. */}
          <div>
            <label htmlFor="crew-name" className={label}>Nombre</label>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "font-display size-14 shrink-0 rounded-2xl flex items-center justify-center text-[22px] transition-colors",
                  name ? "bg-accent text-on-accent" : "bg-surface-2 text-[#5A6068]",
                )}
              >
                {name ? initialsOf(name) : <Users className="size-6" aria-hidden="true" />}
              </span>
              <div className={cn(field, "flex-1", error && !name && "border-rose-400")}>
                <input
                  ref={nameInputRef}
                  id="crew-name"
                  type="text"
                  value={crewName}
                  onChange={(e) => {
                    setCrewName(e.target.value.slice(0, NAME_MAX));
                    if (error) setError(null);
                  }}
                  maxLength={NAME_MAX}
                  placeholder="Los Manijas, Techno BA…"
                  aria-describedby="crew-name-help"
                  aria-invalid={!!error && !name}
                  className="min-w-0 flex-1 bg-transparent border-0 outline-none text-base placeholder:text-ink-3"
                  autoFocus
                />
              </div>
            </div>
            <div id="crew-name-help" className={cn(help, "flex justify-between gap-2")}>
              {error && !name ? <span role="alert" className="text-rose-400">{error}</span> : <span>Se ve en rankings y en el chat de la crew.</span>}
              <span className="num-mono">{crewName.length}/{NAME_MAX}</span>
            </div>
          </div>

          {/* Quién puede unirse. */}
          <div>
            <div id="crew-visibility" className={label}>¿Quién puede unirse?</div>
            <div role="radiogroup" aria-labelledby="crew-visibility" className="relative grid grid-cols-2 gap-1 p-1 rounded-[14px] bg-bg border border-line">
              <TabIndicator variant="pill" className="rounded-[10px]" />
              {([
                { value: false, title: "Privada", Icon: Lock },
                { value: true, title: "Pública", Icon: Globe },
              ] as const).map(({ value, title, Icon }) => {
                const selected = isPublic === value;
                return (
                  <button
                    key={title}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setIsPublic(value)}
                    className={cn(
                      "relative z-[1] h-11 rounded-[10px] flex items-center justify-center gap-2 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-accent",
                      selected ? "text-bg" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
                    {title}
                  </button>
                );
              })}
            </div>
            <p className={help}>
              {isPublic ? "Aparece en Crews y cualquiera se puede sumar." : "Solo entra quien tenga tu link de invitación."}
            </p>
          </div>

          {/* Amigos. */}
          <div>
            <label htmlFor="crew-friends" className={label}>
              Amigos
              {selectedFriends.length > 0 ? <span className="num-mono text-[13px] text-accent">{selectedFriends.length}</span> : optional}
            </label>
            {selectedFriends.length > 0 && (
              <ul className="m-0 mb-2.5 p-0 list-none flex flex-wrap gap-1.5" aria-label="Amigos elegidos">
                {selectedFriends.map((friend) => (
                  <li key={friend.id} className="h-9 flex items-center gap-1.5 rounded-full bg-surface-2 pl-1 pr-1 text-sm font-semibold">
                    <Avatar src={friend.avatarUrl} fallback={friend.name} size="sm" className="size-7 text-[11px] border-0" />
                    <span className="max-w-[120px] truncate">{friend.username || friend.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleFriend(friend)}
                      aria-label={`Quitar a ${friend.username || friend.name}`}
                      className="size-7 rounded-full flex items-center justify-center text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <X className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={field}>
              <Search className="size-[18px] shrink-0 text-ink-3" aria-hidden="true" />
              <input
                id="crew-friends"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o @usuario"
                className="min-w-0 flex-1 bg-transparent border-0 outline-none text-base placeholder:text-ink-3"
              />
              {isSearching && <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden="true" />}
            </div>
            {searchQuery.trim().length >= 2 ? (
              <div className="mt-1" aria-live="polite">
                {!isSearching && searchResults.length === 0 ? (
                  <p className={help}>No encontramos a nadie con &quot;{searchQuery.trim()}&quot;.</p>
                ) : (
                  searchResults.map((user) => {
                    const checked = selectedFriends.some((f) => f.id === user.id);
                    return (
                      <div key={user.id} className="min-h-[60px] py-2 flex items-center gap-3 border-b border-white/[0.06] last:border-b-0">
                        <Avatar src={user.avatarUrl} fallback={user.name} className="size-10 border-0" />
                        <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span className="truncate text-[15px] font-semibold">{user.name}</span>
                          {user.username && <span className="truncate text-[13px] text-ink-2">@{user.username}</span>}
                        </span>
                        <CheckCircle checked={checked} label={`Sumar a ${user.name}`} onToggle={() => toggleFriend(user)} />
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <p className={help}>También podés invitar con el link cuando esté creada.</p>
            )}
          </div>

          {/* Eventos. */}
          {shownEvents.length > 0 && (
            <div>
              <div className={label}>
                Eventos
                {selectedEventIds.length > 0 ? <span className="num-mono text-[13px] text-accent">{selectedEventIds.length}</span> : optional}
              </div>
              <div>
                {shownEvents.map((ev) => {
                  const checked = selectedEventIds.includes(ev.id);
                  const flyer = isValidImageUrl(ev.cinematicBannerUrl) ? ev.cinematicBannerUrl.trim() : null;
                  return (
                    <div key={ev.id} className="min-h-[60px] py-2 flex items-center gap-3 border-b border-white/[0.06] last:border-b-0">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                        {flyer && <Image src={flyer} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                        <span className="truncate text-[15px] font-semibold">{ev.title}</span>
                        <span className="truncate text-[13px] text-ink-2">{eventWhen(ev)}</span>
                      </span>
                      <CheckCircle checked={checked} label={`Asociar ${ev.title}`} onToggle={() => toggleEvent(ev.id)} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Una sola acción, al alcance del pulgar. */}
        <div className="shrink-0 bg-surface px-5 pt-3 pb-[calc(1rem+var(--root-safe-bottom))] shadow-[0_-1px_0_rgba(255,255,255,0.08)] flex flex-col gap-2.5">
          {error && name && <p role="alert" className="m-0 text-center text-[13px] text-rose-400">{error}</p>}
          {name && !error && <p className="m-0 truncate text-center text-[13px] text-ink-2">{summary}</p>}
          <button
            type="submit"
            disabled={!name || isSubmitting}
            className={cn(
              "font-display h-14 rounded-2xl flex items-center justify-center gap-2 text-[15px] transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              name ? "bg-accent text-on-accent" : "bg-surface-2 text-[#5A6068] cursor-not-allowed",
            )}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Creando…" : "Crear crew"}
          </button>
        </div>
      </form>
    </div>
  );
}

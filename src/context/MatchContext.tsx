"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { DEFAULT_CURRENT_VIBE_PROFILE, type UserVibeProfile } from "@/lib/mocks";
import type { EventSquad } from "@/types/match";
import type { Event } from "@/types/events";
import { matchApi, type SwipeDirection } from "@/services/match";
import { useAuth } from "@/context/AuthContext";
import { useChatRealtime } from "@/context/ChatRealtimeContext";
import { useMutation } from "@/hooks/useMutation";

interface MatchContextType {
  vibeProfile: UserVibeProfile;
  updateVibeProfile: (updates: Partial<UserVibeProfile>) => void;
  swipedEventIds: Record<string, SwipeDirection>;
  swipeEvent: (event: Event, direction: SwipeDirection) => Promise<void>;
  resetSwipes: () => void;
  squads: EventSquad[];
  isLoadingSquads: boolean;
  squadsError: string | undefined;
  refreshSquads: () => Promise<void>;
  activeMatchedSquad: EventSquad | null;
  setActiveMatchedSquad: React.Dispatch<React.SetStateAction<EventSquad | null>>;
  matchedEvent: Event | null;
  isMatchModalOpen: boolean;
  closeMatchModal: () => void;
  isPreferencesOpen: boolean;
  setIsPreferencesOpen: (open: boolean) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);
const STORAGE_KEYS = { VIBE_PROFILE: "root_vibe_profile", SWIPES: "root_event_swipes" };

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const { subscribe } = useChatRealtime();
  const [preferences, setPreferences] = useState<UserVibeProfile>(DEFAULT_CURRENT_VIBE_PROFILE);
  const vibeProfile = { ...preferences, userId: userId ?? "" };
  const [swipes, setSwipes] = useState<{ userId?: string; data: Record<string, SwipeDirection> }>({ data: {} });
  const swipedEventIds = swipes.userId === userId ? swipes.data : {};
  const [snapshot, setSnapshot] = useState<{ userId: string; data: EventSquad[] }>();
  const squads = snapshot && snapshot.userId === userId ? snapshot.data : [];
  const [activeMatchedSquad, setActiveMatchedSquad] = useState<EventSquad | null>(null);
  const [matchedEvent, setMatchedEvent] = useState<Event | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const { mutate: getMatches, isLoading: isLoadingSquads, error: loadError } = useMutation(matchApi.getMatches);
  const { mutate: postSwipe, error: swipeError } = useMutation(
    ({ event, direction, profile }: { event: Event; direction: SwipeDirection; profile: UserVibeProfile }) =>
      matchApi.swipe(event.id, direction, profile),
  );
  const refreshSquads = useCallback(async () => {
    if (!userId) return;
    const data = await getMatches(undefined);
    setSnapshot({ userId, data });
  }, [getMatches, userId]);

  useEffect(() => {
    let active = true;
    // Only preferences/swipes are local. Squads and messages always come from the server.
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const savedProfile = localStorage.getItem(STORAGE_KEYS.VIBE_PROFILE);
        if (savedProfile) setPreferences(JSON.parse(savedProfile));
        const savedSwipes = userId ? localStorage.getItem(`${STORAGE_KEYS.SWIPES}:${userId}`) : null;
        setSwipes({ userId, data: savedSwipes ? JSON.parse(savedSwipes) : {} });
      } catch { /* Storage unavailable; keep defaults. */ }
      setActiveMatchedSquad(null);
      setIsMatchModalOpen(false);
    });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    let running = false;
    let requested = false;
    const synchronize = async () => {
      if (running) { requested = true; return; }
      running = true;
      try {
        do {
          requested = false;
          const data = await getMatches(undefined);
          if (active) setSnapshot({ userId, data });
        } while (active && requested);
      } catch { /* Exposed as squadsError, with a retry action. */ }
      finally { running = false; }
    };
    const unsubscribe = subscribe((event) => {
      if (event.type === "ready" || event.type === "resync" || event.type === "chat.created") void synchronize();
    });
    const onVisible = () => { if (document.visibilityState === "visible") void synchronize(); };
    void synchronize();
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; unsubscribe(); document.removeEventListener("visibilitychange", onVisible); };
  }, [userId, subscribe, getMatches]);

  const updateVibeProfile = (updates: Partial<UserVibeProfile>) => {
    setPreferences((previous) => {
      const next = { ...previous, ...updates };
      try { localStorage.setItem(STORAGE_KEYS.VIBE_PROFILE, JSON.stringify(next)); } catch { /* Storage unavailable. */ }
      return next;
    });
  };

  const swipeEvent = async (event: Event, direction: SwipeDirection) => {
    if (!userId) return;
    try {
      const response = await postSwipe({ event, direction, profile: vibeProfile });
      setSwipes((previous) => {
        const data = { ...(previous.userId === userId ? previous.data : {}), [event.id]: direction };
        try { localStorage.setItem(`${STORAGE_KEYS.SWIPES}:${userId}`, JSON.stringify(data)); } catch { /* Storage unavailable. */ }
        return { userId, data };
      });
      if (response.status === "matched") {
        const crew = response.crew;
        setSnapshot((previous) => ({ userId, data: [crew, ...(previous?.userId === userId ? previous.data : []).filter((s) => s.id !== crew.id)] }));
        setActiveMatchedSquad(crew);
        setMatchedEvent(event);
        setIsMatchModalOpen(true);
      }
    } catch { /* Report through squadsError; never create a local/mock match. */ }
  };

  const resetSwipes = () => {
    setSwipes({ userId, data: {} });
    try { localStorage.removeItem(`${STORAGE_KEYS.SWIPES}:${userId}`); } catch { /* Storage unavailable. */ }
  };
  const closeMatchModal = () => {
    setIsMatchModalOpen(false);
    setActiveMatchedSquad(null);
    setMatchedEvent(null);
  };

  return (
    <MatchContext.Provider value={{
      vibeProfile, updateVibeProfile, swipedEventIds, swipeEvent, resetSwipes, squads,
      isLoadingSquads, squadsError: loadError || swipeError ? "No pudimos cargar o actualizar tus crews. Intentá nuevamente." : undefined,
      refreshSquads, activeMatchedSquad, setActiveMatchedSquad, matchedEvent, isMatchModalOpen,
      closeMatchModal, isPreferencesOpen, setIsPreferencesOpen,
    }}>
      {children}
    </MatchContext.Provider>
  );
}
export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) throw new Error("useMatch must be used within a MatchProvider");
  return context;
}

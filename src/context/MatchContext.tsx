"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  UserVibeProfile,
  EventSquad,
  SquadChatMessage,
  DEFAULT_CURRENT_VIBE_PROFILE,
  MOCK_SQUADS,
  MOCK_SQUAD_MESSAGES,
  MOCK_EVENTS,
  MOCK_USERS,
} from "@/lib/mocks";
import type { Event } from "@/types/events";

interface MatchContextType {
  vibeProfile: UserVibeProfile;
  updateVibeProfile: (updates: Partial<UserVibeProfile>) => void;
  swipedEventIds: Record<string, "like" | "pass" | "superlike">;
  swipeEvent: (event: Event, direction: "like" | "pass" | "superlike") => Promise<void>;
  resetSwipes: () => void;
  squads: EventSquad[];
  squadMessages: Record<string, SquadChatMessage[]>;
  sendMessageToSquad: (squadId: string, content: string, type?: SquadChatMessage["type"]) => void;
  activeMatchedSquad: EventSquad | null;
  setActiveMatchedSquad: React.Dispatch<React.SetStateAction<EventSquad | null>>;
  matchedEvent: Event | null;
  isMatchModalOpen: boolean;
  closeMatchModal: () => void;
  isPreferencesOpen: boolean;
  setIsPreferencesOpen: (open: boolean) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VIBE_PROFILE: "root_vibe_profile",
  SWIPES: "root_event_swipes",
  SQUADS: "root_user_squads",
};

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const [vibeProfile, setVibeProfile] = useState<UserVibeProfile>(DEFAULT_CURRENT_VIBE_PROFILE);
  const [swipedEventIds, setSwipedEventIds] = useState<Record<string, "like" | "pass" | "superlike">>({});
  const [squads, setSquads] = useState<EventSquad[]>(MOCK_SQUADS);
  const [squadMessages, setSquadMessages] = useState<Record<string, SquadChatMessage[]>>({
    sq1: MOCK_SQUAD_MESSAGES,
  });

  const [activeMatchedSquad, setActiveMatchedSquad] = useState<EventSquad | null>(null);
  const [matchedEvent, setMatchedEvent] = useState<Event | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Load initial state from localStorage if available
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.VIBE_PROFILE);
      if (savedProfile) {
        setVibeProfile(JSON.parse(savedProfile));
      }
      const savedSwipes = localStorage.getItem(STORAGE_KEYS.SWIPES);
      if (savedSwipes) {
        setSwipedEventIds(JSON.parse(savedSwipes));
      }
      const savedSquads = localStorage.getItem(STORAGE_KEYS.SQUADS);
      if (savedSquads) {
        setSquads(JSON.parse(savedSquads));
      }
    } catch {
      // Storage unavailable or SSR
    }
  }, []);

  const updateVibeProfile = (updates: Partial<UserVibeProfile>) => {
    setVibeProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.VIBE_PROFILE, JSON.stringify(next));
      } catch {
        // storage error
      }
      return next;
    });
  };

  const swipeEvent = async (event: Event, direction: "like" | "pass" | "superlike") => {
    const updatedSwipes = { ...swipedEventIds, [event.id]: direction };
    setSwipedEventIds(updatedSwipes);

    try {
      localStorage.setItem(STORAGE_KEYS.SWIPES, JSON.stringify(updatedSwipes));
    } catch {
      // storage error
    }

    if (direction === "pass") return;

    try {
      const res = await api.post(`/v1/events/${event.id}/swipes`, {
        direction,
        preferences: vibeProfile,
      });

      if (res.data?.status === "matched" && res.data?.crew) {
        // We received a match!
        const matchedSquad = res.data.crew as EventSquad;
        
        // Add to local state
        const updated = [matchedSquad, ...squads.filter(s => s.id !== matchedSquad.id)];
        setSquads(updated);
        try {
          localStorage.setItem(STORAGE_KEYS.SQUADS, JSON.stringify(updated));
        } catch {}

        // Add initial message if provided, otherwise generic
        const initialMsg: SquadChatMessage = {
          id: `msg_sys_${Date.now()}`,
          squadId: matchedSquad.id,
          senderId: "system",
          content: `¡Match de Crew creado para ${event.title}! 🎧 ${matchedSquad.members.length} integrantes listos. ¡Empiecen a coordinar!`,
          type: "system_icebreaker",
          timestamp: new Date().toISOString(),
        };

        setSquadMessages((prev) => ({
          ...prev,
          [matchedSquad.id]: prev[matchedSquad.id] ? [...prev[matchedSquad.id], initialMsg] : [initialMsg],
        }));

        setActiveMatchedSquad(matchedSquad);
        setMatchedEvent(event);
        setIsMatchModalOpen(true);
      } else if (res.data?.status === "queued") {
        console.log("Swipe queued: waiting for match");
        // Could show a toast here in the future
      }
    } catch (err) {
      console.error("Error making swipe:", err);
    }
  };

  const sendMessageToSquad = (squadId: string, content: string, type: SquadChatMessage["type"] = "text") => {
    if (!content.trim()) return;

    const newMsg: SquadChatMessage = {
      id: `msg_${Date.now()}`,
      squadId,
      senderId: vibeProfile.userId,
      content: content.trim(),
      type,
      timestamp: new Date().toISOString(),
    };

    setSquadMessages((prev) => ({
      ...prev,
      [squadId]: [...(prev[squadId] || []), newMsg],
    }));
  };

  const resetSwipes = () => {
    setSwipedEventIds({});
    try {
      localStorage.removeItem(STORAGE_KEYS.SWIPES);
    } catch {}
  };

  const closeMatchModal = () => {
    setIsMatchModalOpen(false);
    setActiveMatchedSquad(null);
    setMatchedEvent(null);
  };

  return (
    <MatchContext.Provider
      value={{
        vibeProfile,
        updateVibeProfile,
        swipedEventIds,
        swipeEvent,
        resetSwipes,
        squads,
        squadMessages,
        sendMessageToSquad,
        activeMatchedSquad,
        setActiveMatchedSquad,
        matchedEvent,
        isMatchModalOpen,
        closeMatchModal,
        isPreferencesOpen,
        setIsPreferencesOpen,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useMatch must be used within a MatchProvider");
  }
  return context;
}

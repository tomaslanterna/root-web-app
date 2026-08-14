"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

interface MatchContextType {
  vibeProfile: UserVibeProfile;
  updateVibeProfile: (updates: Partial<UserVibeProfile>) => void;
  swipedEventIds: Record<string, "like" | "pass" | "superlike">;
  swipeEvent: (eventId: string, direction: "like" | "pass" | "superlike") => EventSquad | null;
  resetSwipes: () => void;
  squads: EventSquad[];
  squadMessages: Record<string, SquadChatMessage[]>;
  sendMessageToSquad: (squadId: string, content: string, type?: SquadChatMessage["type"]) => void;
  activeMatchedSquad: EventSquad | null;
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

  const swipeEvent = (eventId: string, direction: "like" | "pass" | "superlike"): EventSquad | null => {
    const updatedSwipes = { ...swipedEventIds, [eventId]: direction };
    setSwipedEventIds(updatedSwipes);

    try {
      localStorage.setItem(STORAGE_KEYS.SWIPES, JSON.stringify(updatedSwipes));
    } catch {
      // storage error
    }

    // If user passed, no squad formation
    if (direction === "pass") return null;

    const event = MOCK_EVENTS.find((e) => e.id === eventId);
    if (!event) return null;

    // Simulate matchmaking algorithm
    // Check if squad already exists for this event
    const existingSquad = squads.find((s) => s.eventId === eventId);
    let matchedSquad: EventSquad;

    if (existingSquad) {
      // Add current user to existing squad
      const isAlreadyMember = existingSquad.members.some((m) => m.userId === vibeProfile.userId);
      if (!isAlreadyMember) {
        matchedSquad = {
          ...existingSquad,
          status: "active",
          members: [
            ...existingSquad.members,
            { userId: vibeProfile.userId, hasTicket: direction === "superlike", joinedAt: new Date().toISOString(), role: "member" },
          ],
        };
        const updated = squads.map((s) => (s.id === existingSquad.id ? matchedSquad : s));
        setSquads(updated);
        try {
          localStorage.setItem(STORAGE_KEYS.SQUADS, JSON.stringify(updated));
        } catch {}
      } else {
        matchedSquad = existingSquad;
      }
    } else {
      // Create new active Squad with 3-4 compatible members
      const newSquadId = `sq_${Date.now()}`;
      matchedSquad = {
        id: newSquadId,
        eventId: event.id,
        name: `${event.title.split(" ")[0]} Crew BA`,
        matchScore: direction === "superlike" ? 99 : 94,
        departureZone: vibeProfile.departureZone,
        chatRoomId: `chat_${newSquadId}`,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        members: [
          { userId: "1", hasTicket: true, joinedAt: new Date(Date.now() - 3600000).toISOString(), role: "host" },
          { userId: "2", hasTicket: true, joinedAt: new Date(Date.now() - 1800000).toISOString(), role: "member" },
          { userId: vibeProfile.userId, hasTicket: direction === "superlike", joinedAt: new Date().toISOString(), role: "member" },
        ],
      };

      const updated = [matchedSquad, ...squads];
      setSquads(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.SQUADS, JSON.stringify(updated));
      } catch {}

      // Generate initial icebreaker message
      const initialMsg: SquadChatMessage = {
        id: `msg_sys_${Date.now()}`,
        squadId: newSquadId,
        senderId: "system",
        content: `¡Match de Crew creado para ${event.title}! 🎧 ${matchedSquad.members.length} integrantes listos desde ${vibeProfile.departureZone}. ¡Empiecen a coordinar la previa o el viaje!`,
        type: "system_icebreaker",
        timestamp: new Date().toISOString(),
      };

      setSquadMessages((prev) => ({
        ...prev,
        [newSquadId]: [initialMsg],
      }));
    }

    // Trigger match celebration modal!
    setActiveMatchedSquad(matchedSquad);
    setIsMatchModalOpen(true);

    return matchedSquad;
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

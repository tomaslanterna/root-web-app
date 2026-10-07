"use client";

import { createContext, useContext } from "react";

export interface FeedInboxControls {
  open: () => void;
  move: (distance: number) => void;
  cancel: () => void;
}

export const FeedInboxContext = createContext<FeedInboxControls | null>(null);

export function useFeedInbox() {
  const context = useContext(FeedInboxContext);
  if (!context) throw new Error("Feed inbox controls require FeedLayout.");
  return context;
}

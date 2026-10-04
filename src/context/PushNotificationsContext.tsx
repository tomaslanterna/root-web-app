"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePushNotificationsController } from "@/hooks/usePushNotifications";

const PushContext = createContext<ReturnType<typeof usePushNotificationsController> | null>(null);
export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const value = usePushNotificationsController();
  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}
export function usePushNotifications() {
  const value = useContext(PushContext);
  if (!value) throw new Error("usePushNotifications requires PushNotificationsProvider");
  return value;
}

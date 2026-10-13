"use client";
import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "./useMutation";
import { checkoutEvent, openReviewReminder } from "@/services/badges";
import { currentReviewOpening, newReviewOpening } from "@/lib/reviewOpening";
import type { EventBadge } from "@/types/badges";

// Also used by check-out, guaranteeing that this opening is recorded first.
const openingRequests = new Map<string, Promise<{ badge: EventBadge | null }>>();
const presentedOpenings = new Set<string>();
function registerOpening(userId: string, openingId: string) {
  const key = `${userId}:${openingId}`;
  if (!openingRequests.has(key)) {
    const request = openReviewReminder(openingId).catch(error => { openingRequests.delete(key); throw error; });
    openingRequests.set(key, request);
  }
  return openingRequests.get(key)!;
}
export function useEventCheckout(eventId: string) {
  const { user } = useAuth();
  return useMutation<boolean, void>(async () => {
    if (!user) throw new Error("Iniciá sesión");
    await registerOpening(user.id, currentReviewOpening());
    await checkoutEvent(eventId);
    return true;
  });
}
export function useReviewReminder() {
  const { user } = useAuth();
  const userId = user?.id;
  const [pending, setPending] = useState<{ userId: string; badge: EventBadge } | null>(null);
  const { mutate } = useMutation(({ userId, openingId }: { userId: string; openingId: string }) => registerOpening(userId, openingId));
  useEffect(() => {
    if (!userId) return;
    let active = true, wasBackground = false;
    const open = (openingId: string) => void mutate({ userId, openingId }).then(result => {
      if (!active) return;
      const key = `${userId}:${openingId}`;
      if (presentedOpenings.has(key)) return;
      presentedOpenings.add(key);
      setPending(result.badge ? { userId, badge: result.badge } : null);
    }).catch(() => undefined);
    open(currentReviewOpening());
    const listener = Capacitor.isNativePlatform() ? App.addListener("appStateChange", state => {
      if (!state.isActive) { wasBackground = true; return; }
      if (wasBackground) { wasBackground = false; open(newReviewOpening()); }
    }) : undefined;
    return () => { active = false; void listener?.then(handle => handle.remove()); };
  }, [userId, mutate]);
  return { badge: pending && pending.userId === userId ? pending.badge : null, dismiss: () => setPending(null) };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { AndroidPushSession, clearUnownedNativePush, supportsAndroidPush, type PushState } from "@/services/notifications";

export function usePushNotificationsController() {
  const { token, user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const session = useRef<AndroidPushSession | null>(null);
  const [state, setState] = useState<PushState>("unsupported");
  const [error, setError] = useState<string>();
  const update = useCallback((next: PushState, message?: string) => { setState(next); setError(message); }, []);
  const { mutate: resume } = useMutation((value: AndroidPushSession) => value.resume());
  const { mutate: enable, isLoading: enabling } = useMutation(async () => { await session.current?.enable(); });
  const { mutate: disable, isLoading: disabling } = useMutation(async () => {
    try { await session.current?.disable(); }
    catch { update("error", "No pudimos desactivar las notificaciones. Intentá nuevamente."); }
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) { void clearUnownedNativePush(); return; }
    if (!token || !userId || !supportsAndroidPush()) return;
    const value = new AndroidPushSession(token, userId, update, path => router.push(path));
    session.current = value;
    // Update asynchronously to keep state changes outside synchronous effect setup.
    void Promise.resolve().then(() => {
      if (session.current === value) { update("off"); void resume(value).catch(() => undefined); }
    });
    const online = () => { void resume(value).catch(() => undefined); };
    window.addEventListener("online", online);
    return () => {
      session.current = null;
      window.removeEventListener("online", online);
      void value.dispose().catch(() => undefined);
    };
  }, [token, userId, authLoading, router, update, resume]);

  return { state, error, isLoading: enabling || disabling || state === "enabling", enable: () => enable(undefined).catch(() => undefined), disable: () => disable(undefined) };
}

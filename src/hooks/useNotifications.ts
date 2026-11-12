"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import {
  getNotifications,
  getNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  notificationPath,
  updateNotificationPreferences,
} from "@/services/notifications";
import type { AppNotification, NotificationPreferences } from "@/types/notifications";

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const list = useMutation(getNotifications, {
    onSuccess: (page) => {
      setItems(page.data);
      setUnreadCount(page.unreadCount);
      setHasLoaded(true);
    },
  });
  const load = list.mutate;
  useEffect(() => {
    if (!user) return;
    void load(0).catch(() => setHasLoaded(true));
  }, [user, load]);
  const markRead = useCallback(async (item: AppNotification) => {
    if (item.readAt) return;
    await markNotificationRead(item.id);
    const readAt = new Date().toISOString();
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt } : entry));
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);
  const markAll = useCallback(async () => {
    await markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setItems((current) => current.map((entry) => entry.readAt ? entry : { ...entry, readAt }));
    setUnreadCount(0);
  }, []);
  const pathFor = useCallback((item: AppNotification) => user ? notificationPath({ ...item.data, type: item.type, recipient_id: user.id }, user.id) : null, [user]);
  return { items, unreadCount, hasLoaded, isLoading: list.isLoading, error: list.error, markRead, markAll, pathFor, reload: () => load(0) };
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>();
  const load = useMutation(getNotificationPreferences, { onSuccess: setPreferences });
  const save = useMutation(updateNotificationPreferences, { onSuccess: setPreferences });
  const loadPreferences = load.mutate;
  useEffect(() => {
    if (user) void loadPreferences(undefined).catch(() => undefined);
  }, [user, loadPreferences]);
  const toggle = useCallback((key: keyof NotificationPreferences) => {
    if (!preferences || save.isLoading) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    void save.mutate(next).catch(() => setPreferences(preferences));
  }, [preferences, save]);
  return { preferences, toggle, isLoading: load.isLoading || save.isLoading, error: load.error || save.error };
}

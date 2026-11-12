"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays, CheckCheck, ChevronLeft, MessageCircle, RefreshCw, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationCategory } from "@/types/notifications";

const categoryIcon: Record<NotificationCategory, typeof Bell> = {
  messages: MessageCircle,
  events: CalendarDays,
  social: UserPlus,
  crews: Users,
  communities: Sparkles,
  activity: Sparkles,
  account: ShieldCheck,
};

function relativeTime(value: string) {
  const elapsed = new Date(value).getTime() - Date.now();
  const minutes = Math.round(elapsed / 60000);
  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const notifications = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  const open = async (item: AppNotification) => {
    await notifications.markRead(item).catch(() => undefined);
    const path = notifications.pathFor(item);
    if (path) router.push(path);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-bg pb-24 text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 px-4 pb-3 pt-[calc(0.75rem+var(--root-safe-top))] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display m-0 text-[28px]">Notificaciones</h1>
            <p className="m-0 text-xs text-ink-2">{notifications.unreadCount ? `${notifications.unreadCount} sin leer` : "Estás al día"}</p>
          </div>
          {notifications.unreadCount > 0 && (
            <button type="button" onClick={() => void notifications.markAll()} className="flex min-h-11 items-center gap-1.5 px-2 text-xs font-semibold text-accent">
              <CheckCheck className="size-4" aria-hidden="true" /> Leer todas
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl px-4 py-4">
        {!notifications.hasLoaded ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-card bg-surface" />)}
          </div>
        ) : notifications.error ? (
          <div className="rounded-card border border-line bg-surface p-7 text-center">
            <RefreshCw className="mx-auto mb-3 size-6 text-ink-3" />
            <p className="mb-4 text-sm text-ink-2">No pudimos cargar tus notificaciones.</p>
            <Button size="sm" variant="outline" onClick={() => void notifications.reload()}>Reintentar</Button>
          </div>
        ) : notifications.items.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="mx-auto mb-4 size-8 text-ink-3" />
            <h2 className="font-display text-xl">Todavía no hay novedades</h2>
            <p className="mt-2 text-sm text-ink-2">Los eventos, seguidores y crews van a aparecer acá.</p>
          </div>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {notifications.items.map((item) => {
              const Icon = categoryIcon[item.category] || Bell;
              return (
                <button key={item.id} type="button" onClick={() => void open(item)} className="flex min-h-[92px] w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-2">
                  <span className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-control", item.readAt ? "bg-surface-2 text-ink-2" : "bg-accent/12 text-accent")}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={cn("text-sm", item.readAt ? "font-semibold" : "font-black")}>{item.title}</span>
                      {!item.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-label="Sin leer" />}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-2">{item.body}</span>
                    <span className="label-mono mt-2 block text-ink-3">{relativeTime(item.createdAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

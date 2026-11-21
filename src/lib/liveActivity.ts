import { Capacitor } from "@capacitor/core";
import { NativePedometer, type SyncLiveActivityOptions } from "@/hooks/usePedometer";
import { AndroidLiveActivity } from "@/lib/androidLiveActivity";

/** true en iOS (Live Activity) y Android (notificación en curso); false en web. */
export function supportsLiveActivity(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android";
}

/** Datos que solo usa Android; iOS no los recibe. */
export interface AndroidLiveActivityExtras {
  /** Hora de fin del evento (ms epoch): el servicio de pasos en segundo plano se apaga ahí. */
  eventEndEpochMs?: number;
}

export function syncLiveActivity(options: SyncLiveActivityOptions, androidExtras?: AndroidLiveActivityExtras) {
  return Capacitor.getPlatform() === "android"
    ? AndroidLiveActivity.syncLiveActivity({ ...options, ...androidExtras })
    : NativePedometer.syncLiveActivity(options);
}

export function stopLiveActivity(): Promise<unknown> {
  if (!supportsLiveActivity()) return Promise.resolve();
  return (Capacitor.getPlatform() === "android"
    ? AndroidLiveActivity.stopLiveActivity()
    : NativePedometer.stopLiveActivity()
  ).catch(() => undefined);
}

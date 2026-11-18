import { Capacitor } from "@capacitor/core";
import { NativePedometer, type SyncLiveActivityOptions } from "@/hooks/usePedometer";
import { AndroidLiveActivity } from "@/lib/androidLiveActivity";

/** true en iOS (Live Activity) y Android (notificación en curso); false en web. */
export function supportsLiveActivity(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android";
}

export function syncLiveActivity(options: SyncLiveActivityOptions) {
  return Capacitor.getPlatform() === "android"
    ? AndroidLiveActivity.syncLiveActivity(options)
    : NativePedometer.syncLiveActivity(options);
}

export function stopLiveActivity(): Promise<unknown> {
  if (!supportsLiveActivity()) return Promise.resolve();
  return (Capacitor.getPlatform() === "android"
    ? AndroidLiveActivity.stopLiveActivity()
    : NativePedometer.stopLiveActivity()
  ).catch(() => undefined);
}

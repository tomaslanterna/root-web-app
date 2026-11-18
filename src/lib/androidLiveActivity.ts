import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { SyncLiveActivityOptions } from "@/hooks/usePedometer";

/**
 * Notificación de evento en curso en Android (pantalla de bloqueo). Es el equivalente de la
 * Live Activity de iOS: mismas opciones, implementada en `RootLiveActivityPlugin.java`.
 */
interface RootLiveActivityPlugin {
  syncLiveActivity(options: SyncLiveActivityOptions): Promise<{
    supported: boolean;
    started?: boolean;
    updated?: boolean;
    hasThumbnail?: boolean;
    reason?: string;
  }>;
  stopLiveActivity(): Promise<{ stopped: boolean }>;
  addListener(
    eventName: "pedometerUpdate",
    listenerFunc: (data: { steps: number; distanceMeters: number }) => void,
  ): Promise<PluginListenerHandle>;
}

export const AndroidLiveActivity = registerPlugin<RootLiveActivityPlugin>("RootLiveActivity");

/**
 * Android: pasos en vivo del sensor del teléfono (los emite el servicio mientras bailás).
 * Es independiente del podómetro de iOS. En otras plataformas devuelve null.
 */
export async function listenAndroidLiveSteps(
  onSteps: (steps: number) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return null;
  try {
    return await AndroidLiveActivity.addListener("pedometerUpdate", (data) => {
      if (data && typeof data.steps === "number" && data.steps > 0) onSteps(data.steps);
    });
  } catch {
    return null;
  }
}

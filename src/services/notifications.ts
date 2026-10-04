import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api } from "@/lib/api";

export type PushState = "unsupported" | "off" | "enabling" | "enabled" | "denied" | "error";
const installationKey = "root_push_installation";
const registeredKey = "root_push_native_registered";
const preferenceKey = (userId: string) => `root_push_enabled_${userId}`;

export function supportsAndroidPush() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("PushNotifications");
}

function installationId() {
  let id = localStorage.getItem(installationKey);
  if (!id) {
    // getRandomValues also works during LAN live reload where randomUUID may not.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    localStorage.setItem(installationKey, id);
  }
  return id;
}

const headers = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });
export async function getPushAvailability(jwt: string): Promise<boolean> {
  const { data } = await api.get<{ enabled: boolean }>("/v1/push/status", { headers: headers(jwt), timeout: 10000, skipAuthRedirect: true });
  return data.enabled;
}
export async function registerPushDevice(jwt: string, id: string, token: string): Promise<void> {
  await api.put(`/v1/push/devices/${id}`, { token, platform: "android" }, { headers: headers(jwt), timeout: 10000, skipAuthRedirect: true });
}
export async function removePushDevice(jwt: string, id: string): Promise<void> {
  await api.delete(`/v1/push/devices/${id}`, { headers: headers(jwt), timeout: 10000, skipAuthRedirect: true });
}

export function notificationChatPath(data: unknown, userId: string): string | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;
  if (payload.type !== "chat.message" || payload.recipient_id !== userId || typeof payload.chat_id !== "string") return null;
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(payload.chat_id)) return null;
  return `/chat/${payload.chat_id}`;
}

let currentSession: AndroidPushSession | null = null;
let nativeReset: Promise<void> = Promise.resolve();

export class AndroidPushSession {
  private stopped = false;
  private accepting = false;
  private handles: PluginListenerHandle[] = [];
  private registrations: Promise<void> = Promise.resolve();
  private setup: Promise<void>;
  private complete: (() => void) | undefined;
  private failed: ((error: Error) => void) | undefined;
  private enabling: Promise<void> | null = null;

  constructor(
    private jwt: string,
    private userId: string,
    private update: (state: PushState, error?: string) => void,
    private openChat: (path: string) => void,
  ) {
    // This module owns one native session across navigation.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentSession = this;
    this.setup = supportsAndroidPush() ? nativeReset.then(() => this.addListeners()) : Promise.resolve();
    void this.setup.catch(() => { if (!this.stopped) this.update("error", "No pudimos preparar las notificaciones de Android."); });
  }

  private async addListeners() {
    const registration = await PushNotifications.addListener("registration", ({ value }) => {
      if (this.stopped || !this.accepting) return;
      localStorage.setItem(registeredKey, "true");
      // Serialize token rotations, preserving the authenticated session that initiated them.
      this.registrations = this.registrations.catch(() => undefined).then(async () => {
        if (this.stopped || !this.accepting) return;
        await registerPushDevice(this.jwt, installationId(), value);
        if (this.stopped || !this.accepting) return;
        localStorage.setItem(preferenceKey(this.userId), "true");
        this.update("enabled");
        this.complete?.();
      });
      void this.registrations.catch(() => {
        if (!this.stopped) this.update("error", "No pudimos registrar este dispositivo. Intentá nuevamente.");
        this.failed?.(new Error("No pudimos registrar este dispositivo."));
      });
    });
    this.handles.push(registration);
    this.handles.push(await PushNotifications.addListener("registrationError", () => {
      if (this.stopped || !this.accepting) return;
      const error = new Error("No pudimos conectar con Firebase. Revisá la configuración de Android.");
      this.update("error", error.message);
      this.failed?.(error);
    }));
    this.handles.push(await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
      if (this.stopped) return;
      const path = notificationChatPath(notification.data, this.userId);
      if (path) this.openChat(path);
    }));
  }

  enable(prompt = true): Promise<void> {
    if (this.enabling) return this.enabling;
    this.enabling = this.performEnable(prompt).finally(() => { this.enabling = null; });
    return this.enabling;
  }

  private async performEnable(prompt: boolean) {
    if (this.stopped || !supportsAndroidPush()) return;
    this.update("enabling");
    try {
      await this.setup;
      if (!await getPushAvailability(this.jwt)) throw new Error("El servidor todavía no tiene Firebase configurado.");
      if (this.stopped) return;
      let permission = await PushNotifications.checkPermissions();
      if (prompt && (permission.receive === "prompt" || permission.receive === "prompt-with-rationale")) {
        permission = await PushNotifications.requestPermissions();
      }
      if (this.stopped) return;
      if (permission.receive !== "granted") {
        this.update("denied", "Permití las notificaciones desde los ajustes de Android y volvé a intentar.");
        return;
      }
      await PushNotifications.createChannel({ id: "root_messages", name: "Mensajes", description: "Mensajes de tus chats y squads", importance: 4, visibility: 0, vibration: true });
      if (this.stopped) return;
      this.accepting = true;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Firebase no respondió. Intentá nuevamente.")), 20000);
        this.complete = () => { clearTimeout(timeout); resolve(); };
        this.failed = error => { clearTimeout(timeout); reject(error); };
        void PushNotifications.register().catch(error => this.failed?.(error instanceof Error ? error : new Error("No pudimos activar las notificaciones.")));
      });
    } catch (error) {
      if (!this.stopped) this.update("error", error instanceof Error ? error.message : "No pudimos activar las notificaciones.");
      throw error;
    } finally { this.complete = undefined; this.failed = undefined; }
  }

  async resume() {
    if (localStorage.getItem(preferenceKey(this.userId)) === "true") await this.enable(false);
  }

  async disable() {
    this.accepting = false;
    this.failed?.(new Error("Registro cancelado."));
    await this.registrations.catch(() => undefined);
    const id = localStorage.getItem(installationKey);
    if (id) await removePushDevice(this.jwt, id);
    localStorage.removeItem(preferenceKey(this.userId));
    localStorage.removeItem(registeredKey);
    // Server revocation is sufficient even if Google Play services is offline.
    await PushNotifications.unregister().catch(() => undefined);
    await PushNotifications.removeAllDeliveredNotifications().catch(() => undefined);
    if (!this.stopped) this.update("off");
  }

  async dispose(clearCurrent = true) {
    this.stopped = true;
    this.accepting = false;
    this.failed?.(new Error("Sesión cerrada."));
    await this.setup.catch(() => undefined);
    await Promise.allSettled(this.handles.map(handle => handle.remove()));
    if (clearCurrent && currentSession === this) currentSession = null;
  }

  async revokeForLogout() {
    await this.dispose(false);
    await this.registrations.catch(() => undefined);
    const id = localStorage.getItem(installationKey);
    let revoked = false;
    if (id) {
      try { await removePushDevice(this.jwt, id); revoked = true; } catch { /* Fall back to deleting the FCM token. */ }
    } else revoked = true;
    try { await PushNotifications.unregister(); revoked = true; } catch { /* Keep the session if neither revocation worked. */ }
    await PushNotifications.removeAllDeliveredNotifications().catch(() => undefined);
    if (!revoked) throw new Error("No pudimos desactivar las notificaciones. Conectate a internet y volvé a cerrar sesión.");
    localStorage.removeItem(registeredKey);
    if (currentSession === this) currentSession = null;
  }
}

export async function revokePushForLogout() {
  if (currentSession && supportsAndroidPush()) await currentSession.revokeForLogout();
}

export async function clearUnownedNativePush() {
  if (!supportsAndroidPush() || !localStorage.getItem(registeredKey)) return;
  nativeReset = nativeReset.then(async () => {
    try {
      await PushNotifications.unregister();
      localStorage.removeItem(registeredKey);
    } catch { /* Retry on the next unauthenticated startup. */ }
    await PushNotifications.removeAllDeliveredNotifications().catch(() => undefined);
  });
  await nativeReset;
}

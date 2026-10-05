import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

function runtime({ android = true, configured = true, permission = "granted", put, remove, unregister } = {}) {
  const listeners = new Map(), storage = new Map(), calls = [], states = [], paths = [];
  const push = {
    addListener: async (key, fn) => { listeners.set(key, fn); return { remove: async () => listeners.delete(key) }; },
    checkPermissions: async () => ({ receive: permission }),
    requestPermissions: async () => { calls.push(["permission"]); return { receive: "granted" }; },
    createChannel: async (channel) => calls.push(["channel", channel]),
    register: async () => queueMicrotask(() => listeners.get("registration")?.({ value: "abcdefghijklmnopqrstuvwxyz" })),
    unregister: async () => { calls.push(["unregister"]); await unregister?.(); },
    removeAllDeliveredNotifications: async () => calls.push(["clear"]),
  };
  const api = {
    get: async () => ({ data: { enabled: configured } }),
    put: async (...args) => { calls.push(["put", ...args]); await put?.(); },
    delete: async (...args) => { calls.push(["delete", ...args]); await remove?.(); },
  };
  const exportsObject = {};
  const source = fs.readFileSync(new URL("./notifications.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(compiled, {
    exports: exportsObject,
    require: key => key === "@capacitor/core" ? { Capacitor: { isNativePlatform: () => android, getPlatform: () => android ? "android" : "web", isPluginAvailable: () => android } } : key === "@capacitor/push-notifications" ? { PushNotifications: push } : { api },
    crypto: webcrypto, Uint8Array, setTimeout, clearTimeout,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  });
  const session = new exportsObject.AndroidPushSession("jwt-user-a", "user-a", (state, error) => states.push([state, error]), path => paths.push(path));
  return { session, listeners, calls, states, paths, storage, ...exportsObject };
}

test("Android opt-in requests permission, creates channel and registers JWT-bound installation", async () => {
  const r = runtime({ permission: "prompt" });
  await r.session.enable();
  const call = r.calls.find(call => call[0] === "put");
  assert.match(call[1], /^\/v1\/push\/devices\/[\da-f-]{36}$/);
  assert.equal(call[2].platform, "android");
  assert.equal(call[2].userId, undefined);
  assert.equal(call[3].headers.Authorization, "Bearer jwt-user-a");
  assert.equal(r.calls.filter(call => call[0] === "permission").length, 1);
  assert.equal(r.states.at(-1)[0], "enabled");
  assert.equal(r.storage.get("root_push_enabled_user-a"), "true");
  await r.session.dispose();
});

test("browser remains unsupported and never registers devices", async () => {
  const r = runtime({ android: false });
  assert.equal(r.supportsAndroidPush(), false);
  await r.session.enable();
  assert.equal(r.calls.length, 0);
  await r.session.dispose();
});

test("unconfigured backend is explained without prompting or claiming activation", async () => {
  const r = runtime({ configured: false, permission: "prompt" });
  await assert.rejects(r.session.enable(), /Firebase/);
  assert.equal(r.states.at(-1)[0], "error");
  assert.equal(r.calls.length, 0);
  await r.session.dispose();
});

test("notification tap only opens validated chats addressed to this account", async () => {
  const r = runtime();
  await r.session.enable();
  const id = "48a09314-cedb-410b-a243-e45e688fb47e";
  const data = { type: "chat.message", chat_id: id, recipient_id: "user-a" };
  r.listeners.get("pushNotificationActionPerformed")({ notification: { data } });
  assert.deepEqual(r.paths, [`/chat/${id}`]);
  assert.equal(r.notificationChatPath({ ...data, chat_id: "javascript:alert(1)" }, "user-a"), null);
  assert.equal(r.notificationChatPath({ ...data, recipient_id: "user-b" }, "user-a"), null);
  assert.equal(r.notificationChatPath({ ...data, type: "other" }, "user-a"), null);
  await r.session.dispose();
});

test("logout waits for in-flight registration and then revokes with the original JWT", async () => {
  let finishPut;
  const gate = new Promise(resolve => { finishPut = resolve; });
  const r = runtime({ put: () => gate });
  const enable = r.session.enable().catch(() => undefined);
  while (!r.calls.some(call => call[0] === "put")) await new Promise(resolve => setImmediate(resolve));
  const revoke = r.revokePushForLogout();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(r.calls.some(call => call[0] === "delete"), false);
  finishPut();
  await Promise.all([enable, revoke]);
  const call = r.calls.find(call => call[0] === "delete");
  assert.equal(call[2].headers.Authorization, "Bearer jwt-user-a");
  assert.equal(r.listeners.size, 0);
  assert.equal(r.states.some(state => state[0] === "enabled"), false);
});

test("failed server revocation falls back to invalidating the native FCM token", async () => {
  const r = runtime({ remove: () => { throw new Error("offline"); } });
  await r.session.enable();
  await r.revokePushForLogout();
  assert.ok(r.calls.some(call => call[0] === "unregister"));
});

test("if neither revocation works, logout fails safely and can be retried", async () => {
  let offline = true;
  const fail = () => { if (offline) throw new Error("offline"); };
  const r = runtime({ remove: fail, unregister: fail });
  await r.session.enable();
  await assert.rejects(r.revokePushForLogout(), /internet/);
  offline = false;
  await r.revokePushForLogout();
  assert.equal(r.calls.filter(call => call[0] === "delete").length, 2);
});

test("token rotation uses the same installation and disabling revokes it", async () => {
  const r = runtime();
  await r.session.enable();
  r.listeners.get("registration")({ value: "rotated-abcdefghijklmnopqrstuvwxyz" });
  await new Promise(resolve => setImmediate(resolve));
  const registrations = r.calls.filter(call => call[0] === "put");
  assert.equal(registrations.length, 2);
  assert.equal(registrations[0][1], registrations[1][1]);
  await r.session.disable();
  assert.equal(r.storage.get("root_push_enabled_user-a"), undefined);
  assert.equal(r.states.at(-1)[0], "off");
  await r.session.dispose();
});

test("unauthenticated startup clears native push without repeated revocation after logout", async () => {
  const r = runtime();
  await r.session.enable();
  await r.session.dispose();
  await r.clearUnownedNativePush();
  assert.equal(r.storage.get("root_push_native_registered"), undefined);
  assert.equal(r.calls.filter(call => call[0] === "unregister").length, 1);
  await r.clearUnownedNativePush();
  assert.equal(r.calls.filter(call => call[0] === "unregister").length, 1);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function runtime() {
  const instances = [], timers = new Map(), listeners = new Map();
  let timerId = 0;
  class Socket {
    static OPEN = 1;
    static CONNECTING = 0;
    readyState = 0;
    frames = [];
    constructor(url) { this.url = String(url); instances.push(this); }
    send(frame) { this.frames.push(JSON.parse(frame)); }
    close(code = 1000) { this.readyState = 3; this.onclose?.({ code }); }
    open() { this.readyState = 1; this.onopen?.(); }
    event(event) { this.onmessage?.({ data: JSON.stringify(event) }); }
  }
  const exportsObject = {};
  const source = fs.readFileSync(new URL("./chat.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(compiled, {
    exports: exportsObject, URL, WebSocket: Socket,
    require: () => ({ api: { defaults: { baseURL: "https://backend.example.com" } } }),
    window: { location: { origin: "https://root.example.com" }, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: (key) => listeners.delete(key) },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; }, clearTimeout: (id) => timers.delete(id),
  });
  return { connect: exportsObject.connectChatSocket, instances, timers, listeners };
}

test("squad chat creation is forwarded over the shared authenticated socket", () => {
  const { connect, instances, listeners } = runtime();
  const events = [], states = [];
  const stop = connect("test-jwt", (event) => events.push(event), (state) => states.push(state), () => assert.fail("unexpected expiry"));
  const socket = instances[0];
  assert.equal(socket.url, "wss://backend.example.com/v1/chats/ws");
  assert.ok(!socket.url.includes("test-jwt"));
  socket.open();
  assert.equal(socket.frames[0].type, "authenticate");
  assert.equal(socket.frames[0].token, "test-jwt");
  socket.event({ type: "ready" });
  socket.event({ type: "chat.created", chat_id: "real-squad-chat" });
  assert.equal(events[1].chat_id, "real-squad-chat");
  assert.deepEqual(states, ["connecting", "connected"]);
  stop();
  assert.equal(socket.readyState, 3);
  assert.equal(listeners.size, 0);
});

test("reconnect emits ready for history recovery; cleanup cancels retries", () => {
  const { connect, instances, timers } = runtime();
  const events = [];
  const stop = connect("test-jwt", (event) => events.push(event.type), () => {}, () => {});
  instances[0].open();
  instances[0].event({ type: "ready" });
  instances[0].close(1006);
  assert.equal(timers.size, 1);
  const [id, retry] = [...timers][0]; timers.delete(id); retry();
  assert.equal(instances.length, 2);
  instances[1].open(); instances[1].event({ type: "ready" });
  assert.deepEqual(events, ["ready", "ready"]);
  instances[1].close(1006);
  stop();
  assert.equal(timers.size, 0);
});

test("expired auth logs out without reconnecting", () => {
  const { connect, instances, timers } = runtime();
  let expired = 0;
  const stop = connect("test-jwt", () => {}, () => {}, () => expired++);
  instances[0].close(4401);
  assert.equal(expired, 1);
  assert.equal(timers.size, 0);
  stop();
});

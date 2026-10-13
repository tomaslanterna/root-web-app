import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness(native = false) {
  const calls = [], state = [], effects = [], mutations = [];
  let cursor = 0, effectCursor = 0, mutationCursor = 0, user, listener, opening = "opening-1";
  const result = { badge: { eventId: "real-event" } };
  const react = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === "function" ? value(state[i]) : value; }]; },
    useEffect(fn, deps) { const i = effectCursor++; if (!effects[i] || deps.some((v, index) => v !== effects[i].deps[index])) { effects[i]?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; } },
  };
  const exported = {};
  const compiled = ts.transpileModule(fs.readFileSync(new URL("./useReviewReminder.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports: exported, require: key => ({
    react,
    "@/context/AuthContext": { useAuth: () => ({ user }) },
    "./useMutation": { useMutation: fn => { const i = mutationCursor++; if (!mutations[i]) mutations[i] = { fn, mutate: input => mutations[i].fn(input) }; mutations[i].fn = fn; return mutations[i]; } },
    "@capacitor/core": { Capacitor: { isNativePlatform: () => native } },
    "@capacitor/app": { App: { addListener: async (_, fn) => { listener = fn; return { remove: async () => { listener = null; } }; } } },
    "@/lib/reviewOpening": { currentReviewOpening: () => opening, newReviewOpening: () => { opening = "opening-2"; return opening; } },
    "@/services/badges": { openReviewReminder: async id => { calls.push(["open", id]); return result; }, checkoutEvent: async id => { calls.push(["checkout", id]); } },
  })[key] });
  return {
    calls, result, login: id => { user = id ? { id } : undefined; },
    render(name = "useReviewReminder") { cursor = effectCursor = mutationCursor = 0; return exported[name]("event"); },
    appState(active) { listener({ isActive: active }); },
    cleanup() { effects.forEach(effect => effect.cleanup?.()); effects.length = 0; },
  };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test("unauthenticated users do not load private reminders; navigation does not register new openings", async () => {
  const h = harness(); h.render(); await flush(); assert.equal(h.calls.length, 0);
  h.login("owner"); h.render(); await flush();
  let view = h.render(); assert.equal(view.badge.eventId, "real-event"); view.dismiss();
  view = h.render(); await flush(); assert.equal(view.badge, null); assert.equal(h.calls.length, 1);
});
test("remounts and logout/login cannot redisplay a dismissed reminder in the same opening", async () => {
  const h = harness(); h.login("owner"); h.render(); h.cleanup(); h.render(); await flush();
  h.render().dismiss(); h.login(undefined); h.render(); h.login("owner"); h.render(); await flush();
  assert.equal(h.render().badge, null); assert.equal(h.calls.length, 1);
});
test("only native background-to-foreground registers another opening, never same-session checkout", async () => {
  const h = harness(true); h.login("owner"); h.render(); await flush(); h.render().dismiss();
  h.appState(true); await flush(); assert.equal(h.calls.length, 1);
  h.appState(false); h.appState(true); await flush();
  assert.deepEqual(h.calls, [["open", "opening-1"], ["open", "opening-2"]]);
  assert.equal(h.render().badge.eventId, "real-event");
});
test("explicit checkout records the opening before recording departure; no client user ID is sent", async () => {
  const h = harness(); h.login("owner"); await h.render("useEventCheckout").mutate();
  assert.deepEqual(h.calls, [["open", "opening-1"], ["checkout", "event"]]);
  h.login(undefined); await assert.rejects(h.render("useEventCheckout").mutate());
  assert.equal(h.calls.length, 2);
});

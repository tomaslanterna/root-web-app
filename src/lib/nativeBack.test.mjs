import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compile = file => ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function runtime() {
  const api = {};
  vm.runInNewContext(compile("./nativeBack.ts"), { exports: api });
  return api;
}
test("Android Back confirms exit only at home, regardless of browser history", () => {
  const { nativeBackDestination: back } = runtime();
  assert.equal(back("/feed", true), "confirm-exit");
  assert.equal(back("/", false), "confirm-exit");
  assert.equal(back("/communities", true), "history-back");
  assert.equal(back("/chat/room", true), "history-back");
});
test("cold-start deep links go to their parent, not out of the app", () => {
  const { nativeBackDestination: back } = runtime();
  for (const parent of ["/chat", "/communities", "/events", "/match", "/profile"]) {
    assert.equal(back(`${parent}/detail`, false), parent);
  }
  assert.equal(back("/communities", false), "/feed");
  assert.equal(back("/settings", false), "/feed");
});
test("Back closes the topmost overlay first and cleans up its handler", () => {
  const { registerNativeBackHandler: add, consumeNativeBack: back } = runtime();
  const actions = [];
  const inbox = add(() => actions.push("inbox"));
  const modal = add(() => actions.push("modal"));
  assert.equal(back(), true); assert.deepEqual(actions, ["modal"]);
  modal(); assert.equal(back(), true); assert.deepEqual(actions, ["modal", "inbox"]);
  inbox(); assert.equal(back(), false);
});
test("native listener uses current pathname and is removed on unmount (also late registration)", async () => {
  for (const late of [false, true]) {
    const api = runtime(), effects = [], states = [], actions = [];
    let onBack, removed = 0, resolve;
    const registration = new Promise(done => { resolve = done; });
    const app = { addListener: (name, callback) => { assert.equal(name, "backButton"); onBack = callback; return registration; } };
    const exports = {}, page = { location: { pathname: "/feed" } };
    vm.runInNewContext(compile("../hooks/useNativeBack.ts"), {
      exports, window: page, console,
      require: name => name === "react" ? { useEffect: fn => effects.push(fn), useState: () => [false, value => states.push(value)] }
        : name === "next/navigation" ? { useRouter: () => ({ back: () => actions.push("back"), replace: url => actions.push(url) }) }
        : name === "@capacitor/app" ? { App: app }
        : name === "@capacitor/core" ? { Capacitor: { getPlatform: () => "android" } } : api,
    });
    exports.useNativeBack();
    const dispose = effects[0]();
    if (late) dispose();
    resolve({ remove: () => { removed++; } }); await Promise.resolve();
    if (!late) {
      onBack({ canGoBack: true }); assert.deepEqual(states, [true]);
      page.location.pathname = "/chat/room";
      onBack({ canGoBack: false }); assert.deepEqual(actions, ["/chat"]);
      dispose();
    }
    assert.equal(removed, 1);
  }
});

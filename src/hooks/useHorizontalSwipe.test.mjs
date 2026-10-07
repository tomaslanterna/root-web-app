import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compile = (file) => ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const helpers = {};
vm.runInNewContext(compile("../lib/horizontalSwipe.ts"), { exports: helpers });
function runtime({ direction = -1, enabled = true, blocked = false, carousel = false, modal = false, ownModal = false } = {}) {
  class Element {
    constructor() { this.parentElement = null; this.scrollWidth = 100; this.clientWidth = 100; }
    closest() { return blocked ? this : null; }
    contains() { return false; }
  }
  const handlers = new Map(), states = [], effects = [], disposers = [];
  const node = new Element(); node.clientWidth = 400;
  node.addEventListener = (name, fn) => handlers.set(name, fn);
  node.removeEventListener = (name) => handlers.delete(name);
  const child = new Element(); child.parentElement = node;
  if (carousel) child.scrollWidth = 600;
  let refNumber = 0, completed = 0, cancelled = 0;
  const progress = [];
  const react = {
    useRef: value => ({ current: refNumber++ === 0 ? node : value }),
    useState: () => [0, value => states.push(value)],
    useEffect: fn => effects.push(fn),
  };
  const exportsObject = {};
  vm.runInNewContext(compile("./useHorizontalSwipe.ts"), { exports: exportsObject, require: key => key === "react" ? react : helpers, Element, document: { querySelectorAll: () => ownModal ? [node] : modal ? [new Element()] : [] }, window: { innerWidth: 400 }, getComputedStyle: () => ({ overflowX: carousel ? "auto" : "visible" }) });
  exportsObject.useHorizontalSwipe(direction, enabled, () => completed++, {
    onProgress: distance => progress.push(distance), onCancel: () => cancelled++,
  });
  effects.forEach(fn => { const dispose = fn(); if (dispose) disposers.push(dispose); });
  let prevented = false;
  const touch = (name, x, y = 100, count = 1) => handlers.get(name)?.({ target: child, touches: Array.from({ length: count }, () => ({ clientX: x, clientY: y })), cancelable: true, preventDefault: () => { prevented = true; }, stopPropagation() {} });
  return { touch, handlers, states, progress, get cancelled() { return cancelled; }, get completed() { return completed; }, get prevented() { return prevented; }, dispose: () => disposers.forEach(fn => fn()) };
}
test("horizontal swipe opens only after threshold and suppresses the trailing click", () => {
  const r = runtime(); r.touch("touchstart", 300); r.touch("touchmove", 180); assert.equal(r.prevented, true); r.touch("touchend", 180); assert.equal(r.completed, 1);
  let blocked = false; r.handlers.get("click")({ preventDefault() { blocked = true; }, stopPropagation() {} }); assert.equal(blocked, true);
  r.dispose(); assert.equal(r.handlers.size, 0);
});
test("short, vertical, cancelled, wrong-direction and multitouch gestures never open", () => {
  for (const scenario of ["short", "vertical", "cancel", "wrong", "multi"]) {
    const r = runtime(); r.touch("touchstart", 300);
    if (scenario === "vertical") r.touch("touchmove", 290, 200);
    else if (scenario === "wrong") r.touch("touchmove", 350);
    else if (scenario === "multi") r.touch("touchmove", 150, 100, 2);
    else r.touch("touchmove", scenario === "short" ? 270 : 150);
    r.touch(scenario === "cancel" ? "touchcancel" : "touchend", 150);
    assert.equal(r.completed, 0, scenario);
    if (scenario === "vertical") assert.equal(r.prevented, false);
  }
});
test("forms, carousels, dialogs, system edges and anonymous screens do not activate", () => {
  for (const options of [{ blocked: true }, { carousel: true }, { modal: true }, { enabled: false }]) {
    const r = runtime(options); r.touch("touchstart", 300); r.touch("touchmove", 150); r.touch("touchend", 150); assert.equal(r.completed, 0); assert.equal(r.prevented, false);
  }
  const r = runtime(); r.touch("touchstart", 10); r.touch("touchmove", 180); r.touch("touchend", 180); assert.equal(r.completed, 0);
});
test("rightward inbox swipe closes using the same directional rules", () => {
  const r = runtime({ direction: 1 }); r.touch("touchstart", 100); r.touch("touchmove", 220); r.touch("touchend", 220); assert.equal(r.completed, 1);
});
test("the inbox's own dialog does not block its return gesture", () => {
  const r = runtime({ direction: 1, ownModal: true });
  r.touch("touchstart", 100); r.touch("touchmove", 220); r.touch("touchend", 220);
  assert.equal(r.completed, 1);
});
test("preview follows every finger movement before release, without navigation", () => {
  const r = runtime();
  r.touch("touchstart", 300);
  r.touch("touchmove", 260); r.touch("touchmove", 200); r.touch("touchmove", 240);
  assert.deepEqual(r.progress, [-40, -100, -60]);
  assert.equal(r.completed, 0);
  r.touch("touchend", 240);
  assert.equal(r.completed, 0); assert.equal(r.cancelled, 1);
});
test("cancelled/multitouch previews settle back, completed previews do not reset", () => {
  for (const kind of ["cancel", "multi", "second-start"]) {
    const r = runtime(); r.touch("touchstart", 300); r.touch("touchmove", 180);
    r.touch(kind === "cancel" ? "touchcancel" : kind === "multi" ? "touchmove" : "touchstart", 150, 100, kind === "cancel" ? 1 : 2);
    assert.equal(r.cancelled, 1); assert.equal(r.completed, 0);
  }
  const r = runtime(); r.touch("touchstart", 300); r.touch("touchmove", 180); r.touch("touchend", 180);
  assert.equal(r.completed, 1); assert.equal(r.cancelled, 0);
});

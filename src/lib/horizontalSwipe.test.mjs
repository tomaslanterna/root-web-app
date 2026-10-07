import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exportsObject = {};
const source = fs.readFileSync(new URL("./horizontalSwipe.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
const { swipeIntent, swipeThreshold } = exportsObject;
test("short gestures remain pending, vertical and reverse gestures cancel", () => {
  assert.equal(swipeIntent(-8, 2, -1), "pending");
  assert.equal(swipeIntent(-40, 100, -1), "cancel");
  assert.equal(swipeIntent(100, 2, -1), "cancel");
  assert.equal(swipeIntent(-90, 20, -1), "horizontal");
  assert.equal(swipeIntent(90, 20, 1), "horizontal");
});
test("threshold scales with screen width within reasonable bounds", () => {
  assert.equal(swipeThreshold(300), 64);
  assert.equal(swipeThreshold(400), 80);
  assert.equal(swipeThreshold(1200), 120);
});

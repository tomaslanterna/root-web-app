import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./swipeBack.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: api });

test("the last mounted back gesture is the only active one and hands back on unmount", () => {
  const page = {}, layer = {};
  let changes = 0;
  const unsubscribe = api.subscribeSwipeBack(() => changes++);
  const removePage = api.registerSwipeBack(page);
  assert.equal(api.isActiveSwipeBack(page), true);
  const removeLayer = api.registerSwipeBack(layer);
  assert.equal(api.isActiveSwipeBack(page), false);
  assert.equal(api.isActiveSwipeBack(layer), true);
  removeLayer();
  assert.equal(api.isActiveSwipeBack(page), true);
  removePage();
  assert.equal(api.isActiveSwipeBack(page), false);
  assert.equal(changes, 4);
  unsubscribe();
});
